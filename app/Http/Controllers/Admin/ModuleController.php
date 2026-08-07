<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (auth()->check() && !in_array(auth()->user()->role, ['superadmin', 'admin'])) {
                abort(403, 'Unauthorized action.');
            }
            return $next($request);
        });
    }

    public function index()
    {
        $modules = [
            ['key' => 'projects', 'name' => 'Projects', 'description' => 'Manage projects, tasks, and task comments'],
            ['key' => 'users', 'name' => 'Employees & Users', 'description' => 'Employee directory, user creation, and role management'],
            ['key' => 'departments', 'name' => 'Departments', 'description' => 'Department management and user department structure'],
            ['key' => 'attendance', 'name' => 'Attendance', 'description' => 'Daily punch in/out, breaks, and attendance history'],
            ['key' => 'leaves', 'name' => 'Leaves', 'description' => 'Leave applications, approval workflow, and balance tracking'],
            ['key' => 'calendar', 'name' => 'Calendar', 'description' => 'Company events, holidays, and schedule calendar'],
            ['key' => 'content_calendar', 'name' => 'Content Calendar', 'description' => 'Social media and marketing content scheduling'],
            ['key' => 'daily_listings', 'name' => 'Daily Listings', 'description' => 'Daily worksheet, task logs, and user listing settings'],
            ['key' => 'designers_worklist', 'name' => 'Designers Worklist', 'description' => 'Design tasks, asset uploads, and status workflows'],
            ['key' => 'drive', 'name' => 'Drive', 'description' => 'Google Drive file browser and storage management'],
            ['key' => 'chat', 'name' => 'Chat & Messaging', 'description' => 'Real-time team chat and direct messaging'],
            ['key' => 'websites', 'name' => 'Websites & Domains', 'description' => 'Domain registration tracking and hosting management'],
            ['key' => 'reports', 'name' => 'Reports', 'description' => 'Attendance, working hours, and activity reporting'],
        ];

        $defaultOrder = [
            'projects' => 1,
            'users' => 2,
            'departments' => 3,
            'attendance' => 4,
            'leaves' => 5,
            'calendar' => 6,
            'content_calendar' => 7,
            'daily_listings' => 8,
            'designers_worklist' => 9,
            'drive' => 10,
            'chat' => 11,
            'websites' => 12,
            'reports' => 13,
        ];

        $savedOrderJson = Setting::where('key', 'module_order')->value('value');
        $savedOrder = $savedOrderJson ? json_decode($savedOrderJson, true) : [];
        $moduleOrder = array_merge($defaultOrder, is_array($savedOrder) ? $savedOrder : []);

        foreach ($modules as &$mod) {
            $mod['order'] = (int) ($moduleOrder[$mod['key']] ?? 99);
        }
        unset($mod);

        usort($modules, function ($a, $b) {
            return $a['order'] <=> $b['order'];
        });

        // Roles list specifically excluding superadmin
        $roles = [
            ['key' => 'admin', 'name' => 'Admin', 'is_locked' => true, 'badge' => 'Full Access'],
            ['key' => 'manager', 'name' => 'Users Manager', 'is_locked' => false],
            ['key' => 'editor', 'name' => 'Editor', 'is_locked' => false],
            ['key' => 'user', 'name' => 'User / Employee', 'is_locked' => false],
        ];

        $allModuleKeys = array_column($modules, 'key');

        $savedSetting = Setting::where('key', 'role_module_permissions')->value('value');
        $rolePermissions = $savedSetting ? json_decode($savedSetting, true) : [];

        // Ensure defaults if not set
        $defaultPermissions = [
            'admin' => $allModuleKeys,
            'manager' => ['projects', 'users', 'departments', 'attendance', 'leaves', 'calendar', 'content_calendar', 'daily_listings', 'designers_worklist', 'drive', 'chat', 'reports'],
            'editor' => ['projects', 'departments', 'attendance', 'leaves', 'calendar', 'content_calendar', 'daily_listings', 'designers_worklist', 'drive', 'chat'],
            'user' => ['projects', 'attendance', 'leaves', 'calendar', 'content_calendar', 'daily_listings', 'drive', 'chat'],
        ];

        foreach ($defaultPermissions as $rKey => $defVal) {
            if ($rKey === 'admin') {
                $rolePermissions['admin'] = $allModuleKeys; // Admin always gets all modules
            } elseif (!isset($rolePermissions[$rKey]) || !is_array($rolePermissions[$rKey])) {
                $rolePermissions[$rKey] = $defVal;
            }
        }

        return Inertia::render('Admin/Modules/Index', [
            'modules' => $modules,
            'roles' => $roles,
            'rolePermissions' => $rolePermissions,
            'moduleOrder' => $moduleOrder,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'module_order' => 'nullable|array',
        ]);

        $modules = [
            'projects', 'users', 'departments', 'attendance', 'leaves', 'calendar', 
            'content_calendar', 'daily_listings', 'designers_worklist', 
            'drive', 'chat', 'websites', 'reports'
        ];

        $permissions = $validated['permissions'];

        // Enforce rule: Admin role always gets ALL modules and cannot be modified
        $permissions['admin'] = $modules;

        // Clean arrays
        foreach ($permissions as $role => &$mods) {
            if (is_array($mods)) {
                $mods = array_values(array_intersect($mods, $modules));
            } else {
                $mods = [];
            }
        }

        Setting::updateOrCreate(
            ['key' => 'role_module_permissions'],
            ['value' => json_encode($permissions)]
        );

        if (!empty($validated['module_order']) && is_array($validated['module_order'])) {
            $cleanedOrder = [];
            foreach ($validated['module_order'] as $mKey => $oVal) {
                if (in_array($mKey, $modules)) {
                    $cleanedOrder[$mKey] = (int) $oVal;
                }
            }

            // Check for duplicate order values
            $orderValues = array_values($cleanedOrder);
            $duplicateValues = array_unique(array_diff_assoc($orderValues, array_unique($orderValues)));
            if (!empty($duplicateValues)) {
                $dupNum = implode(', ', $duplicateValues);
                return back()->withErrors(['module_order' => "Order numbers must be unique. Duplicate order number ($dupNum) detected."]);
            }

            Setting::updateOrCreate(
                ['key' => 'module_order'],
                ['value' => json_encode($cleanedOrder)]
            );
        }

        Cache::forget('global_settings_map');

        return back()->with('success', 'Module settings saved successfully.');
    }
}
