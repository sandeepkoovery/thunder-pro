<?php

namespace App\Http\Controllers;

use App\Models\ContentCalendar;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContentCalendarController extends Controller
{
    private function getTenantAdminId()
    {
        $user = auth()->user();
        if ($user->role === 'superadmin') {
            return null;
        }
        if ($user->role === 'admin' || $user instanceof \App\Models\Admin) {
            $admin = \App\Models\Admin::where('email', $user->email)->first();
            return $admin ? $admin->id : null;
        }
        return $user->admin_id ?? null;
    }

    public function index()
    {
        $user = auth()->user();
        $adminId = $this->getTenantAdminId();

        $query = ContentCalendar::with(['project', 'assignedUsers']);
        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        if ($user->role === 'user') {
            $query->whereHas('assignedUsers', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }

        $items = $query->orderBy('date', 'asc')->orderBy('id', 'asc')->get();

        $userQuery = User::where('is_active', true);
        if ($adminId) {
            $userQuery->where('admin_id', $adminId);
        }
        $users = $userQuery->orderBy('name')->get(['id', 'name', 'email']);

        $projectQuery = Project::query();
        if ($adminId) {
            $projectQuery->where('admin_id', $adminId);
        }
        $projects = $projectQuery->orderBy('name')->get(['id', 'name']);

        return Inertia::render('ContentCalendar/Index', [
            'calendarItems' => $items,
            'users' => $users,
            'projects' => $projects,
        ]);
    }

    public function generateMonth(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|string', // e.g. "2026-07" or "Jul 2026"
            'project_id' => 'nullable|exists:projects,id',
        ]);

        $adminId = $this->getTenantAdminId();

        try {
            $date = Carbon::parse($validated['month'] . '-01');
        } catch (\Exception $e) {
            $date = Carbon::now();
        }

        $daysInMonth = $date->daysInMonth;
        $year = $date->year;
        $month = $date->month;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $currentDate = Carbon::createFromDate($year, $month, $day)->format('Y-m-d');
            
            // Check if already exists for this date and project
            $query = ContentCalendar::where('date', $currentDate);
            if ($adminId) {
                $query->where('admin_id', $adminId);
            }
            if (!empty($validated['project_id'])) {
                $query->where('project_id', $validated['project_id']);
            }

            if (!$query->exists()) {
                ContentCalendar::create([
                    'admin_id' => $adminId,
                    'project_id' => $validated['project_id'] ?? null,
                    'creative_uid' => 'CR_' . strtoupper(substr(md5($currentDate . rand(100, 999)), 0, 6)),
                    'date' => $currentDate,
                    'creative_type' => 'POSTER',
                    'updation' => 'PENDING',
                    'creative_caption' => null,
                    'is_additional' => false,
                ]);
            }
        }

        return back()->with('success', 'Generated month calendar days successfully.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'creative_uid' => 'required|string|max:255',
            'date' => 'required|date',
            'creative_type' => 'nullable|string|max:255',
            'updation' => 'nullable|string|max:255',
            'drive_link' => 'nullable|string|max:255',
            'thumbnail_link' => 'nullable|string|max:255',
            'creative_caption' => 'nullable|string',
            'is_additional' => 'boolean',
            'assigned_user_ids' => 'nullable|array',
        ]);

        $adminId = $this->getTenantAdminId();

        $item = ContentCalendar::create([
            'admin_id' => $adminId,
            'project_id' => $validated['project_id'] ?? null,
            'creative_uid' => $validated['creative_uid'],
            'date' => $validated['date'],
            'creative_type' => $validated['creative_type'] ?? null,
            'updation' => $validated['updation'] ?? null,
            'drive_link' => $validated['drive_link'] ?? null,
            'thumbnail_link' => $validated['thumbnail_link'] ?? null,
            'creative_caption' => $validated['creative_caption'] ?? null,
            'is_additional' => $validated['is_additional'] ?? false,
        ]);

        if (!empty($validated['assigned_user_ids'])) {
            $item->assignedUsers()->sync($validated['assigned_user_ids']);
        }

        return back()->with('success', 'Content calendar item created successfully.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'creative_uid' => 'nullable|string|max:255',
            'date' => 'nullable|date',
            'creative_type' => 'nullable|string|max:255',
            'updation' => 'nullable|string|max:255',
            'drive_link' => 'nullable|string|max:255',
            'thumbnail_link' => 'nullable|string|max:255',
            'creative_caption' => 'nullable|string',
            'is_additional' => 'boolean',
            'assigned_user_ids' => 'nullable|array',
        ]);

        $item = ContentCalendar::findOrFail($id);

        $updateData = array_filter($validated, fn($val) => $val !== null);

        $item->update($updateData);

        if (isset($validated['assigned_user_ids'])) {
            $item->assignedUsers()->sync($validated['assigned_user_ids']);
        }

        return back()->with('success', 'Content calendar item updated successfully.');
    }

    public function destroy($id)
    {
        $item = ContentCalendar::findOrFail($id);
        $item->delete();

        return back()->with('success', 'Content calendar item deleted successfully.');
    }
}
