<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Leave;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index()
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

        // 1. Chat Messages
        $messages = Message::with('sender')
            ->where('receiver_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        foreach ($messages as $msg) {
            $notifId = 'msg_' . $msg->id;
            $isRead = $msg->is_read || in_array($notifId, $seenIds);
            
            $notifications[] = [
                'id' => $notifId,
                'type' => 'chat',
                'title' => 'Message from ' . $msg->sender->name,
                'message' => $msg->message,
                'time' => $msg->created_at->diffForHumans(),
                'is_read' => $isRead,
                'link' => route('chat.index'),
                'icon' => 'chat',
                'created_at' => $msg->created_at->toIso8601String(),
                'sender_avatar' => $msg->sender->image ? asset('storage/' . $msg->sender->image) : null,
                'sender_name' => $msg->sender->name,
            ];
        }

        // 2. Leave Requests
        if (in_array($user->role, ['admin', 'manager', 'editor'])) {
            $leaves = Leave::with('user')
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();

            foreach ($leaves as $leave) {
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
        } else {
            $leaves = Leave::where('user_id', $user->id)
                ->orderBy('updated_at', 'desc')
                ->take(50)
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
        }

        // Sort by created_at desc
        usort($notifications, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        $notifications = array_slice($notifications, 0, 50);

        return \Inertia\Inertia::render('Notifications/Index', [
            'initialNotifications' => $notifications
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

        // 1. Unread Chat Messages
        $unreadMessages = Message::with('sender')
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($unreadMessages as $msg) {
            $notifId = 'msg_' . $msg->id;
            if (in_array($notifId, $seenIds))
                continue;

            $notifications[] = [
                'id' => $notifId,
                'type' => 'chat',
                'title' => 'New message from ' . $msg->sender->name,
                'message' => $msg->message,
                'time' => $msg->created_at->diffForHumans(),
                'link' => route('chat.index'),
                'icon' => 'chat'
            ];
        }

        // 2. Leave Requests
        if (in_array($user->role, ['admin', 'manager', 'editor'])) {
            // Admins see pending leaves from others
            $pendingLeaves = Leave::with('user')
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($pendingLeaves as $leave) {
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
        } else {
            // Users see approvals/rejections of their own leaves
            $updatedLeaves = Leave::where('user_id', $user->id)
                ->whereIn('status', ['approved', 'rejected'])
                ->where('updated_at', '>', now()->subDays(3)) // Show recent updates
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
        }

        // Sort by time (implied or explicit)
        // Since we combined them, let's sort if needed, but for now chronological per type is okay.

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

        $unreadChats = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        $pendingLeaves = 0;
        $seenIds = DB::table('notification_reads')
            ->where('user_id', $user->id)
            ->pluck('notification_id')
            ->toArray();

        if (in_array($user->role, ['admin', 'manager', 'editor'])) {
            $leaves = Leave::where('status', 'pending')->get();
            foreach ($leaves as $leave) {
                if (!in_array('leave_' . $leave->id, $seenIds)) {
                    $pendingLeaves++;
                }
            }
        } else {
            // For regular users, show count of recently updated leaves (approved/rejected)
            $leaves = Leave::where('user_id', $user->id)
                ->whereIn('status', ['approved', 'rejected'])
                ->where('updated_at', '>', now()->subDays(3))
                ->get();

            foreach ($leaves as $leave) {
                if (!in_array('leave_' . $leave->id, $seenIds)) {
                    $pendingLeaves++;
                }
            }
        }

        return response()->json([
            'unread_chats' => $unreadChats,
            'pending_leaves' => $pendingLeaves,
        ]);
    }

    public function markAsRead($id)
    {
        $user = Auth::user();
        if (!$user)
            return response()->json([], 401);

        if (strpos($id, 'msg_') === 0) {
            $msgId = str_replace('msg_', '', $id);
            Message::where('id', $msgId)
                ->where('receiver_id', $user->id)
                ->update(['is_read' => true]);
        }

        // Track that this user has "read" this notification in the bell
        DB::table('notification_reads')->updateOrInsert(
            ['user_id' => $user->id, 'notification_id' => $id],
            ['created_at' => now(), 'updated_at' => now()]
        );

        return response()->json(['status' => 'success']);
    }
}
