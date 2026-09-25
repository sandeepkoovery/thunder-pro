<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    private function getAdmin()
    {
        $user = auth()->user();
        if (!$user) return null;

        if ($user instanceof Admin) {
            return $user;
        }
        if ($user->role === 'admin') {
            return Admin::where('email', $user->email)->first();
        }
        if (!empty($user->admin_id)) {
            return Admin::find($user->admin_id);
        }
        return Admin::first();
    }

    private function canAccessShifts(): bool
    {
        $user = auth()->user();
        if (!$user) return false;
        if ($user->role === 'superadmin') return true;
        $admin = $this->getAdmin();
        if (!$admin) return false;
        return (bool)$admin->workshift_enabled;
    }

    public function toggleMultiple(Request $request)
    {
        if (!$this->canAccessShifts()) {
            return back()->with('error', 'Work Shift system is currently disabled by Super Admin.');
        }

        $admin = $this->getAdmin();
        if (!$admin) {
            return back()->with('error', 'Admin not found.');
        }

        $enabled = $request->boolean('shifts_enabled');
        $admin->update(['shifts_enabled' => $enabled]);

        // When enabled, ensure exactly 1 default editable shift is ready
        if ($enabled && Shift::where('admin_id', $admin->id)->count() === 0) {
            $startTime = $admin->office_start_time ? substr($admin->office_start_time, 0, 5) : '09:00';
            $endTime = $admin->office_end_time ? substr($admin->office_end_time, 0, 5) : '18:00';
            $buffer = $admin->login_buffer_minutes ?: 30;

            Shift::create([
                'admin_id' => $admin->id,
                'name' => 'General Shift',
                'start_time' => $startTime,
                'end_time' => $endTime,
                'buffer_minutes' => $buffer,
                'is_night_shift' => ($endTime <= $startTime),
                'is_default' => true,
                'is_active' => true,
                'description' => 'Official office working hours',
            ]);
        }

        return back()->with('success', $enabled ? 'Multiple shifts enabled. Default shift is ready to edit or add new shifts.' : 'Multiple shifts disabled. Single office timing restored.');
    }

    public function store(Request $request)
    {
        $admin = $this->getAdmin();
        if (!$admin) {
            return back()->with('error', 'Admin not found.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|string|max:10',
            'end_time' => 'required|string|max:10',
            'buffer_minutes' => 'nullable|integer|min:0|max:240',
            'is_default' => 'nullable|boolean',
            'is_night_shift' => 'nullable|boolean',
            'description' => 'nullable|string|max:500',
        ]);

        $start = substr($validated['start_time'], 0, 5);
        $end = substr($validated['end_time'], 0, 5);
        $isOvernight = $end <= $start;

        $hasOtherShifts = Shift::where('admin_id', $admin->id)->exists();
        $isDefault = !empty($validated['is_default']) || !$hasOtherShifts;

        if ($isDefault) {
            Shift::where('admin_id', $admin->id)->update(['is_default' => false]);
        }

        Shift::create([
            'admin_id' => $admin->id,
            'name' => $validated['name'],
            'start_time' => $start,
            'end_time' => $end,
            'buffer_minutes' => isset($validated['buffer_minutes']) ? (int)$validated['buffer_minutes'] : 30,
            'is_night_shift' => $isOvernight || !empty($validated['is_night_shift']),
            'is_default' => $isDefault,
            'is_active' => true,
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', "Shift '{$validated['name']}' added successfully.");
    }

    public function update(Request $request, Shift $shift)
    {
        $admin = $this->getAdmin();
        if (!$admin || ($shift->admin_id && $shift->admin_id !== $admin->id && auth()->user()->role !== 'superadmin')) {
            return back()->with('error', 'Unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|string|max:10',
            'end_time' => 'required|string|max:10',
            'buffer_minutes' => 'nullable|integer|min:0|max:240',
            'is_default' => 'nullable|boolean',
            'is_night_shift' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string|max:500',
        ]);

        $start = substr($validated['start_time'], 0, 5);
        $end = substr($validated['end_time'], 0, 5);
        $isOvernight = $end <= $start;

        if (!empty($validated['is_default'])) {
            Shift::where('admin_id', $shift->admin_id)->where('id', '!=', $shift->id)->update(['is_default' => false]);
        }

        $shift->update([
            'name' => $validated['name'],
            'start_time' => $start,
            'end_time' => $end,
            'buffer_minutes' => isset($validated['buffer_minutes']) ? (int)$validated['buffer_minutes'] : $shift->buffer_minutes,
            'is_night_shift' => $isOvernight || !empty($validated['is_night_shift']),
            'is_default' => isset($validated['is_default']) ? (bool)$validated['is_default'] : $shift->is_default,
            'is_active' => isset($validated['is_active']) ? (bool)$validated['is_active'] : $shift->is_active,
            'description' => $validated['description'] ?? $shift->description,
        ]);

        return back()->with('success', "Shift '{$shift->name}' updated successfully.");
    }

    public function setDefault(Shift $shift)
    {
        $admin = $this->getAdmin();
        if (!$admin || ($shift->admin_id && $shift->admin_id !== $admin->id && auth()->user()->role !== 'superadmin')) {
            return back()->with('error', 'Unauthorized.');
        }

        Shift::where('admin_id', $shift->admin_id)->update(['is_default' => false]);
        $shift->update(['is_default' => true, 'is_active' => true]);

        return back()->with('success', "Shift '{$shift->name}' set as the default shift.");
    }

    public function toggle(Shift $shift)
    {
        $admin = $this->getAdmin();
        if (!$admin || ($shift->admin_id && $shift->admin_id !== $admin->id && auth()->user()->role !== 'superadmin')) {
            return back()->with('error', 'Unauthorized.');
        }

        $shift->update(['is_active' => !$shift->is_active]);

        $statusStr = $shift->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "Shift '{$shift->name}' has been {$statusStr}.");
    }

    public function destroy(Shift $shift)
    {
        $admin = $this->getAdmin();
        if (!$admin || ($shift->admin_id && $shift->admin_id !== $admin->id && auth()->user()->role !== 'superadmin')) {
            return back()->with('error', 'Unauthorized.');
        }

        $shiftName = $shift->name;

        // Reassign any users on this shift to null or default shift
        $defaultShift = Shift::where('admin_id', $shift->admin_id)
            ->where('id', '!=', $shift->id)
            ->where('is_default', true)
            ->first();

        User::where('shift_id', $shift->id)->update([
            'shift_id' => $defaultShift ? $defaultShift->id : null,
        ]);

        $shift->delete();

        // If deleted shift was default and other shifts exist, make the first one default
        if ($shift->is_default) {
            $nextShift = Shift::where('admin_id', $shift->admin_id)->first();
            if ($nextShift) {
                $nextShift->update(['is_default' => true]);
            }
        }

        return back()->with('success', "Shift '{$shiftName}' deleted successfully.");
    }
}
