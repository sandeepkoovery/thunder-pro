<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\User;
use App\Models\Admin;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function index()
    {
        if (Auth::user()->role === 'superadmin') {
            abort(403, 'Super Admins do not have access to Chat.');
        }

        return Inertia::render('Chat/Index', [
            'users' => $this->getUsersList(),
        ]);
    }

    public function getUsers()
    {
        if (Auth::user()->role === 'superadmin') {
            return response()->json(['users' => []]);
        }

        return response()->json([
            'users' => $this->getUsersList(),
        ]);
    }

    private function getUsersList()
    {
        $currentUser = Auth::user();

        // 1. Super Admin has no access
        if ($currentUser->role === 'superadmin') {
            return collect([]);
        }

        $isTenantAdmin = $currentUser instanceof Admin || $currentUser->role === 'admin';
        $tenantAdminId = $isTenantAdmin ? $currentUser->id : ($currentUser->admin_id ?? null);

        if (!$tenantAdminId) {
            return collect([]);
        }

        $contacts = collect();

        // 2. If current user is an employee, include their Tenant Admin in their contact list
        if (!$isTenantAdmin) {
            $adminUser = Admin::find($tenantAdminId);
            if ($adminUser) {
                $contacts->push([
                    'id' => 'admin_' . $adminUser->id,
                    'raw_id' => $adminUser->id,
                    'is_admin_contact' => true,
                    'name' => $adminUser->name . ' (Admin)',
                    'email' => $adminUser->email,
                    'role' => 'admin',
                    'designation' => $adminUser->company_name ? $adminUser->company_name . ' Admin' : 'Tenant Administrator',
                    'image' => $adminUser->image ? asset('storage/' . $adminUser->image) : null,
                    'thumb' => $adminUser->thumb ? asset('storage/' . $adminUser->thumb) : null,
                    'is_active' => true,
                ]);
            }
        }

        // 3. Fetch fellow employees belonging ONLY to this specific tenant admin
        $employees = User::where('admin_id', $tenantAdminId)
            ->where('is_active', true)
            ->where('role', '!=', 'superadmin')
            ->when(!$isTenantAdmin, fn($q) => $q->where('id', '!=', $currentUser->id))
            ->get()
            ->map(function ($u) {
                return [
                    'id' => (string) $u->id,
                    'raw_id' => $u->id,
                    'is_admin_contact' => false,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'designation' => $u->designation ?? ucfirst($u->role),
                    'image' => $u->image ? asset('storage/' . $u->image) : null,
                    'thumb' => $u->thumb ? asset('storage/' . $u->thumb) : null,
                    'is_active' => $u->is_active,
                ];
            });

        $contacts = $contacts->concat($employees);

        $currentUserId = $isTenantAdmin ? 'admin_' . $currentUser->id : (string) $currentUser->id;

        // 4. Calculate unread counts and last message per contact
        return $contacts->map(function ($user) use ($currentUserId) {
            $contactId = (string) $user['id'];

            $user['unread_count'] = Message::where('sender_id', $contactId)
                ->where('receiver_id', $currentUserId)
                ->where('is_read', false)
                ->count();

            $user['last_message'] = Message::where(function ($query) use ($currentUserId, $contactId) {
                $query->where('sender_id', $currentUserId)
                    ->where('receiver_id', $contactId);
            })->orWhere(function ($query) use ($currentUserId, $contactId) {
                $query->where('sender_id', $contactId)
                    ->where('receiver_id', $currentUserId);
            })
                ->orderBy('created_at', 'desc')
                ->first();

            return $user;
        });
    }

    public function getMessages($contactId)
    {
        $currentUser = Auth::user();
        if ($currentUser->role === 'superadmin') {
            return response()->json(['messages' => []]);
        }

        $isTenantAdmin = $currentUser instanceof Admin || $currentUser->role === 'admin';
        $currentUserId = $isTenantAdmin ? 'admin_' . $currentUser->id : (string) $currentUser->id;

        $messages = Message::where(function ($query) use ($currentUserId, $contactId) {
            $query->where('sender_id', $currentUserId)
                ->where('receiver_id', $contactId);
        })->orWhere(function ($query) use ($currentUserId, $contactId) {
            $query->where('sender_id', $contactId)
                ->where('receiver_id', $currentUserId);
        })
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark as read
        Message::where('sender_id', $contactId)
            ->where('receiver_id', $currentUserId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $currentUser = Auth::user();
        if ($currentUser->role === 'superadmin') {
            return response()->json(['status' => 'error', 'message' => 'Super Admins cannot send chat messages.'], 403);
        }

        $request->validate([
            'receiver_id' => 'required',
            'message' => 'required_if:type,text|nullable|string',
            'type' => 'required|in:text,image,file',
            'file' => 'nullable|file|max:10240', // 10MB
        ]);

        $isTenantAdmin = $currentUser instanceof Admin || $currentUser->role === 'admin';
        $senderId = $isTenantAdmin ? 'admin_' . $currentUser->id : (string) $currentUser->id;
        $filePath = null;

        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('chat_files', 'public');
        }

        $message = Message::create([
            'sender_id' => $senderId,
            'receiver_id' => (string) $request->receiver_id,
            'message' => $request->message ?? '',
            'type' => $request->type,
            'file_path' => $filePath,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => $message,
        ]);
    }
}
