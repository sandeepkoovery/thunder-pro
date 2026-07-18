<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Event::with('user');

        // Non-admin/manager/editor users only see their own created events or events where they are guests
        if (!in_array($user->role, ['admin', 'manager', 'editor'])) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereJsonContains('guest_ids', (string)$user->id)
                  ->orWhereJsonContains('guest_ids', (int)$user->id);
            });
        }

        $events = $query->get()->map(function ($event) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'start' => $event->start_date->toIso8601String(),
                'end' => $event->end_date->toIso8601String(),
                'allDay' => (bool)$event->all_day,
                'resource' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'category' => $event->category,
                    'location' => $event->location,
                    'event_url' => $event->event_url,
                    'guest_ids' => $event->guest_ids ?? [],
                    'user_id' => $event->user_id,
                    'creator' => $event->user ? $event->user->name : 'Unknown',
                ],
                'status' => $event->category === 'holiday' ? 'completed' : ($event->category === 'etc' ? 'on hold' : 'in progress'), // Map categories back for visual compatibility
                'priority' => $event->category === 'business' ? 'high' : ($event->category === 'family' ? 'medium' : 'low'),
            ];
        });

        return Inertia::render('Calendar/Index', [
            'events' => $events,
            'users' => User::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $allowedCategories = ['personal']; // Default for Employee
        
        if (in_array($user->role, ['admin', 'superadmin', 'editor'])) {
            $allowedCategories = ['holiday', 'leave', 'meeting', 'training', 'project', 'personal', 'company_event'];
        } elseif ($user->role === 'manager') {
            $allowedCategories = ['meeting', 'project', 'personal'];
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|in:' . implode(',', $allowedCategories),
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'all_day' => 'boolean',
            'description' => 'nullable|string',
            'location' => 'nullable|string',
            'event_url' => 'nullable|url',
            'guest_ids' => 'nullable|array',
            'guest_ids.*' => 'exists:users,id',
        ]);

        Event::create([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'all_day' => $validated['all_day'] ?? false,
            'description' => $validated['description'] ?? null,
            'location' => $validated['location'] ?? null,
            'event_url' => $validated['event_url'] ?? null,
            'guest_ids' => $validated['guest_ids'] ?? [],
            'user_id' => auth()->id(),
        ]);

        return redirect()->route('calendar.index')->with('success', 'Event created successfully.');
    }

    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        if ($event->user_id !== auth()->id() && !in_array(auth()->user()->role, ['admin', 'manager', 'editor'])) {
            abort(403, 'Unauthorized action.');
        }

        $user = auth()->user();
        $allowedCategories = ['personal']; // Default for Employee
        
        if (in_array($user->role, ['admin', 'superadmin', 'editor'])) {
            $allowedCategories = ['holiday', 'leave', 'meeting', 'training', 'project', 'personal', 'company_event'];
        } elseif ($user->role === 'manager') {
            $allowedCategories = ['meeting', 'project', 'personal'];
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|in:' . implode(',', $allowedCategories),
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'all_day' => 'boolean',
            'description' => 'nullable|string',
            'location' => 'nullable|string',
            'event_url' => 'nullable|url',
            'guest_ids' => 'nullable|array',
            'guest_ids.*' => 'exists:users,id',
        ]);

        $event->update([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'all_day' => $validated['all_day'] ?? false,
            'description' => $validated['description'] ?? null,
            'location' => $validated['location'] ?? null,
            'event_url' => $validated['event_url'] ?? null,
            'guest_ids' => $validated['guest_ids'] ?? [],
        ]);

        return redirect()->route('calendar.index')->with('success', 'Event updated successfully.');
    }

    public function destroy($id)
    {
        $event = Event::findOrFail($id);

        if ($event->user_id !== auth()->id() && !in_array(auth()->user()->role, ['admin', 'manager', 'editor'])) {
            abort(403, 'Unauthorized action.');
        }

        $event->delete();

        return redirect()->route('calendar.index')->with('success', 'Event deleted successfully.');
    }
}
