<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    /**
     * Resolve the tenant admin ID for the current authenticated user.
     */
    private function tenantAdminId(): ?int
    {
        $user = auth()->user();
        if ($user->role === 'superadmin') {
            return null; // superadmin sees all tenants
        }
        return $user->role === 'admin' ? $user->id : ($user->admin_id ?? $user->id);
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $tenantAdminId = $this->tenantAdminId();

        $query = Event::with('user');

        // Scope events to this tenant (admin_id)
        if ($tenantAdminId !== null) {
            $query->where('admin_id', $tenantAdminId);
        }

        // Non-admin/manager/editor users only see their own events or events where they are guests
        if (!in_array($user->role, ['admin', 'superadmin', 'manager', 'editor'])) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereJsonContains('guest_ids', (string)$user->id)
                  ->orWhereJsonContains('guest_ids', (int)$user->id);
            });
        }

        $events = $query->get()->map(function ($event) {
            return [
                'id'       => $event->id,
                'title'    => $event->title,
                'start'    => $event->start_date->toIso8601String(),
                'end'      => $event->end_date->toIso8601String(),
                'allDay'   => (bool)$event->all_day,
                'resource' => [
                    'id'          => $event->id,
                    'title'       => $event->title,
                    'description' => $event->description,
                    'category'    => $event->category,
                    'location'    => $event->location,
                    'event_url'   => $event->event_url,
                    'guest_ids'   => $event->guest_ids ?? [],
                    'user_id'     => $event->user_id,
                    'creator'     => $event->user ? $event->user->name : 'Unknown',
                ],
                'status'   => $event->category === 'holiday' ? 'completed' : ($event->category === 'etc' ? 'on hold' : 'in progress'),
                'priority' => $event->category === 'business' ? 'high' : ($event->category === 'family' ? 'medium' : 'low'),
            ];
        });

        // Scope users list to same tenant for guest selection
        $usersQuery = User::where('is_active', true);
        if ($tenantAdminId !== null) {
            $usersQuery->where(function ($q) use ($tenantAdminId) {
                $q->where('admin_id', $tenantAdminId)
                  ->orWhere('id', $tenantAdminId); // include the admin user themselves
            });
        }

        return Inertia::render('Calendar/Index', [
            'events' => $events,
            'users'  => $usersQuery->get(),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $tenantAdminId = $this->tenantAdminId();

        $isAdmin = ($user instanceof \App\Models\Admin) || in_array(strtolower($user->role ?? ''), ['admin', 'superadmin']);
        $allowedCategories = $isAdmin 
            ? ['holiday', 'leave', 'meeting', 'training', 'project', 'personal', 'company_event']
            : ['personal'];

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'category'    => 'required|string|in:' . implode(',', $allowedCategories),
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'all_day'     => 'boolean',
            'description' => 'nullable|string',
            'location'    => 'nullable|string',
            'event_url'   => 'nullable|string|max:255',
            'guest_ids'   => 'nullable|array',
            'guest_ids.*' => 'exists:users,id',
        ]);

        $userId = auth()->id();
        if ($user instanceof \App\Models\Admin) {
            $matchingUser = User::where('email', $user->email)->first();
            $userId = $matchingUser ? $matchingUser->id : (User::where('admin_id', $user->id)->value('id') ?? User::value('id') ?? 1);
        }

        Event::create([
            'admin_id'    => $tenantAdminId,
            'title'       => $validated['title'],
            'category'    => $validated['category'],
            'start_date'  => $validated['start_date'],
            'end_date'    => $validated['end_date'],
            'all_day'     => $validated['all_day'] ?? false,
            'description' => $validated['description'] ?? null,
            'location'    => $validated['location'] ?? null,
            'event_url'   => $validated['event_url'] ?? null,
            'guest_ids'   => $validated['guest_ids'] ?? [],
            'user_id'     => $userId,
        ]);

        return redirect()->route('calendar.index')->with('success', 'Event created successfully.');
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $tenantAdminId = $this->tenantAdminId();
        $event = Event::findOrFail($id);

        // Ensure event belongs to this tenant (superadmin can edit any)
        if ($tenantAdminId !== null && $event->admin_id !== null && $event->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized action.');
        }

        $userRole = strtolower($user->role ?? ($user instanceof \App\Models\Admin ? 'admin' : 'user'));
        if ($event->user_id !== $user->id && !in_array($userRole, ['admin', 'superadmin', 'manager', 'editor'])) {
            abort(403, 'Unauthorized action.');
        }

        $isAdmin = ($user instanceof \App\Models\Admin) || in_array($userRole, ['admin', 'superadmin']);
        $allowedCategories = $isAdmin 
            ? ['holiday', 'leave', 'meeting', 'training', 'project', 'personal', 'company_event']
            : ['personal'];

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'category'    => 'required|string|in:' . implode(',', $allowedCategories),
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'all_day'     => 'boolean',
            'description' => 'nullable|string',
            'location'    => 'nullable|string',
            'event_url'   => 'nullable|string|max:255',
            'guest_ids'   => 'nullable|array',
            'guest_ids.*' => 'exists:users,id',
        ]);

        $event->update([
            'title'       => $validated['title'],
            'category'    => $validated['category'],
            'start_date'  => $validated['start_date'],
            'end_date'    => $validated['end_date'],
            'all_day'     => $validated['all_day'] ?? false,
            'description' => $validated['description'] ?? null,
            'location'    => $validated['location'] ?? null,
            'event_url'   => $validated['event_url'] ?? null,
            'guest_ids'   => $validated['guest_ids'] ?? [],
        ]);

        return redirect()->route('calendar.index')->with('success', 'Event updated successfully.');
    }

    public function destroy($id)
    {
        $tenantAdminId = $this->tenantAdminId();
        $event = Event::findOrFail($id);

        // Ensure event belongs to this tenant (superadmin can delete any)
        if ($tenantAdminId !== null && $event->admin_id !== null && $event->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized action.');
        }

        $user = auth()->user();
        $userRole = strtolower($user->role ?? ($user instanceof \App\Models\Admin ? 'admin' : 'user'));
        if ($event->user_id !== $user->id && !in_array($userRole, ['admin', 'superadmin', 'manager', 'editor'])) {
            abort(403, 'Unauthorized action.');
        }

        $event->delete();

        return redirect()->route('calendar.index')->with('success', 'Event deleted successfully.');
    }
}
