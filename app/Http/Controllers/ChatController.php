<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Message;
use App\Models\User;
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

        // Admin/manager can chat with all users (excluding superadmin)
        // Regular users can only chat with admin/manager
        return User::where('id', '!=', $currentUser->id)
            ->where('is_active', true)
            ->where('role', '!=', 'superadmin') // never include superadmin in chat
            ->when(!in_array($currentUser->role, ['admin', 'manager', 'editor']), function ($query) {
                // regular users: only show admin/manager
                return $query->whereIn('role', ['admin', 'manager']);
            })
            ->get()
            ->map(function ($user) use ($currentUser) {
                $user->unread_count = Message::where('sender_id', $user->id)
                    ->where('receiver_id', $currentUser->id)
                    ->where('is_read', false)
                    ->count();

                $user->last_message = Message::where(function ($query) use ($currentUser, $user) {
                    $query->where('sender_id', $currentUser->id)
                        ->where('receiver_id', $user->id);
                })->orWhere(function ($query) use ($currentUser, $user) {
                    $query->where('sender_id', $user->id)
                        ->where('receiver_id', $currentUser->id);
                })
                    ->orderBy('created_at', 'desc')
                    ->first();

                return $user;
            });
    }

    public function getMessages(User $user)
    {
        $currentUser = Auth::user();

        $messages = Message::where(function ($query) use ($currentUser, $user) {
            $query->where('sender_id', $currentUser->id)
                ->where('receiver_id', $user->id);
        })->orWhere(function ($query) use ($currentUser, $user) {
            $query->where('sender_id', $user->id)
                ->where('receiver_id', $currentUser->id);
        })
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark as read
        Message::where('sender_id', $user->id)
            ->where('receiver_id', $currentUser->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required_if:type,text|string',
            'type' => 'required|in:text,image,file',
            'file' => 'nullable|file|max:10240', // 10MB
        ]);

        $senderId = Auth::id();
        $filePath = null;

        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('chat_files', 'public');
        }

        $message = Message::create([
            'sender_id' => $senderId,
            'receiver_id' => $request->receiver_id,
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
