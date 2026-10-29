<?php

namespace App\Http\Controllers;

use App\Models\OdRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OdRequestController extends Controller
{
    private function getTenantAdminId()
    {
        $user = auth()->user();
        if (!$user) return 0;

        if ($user instanceof \App\Models\Admin) {
            return $user->role === 'superadmin' ? 0 : $user->id;
        }

        if (isset($user->role) && $user->role === 'admin') {
            $admin = \App\Models\Admin::where('email', $user->email)->first();
            return $admin ? $admin->id : 0;
        }

        return $user->admin_id ?? 0;
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'reason' => 'required|string|max:1000',
        ]);

        $user = Auth::user();

        if (!$user->od_enabled) {
            return back()->with('error', 'OD (On Duty) is not enabled for your profile. Please contact your admin.');
        }

        $date = Carbon::parse($request->date)->toDateString();

        $exists = OdRequest::where('user_id', $user->id)
            ->where('date', $date)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'An OD request is already pending or approved for this date.');
        }

        OdRequest::create([
            'user_id' => $user->id,
            'admin_id' => $this->getTenantAdminId(),
            'date' => $date,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return back()->with('success', 'OD request submitted successfully for admin review.');
    }

    public function approve(Request $request, $id)
    {
        $od = OdRequest::findOrFail($id);

        if ($od->status !== 'pending') {
            return back()->with('error', 'This request has already been actioned.');
        }

        $od->update([
            'status' => 'approved',
            'admin_note' => $request->input('admin_note'),
            'actioned_by' => Auth::id(),
            'actioned_at' => Carbon::now(),
        ]);

        return back()->with('success', 'OD request approved. The day will be marked as OD.');
    }

    public function reject(Request $request, $id)
    {
        $od = OdRequest::findOrFail($id);

        if ($od->status !== 'pending') {
            return back()->with('error', 'This request has already been actioned.');
        }

        $od->update([
            'status' => 'rejected',
            'admin_note' => $request->input('admin_note'),
            'actioned_by' => Auth::id(),
            'actioned_at' => Carbon::now(),
        ]);

        return back()->with('success', 'OD request rejected.');
    }

    public function destroy($id)
    {
        $od = OdRequest::findOrFail($id);
        $user = Auth::user();

        $isAdmin = ($user instanceof \App\Models\Admin) || (isset($user->role) && in_array($user->role, ['admin', 'superadmin']));

        if (!$isAdmin) {
            if ($od->user_id !== $user->id) {
                return back()->with('error', 'Unauthorized action.');
            }
            if ($od->status !== 'pending') {
                return back()->with('error', 'Only pending requests can be deleted.');
            }
        }

        $od->delete();

        return back()->with('success', 'OD request deleted successfully.');
    }
}
