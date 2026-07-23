<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Admin\ProjectController as AdminProjectController;
use App\Http\Controllers\Admin\TaskController as AdminTaskController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\User\ProjectController as UserProjectController;

// NEW
use App\Http\Controllers\User\LeaveController as UserLeaveController;
use App\Http\Controllers\Admin\LeaveController as AdminLeaveController;
use App\Http\Controllers\GoogleDriveController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AiAssistantController;


// Home page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/welcome-new', function () {
    return Inertia::render('Landing');
});

// Dashboard (redirects based on role)
Route::middleware(['auth'])->get('/dashboard', function () {
    $user = auth()->user();

    if (in_array($user->role, ['superadmin', 'admin', 'manager', 'editor'])) {
        return app(\App\Http\Controllers\Admin\DashboardController::class)->index();
    }

    return app(\App\Http\Controllers\User\DashboardController::class)->index();
})->name('dashboard');


// -----------------------------
// USER ROUTES
// -----------------------------
Route::middleware(['auth'])->group(function () {

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::put('/tasks/{task}/status', [TaskController::class, 'updateStatus'])
        ->name('tasks.updateStatus');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
    Route::post('/tasks/{task}/comments', [TaskController::class, 'storeComment'])->name('tasks.comments.store');

    // Projects
    Route::get('/projects', [UserProjectController::class, 'index'])->name('projects.index');

    // Profile
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

    // -------------------------
    // ✅ USER LEAVE ROUTES
    // -------------------------
    Route::get('/leave', [UserLeaveController::class, 'index'])->name('leave.index');
    Route::get('/leave/apply', [UserLeaveController::class, 'create'])->name('leave.create');
    Route::post('/leave/store', [UserLeaveController::class, 'store'])->name('leave.store');
    Route::delete('/leave/{leave}', [UserLeaveController::class, 'destroy'])->name('leave.destroy');

    // -------------------------
    // ✅ CALENDAR ROUTES
    // -------------------------
    Route::get('/calendar', [App\Http\Controllers\CalendarController::class, 'index'])->name('calendar.index');
    Route::post('/calendar/events', [App\Http\Controllers\CalendarController::class, 'store'])->name('calendar.events.store');
    Route::put('/calendar/events/{id}', [App\Http\Controllers\CalendarController::class, 'update'])->name('calendar.events.update');
    Route::delete('/calendar/events/{id}', [App\Http\Controllers\CalendarController::class, 'destroy'])->name('calendar.events.destroy');

    // -------------------------
    // ✅ GOOGLE DRIVE ROUTES
    // -------------------------
    Route::get('/google-drive/files', [GoogleDriveController::class, 'index'])->name('google-drive.files');
    Route::post('/google-drive/upload', [GoogleDriveController::class, 'upload'])->name('google-drive.upload');
    Route::post('/google-drive/create-folder', [GoogleDriveController::class, 'createFolder'])->name('google-drive.create-folder');
    Route::delete('/google-drive/delete', [GoogleDriveController::class, 'delete'])->name('google-drive.delete');
    Route::get('/drive', function () {
        return Inertia::render('Drive/Index');
    })->name('drive.index');
    // -------------------------
    // ✅ ATTENDANCE ROUTES
    // -------------------------
    Route::get('/attendance', [App\Http\Controllers\AttendanceController::class, 'userIndex'])->name('attendance.index');
    Route::get('/attendance/status', [App\Http\Controllers\AttendanceController::class, 'status'])->name('attendance.status');
    Route::post('/attendance/punch-in', [App\Http\Controllers\AttendanceController::class, 'punchIn'])->name('attendance.punchIn');
    Route::post('/attendance/punch-out', [App\Http\Controllers\AttendanceController::class, 'punchOut'])->name('attendance.punchOut');
    Route::post('/attendance/break/start', [App\Http\Controllers\AttendanceController::class, 'startBreak'])->name('attendance.break.start');
    Route::post('/attendance/break/end', [App\Http\Controllers\AttendanceController::class, 'endBreak'])->name('attendance.break.end');

    // -------------------------
    // ✅ CHAT ROUTES
    // -------------------------
    Route::get('/chat', [App\Http\Controllers\ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat/users', [App\Http\Controllers\ChatController::class, 'getUsers'])->name('chat.users');
    Route::get('/chat/messages/{user}', [App\Http\Controllers\ChatController::class, 'getMessages'])->name('chat.messages');
    Route::post('/chat/send', [App\Http\Controllers\ChatController::class, 'sendMessage'])->name('chat.send');

    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'getNotifications'])->name('notifications');
    Route::get('/notifications-list', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/counts', [App\Http\Controllers\NotificationController::class, 'getCounts'])->name('notifications.counts');
    Route::post('/notifications/mark-as-read/{id}', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');



    // -------------------------
    // ✅ AI ASSISTANT ROUTES
    // -------------------------
    Route::post('/ai/chat', [AiAssistantController::class, 'chat'])->name('ai.chat');
});


// -----------------------------
// ADMIN ROUTES
// -----------------------------
Route::middleware(['auth', 'is_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        Route::get('/drive', function () {
            return Inertia::render('Admin/Drive/Index');
        })->name('drive.index');

        Route::middleware(['is_super_or_admin'])->group(function () {
            Route::patch('users/toggle/{user}', [AdminUserController::class, 'toggle'])
                ->name('users.toggle');
            Route::patch('users/toggle-desktop/{user}', [AdminUserController::class, 'toggleDesktop'])
                ->name('users.toggle.desktop');
            Route::resource('users', AdminUserController::class);

            // -------------------------
            // ✅ ADMIN LEAVE ROUTES
            // -------------------------
            Route::get('leaves', [AdminLeaveController::class, 'index'])->name('leaves.index');
            Route::get('leaves/{id}', [AdminLeaveController::class, 'show'])->name('leaves.show');
            Route::post('leaves/{id}/approve', [AdminLeaveController::class, 'approve'])->name('leaves.approve');
            Route::post('leaves/{id}/reject', [AdminLeaveController::class, 'reject'])->name('leaves.reject');
            Route::put('leaves/{id}', [AdminLeaveController::class, 'update'])->name('leaves.update');
            Route::delete('leaves/{id}', [AdminLeaveController::class, 'destroy'])->name('leaves.delete');

            // -------------------------
            // ✅ ATTENDANCE ROUTES
            // -------------------------
            Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
            Route::get('attendance/export', [AttendanceController::class, 'export'])->name('attendance.export');
            Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
            Route::get('attendance/report', [AttendanceController::class, 'report'])->name('attendance.report');
            Route::put('attendance/{attendance}', [AttendanceController::class, 'update'])->name('attendance.update');
            Route::post('attendance/{attendance}/break', [AttendanceController::class, 'storeBreak'])->name('attendance.break.store');
            Route::put('attendance/break/{attendanceBreak}', [AttendanceController::class, 'updateBreak'])->name('attendance.break.update');

            // -------------------------
            // ✅ SETTINGS ROUTES (Super Admin & Admin)
            // -------------------------
            Route::get('settings', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
            Route::post('settings', [\App\Http\Controllers\Admin\SettingController::class, 'update'])->name('settings.update');

            // -------------------------
            // ✅ PRICING ROUTES
            // -------------------------
            Route::get('pricing', [\App\Http\Controllers\Admin\PricingController::class, 'index'])->name('pricing.index');
            Route::post('pricing/subscribe', [\App\Http\Controllers\Admin\PricingController::class, 'subscribe'])->name('pricing.subscribe');
            Route::post('pricing/settings', [\App\Http\Controllers\Admin\PricingController::class, 'updateSettings'])->name('pricing.settings');
            Route::post('pricing/admin-plan/{user}', [\App\Http\Controllers\Admin\PricingController::class, 'updateAdminPlan'])->name('pricing.admin-plan');
        });

        Route::resource('projects', AdminProjectController::class);
        Route::post('projects/{project}/tasks/reorder', [AdminProjectController::class, 'reorder'])
            ->name('projects.tasks.reorder');

        Route::resource('tasks', AdminTaskController::class);
        Route::put('/tasks/{id}/status', [AdminTaskController::class, 'status'])
            ->name('tasks.status');
        Route::post('/tasks/{task}/comments', [AdminTaskController::class, 'storeComment'])->name('tasks.comments.store');
        Route::delete('/comments/{comment}', [AdminTaskController::class, 'destroyComment'])->name('tasks.comments.destroy');

        // Domains
        Route::resource('domains', \App\Http\Controllers\Admin\DomainController::class);

        // Hosting
        Route::resource('hostings', \App\Http\Controllers\Admin\HostingController::class);

        // Websites (combined Domains + Hosting view)
        Route::get('websites', [\App\Http\Controllers\Admin\WebsiteController::class, 'index'])->name('websites.index');

        // Temporary Google Auth Routes
        Route::get('/google-auth', [GoogleDriveController::class, 'generateAuthUrl'])->name('google.auth');
        Route::get('/google-callback', [GoogleDriveController::class, 'handleCallback'])->name('google.callback');


    });


require __DIR__ . '/auth.php';
require __DIR__ . '/debug.php';

Route::get('/debug-drive', function () {
    try {
        $service = app(\App\Services\GoogleDriveService::class);
        $client = $service->getClient(); // I need to add this getter

        if (!$client) {
            return [
                'status' => 'error',
                'message' => 'Google Drive Client failed to initialize. Check your refresh token in .env.'
            ];
        }

        $accessToken = $client->getAccessToken();
        return [
            'status' => 'success',
            'message' => 'Google Drive Client initialized successfully.',
            'has_access_token' => !empty($accessToken),
            'is_token_expired' => $client->isAccessTokenExpired(),
            'folder_id' => config('services.google.folder_id'),
        ];
    } catch (\Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ];
    }
});
Route::get('/debug-remember', function () {
    $user = auth()->user();
    if (!$user) {
        return ['status' => 'error', 'message' => 'Not authenticated'];
    }

    return [
        'status' => 'success',
        'user_id' => $user->id,
        'email' => $user->email,
        'remember_token' => $user->remember_token,
        'session_id' => session()->getId(),
        'cookies' => request()->cookies->all(),
    ];
});

// Temporary OAuth Helper Routes
Route::get('/google-drive/auth', function () {
    $client = new \Google\Client();
    $client->setClientId(config('services.google.client_id'));
    $client->setClientSecret(config('services.google.client_secret'));
    // Dynamically determine redirect URI based on current host to support both local and live
    $redirectUri = url('/google-drive/callback');
    $client->setRedirectUri($redirectUri);
    $client->setAccessType('offline'); // Crucial for getting refresh token
    $client->setPrompt('consent'); // Force consent to ensure refresh token is returned
    $client->addScope("https://www.googleapis.com/auth/drive");

    return redirect($client->createAuthUrl());
});

Route::get('/google-drive/callback', function (\Illuminate\Http\Request $request) {
    if (!$request->has('code')) {
        return "Error: No code returned from Google.";
    }

    try {
        $client = new \Google\Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(url('/google-drive/callback'));

        $token = $client->fetchAccessTokenWithAuthCode($request->input('code'));

        if (isset($token['error'])) {
            return "Error fetching token: " . json_encode($token);
        }

        return "<h1>Success! Here is your new Refresh Token:</h1><p style='font-family:monospace; background:#eee; padding:10px;'>" . ($token['refresh_token'] ?? 'No refresh token found. Did you set prompt=consent?') . "</p><p>Copy this and update your .env file: <br><code>GOOGLE_DRIVE_REFRESH_TOKEN=" . ($token['refresh_token'] ?? '...') . "</code></p>";
    } catch (\Exception $e) {
        return "Exception: " . $e->getMessage();
    }
});

// PWA Routes for local development
Route::get('/sw.js', function () {
    $path = public_path('build/sw.js');
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path, [
        'Content-Type' => 'application/javascript',
        'Service-Worker-Allowed' => '/'
    ]);
});

Route::get('/manifest.webmanifest', function () {
    $path = public_path('build/manifest.webmanifest');
    if (!file_exists($path)) {
        abort(404);
    }
    
    $json = json_decode(file_get_contents($path), true);
    
    // Dynamically override start_url and scope using Laravel base path configurations
    $appUrl = url('/');
    $pathPrefix = parse_url($appUrl, PHP_URL_PATH) ?: '';
    $pathPrefix = rtrim($pathPrefix, '/') . '/';
    
    $json['start_url'] = $appUrl . '/';
    $json['scope'] = $pathPrefix;
    
    // Correct icon references to absolute paths to prevent subdirectory loading errors
    if (isset($json['icons'])) {
        foreach ($json['icons'] as &$icon) {
            if (strpos($icon['src'], '../') === 0) {
                $cleanSrc = substr($icon['src'], 3);
                $icon['src'] = asset($cleanSrc) . '?v=5';
            }
        }
    }
    if (isset($json['screenshots'])) {
        foreach ($json['screenshots'] as &$screenshot) {
            if (strpos($screenshot['src'], '../') === 0) {
                $cleanSrc = substr($screenshot['src'], 3);
                $screenshot['src'] = asset($cleanSrc) . '?v=5';
            }
        }
    }
    
    return response()->json($json, 200, [
        'Content-Type' => 'application/manifest+json; charset=utf-8'
    ]);
});
