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
        $admin = $adminId ? \App\Models\Admin::find($adminId) : ($user instanceof \App\Models\Admin ? $user : null);

        $monthStartDay = $admin ? ($admin->month_start_day ?? 25) : 25;
        $monthEndDay = $admin ? ($admin->month_end_day ?? 24) : 24;

        $query = ContentCalendar::with(['project', 'assignedUsers']);
        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        $isManager = ($user instanceof \App\Models\Admin) || in_array(strtolower($user->role ?? ''), ['admin', 'superadmin', 'editor']);

        if (!$isManager) {
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
            'monthStartDay' => $monthStartDay,
            'monthEndDay' => $monthEndDay,
        ]);
    }

    public function generateMonth(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|string', // e.g. "2026-07"
            'project_id' => 'nullable|exists:projects,id',
        ]);

        $adminId = $this->getTenantAdminId();
        $user = auth()->user();
        $admin = $adminId ? \App\Models\Admin::find($adminId) : ($user instanceof \App\Models\Admin ? $user : null);
        $tempAdmin = $admin ?? new \App\Models\Admin(['month_start_day' => 25, 'month_end_day' => 24]);

        list($startDate, $endDate) = $tempAdmin->getMonthDateRange($validated['month']);

        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        while ($start->lte($end)) {
            $currentDate = $start->format('Y-m-d');
            
            // Check if already exists for this date and project
            $query = ContentCalendar::where('date', $currentDate);
            if ($adminId) {
                $query->where('admin_id', $adminId);
            }
            if (!empty($validated['project_id'])) {
                $query->where('project_id', $validated['project_id']);
            } else {
                $query->whereNull('project_id');
            }

            if (!$query->exists()) {
                ContentCalendar::create([
                    'admin_id' => $adminId,
                    'project_id' => $validated['project_id'] ?? null,
                    'creative_uid' => 'CR_' . strtoupper(substr(md5($currentDate . rand(100, 999)), 0, 6)),
                    'date' => $currentDate,
                    'creative_type' => '',
                    'updation' => 'STATUS',
                    'creative_caption' => null,
                    'is_additional' => false,
                ]);
            }
            $start->addDay();
        }

        return back()->with('success', 'Generated month calendar entries from ' . $startDate . ' to ' . $endDate . ' successfully.');
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
            'project_id' => 'nullable',
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

        $item->update($validated);

        if (array_key_exists('assigned_user_ids', $validated)) {
            $item->assignedUsers()->sync($validated['assigned_user_ids'] ?? []);
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
