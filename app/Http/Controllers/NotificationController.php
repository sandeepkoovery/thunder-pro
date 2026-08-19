<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Leave;
use App\Models\AttendanceCorrectionRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $seenIds = DB::table('notification_reads')
            ->where('user_id', $user->id)
            ->pluck('notification_id')
            ->toArray();

        $notifications = [];

        // Determine if user is Admin or Super Admin
        $isSuperAdmin = in_array($user->role, ['superadmin', 'super_admin']);
        $isAdmin = $user->role === 'admin';
        $isAdminOrSuper = $isSuperAdmin || $isAdmin;

        if ($isAdminOrSuper) {
            // Admins see leave requests from their tenant employees
            $leavesQuery = Leave::with('user');
            if (!$isSuperAdmin) {
                $tenantAdminId = $user->role === 'admin' ? $user->id : ($user->admin_id ?? $user->id);
                $tenantUserIds = \App\Models\User::where('admin_id', $tenantAdminId)->pluck('id')->toArray();
                $leavesQuery->whereIn('user_id', $tenantUserIds);
            }

            $leaves = $leavesQuery
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($leaves as $leave) {
                if (!$leave->user) continue;
                $notifId = 'leave_' . $leave->id;
                $isRead = in_array($notifId, $seenIds) || $leave->status !== 'pending';

                $fromStr = \Carbon\Carbon::parse($leave->from_date)->format('j M Y');
                $toStr = \Carbon\Carbon::parse($leave->to_date)->format('j M Y');
                $leaveText = ($fromStr === $toStr) 
                    ? "{$leave->leave_type} on {$fromStr}"
                    : "{$leave->leave_type} from {$fromStr} to {$toStr}";

                $notifications[] = [
                    'id' => $notifId,
                    'type' => 'leave',
                    'title' => 'Leave Request: ' . $leave->user->name,
                    'message' => $leaveText . ' (' . $leave->status . ')',
                    'time' => $leave->created_at->diffForHumans(),
                    'is_read' => $isRead,
                    'link' => route('admin.leaves.index'),
                    'icon' => 'leave',
                    'created_at' => $leave->created_at->toIso8601String(),
                    'sender_avatar' => $leave->user->image ? asset('storage/' . $leave->user->image) : null,
                    'sender_name' => $leave->user->name,
                ];
            }

            // Admins see attendance correction requests from tenant users
            $correctionsQuery = AttendanceCorrectionRequest::with('user');
            if (!$isSuperAdmin) {
                $tenantAdminId = $user->role === 'admin' ? $user->id : ($user->admin_id ?? $user->id);
                $tenantUserIds = \App\Models\User::where('admin_id', $tenantAdminId)->pluck('id')->toArray();
                $correctionsQuery->whereIn('user_id', $tenantUserIds);
            }

            $corrections = $correctionsQuery->orderBy('created_at', 'desc')->get();

            foreach ($corrections as $corr) {
                if (!$corr->user) continue;
                $notifId = 'correction_' . $corr->id;
                $isRead = in_array($notifId, $seenIds) || $corr->status !== 'pending';

                $dateStr = \Carbon\Carbon::parse($corr->date)->format('j M Y');
                $reqTypeLabel = $corr->request_type === 'punch_time' 
                    ? 'Punch Time Correction' 
                    : ($corr->break_action === 'edit' ? 'Modify Break Request' : 'Add Break Request');

                $notifications[] = [
                    'id' => $notifId,
                    'type' => 'attendance_correction',
                    'title' => 'Correction Request: ' . $corr->user->name,
                    'message' => "{$reqTypeLabel} for {$dateStr} ({$corr->status})",
                    'time' => $corr->created_at->diffForHumans(),
                    'is_read' => $isRead,
                    'link' => route('admin.attendance.index', ['display' => 'requests']),
                    'icon' => 'attendance_correction',
                    'created_at' => $corr->created_at->toIso8601String(),
                    'sender_avatar' => $corr->user->image ? asset('storage/' . $corr->user->image) : null,
                    'sender_name' => $corr->user->name,
                ];
            }
        } else {
            // Non-admin users ONLY see their own data
            $leaves = Leave::where('user_id', $user->id)
                ->orderBy('updated_at', 'desc')
                ->get();

            foreach ($leaves as $leave) {
                $notifId = 'leave_' . $leave->id;
                $isRead = in_array($notifId, $seenIds);

                $notifications[] = [
                    'id' => $notifId,
                    'type' => 'leave_update',
                    'title' => 'Leave ' . ucfirst($leave->status),
                    'message' => 'Your ' . $leave->leave_type . ' request was ' . $leave->status,
                    'time' => $leave->updated_at->diffForHumans(),
                    'is_read' => $isRead,
                    'link' => route('leave.index'),
                    'icon' => 'leave',
                    'created_at' => $leave->updated_at->toIso8601String(),
                    'sender_avatar' => null,
                    'sender_name' => 'System',
                ];
            }

            // Non-admin users see updates on their correction requests
            $userCorrections = AttendanceCorrectionRequest::where('user_id', $user->id)
                ->orderBy('updated_at', 'desc')
                ->get();

            foreach ($userCorrections as $corr) {
                $notifId = 'correction_' . $corr->id;
                $isRead = in_array($notifId, $seenIds);

                $dateStr = \Carbon\Carbon::parse($corr->date)->format('j M Y');
                $reqTypeLabel = $corr->request_type === 'punch_time' ? 'Punch time correction' : 'Break time request';
                $statusTitle = $corr->status === 'pending' ? 'submitted' : $corr->status;
                $noteStr = $corr->admin_note ? " (Note: {$corr->admin_note})" : '';

                $notifications[] = [
                    'id' => $notifId,
                    'type' => 'correction_update',
                    'title' => 'Correction Request ' . ucfirst($corr->status),
                    'message' => "Your {$reqTypeLabel} for {$dateStr} was {$statusTitle}{$noteStr}",
                    'time' => $corr->updated_at->diffForHumans(),
                    'is_read' => $isRead,
                    'link' => route('attendance.index'),
                    'icon' => 'correction_update',
                    'created_at' => $corr->updated_at->toIso8601String(),
                    'sender_avatar' => null,
                    'sender_name' => 'System',
                ];
            }
        }

        // Sort by created_at desc
        usort($notifications, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        // Paginate manually with LengthAwarePaginator
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $perPage = 15;
        $currentItems = array_slice($notifications, ($currentPage - 1) * $perPage, $perPage);
        $paginatedNotifications = new LengthAwarePaginator(
            $currentItems,
            count($notifications),
            $perPage,
            $currentPage,
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
                'pageName' => 'page',
            ]
        );

        return Inertia::render('Notifications/Index', [
            'notifications' => $paginatedNotifications,
        ]);
    }

    public function getNotifications()
    {
        $user = Auth::user();
        if (!$user)
            return response()->json(['notifications' => []], 401);

        $notifications = [];

        // Get IDs of notifications this user has already "seen"
        $seenIds = DB::table('notification_reads')
            ->where('user_id', $user->id)
            ->pluck('notification_id')
            ->toArray();

        $isSuperAdmin = in_array($user->role, ['superadmin', 'super_admin']);
        $isAdmin = $user->role === 'admin';

        if ($isAdmin) {
            // Tenant Admins see pending leaves from their tenant users
            $tenantAdminId = $user->id;
            $tenantUserIds = \App\Models\User::where('admin_id', $tenantAdminId)->pluck('id')->toArray();

            $pendingLeaves = Leave::with('user')
                ->where('status', 'pending')
                ->whereIn('user_id', $tenantUserIds)
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($pendingLeaves as $leave) {
                if (!$leave->user) continue;
                $notifId = 'leave_' . $leave->id;
                if (in_array($notifId, $seenIds))
                    continue;

                $fromStr = \Carbon\Carbon::parse($leave->from_date)->format('j M Y');
                $toStr = \Carbon\Carbon::parse($leave->to_date)->format('j M Y');
                $leaveText = ($fromStr === $toStr) 
                    ? "{$leave->leave_type} on {$fromStr}"
                    : "{$leave->leave_type} from {$fromStr} to {$toStr}";

                $notifications[] = [
                    'id' => $notifId,
                    'type' => 'leave',
                    'title' => 'Leave Request: ' . $leave->user->name,
                    'message' => $leaveText,
                    'time' => $leave->created_at->diffForHumans(),
                    'link' => route('admin.leaves.index'),
                    'icon' => 'leave'
                ];
            }

            // Tenant Admins see pending correction requests from tenant users
            $pendingCorrections = AttendanceCorrectionRequest::with('user')
                ->where('status', 'pending')
                ->whereIn('user_id', $tenantUserIds)
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($pendingCorrections as $corr) {
                if (!$corr->user) continue;
                $notifId = 'correction_' . $corr->id;
                if (in_array($notifId, $seenIds)) continue;

                $dateStr = \Carbon\Carbon::parse($corr->date)->format('j M Y');
                $reqTypeLabel = $corr->request_type === 'punch_time' 
                    ? 'Punch Time Correction' 
                    : ($corr->break_action === 'edit' ? 'Modify Break Request' : 'Add Break Request');

                $notifications[] = [
                    'id' => $notifId,
                    'type' => 'attendance_correction',
                    'title' => 'Correction Request: ' . $corr->user->name,
                    'message' => "{$reqTypeLabel} for {$dateStr}",
                    'time' => $corr->created_at->diffForHumans(),
                    'link' => route('admin.attendance.index', ['display' => 'requests']),
                    'icon' => 'attendance_correction'
                ];
            }
        } else {
            // Users see approvals/rejections of their own leaves
            $updatedLeaves = Leave::where('user_id', $user->id)
                ->whereIn('status', ['approved', 'rejected'])
                ->where('updated_at', '>', now()->subDays(7))
                ->orderBy('updated_at', 'desc')
                ->get();

            foreach ($updatedLeaves as $leave) {
                $notifId = 'leave_' . $leave->id;
                if (in_array($notifId, $seenIds))
                    continue;

                $notifications[] = [
                    'id' => $notifId,
                    'type' => 'leave_update',
                    'title' => 'Leave ' . ucfirst($leave->status),
                    'message' => 'Your ' . $leave->leave_type . ' request was ' . $leave->status,
                    'time' => $leave->updated_at->diffForHumans(),
                    'link' => route('leave.index'),
                    'icon' => 'leave'
                ];
            }

            // Users see approvals/rejections of their correction requests from the last 7 days
            $updatedCorrections = AttendanceCorrectionRequest::where('user_id', $user->id)
                ->whereIn('status', ['approved', 'rejected'])
                ->where('updated_at', '>', now()->subDays(7))
                ->orderBy('updated_at', 'desc')
                ->get();

            foreach ($updatedCorrections as $corr) {
                $notifId = 'correction_' . $corr->id;
                if (in_array($notifId, $seenIds)) continue;

                $dateStr = \Carbon\Carbon::parse($corr->date)->format('j M Y');
                $reqTypeLabel = $corr->request_type === 'punch_time' ? 'Punch time correction' : 'Break time request';
                $noteStr = $corr->admin_note ? " (Note: {$corr->admin_note})" : '';

                $notifications[] = [
                    'id' => $notifId,
                    'type' => 'correction_update',
                    'title' => 'Correction Request ' . ucfirst($corr->status),
                    'message' => "Your {$reqTypeLabel} for {$dateStr} was {$corr->status}{$noteStr}",
                    'time' => $corr->updated_at->diffForHumans(),
                    'link' => route('attendance.index'),
                    'icon' => 'correction_update'
                ];
            }
        }

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => count($notifications)
        ]);
    }

    public function getCounts()
    {
        $user = Auth::user();
        if (!$user)
            return response()->json([], 401);

        $currentUserId = $user->role === 'admin' ? 'admin_' . $user->id : (string) $user->id;
        $unreadChats = Message::where('receiver_id', $currentUserId)
            ->where('is_read', false)
            ->count();

        $pendingLeaves = 0;
        $pendingCorrections = 0;

        if ($user->role === 'admin') {
            $tenantAdminId = $user->id;
            $tenantUserIds = \App\Models\User::where('admin_id', $tenantAdminId)->pluck('id')->toArray();
            $pendingLeaves = Leave::where('status', 'pending')
                ->whereIn('user_id', $tenantUserIds)
                ->count();
            $pendingCorrections = AttendanceCorrectionRequest::where('status', 'pending')
                ->whereIn('user_id', $tenantUserIds)
                ->count();
        }

        return response()->json([
            'unread_chats' => $unreadChats,
            'pending_leaves' => $pendingLeaves,
            'pending_corrections' => $pendingCorrections,
            'total_pending' => $pendingLeaves + $pendingCorrections,
        ]);
    }

    public function markAsRead($id)
    {
        $user = Auth::user();
        if (!$user)
            return response()->json(['success' => false], 401);

        DB::table('notification_reads')->updateOrInsert(
            ['user_id' => $user->id, 'notification_id' => $id],
            ['created_at' => now(), 'updated_at' => now()]
        );

        if (str_starts_with($id, 'msg_')) {
            $msgId = str_replace('msg_', '', $id);
            Message::where('id', $msgId)
                ->where('receiver_id', $user->id)
                ->update(['is_read' => true]);
        }

        return response()->json(['success' => true]);
    }
}
