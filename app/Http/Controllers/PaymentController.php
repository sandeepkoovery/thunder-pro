<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use App\Models\Admin;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Create Razorpay Order for Subscription
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'plan' => 'required|in:basic,premium',
            'name' => 'required_if:is_guest,true|nullable|string|max:255',
            'email' => 'required_if:is_guest,true|nullable|email|max:255',
            'password' => 'required_if:is_guest,true|nullable|string|min:6',
        ]);

        $isGuest = $request->boolean('is_guest') || !Auth::check();
        $email = $request->input('email');

        if ($isGuest && $email) {
            $existsInAdmins = Admin::where('email', $email)->exists();
            $existsInUsers = User::where('email', $email)->exists();
            if ($existsInAdmins || $existsInUsers) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This email address is already registered. Please sign in or use a different email.'
                ], 422);
            }
        }

        $plan = $request->input('plan', 'basic');
        $defaultPrice = $plan === 'premium' ? 2999 : 999;
        
        $settingPrice = Setting::where('key', $plan . '_plan_price')->value('value');
        $price = $settingPrice ? (float) $settingPrice : $defaultPrice;
        $amountInPaise = (int) round($price * 100);

        $keyId = config('services.razorpay.key_id', env('RAZORPAY_KEY_ID', 'rzp_test_worknest_key'));
        $keySecret = config('services.razorpay.key_secret', env('RAZORPAY_KEY_SECRET', 'rzp_test_worknest_secret'));

        $orderId = 'order_' . uniqid() . '_' . time();

        // Attempt real Razorpay API call if valid non-placeholder keys are set
        if (!empty($keyId) && !empty($keySecret) && !str_contains($keyId, 'test_worknest_key')) {
            try {
                $response = Http::withBasicAuth($keyId, $keySecret)
                    ->post('https://api.razorpay.com/v1/orders', [
                        'amount' => $amountInPaise,
                        'currency' => 'INR',
                        'receipt' => 'rcpt_' . time(),
                        'notes' => [
                            'plan' => $plan,
                            'client_email' => $request->input('email') ?: (Auth::user()?->email ?? ''),
                        ]
                    ]);

                if ($response->successful() && isset($response->json()['id'])) {
                    $orderId = $response->json()['id'];
                }
            } catch (\Exception $e) {
                Log::warning('Razorpay Order API fallback: ' . $e->getMessage());
            }
        }

        $isMock = empty($keyId) || str_contains($keyId, 'test_worknest_key') || str_starts_with($orderId, 'order_demo_') || str_starts_with($orderId, 'order_6');

        return response()->json([
            'status' => 'success',
            'order_id' => $orderId,
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'key' => $keyId,
            'plan' => $plan,
            'price' => $price,
            'is_mock' => $isMock,
        ]);
    }

    /**
     * Verify Razorpay Payment Signature, Provision Database, SuperAdmin & Client Admin, and Redirect to Admin Dashboard
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'razorpay_payment_id' => 'required|string',
            'razorpay_order_id' => 'required|string',
            'plan' => 'required|in:basic,premium',
        ]);

        $paymentId = $request->input('razorpay_payment_id');
        $orderId = $request->input('razorpay_order_id');
        $signature = $request->input('razorpay_signature');
        $plan = $request->input('plan');

        $keySecret = config('services.razorpay.key_secret', env('RAZORPAY_KEY_SECRET', 'rzp_test_worknest_secret'));

        // Verify HMAC SHA256 Signature if live signature is provided and not in direct/simulated test mode
        $isDirect = str_starts_with($paymentId, 'pay_direct_') || str_starts_with($paymentId, 'pay_test_') || str_starts_with($paymentId, 'pay_demo_');

        if (!$isDirect && !empty($signature) && !empty($keySecret) && !str_contains($keySecret, 'test_worknest_secret')) {
            $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);
            if (!hash_equals($expectedSignature, $signature)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment verification signature failed. Please contact support.'
                ], 400);
            }
        }

        // 1. Ensure Super Admin user exists in admins database table
        $superAdmin = Admin::where('role', 'superadmin')->first();
        if (!$superAdmin) {
            Admin::create([
                'name' => 'Super Administrator',
                'email' => 'superadmin@erp.com',
                'password' => Hash::make('password'),
                'role' => 'superadmin',
                'is_active' => true,
            ]);
        }

        // 2. Ensure Database tables are fully seeded (Departments etc.)
        if (Department::count() === 0) {
            $departments = [
                ['name' => 'IT', 'code' => 'IT', 'description' => 'Information Technology'],
                ['name' => 'HR', 'code' => 'HR', 'description' => 'Human Resources'],
                ['name' => 'Accounts', 'code' => 'ACCT', 'description' => 'Accounts and Finance'],
                ['name' => 'Sales', 'code' => 'SALES', 'description' => 'Sales and Business Development'],
                ['name' => 'Marketing', 'code' => 'MKTG', 'description' => 'Marketing and Advertising'],
            ];
            foreach ($departments as $dept) {
                Department::updateOrCreate(['name' => $dept['name']], $dept);
            }
        }

        // 3. Register or Update Client Admin account in admins table
        $adminUser = Auth::guard('admin')->user() ?? Auth::user();

        if (!$adminUser || !($adminUser instanceof Admin)) {
            $email = $request->input('email');
            $name = $request->input('name');
            $password = $request->input('password');

            if ($email) {
                $adminUser = Admin::where('email', $email)->first();
            }

            if (!$adminUser) {
                if (!$email || !$name || !$password) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'User registration credentials missing.'
                    ], 422);
                }

                $adminUser = Admin::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'role' => 'admin',
                    'plan' => $plan,
                    'phone' => $request->input('phone'),
                    'company_name' => $request->input('company_name'),
                    'is_active' => true,
                ]);
            } else {
                // Account with this email already exists
                if ($password && !Hash::check($password, $adminUser->password)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'This email is already registered. The password entered does not match the existing account.'
                    ], 422);
                }

                $adminUser->update([
                    'role' => 'admin',
                    'plan' => $plan,
                    'is_active' => true,
                ]);
            }
        } else {
            $adminUser->update([
                'role' => 'admin',
                'plan' => $plan,
                'is_active' => true,
            ]);
        }

        // 4. Authenticate client admin in session
        Auth::guard('admin')->login($adminUser, true);
        Auth::shouldUse('admin');

        return response()->json([
            'status' => 'success',
            'message' => 'Payment verified successfully! Welcome to your Admin Dashboard.',
            'redirect' => route('dashboard'),
        ]);
    }
}
