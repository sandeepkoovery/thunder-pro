<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Setting;
use Illuminate\Support\Str;

class CheckBetaAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $betaMenuItems = json_decode(Setting::where('key', 'beta_menu_items')->value('value') ?? '[]', true);

        if (empty($betaMenuItems)) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();
        if (!$routeName) {
            return $next($request);
        }

        // Never restrict settings page or logout
        if ($routeName === 'admin.settings.index' || $routeName === 'logout' || $routeName === 'admin.settings.update') {
            return $next($request);
        }

        $mapping = [
            'dashboard' => ['dashboard'],
            'projects' => ['projects.', 'admin.projects.'],
            'users' => ['admin.users.'],
            'leaves' => ['leave.', 'admin.leaves.'],
            'attendance' => ['attendance.', 'admin.attendance.'],
            'calendar' => ['calendar.'],
            'drive' => ['drive.', 'admin.drive.', 'google-drive.'],
            'chat' => ['chat.'],
            'content-calendar' => ['content-calendar.', 'admin.content-calendar.'],
            'daily-worksheet' => ['daily-worksheet.', 'admin.daily-worksheet.'],
            'worksheet-settings' => ['admin.daily-worksheet.users', 'admin.users.worksheet-settings'],
        ];

        foreach ($betaMenuItems as $item) {
            if (isset($mapping[$item])) {
                foreach ($mapping[$item] as $prefix) {
                    if (Str::startsWith($routeName, $prefix) || $routeName === $prefix) {
                        return redirect()->back()->with('error', 'access denied.. please contact administrator');
                    }
                }
            }
        }

        return $next($request);
    }
}
