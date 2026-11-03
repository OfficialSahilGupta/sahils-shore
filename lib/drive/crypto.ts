// ============================================================================
// Sahil's Shore: Google Drive Refresh Token Encryption Helper
// AES-256-GCM authenticated encryption for securing tokens at rest
// ============================================================================

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM

/**
 * Derives a consistent 32-byte key from environment secrets.
 * Uses DRIVE_ENCRYPTION_KEY if provided, falling back to SUPABASE_SERVICE_ROLE_KEY.
 */
export function getEncryptionKey(): Buffer {
  const secret =
    process.env.DRIVE_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "sahil-shore-drive-fallback-key-2026";

  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive plaintext (such as Google OAuth refresh token) using AES-256-GCM.
 * Output format: `<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
 */
export function encryptToken(plainText: string, customKey?: Buffer): string {
  if (!plainText) return "";
  const key = customKey || getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts ciphertext encrypted with AES-256-GCM.
 * Input format: `<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
 */
export function decryptToken(encryptedData: string, customKey?: Buffer): string {
  if (!encryptedData) return "";
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format. Expected iv:authTag:ciphertext.");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = customKey || getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
