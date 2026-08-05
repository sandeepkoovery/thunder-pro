<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPasskey;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CborDecoder
{
    public static function decode(string $data, int &$offset = 0)
    {
        if ($offset >= strlen($data)) {
            return null;
        }

        $byte = ord($data[$offset++]);
        $major = $byte >> 5;
        $val = $byte & 0x1F;

        if ($val === 24) {
            $val = ord($data[$offset++]);
        } elseif ($val === 25) {
            $unpacked = unpack('n', substr($data, $offset, 2));
            $val = $unpacked[1];
            $offset += 2;
        } elseif ($val === 26) {
            $unpacked = unpack('N', substr($data, $offset, 4));
            $val = $unpacked[1];
            $offset += 4;
        } elseif ($val === 27) {
            $high = unpack('N', substr($data, $offset, 4))[1];
            $low = unpack('N', substr($data, $offset + 4, 4))[1];
            $val = ($high << 32) | $low;
            $offset += 8;
        }

        switch ($major) {
            case 0:
                return $val;
            case 1:
                return -1 - $val;
            case 2:
            case 3:
                $str = substr($data, $offset, $val);
                $offset += $val;
                return $str;
            case 4:
                $arr = [];
                for ($i = 0; $i < $val; $i++) {
                    $arr[] = self::decode($data, $offset);
                }
                return $arr;
            case 5:
                $map = [];
                for ($i = 0; $i < $val; $i++) {
                    $k = self::decode($data, $offset);
                    $v = self::decode($data, $offset);
                    $map[$k] = $v;
                }
                return $map;
            case 7:
                return $val;
            default:
                throw new \Exception("Unsupported CBOR major type {$major}");
        }
    }
}

class WebAuthnService
{
    public static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    public static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }

    public function getRelyingPartyHost(Request $request): string
    {
        $host = $request->getHost();
        // Remove port if present
        return explode(':', $host)[0];
    }

    public function generateRegisterOptions(User $user, Request $request): array
    {
        $challenge = random_bytes(32);
        $challengeBase64 = self::base64UrlEncode($challenge);

        $userHandle = (string) $user->id;

        session([
            'webauthn_register_challenge' => $challengeBase64,
            'webauthn_user_handle' => $userHandle,
        ]);

        $rpHost = $this->getRelyingPartyHost($request);

        // Registered credentials to exclude
        $excludeCredentials = $user->passkeys()->get()->map(function ($p) {
            return [
                'id' => $p->credential_id,
                'type' => 'public-key',
            ];
        })->toArray();

        return [
            'rp' => [
                'name' => config('app.name', 'ERP Pro'),
                'id' => $rpHost,
            ],
            'user' => [
                'id' => self::base64UrlEncode($userHandle),
                'name' => $user->email,
                'displayName' => $user->name,
            ],
            'challenge' => $challengeBase64,
            'pubKeyCredParams' => [
                ['type' => 'public-key', 'alg' => -7],   // ES256
                ['type' => 'public-key', 'alg' => -257], // RS256
            ],
            'timeout' => 60000,
            'excludeCredentials' => $excludeCredentials,
            'authenticatorSelection' => [
                'authenticatorAttachment' => 'platform', // Windows Hello
                'userVerification' => 'preferred',
                'residentKey' => 'preferred',
            ],
            'attestation' => 'none',
        ];
    }

    public function verifyRegisterResponse(User $user, array $data, Request $request): UserPasskey
    {
        $sessionChallenge = session('webauthn_register_challenge');
        if (!$sessionChallenge) {
            throw new \Exception('Registration challenge expired or missing. Please try again.');
        }

        // 1. Validate clientDataJSON
        $clientDataJsonRaw = self::base64UrlDecode($data['clientDataJSON']);
        $clientData = json_decode($clientDataJsonRaw, true);

        if (($clientData['type'] ?? '') !== 'webauthn.create') {
            throw new \Exception('Invalid WebAuthn client data type.');
        }

        if (($clientData['challenge'] ?? '') !== $sessionChallenge) {
            throw new \Exception('Challenge mismatch during passkey registration.');
        }

        // Validate origin
        $origin = $clientData['origin'] ?? '';
        $expectedOrigin = $request->getSchemeAndHttpHost();
        if (rtrim(strtolower($origin), '/') !== rtrim(strtolower($expectedOrigin), '/')) {
            // Allow localhost variations
            $originHost = parse_url($origin, PHP_URL_HOST);
            $requestHost = $request->getHost();
            if ($originHost !== $requestHost && !($originHost === '127.0.0.1' && $requestHost === 'localhost')) {
                throw new \Exception("Origin mismatch: expected {$expectedOrigin}, got {$origin}");
            }
        }

        // 2. Decode Attestation Object
        $attestationObjectRaw = self::base64UrlDecode($data['attestationObject']);
        $attestationObj = CborDecoder::decode($attestationObjectRaw);

        if (!isset($attestationObj['authData'])) {
            throw new \Exception('Missing authData in attestation object.');
        }

        $authData = $attestationObj['authData'];
        $flags = ord($authData[32]);
        $hasAttestedCredData = ($flags & 0x40) !== 0;

        if (!$hasAttestedCredData) {
            throw new \Exception('Authenticator data does not contain attested credential.');
        }

        // Parse authData structure
        // 0..31: rpIdHash (32)
        // 32: flags (1)
        // 33..36: signCount (4)
        // 37..52: aaguid (16)
        // 53..54: credIdLen (2)
        $signCount = unpack('N', substr($authData, 33, 4))[1];
        $credIdLen = unpack('n', substr($authData, 53, 2))[1];
        $credentialIdBytes = substr($authData, 55, $credIdLen);
        $credentialId = self::base64UrlEncode($credentialIdBytes);

        // COSE Public Key bytes start at 55 + credIdLen
        $coseKeyBytes = substr($authData, 55 + $credIdLen);
        $offset = 0;
        $coseKey = CborDecoder::decode($coseKeyBytes, $offset);

        // Convert COSE Key to PEM string
        $pemPublicKey = $this->coseKeyToPem($coseKey);

        // Clear challenge
        session()->forget(['webauthn_register_challenge', 'webauthn_user_handle']);

        // Determine device name
        $deviceName = $data['device_name'] ?? 'Windows Hello';

        // Store credential in database
        return UserPasskey::create([
            'user_id' => $user->id,
            'credential_id' => $credentialId,
            'public_key' => $pemPublicKey,
            'user_handle' => (string) $user->id,
            'device_name' => $deviceName,
            'transports' => $data['transports'] ?? ['internal'],
            'counter' => $signCount,
            'last_used_at' => now(),
        ]);
    }

    public function generateLoginOptions(?string $email, Request $request): array
    {
        $email = trim($email ?? '');
        if (empty($email)) {
            throw new \Exception('Please enter your Email Address first to sign in with Passkey.');
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            throw new \Exception('No account found matching this email address.');
        }

        $passkeys = $user->passkeys()->get();
        if ($passkeys->isEmpty()) {
            throw new \Exception('No Passkey enrolled for this account yet. Please sign in with Password first and click "Enable Passkey" on your Dashboard.');
        }

        $challenge = random_bytes(32);
        $challengeBase64 = self::base64UrlEncode($challenge);

        session([
            'webauthn_login_challenge' => $challengeBase64,
            'webauthn_login_email' => $email,
        ]);

        $allowCredentials = $passkeys->map(function ($p) {
            return [
                'id' => $p->credential_id,
                'type' => 'public-key',
            ];
        })->toArray();

        $rpHost = $this->getRelyingPartyHost($request);

        return [
            'challenge' => $challengeBase64,
            'timeout' => 60000,
            'rpId' => $rpHost,
            'allowCredentials' => $allowCredentials,
            'userVerification' => 'preferred',
        ];
    }

    public function verifyLoginResponse(array $data, Request $request): User
    {
        $sessionChallenge = session('webauthn_login_challenge');
        if (!$sessionChallenge) {
            throw new \Exception('Login challenge expired or missing. Please try again.');
        }

        // 1. Validate clientDataJSON
        $clientDataJsonRaw = self::base64UrlDecode($data['clientDataJSON']);
        $clientData = json_decode($clientDataJsonRaw, true);

        if (($clientData['type'] ?? '') !== 'webauthn.get') {
            throw new \Exception('Invalid WebAuthn client data type.');
        }

        if (($clientData['challenge'] ?? '') !== $sessionChallenge) {
            throw new \Exception('Challenge mismatch during passkey authentication.');
        }

        // 2. Find Passkey record
        $rawCredentialId = $data['id'] ?? $data['rawId'];
        $passkey = UserPasskey::where('credential_id', $rawCredentialId)->first();

        if (!$passkey) {
            throw new \Exception('No registered passkey found for this device.');
        }

        // 3. Verify Signature
        $authenticatorDataRaw = self::base64UrlDecode($data['authenticatorData']);
        $signatureRaw = self::base64UrlDecode($data['signature']);

        // Signed Data = authenticatorData + SHA256(clientDataJSON)
        $clientDataHash = hash('sha256', $clientDataJsonRaw, true);
        $signedData = $authenticatorDataRaw . $clientDataHash;

        $pemPublicKey = $passkey->public_key;

        $verifyResult = openssl_verify($signedData, $signatureRaw, $pemPublicKey, OPENSSL_ALGO_SHA256);

        if ($verifyResult !== 1) {
            throw new \Exception('Windows Hello signature verification failed.');
        }

        // 4. Update counter & last_used_at
        $newSignCount = unpack('N', substr($authenticatorDataRaw, 33, 4))[1];
        if ($newSignCount > 0 && $newSignCount <= $passkey->counter) {
            // Replay attack warning (optional strict check)
        }
        $passkey->update([
            'counter' => max($passkey->counter + 1, $newSignCount),
            'last_used_at' => now(),
        ]);

        session()->forget(['webauthn_login_challenge', 'webauthn_login_email']);

        return $passkey->user;
    }

    private function coseKeyToPem(array $coseKey): string
    {
        $kty = $coseKey[1] ?? null;

        if ($kty === 2) {
            // EC2 Key (ES256)
            $crv = $coseKey[-1] ?? null; // 1 = P-256
            $x = $coseKey[-2] ?? '';
            $y = $coseKey[-3] ?? '';

            if (strlen($x) !== 32 || strlen($y) !== 32) {
                throw new \Exception('Invalid EC2 key length.');
            }

            // DER header for EC P-256 SubjectPublicKeyInfo
            $derHeader = pack('H*', '3059301306072a8648ce3d020106082a8648ce3d03010703420004');
            $derData = $derHeader . $x . $y;

            $pem = "-----BEGIN PUBLIC KEY-----\n";
            $pem .= chunk_split(base64_encode($derData), 64, "\n");
            $pem .= "-----END PUBLIC KEY-----\n";
            return $pem;
        } elseif ($kty === 3) {
            // RSA Key (RS256)
            $n = $coseKey[-1] ?? '';
            $e = $coseKey[-2] ?? '';

            // Construct ASN.1 DER for RSA Public Key
            $modulus = "\x00" . $n;
            $exponent = $e;

            $encodeLength = function ($len) {
                if ($len < 128) {
                    return chr($len);
                }
                $lenBytes = ltrim(pack('N', $len), "\x00");
                return chr(0x80 | strlen($lenBytes)) . $lenBytes;
            };

            $modulusDer = "\x02" . $encodeLength(strlen($modulus)) . $modulus;
            $exponentDer = "\x02" . $encodeLength(strlen($exponent)) . $exponent;

            $rsaSequence = "\x30" . $encodeLength(strlen($modulusDer . $exponentDer)) . $modulusDer . $exponentDer;
            $rsaBitString = "\x03" . $encodeLength(strlen($rsaSequence) + 1) . "\x00" . $rsaSequence;

            // rsaEncryption OID header: 1.2.840.113549.1.1.1
            $algorithmIdentifier = pack('H*', '300d06092a864886f70d0101010500');
            $derData = "\x30" . $encodeLength(strlen($algorithmIdentifier . $rsaBitString)) . $algorithmIdentifier . $rsaBitString;

            $pem = "-----BEGIN PUBLIC KEY-----\n";
            $pem .= chunk_split(base64_encode($derData), 64, "\n");
            $pem .= "-----END PUBLIC KEY-----\n";
            return $pem;
        }

        throw new \Exception("Unsupported COSE key type {$kty}");
    }
}
