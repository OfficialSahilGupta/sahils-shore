// ============================================================================
// Sahil's Shore: Privacy & Vault Protection System
// Secure PIN hashing (SHA-256), WebAuthn biometric integration, and session locks
// ============================================================================

export type ProtectedModule = "journal" | "expenses" | "media";

export interface PrivacyConfig {
  lock_journal: boolean;
  lock_expenses: boolean;
  lock_media: boolean;
  pin_hash?: string | null;
  pin_salt?: string | null;
  webauthn_credential_id?: string | null;
  auto_lock_minutes: number;
}

export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  lock_journal: false,
  lock_expenses: false,
  lock_media: false,
  pin_hash: null,
  pin_salt: null,
  webauthn_credential_id: null,
  auto_lock_minutes: 5,
};

/**
 * Generates a random alphanumeric salt string for PIN hashing.
 */
export function generateSalt(length: number = 16): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const byteCount = Math.ceil(length / 2);
    const bytes = new Uint8Array(byteCount);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, length);
  }
  return Math.random().toString(36).substring(2).padEnd(length, "0").slice(0, length);
}

/**
 * Computes a SHA-256 hash of (pin + ":" + salt).
 * Works across modern browsers and Node.js testing runtimes.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const combined = `${pin.trim()}:${salt.trim()}`;
  
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Node fallback for unit tests
  try {
    const nodeCrypto = require("crypto");
    return nodeCrypto.createHash("sha256").update(combined).digest("hex");
  } catch {
    throw new Error("No cryptographic provider found for hashPin");
  }
}

/**
 * Verifies if entered PIN matches the stored hash given its salt.
 */
export async function verifyPin(
  pin: string,
  expectedHash: string,
  salt: string
): Promise<boolean> {
  if (!pin || !expectedHash || !salt) return false;
  const computed = await hashPin(pin, salt);
  return computed.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Checks if the browser environment supports WebAuthn / Biometrics.
 */
export async function isWebAuthnAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Registers a WebAuthn platform credential (Face ID, Touch ID, Windows Hello).
 */
export async function registerWebAuthnCredential(
  userId: string,
  email: string
): Promise<{ credentialId: string } | null> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return null;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const encoder = new TextEncoder();
    const userHandle = encoder.encode(userId.slice(0, 32));

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Sahil's Shore",
        id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
      },
      user: {
        id: userHandle,
        name: email,
        displayName: "Sahil",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // TouchID/FaceID
        userVerification: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) return null;

    // Base64 encode raw credential ID
    const rawIdArray = Array.from(new Uint8Array(credential.rawId));
    const base64Id = btoa(String.fromCharCode.apply(null, rawIdArray));

    return { credentialId: base64Id };
  } catch (err) {
    console.warn("[registerWebAuthnCredential] Error or cancellation:", err);
    return null;
  }
}

/**
 * Authenticates via WebAuthn platform credential.
 */
export async function authenticateWebAuthn(
  credentialId?: string | null
): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    let allowCredentials: PublicKeyCredentialDescriptor[] | undefined;
    if (credentialId) {
      try {
        const binStr = atob(credentialId);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        allowCredentials = [
          {
            id: bytes,
            type: "public-key",
            transports: ["internal"],
          },
        ];
      } catch {}
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials,
      userVerification: "preferred",
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    return !!assertion;
  } catch (err) {
    console.warn("[authenticateWebAuthn] Authentication rejected or canceled:", err);
    return false;
  }
}

// ============================================================================
// Session Unlock State Management
// ============================================================================

const SESSION_PREFIX = "shore_vault_unlocked_";

export function isModuleUnlocked(
  module: ProtectedModule,
  autoLockMinutes: number = 5
): boolean {
  if (typeof window === "undefined") return true;

  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${module}`);
    if (!raw) return false;

    const data = JSON.parse(raw) as { unlockedAt: number };
    if (!data.unlockedAt) return false;

    // Immediate lock means it does not stay unlocked across visits
    if (autoLockMinutes === 0) return false;

    const elapsedMs = Date.now() - data.unlockedAt;
    const maxAllowedMs = autoLockMinutes * 60 * 1000;

    if (elapsedMs > maxAllowedMs) {
      sessionStorage.removeItem(`${SESSION_PREFIX}${module}`);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function unlockModuleSession(module: ProtectedModule): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${SESSION_PREFIX}${module}`,
      JSON.stringify({ unlockedAt: Date.now() })
    );
  } catch {}
}

export function lockModuleSession(module: ProtectedModule): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${SESSION_PREFIX}${module}`);
  } catch {}
}

export function lockAllModules(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${SESSION_PREFIX}journal`);
    sessionStorage.removeItem(`${SESSION_PREFIX}expenses`);
    sessionStorage.removeItem(`${SESSION_PREFIX}media`);
  } catch {}
}
