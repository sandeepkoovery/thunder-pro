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
use App\Http\Controllers\GoogleDriveAuthController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceCorrectionController;
use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Admin\PricingController;


use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;

// Home page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('home');


Route::get('/welcome-new', function () {
    return Inertia::render('Landing');
});

// Public Pricing & Razorpay Payment Routes
Route::get('/pricing', [PricingController::class, 'showPricing'])->name('pricing.public');
Route::post('/payment/create-order', [PaymentController::class, 'createOrder'])->name('payment.create-order');
Route::post('/payment/verify', [PaymentController::class, 'verifyPayment'])->name('payment.verify');


// Dashboard (redirects based on role)
Route::middleware(['auth'])->get('/dashboard', function () {
    $user = auth()->user();

    if ($user instanceof \App\Models\Admin || in_array($user->role, ['superadmin', 'admin'])) {
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
    // ✅ GOOGLE DRIVE ROUTES & OAUTH
    // -------------------------
    Route::get('/google-drive/connect', [GoogleDriveAuthController::class, 'redirect'])->name('google-drive.connect');
    Route::get('/google-drive/callback', [GoogleDriveAuthController::class, 'callback'])->name('google-drive.callback');
    Route::get('/google-drive/status', [GoogleDriveAuthController::class, 'status'])->name('google-drive.status');
    Route::post('/google-drive/disconnect', [GoogleDriveAuthController::class, 'disconnect'])->name('google-drive.disconnect');
    Route::post('/google-drive/save-manual', [GoogleDriveAuthController::class, 'saveManualConnection'])->name('google-drive.save-manual');

    Route::get('/google-drive/files', [GoogleDriveController::class, 'index'])->name('google-drive.files');
    Route::post('/google-drive/upload', [GoogleDriveController::class, 'upload'])->name('google-drive.upload');
    Route::post('/google-drive/create-folder', [GoogleDriveController::class, 'createFolder'])->name('google-drive.create-folder');
    Route::put('/google-drive/rename', [GoogleDriveController::class, 'rename'])->name('google-drive.rename');
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
    Route::post('/attendance/correction-request', [AttendanceCorrectionController::class, 'store'])->name('attendance.correction.store');
    Route::delete('/attendance/correction-request/{id}', [AttendanceCorrectionController::class, 'destroy'])->name('attendance.correction.delete');

    // -------------------------
    // ✅ AI ASSISTANT ROUTES
    // -------------------------
    Route::post('/ai-assistant/chat', [AiAssistantController::class, 'chat'])->name('ai.chat');
    Route::get('/ai-assistant/tts', [AiAssistantController::class, 'tts'])->name('ai.tts');
    Route::get('/ai-assistant/key', [AiAssistantController::class, 'getKey'])->name('ai.key.get');
    Route::post('/ai-assistant/key', [AiAssistantController::class, 'saveKey'])->name('ai.key.save');

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
    // ✅ ADDITIONAL MODULES ROUTES
    // -------------------------
    Route::get('/content-calendar', [\App\Http\Controllers\ContentCalendarController::class, 'index'])->name('content-calendar.index');
    Route::post('/content-calendar', [\App\Http\Controllers\ContentCalendarController::class, 'store'])->name('content-calendar.store');
    Route::post('/content-calendar/generate-month', [\App\Http\Controllers\ContentCalendarController::class, 'generateMonth'])->name('content-calendar.generate-month');
    Route::put('/content-calendar/{id}', [\App\Http\Controllers\ContentCalendarController::class, 'update'])->name('content-calendar.update');
    Route::delete('/content-calendar/{id}', [\App\Http\Controllers\ContentCalendarController::class, 'destroy'])->name('content-calendar.destroy');

    Route::get('/daily-listings', [\App\Http\Controllers\DailyListingsController::class, 'index'])->name('daily-listings.index');
    Route::post('/daily-listings', [\App\Http\Controllers\DailyListingsController::class, 'store'])->name('daily-listings.store');
    Route::put('/daily-listings/{id}', [\App\Http\Controllers\DailyListingsController::class, 'update'])->name('daily-listings.update');
    Route::delete('/daily-listings/{id}', [\App\Http\Controllers\DailyListingsController::class, 'destroy'])->name('daily-listings.destroy');
    Route::post('/daily-listings/settings', [\App\Http\Controllers\DailyListingsController::class, 'updateSettings'])->name('daily-listings.settings');

    Route::get('/designers-worklist', [\App\Http\Controllers\DesignersWorklistController::class, 'index'])->name('designers-worklist.index');
    Route::post('/designers-worklist', [\App\Http\Controllers\DesignersWorklistController::class, 'store'])->name('designers-worklist.store');
    Route::put('/designers-worklist/{id}', [\App\Http\Controllers\DesignersWorklistController::class, 'update'])->name('designers-worklist.update');
    Route::patch('/designers-worklist/{id}/status', [\App\Http\Controllers\DesignersWorklistController::class, 'updateStatus'])->name('designers-worklist.status');
    Route::delete('/designers-worklist/{id}', [\App\Http\Controllers\DesignersWorklistController::class, 'destroy'])->name('designers-worklist.destroy');

    // -------------------------
    // ✅ AI ASSISTANT & USER SETTINGS ROUTES
    // -------------------------
    Route::post('/ai/chat', [AiAssistantController::class, 'chat'])->name('ai.chat');
    Route::patch('/users/toggle-desktop/{user}', [AdminUserController::class, 'toggleDesktop'])->name('users.toggle.desktop');
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
            Route::resource('departments', AdminDepartmentController::class);

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
            Route::post('attendance/correction-requests/{id}/approve', [AttendanceCorrectionController::class, 'approve'])->name('attendance.correction.approve');
            Route::post('attendance/correction-requests/{id}/reject', [AttendanceCorrectionController::class, 'reject'])->name('attendance.correction.reject');
            Route::delete('attendance/correction-requests/{id}', [AttendanceCorrectionController::class, 'destroy'])->name('attendance.correction.destroy');

            // -------------------------
            // ✅ SETTINGS ROUTES (Super Admin & Admin)
            // -------------------------
            Route::get('settings', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
            Route::post('settings', [\App\Http\Controllers\Admin\SettingController::class, 'update'])->name('settings.update');
            Route::post('settings/worksheet', [\App\Http\Controllers\Admin\SettingController::class, 'updateWorksheetSetting'])->name('settings.worksheet.update');
            Route::post('settings/designers', [\App\Http\Controllers\Admin\SettingController::class, 'updateDesignersSetting'])->name('settings.designers.update');

            // -------------------------
            // ✅ MODULES LIST & PERMISSIONS
            // -------------------------
            Route::get('modules', [\App\Http\Controllers\Admin\ModuleController::class, 'index'])->name('modules.index');
            Route::post('modules', [\App\Http\Controllers\Admin\ModuleController::class, 'update'])->name('modules.update');

            // -------------------------
            // ✅ PRICING ROUTES
            // -------------------------
            Route::get('pricing', [\App\Http\Controllers\Admin\PricingController::class, 'index'])->name('pricing.index');
            Route::post('pricing/subscribe', [\App\Http\Controllers\Admin\PricingController::class, 'subscribe'])->name('pricing.subscribe');
            Route::post('pricing/settings', [\App\Http\Controllers\Admin\PricingController::class, 'updateSettings'])->name('pricing.settings');
            Route::post('pricing/admin-plan/{user}', [\App\Http\Controllers\Admin\PricingController::class, 'updateAdminPlan'])->name('pricing.admin-plan');
            Route::post('pricing/admin-status/{id}', [\App\Http\Controllers\Admin\PricingController::class, 'toggleAdminStatus'])->name('pricing.admin-status');

            // -------------------------
            // ✅ SUPER ADMIN: ADMIN USERS & SUBSCRIPTIONS
            // -------------------------
            Route::get('admin-users', [\App\Http\Controllers\Admin\AdminUsersController::class, 'index'])->name('admin-users.index');
            Route::post('admin-users', [\App\Http\Controllers\Admin\AdminUsersController::class, 'store'])->name('admin-users.store');
            Route::put('admin-users/{id}', [\App\Http\Controllers\Admin\AdminUsersController::class, 'update'])->name('admin-users.update');
            Route::match(['post', 'patch'], 'admin-users/{id}/approval', [\App\Http\Controllers\Admin\AdminUsersController::class, 'updateApproval'])->name('admin-users.approval');
            Route::match(['post', 'patch'], 'admin-users/{id}/toggle', [\App\Http\Controllers\Admin\AdminUsersController::class, 'toggleStatus'])->name('admin-users.toggle');
            Route::delete('admin-users/{id}', [\App\Http\Controllers\Admin\AdminUsersController::class, 'destroy'])->name('admin-users.destroy');

            // -------------------------
            // ✅ SUPER ADMIN: DATABASE BACKUPS
            // -------------------------
            Route::middleware(['is_super_admin'])->prefix('backups')->name('backups.')->group(function () {
                Route::get('/', [\App\Http\Controllers\Admin\DatabaseBackupController::class, 'index'])->name('index');
                Route::post('/settings', [\App\Http\Controllers\Admin\DatabaseBackupController::class, 'updateSettings'])->name('settings.update');
                Route::post('/run', [\App\Http\Controllers\Admin\DatabaseBackupController::class, 'runBackup'])->name('run');
                Route::post('/test-gdrive', [\App\Http\Controllers\Admin\DatabaseBackupController::class, 'testConnection'])->name('test-gdrive');
                Route::delete('/{id}', [\App\Http\Controllers\Admin\DatabaseBackupController::class, 'destroy'])->name('destroy');
            });
        });


        Route::resource('projects', AdminProjectController::class);
        Route::post('projects/{project}/tasks/reorder', [AdminProjectController::class, 'reorder'])
            ->name('projects.tasks.reorder');

        Route::resource('tasks', AdminTaskController::class);
        Route::put('/tasks/{id}/status', [AdminTaskController::class, 'status'])
            ->name('tasks.status');
        Route::post('/tasks/{task}/comments', [AdminTaskController::class, 'storeComment'])->name('tasks.comments.store');
        Route::delete('/comments/{comment}', [AdminTaskController::class, 'destroyComment'])->name('tasks.comments.destroy');

        // Domains & Hosting
        Route::resource('domains', \App\Http\Controllers\Admin\DomainController::class);
        Route::post('domains/hostings', [\App\Http\Controllers\Admin\DomainController::class, 'storeHosting'])->name('domains.hostings.store');
        Route::put('domains/hostings/{hosting}', [\App\Http\Controllers\Admin\DomainController::class, 'updateHosting'])->name('domains.hostings.update');
        Route::delete('domains/hostings/{hosting}', [\App\Http\Controllers\Admin\DomainController::class, 'destroyHosting'])->name('domains.hostings.destroy');
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

// Production OAuth Helper Redirects
Route::get('/google-drive/auth', [GoogleDriveAuthController::class, 'redirect']);

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
                $icon['src'] = asset($cleanSrc) . '?v=6';
            }
        }
    }
    if (isset($json['screenshots'])) {
        foreach ($json['screenshots'] as &$screenshot) {
            if (strpos($screenshot['src'], '../') === 0) {
                $cleanSrc = substr($screenshot['src'], 3);
                $screenshot['src'] = asset($cleanSrc) . '?v=6';
            }
        }
    }
    
    return response()->json($json, 200, [
        'Content-Type' => 'application/manifest+json; charset=utf-8'
    ]);
});

require __DIR__.'/auth.php';

