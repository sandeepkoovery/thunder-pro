<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\WebAuthnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PasskeyController extends Controller
{
    protected WebAuthnService $webAuthnService;

    public function __construct(WebAuthnService $webAuthnService)
    {
        $this->webAuthnService = $webAuthnService;
    }

    /**
     * Get registration options for WebAuthn navigator.credentials.create
     */
    public function registerOptions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $options = $this->webAuthnService->generateRegisterOptions($user, $request);
            return response()->json($options);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Failed to generate registration options.'
            ], 400);
        }
    }

    /**
     * Store newly created passkey after Windows Hello validation
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'clientDataJSON' => 'required|string',
            'attestationObject' => 'required|string',
            'rawId' => 'required|string',
            'device_name' => 'nullable|string|max:255',
        ]);

        try {
            $user = $request->user();
            $passkey = $this->webAuthnService->verifyRegisterResponse($user, $request->all(), $request);

            return response()->json([
                'success' => true,
                'message' => 'Windows Hello Passkey enabled successfully!',
                'passkey' => [
                    'id' => $passkey->id,
                    'device_name' => $passkey->device_name,
                    'created_at' => $passkey->created_at->format('M d, Y'),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Passkey registration failed.',
            ], 422);
        }
    }

    /**
     * Get authentication options for WebAuthn navigator.credentials.get
     */
    public function loginOptions(Request $request): JsonResponse
    {
        try {
            $email = $request->input('email');
            $options = $this->webAuthnService->generateLoginOptions($email, $request);
            return response()->json($options);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Failed to generate login options.'
            ], 400);
        }
    }

    /**
     * Authenticate user session with Windows Hello passkey
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|string',
            'clientDataJSON' => 'required|string',
            'authenticatorData' => 'required|string',
            'signature' => 'required|string',
        ]);

        try {
            $user = $this->webAuthnService->verifyLoginResponse($request->all(), $request);

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is deactivated. Please contact support.',
                ], 403);
            }

            if ($user instanceof \App\Models\User && !empty($user->desktop_only)) {
                $userAgent = $request->header('User-Agent') ?? '';
                $isMobileDevice = (bool) preg_match('/Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i', $userAgent);
                $isPwaRequest = $request->header('X-PWA-Mode') === 'true'
                             || $request->boolean('is_pwa')
                             || $request->input('is_pwa') === 'true'
                             || $request->query('pwa') === '1'
                             || $request->query('source') === 'pwa';

                if ($isMobileDevice || $isPwaRequest) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Your account is restricted to Desktop login only. Access via mobile device or PWA is not permitted.',
                    ], 403);
                }
            }

            Auth::login($user, true);
            $request->session()->regenerate();

            return response()->json([
                'success' => true,
                'redirect' => route('dashboard'),
                'message' => 'Authenticated with Windows Hello successfully!',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Passkey login failed.',
            ], 422);
        }
    }

    /**
     * List user passkeys
     */
    public function index(Request $request): JsonResponse
    {
        $passkeys = $request->user()->passkeys()->orderBy('created_at', 'desc')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'device_name' => $p->device_name,
                'created_at' => $p->created_at->format('M d, Y'),
                'last_used_at' => $p->last_used_at ? $p->last_used_at->diffForHumans() : 'Never',
            ];
        });

        return response()->json([
            'passkeys' => $passkeys,
        ]);
    }

    /**
     * Delete a passkey
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $passkey = $request->user()->passkeys()->where('id', $id)->first();

        if (!$passkey) {
            return response()->json(['message' => 'Passkey not found.'], 404);
        }

        $passkey->delete();

        return response()->json([
            'success' => true,
            'message' => 'Passkey removed successfully.',
        ]);
    }
}
