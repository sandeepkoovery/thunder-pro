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
            if (auth()->check() && !in_array(auth()->user()->role, ['superadmin', 'admin', 'manager', 'editor'])) {
                abort(403, 'Unauthorized action.');
            }
            return $next($request);
        });
    }

    public function index()
    {
        $modules = [
            ['key' => 'dashboard', 'name' => 'Dashboard', 'description' => 'Main application overview and statistics dashboard'],
            ['key' => 'projects', 'name' => 'Projects', 'description' => 'Manage projects, tasks, and task comments'],
            ['key' => 'users', 'name' => 'Employees & Users', 'description' => 'Employee directory, user creation, and role management'],
            ['key' => 'departments', 'name' => 'Departments', 'description' => 'Department management and user department structure'],
            ['key' => 'attendance', 'name' => 'Attendance', 'description' => 'Daily punch in/out, breaks, and attendance history'],
            ['key' => 'leaves', 'name' => 'Leaves', 'description' => 'Leave applications, approval workflow, and balance tracking'],
            ['key' => 'calendar', 'name' => 'Calendar', 'description' => 'Company events, holidays, and schedule calendar'],
            ['key' => 'content_calendar', 'name' => 'Content Calendar', 'description' => 'Social media and marketing content scheduling (Add-on)'],
            ['key' => 'daily_listings', 'name' => 'Daily Listings', 'description' => 'Daily worksheet, task logs, and user listing settings (Add-on)'],
            ['key' => 'designers_worklist', 'name' => 'Designers Worklist', 'description' => 'Design tasks, asset uploads, and status workflows (Add-on)'],
            ['key' => 'drive', 'name' => 'Drive', 'description' => 'Google Drive file browser and storage management'],
            ['key' => 'chat', 'name' => 'Chat & Messaging', 'description' => 'Real-time team chat and direct messaging'],
            ['key' => 'websites', 'name' => 'Websites & Domains', 'description' => 'Domain registration tracking and hosting management (Add-on)'],
            ['key' => 'reports', 'name' => 'Reports', 'description' => 'Attendance, working hours, and activity reporting'],
            ['key' => 'notifications', 'name' => 'Notifications', 'description' => 'System notifications and user alert logs'],
            ['key' => 'ai_assistant', 'name' => 'AI Voice Assistant', 'description' => 'Voice & AI Assistant for database queries and tasks (Add-on)'],
            ['key' => 'modules', 'name' => 'Modules List', 'description' => 'Module access matrix and menu ordering control'],
            ['key' => 'pricing', 'name' => 'Pricing', 'description' => 'Subscription plans and billing settings'],
            ['key' => 'settings', 'name' => 'Settings', 'description' => 'Global application settings and configuration'],
        ];

        // Merge any dynamic additional modules from settings
        $existingKeys = array_column($modules, 'key');
        $additionalModulesJson = Setting::where('key', 'additional_modules')->value('value');
        if ($additionalModulesJson) {
            $addOns = json_decode($additionalModulesJson, true);
            if (is_array($addOns)) {
                foreach ($addOns as $addOn) {
                    $key = $addOn['key'] ?? null;
                    if ($key && !in_array($key, $existingKeys)) {
                        $modules[] = [
                            'key' => $key,
                            'name' => ($addOn['label'] ?? $addOn['name'] ?? ucfirst(str_replace('_', ' ', $key))) . ' (Add-on)',
                            'description' => $addOn['description'] ?? 'Add-on module',
                        ];
                        $existingKeys[] = $key;
                    }
                }
            }
        }

        $defaultOrder = [
            'dashboard' => 1,
            'projects' => 2,
            'users' => 3,
            'departments' => 4,
            'attendance' => 5,
            'leaves' => 6,
            'calendar' => 7,
            'content_calendar' => 8,
            'daily_listings' => 9,
            'designers_worklist' => 10,
            'drive' => 11,
            'chat' => 12,
            'websites' => 13,
            'reports' => 14,
            'notifications' => 15,
            'modules' => 16,
            'pricing' => 17,
            'settings' => 18,
            'ai_assistant' => 19,
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

        $authUser = auth()->user();
        $isSuperAdmin = $authUser && $authUser->role === 'superadmin';
        $tenantAdminId = $authUser ? ($authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id)) : null;

        $managersQuery = \App\Models\User::where('role', 'manager');
        if (!$isSuperAdmin && $tenantAdminId) {
            $managersQuery->where('admin_id', $tenantAdminId);
        }
        $managers = $managersQuery->orderBy('name')->get();

        $allModuleKeys = array_column($modules, 'key');

        $savedSetting = Setting::where('key', 'role_module_permissions')->value('value');
        $rolePermissions = $savedSetting ? json_decode($savedSetting, true) : [];

        // Ensure defaults if not set
        $defaultPermissions = [
            'admin' => $allModuleKeys,
            'manager' => [],
            'editor' => ['dashboard', 'projects', 'departments', 'attendance', 'leaves', 'calendar', 'content_calendar', 'daily_listings', 'designers_worklist', 'drive', 'chat', 'reports', 'notifications', 'ai_assistant'],
            'user' => ['dashboard', 'projects', 'attendance', 'leaves', 'calendar', 'content_calendar', 'daily_listings', 'drive', 'chat', 'notifications', 'ai_assistant'],
        ];

        foreach ($defaultPermissions as $rKey => $defVal) {
            if ($rKey === 'admin') {
                $rolePermissions['admin'] = $allModuleKeys; // Admin always gets all modules
            } elseif (!isset($rolePermissions[$rKey]) || !is_array($rolePermissions[$rKey])) {
                $rolePermissions[$rKey] = $defVal;
            } else {
                $missing = array_diff($defVal, $rolePermissions[$rKey]);
                if (!empty($missing)) {
                    $rolePermissions[$rKey] = array_values(array_unique(array_merge($rolePermissions[$rKey], $missing)));
                }
            }
        }

        // Roles for the Full Matrix view (base system roles only).
        // Individual managers are managed separately in the dedicated "Managers Assignment" tab.
        $roles = [
            ['key' => 'admin', 'name' => 'Admin', 'is_locked' => true, 'badge' => 'Full Access'],
            ['key' => 'editor', 'name' => 'Editor', 'is_locked' => false],
            ['key' => 'user', 'name' => 'User / Employee', 'is_locked' => false],
        ];

        // Populate individual manager permissions for the Managers Assignment tab.
        // If a manager's permissions are an array, ensure 'dashboard' is present.
        // If not set yet, check Setting for manager_{id}, else default to ['dashboard'].
        foreach ($managers as $mgr) {
            $mods = null;
            if (is_array($mgr->module_permissions)) {
                $mods = $mgr->module_permissions;
            } elseif (isset($rolePermissions['manager_' . $mgr->id]) && is_array($rolePermissions['manager_' . $mgr->id])) {
                $mods = $rolePermissions['manager_' . $mgr->id];
            } else {
                $mods = ['dashboard'];
            }

            if (!in_array('dashboard', $mods)) {
                array_unshift($mods, 'dashboard');
            }
            $rolePermissions['manager_' . $mgr->id] = array_values(array_unique($mods));
        }

        $adminOnlyModules = ['departments', 'users', 'settings', 'modules', 'pricing', 'websites'];
        if (isset($rolePermissions['editor']) && is_array($rolePermissions['editor'])) {
            $rolePermissions['editor'] = array_values(array_diff($rolePermissions['editor'], $adminOnlyModules));
        }
        if (isset($rolePermissions['user']) && is_array($rolePermissions['user'])) {
            $rolePermissions['user'] = array_values(array_diff($rolePermissions['user'], $adminOnlyModules));
        }

        $departmentsQuery = \App\Models\Department::query();
        if (!$isSuperAdmin && $tenantAdminId) {
            $departmentsQuery->where('admin_id', $tenantAdminId);
        }
        $departments = $departmentsQuery->orderBy('name')->get();

        return Inertia::render('Admin/Modules/Index', [
            'modules' => $modules,
            'roles' => $roles,
            'rolePermissions' => $rolePermissions,
            'moduleOrder' => $moduleOrder,
            'managers' => $managers,
            'departments' => $departments,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'module_order' => 'nullable|array',
        ]);

        $modules = [
            'dashboard', 'projects', 'users', 'departments', 'attendance', 'leaves', 
            'calendar', 'content_calendar', 'daily_listings', 'designers_worklist', 
            'drive', 'chat', 'websites', 'reports', 'notifications', 'modules', 
            'pricing', 'settings', 'ai_assistant'
        ];

        $additionalModulesJson = Setting::where('key', 'additional_modules')->value('value');
        if ($additionalModulesJson) {
            $addOns = json_decode($additionalModulesJson, true);
            if (is_array($addOns)) {
                foreach ($addOns as $addOn) {
                    if (!empty($addOn['key']) && !in_array($addOn['key'], $modules)) {
                        $modules[] = $addOn['key'];
                    }
                }
            }
        }

        $permissions = $validated['permissions'];

        // Enforce rule: Admin role always gets ALL modules and cannot be modified
        $permissions['admin'] = $modules;

        $rolePermissionsToSave = [];

        // Clean and dispatch permissions
        foreach ($permissions as $roleKey => $mods) {
            $cleanMods = is_array($mods) ? array_values(array_intersect($mods, $modules)) : [];

            if (str_starts_with($roleKey, 'manager_')) {
                $mgrId = (int) str_replace('manager_', '', $roleKey);

                // Dashboard is ALWAYS required for managers
                if (!in_array('dashboard', $cleanMods)) {
                    array_unshift($cleanMods, 'dashboard');
                }
                $cleanMods = array_values(array_unique($cleanMods));

                // 1. Save directly to User model
                $mgrUser = \App\Models\User::find($mgrId);
                if ($mgrUser) {
                    $mgrUser->module_permissions = $cleanMods;
                    $mgrUser->save();
                }

                // 2. Also save to Setting role_module_permissions so it survives any database state
                $rolePermissionsToSave[$roleKey] = $cleanMods;
            } else {
                if (in_array($roleKey, ['editor', 'user'])) {
                    $adminOnlyModules = ['departments', 'users', 'settings', 'modules', 'pricing', 'websites'];
                    $cleanMods = array_values(array_diff($cleanMods, $adminOnlyModules));
                }
                $rolePermissionsToSave[$roleKey] = $cleanMods;
            }
        }

        // CRITICAL: Overwrite legacy generic 'manager' key so it never falls back to 19 modules
        $rolePermissionsToSave['manager'] = ['dashboard'];

        Setting::updateOrCreate(
            ['key' => 'role_module_permissions'],
            ['value' => json_encode($rolePermissionsToSave)]
        );

        if (!empty($validated['module_order']) && is_array($validated['module_order'])) {
            $cleanedOrder = [];
            foreach ($validated['module_order'] as $mKey => $oVal) {
                if (in_array($mKey, $modules) && $oVal !== '' && $oVal !== null) {
                    $cleanedOrder[$mKey] = (int) $oVal;
                }
            }

            // Determine visible/allowed modules for duplicate checking based on current user role
            $user = auth()->user();
            $isSuperAdmin = $user && $user->role === 'superadmin';

            $orderCheckModules = $modules;
            if (!$isSuperAdmin) {
                $admin = $user->tenant_id ? \App\Models\User::find($user->tenant_id) : $user;
                $plan = $admin ? ($admin->subscription_plan ?? 'basic') : 'basic';
                $basicModules = ['dashboard', 'projects', 'users', 'departments', 'attendance', 'leaves', 'notifications', 'modules', 'pricing', 'settings'];
                $premiumModules = ['dashboard', 'projects', 'users', 'departments', 'attendance', 'leaves', 'calendar', 'chat', 'reports', 'drive', 'notifications', 'modules', 'pricing', 'settings'];

                $userAdditionalModules = [];
                if ($admin && !empty($admin->additional_modules)) {
                    $userAdditionalModules = is_array($admin->additional_modules) ? $admin->additional_modules : (json_decode($admin->additional_modules, true) ?: []);
                }

                $tenantMaxModules = array_unique(array_merge(
                    $plan === 'premium' ? $premiumModules : $basicModules,
                    $userAdditionalModules,
                    ['dashboard', 'departments', 'notifications', 'pricing', 'settings', 'modules']
                ));

                $orderCheckModules = array_values(array_intersect($modules, $tenantMaxModules));
            }

            // Check for duplicate order values among visible/allowed modules for this user
            $checkOrderValues = [];
            foreach ($orderCheckModules as $mKey) {
                if (isset($cleanedOrder[$mKey])) {
                    $checkOrderValues[] = $cleanedOrder[$mKey];
                }
            }

            $duplicateValues = array_unique(array_diff_assoc($checkOrderValues, array_unique($checkOrderValues)));
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

    public function addManager(Request $request)
    {
        $validated = $request->validate([
            'designation' => 'required|string|max:255',
            'module_permissions' => 'nullable|array',
            'module_permissions.*' => 'string',
        ]);

        $authUser = auth()->user();
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        $designation = trim($validated['designation']);
        $slug = \Illuminate\Support\Str::slug($designation, '_');
        $uniqueSuffix = time() . '_' . rand(100, 999);
        $email = $slug . '_' . $uniqueSuffix . '@company.local';

        $initialMods = $validated['module_permissions'] ?? [];
        if (!in_array('dashboard', $initialMods)) {
            array_unshift($initialMods, 'dashboard');
        }
        $initialMods = array_values(array_unique($initialMods));

        $manager = \App\Models\User::create([
            'name' => $designation,
            'email' => $email,
            'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(16)),
            'role' => 'manager',
            'designation' => $designation,
            'admin_id' => $tenantAdminId,
            'module_permissions' => $initialMods,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        // Also save to Setting
        $settingRow = Setting::where('key', 'role_module_permissions')->first();
        if ($settingRow) {
            $curPerms = json_decode($settingRow->value, true) ?: [];
            $curPerms['manager_' . $manager->id] = $initialMods;
            $curPerms['manager'] = ['dashboard'];
            $settingRow->value = json_encode($curPerms);
            $settingRow->save();
            Cache::forget('global_settings_map');
        }

        return redirect()->back()->with('success', "Manager '{$designation}' created successfully!");
    }
}
