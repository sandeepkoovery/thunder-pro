import axios from 'axios';

/**
 * Get route URL helper using Ziggy route() or fallback relative path
 */
function getUrl(routeName, fallbackPath) {
    if (typeof window !== 'undefined' && typeof window.route === 'function') {
        try {
            return window.route(routeName);
        } catch (e) {
            console.warn(`Route ${routeName} not resolved by Ziggy, using fallback: ${fallbackPath}`);
        }
    }
    return fallbackPath;
}

/**
 * Convert ArrayBuffer to Base64URL string
 */
export function bufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert Base64URL string to ArrayBuffer / Uint8Array
 */
export function base64UrlToBuffer(base64url) {
    if (!base64url) return new Uint8Array(0).buffer;
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Check if WebAuthn is supported by current browser
 */
export function isWebAuthnSupported() {
    return typeof window !== 'undefined' &&
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential === 'function';
}

/**
 * Start Passkey Registration (Enable Passkey / Windows Hello)
 */
export async function startPasskeyRegistration(deviceName = 'Windows Hello') {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in your browser.');
    }

    const optionsUrl = getUrl('passkey.register.options', '/passkey/register/options');
    const registerUrl = getUrl('passkey.register', '/passkey/register');

    // 1. Get options from server
    const optionsRes = await axios.post(optionsUrl);
    const options = optionsRes.data;

    // Convert challenge and user.id to ArrayBuffer
    options.challenge = base64UrlToBuffer(options.challenge);
    options.user.id = base64UrlToBuffer(options.user.id);

    if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map(cred => ({
            ...cred,
            id: base64UrlToBuffer(cred.id),
        }));
    }

    // 2. Invoke Windows Hello / WebAuthn prompt
    let credential;
    try {
        credential = await navigator.credentials.create({
            publicKey: options,
        });
    } catch (err) {
        if (err.name === 'InvalidStateError') {
            throw new Error('This Windows Hello passkey is already registered on your account.');
        }
        if (err.name === 'NotAllowedError') {
            throw new Error('Passkey creation cancelled or not allowed on this device.');
        }
        throw err;
    }

    if (!credential) {
        throw new Error('Passkey creation cancelled or failed.');
    }

    // 3. Prepare response object for server
    const registrationData = {
        id: credential.id,
        rawId: bufferToBase64Url(credential.rawId),
        type: credential.type,
        clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
        attestationObject: bufferToBase64Url(credential.response.attestationObject),
        device_name: deviceName,
        transports: credential.response.getTransports ? credential.response.getTransports() : ['internal'],
    };

    // 4. Send to server for verification and storage
    const saveRes = await axios.post(registerUrl, registrationData);
    return saveRes.data;
}

/**
 * Start Passkey Login (Sign in with Windows Hello)
 */
export async function startPasskeyLogin(email = '') {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in your browser.');
    }

    const optionsUrl = getUrl('passkey.login.options', '/passkey/login/options');
    const loginUrl = getUrl('passkey.login', '/passkey/login');

    // 1. Get options from server
    const optionsRes = await axios.post(optionsUrl, { email });
    const options = optionsRes.data;

    // Convert challenge to ArrayBuffer
    options.challenge = base64UrlToBuffer(options.challenge);

    if (options.allowCredentials && options.allowCredentials.length > 0) {
        options.allowCredentials = options.allowCredentials.map(cred => ({
            ...cred,
            id: base64UrlToBuffer(cred.id),
        }));
    } else {
        delete options.allowCredentials;
    }

    // 2. Invoke Windows Hello / WebAuthn login prompt
    let assertion;
    try {
        assertion = await navigator.credentials.get({
            publicKey: options,
        });
    } catch (err) {
        if (err.name === 'NotAllowedError') {
            throw new Error('Windows Hello login cancelled or no matching passkey found on this device.');
        }
        throw err;
    }

    if (!assertion) {
        throw new Error('Windows Hello login cancelled.');
    }

    // 3. Prepare assertion response for server
    const loginData = {
        id: assertion.id,
        rawId: bufferToBase64Url(assertion.rawId),
        type: assertion.type,
        clientDataJSON: bufferToBase64Url(assertion.response.clientDataJSON),
        authenticatorData: bufferToBase64Url(assertion.response.authenticatorData),
        signature: bufferToBase64Url(assertion.response.signature),
        userHandle: assertion.response.userHandle ? bufferToBase64Url(assertion.response.userHandle) : null,
    };

    // 4. Send to server to authenticate session
    const verifyRes = await axios.post(loginUrl, loginData);
    return verifyRes.data;
}
