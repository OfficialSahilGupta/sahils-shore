// ============================================================================
// Sahil's Shore: Google Drive Integration Layer
// OAuth 2.0 with drive.file scope, folder tree bootstrap, & resumable uploads
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import { encryptToken, decryptToken } from "./crypto.ts";
import { currentYearMonthIST } from "../date-utils.ts";

export const DRIVE_FOLDER_ROOT = "Shore";
export const DRIVE_SUBFOLDERS = {
  PHOTOS: "Photos",
  VIDEOS: "Videos",
  RECEIPTS: "Receipts",
  VOICE: "Voice-Recordings",
  BACKUPS: "Backups",
  RESUMES: "Resumes",
} as const;

export interface DriveFolderTree {
  root: string;
  photosRoot: string;
  photosCurrent: string;
  videosRoot: string;
  videosCurrent: string;
  receipts: string;
  voice: string;
  backups: string;
  resumes?: string;
}

export interface DriveConnectionStatus {
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
  folderTree: Partial<DriveFolderTree> | null;
  error?: string | null;
}

/**
 * Returns the Google OAuth 2.0 authorization URL for `drive.file` scope.
 * Requests offline access with prompt=consent to ensure a refresh token is returned.
 */
export function getDriveOAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri =
    process.env.GOOGLE_DRIVE_REDIRECT_URI || `${appUrl}/api/drive/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file email profile",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges Google OAuth authorization code for access and refresh tokens.
 */
export async function exchangeDriveAuthCode(
  code: string
): Promise<{ accessToken: string; refreshToken: string; email?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri =
    process.env.GOOGLE_DRIVE_REDIRECT_URI || `${appUrl}/api/drive/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || tokenData.error) {
    throw new Error(
      tokenData.error_description || tokenData.error || "Failed to exchange auth code."
    );
  }

  // Retrieve user email from Google Userinfo API
  let email: string | undefined;
  try {
    const userinfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    if (userinfoRes.ok) {
      const userinfo = await userinfoRes.json();
      email = userinfo.email;
    }
  } catch {
    // Non-fatal if userinfo fails
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    email,
  };
}

/**
 * Uses a decrypted refresh token to get a fresh access token from Google.
 */
export async function refreshDriveAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    if (data.error === "invalid_grant") {
      throw new Error("REVOKED_ACCESS: Google Drive access was revoked or expired.");
    }
    throw new Error(data.error_description || data.error || "Token refresh failed.");
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Helper to find or create a Google Drive folder by name inside a parent.
 */
export async function findOrCreateDriveFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  const safeName = name.replace(/'/g, "\\'");
  // Query existing folder
  let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeName}' and trashed = false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&spaces=drive&fields=files(id, name)&pageSize=1`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder
  const body: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    body.parents = [parentId];
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.id) {
    throw new Error(`Failed to create Google Drive folder: ${name}`);
  }

  return createData.id;
}

/**
 * Trashes a Google Drive folder or file.
 */
export async function trashDriveFolder(
  accessToken: string,
  folderId: string
): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ trashed: true }),
  });
  return res.ok;
}

/**
 * Moves all files from a source folder into a destination folder in Google Drive.
 */
export async function moveDriveFolderContents(
  accessToken: string,
  sourceFolderId: string,
  destFolderId: string
): Promise<void> {
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `'${sourceFolderId}' in parents and trashed = false`
    )}&spaces=drive&fields=files(id, name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listRes.ok) return;
  const data = await listRes.json();
  const files: { id: string }[] = data.files || [];

  for (const file of files) {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?addParents=${destFolderId}&removeParents=${sourceFolderId}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }
}

/**
 * Moves a folder into a new parent folder in Google Drive.
 */
export async function moveDriveFolder(
  accessToken: string,
  folderId: string,
  newParentId: string,
  oldParentId: string
): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?addParents=${newParentId}&removeParents=${oldParentId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return res.ok;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getMonthName(monthNumberOrString: number | string): string {
  const monthNum =
    typeof monthNumberOrString === "string"
      ? parseInt(monthNumberOrString, 10)
      : monthNumberOrString;
  return MONTH_NAMES[monthNum - 1] || "November";
}

/**
 * Ensures Shore/Photos/YYYY/<MonthName> folder exists and returns its Google Drive folder ID.
 * Hierarchical path: Shore -> Photos -> YYYY -> MonthName (e.g. Shore/Photos/2026/November)
 */
export async function ensurePhotosMonthFolder(
  accessToken: string,
  folderTree?: DriveFolderTree | null,
  yearMonth?: string
): Promise<string> {
  const [targetYear, rawMonth] = (yearMonth || currentYearMonthIST()).split("-");
  const monthName = getMonthName(rawMonth); // Full month name: e.g. "November", "January"

  const root =
    folderTree?.photosRoot ||
    (await findOrCreateDriveFolder(accessToken, DRIVE_SUBFOLDERS.PHOTOS, folderTree?.root));
  const yearFolder = await findOrCreateDriveFolder(accessToken, targetYear, root);
  const monthFolder = await findOrCreateDriveFolder(accessToken, monthName, yearFolder);
  return monthFolder;
}

/**
 * Builds the required folder structure in Google Drive upon first connection:
 * Shore/
 * ├── Photos/
 * │   └── YYYY/MonthName/ (e.g. 2026/November)
 * ├── Videos/
 * │   └── YYYY/MonthName/
 * ├── Receipts/
 * ├── Voice-Recordings/
 * └── Backups/
 */
export async function ensureDriveFolderTree(
  accessToken: string
): Promise<DriveFolderTree> {
  const [currentYear, rawMonth] = currentYearMonthIST().split("-");
  const currentMonthName = getMonthName(rawMonth); // Full month name, e.g. "November"

  // 1. Root: Shore/
  const root = await findOrCreateDriveFolder(accessToken, DRIVE_FOLDER_ROOT);

  // 2. Photos Root & Subfolders
  const photosRoot = await findOrCreateDriveFolder(accessToken, DRIVE_SUBFOLDERS.PHOTOS, root);
  const photosYear = await findOrCreateDriveFolder(accessToken, currentYear, photosRoot);
  const photosCurrent = await findOrCreateDriveFolder(accessToken, currentMonthName, photosYear);

  // 3. Videos Root & Subfolders
  const videosRoot = await findOrCreateDriveFolder(accessToken, DRIVE_SUBFOLDERS.VIDEOS, root);
  const videosYear = await findOrCreateDriveFolder(accessToken, currentYear, videosRoot);
  const videosCurrent = await findOrCreateDriveFolder(accessToken, currentMonthName, videosYear);

  // 4. Receipts/, Voice-Recordings/, Backups/, Resumes/
  const receipts = await findOrCreateDriveFolder(accessToken, DRIVE_SUBFOLDERS.RECEIPTS, root);
  const voice = await findOrCreateDriveFolder(accessToken, DRIVE_SUBFOLDERS.VOICE, root);
  const backups = await findOrCreateDriveFolder(accessToken, DRIVE_SUBFOLDERS.BACKUPS, root);
  const resumes = await findOrCreateDriveFolder(accessToken, DRIVE_SUBFOLDERS.RESUMES, root);

  return {
    root,
    photosRoot,
    photosCurrent,
    videosRoot,
    videosCurrent,
    receipts,
    voice,
    backups,
    resumes,
  };
}

/**
 * Initiates a Google Drive Resumable Upload session.
 * Returns the resumable upload URL where the client browser directly PUTs file bytes.
 * This guarantees large videos and photos never stream through Vercel serverless functions.
 */
export async function initiateResumableUpload(
  accessToken: string,
  folderId: string,
  metadata: { name: string; mimeType: string; size?: number },
  origin?: string
): Promise<string> {
  const appOrigin = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": metadata.mimeType,
        Origin: appOrigin,
        ...(metadata.size ? { "X-Upload-Content-Length": metadata.size.toString() } : {}),
      },
      body: JSON.stringify({
        name: metadata.name,
        parents: [folderId],
      }),
    }
  );

  if (!initRes.ok) {
    const errorBody = await initRes.text();
    throw new Error(`Failed to initiate Drive upload session: ${errorBody}`);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("Google Drive did not return a Location header for resumable upload.");
  }

  return uploadUrl;
}

/**
 * Fetches stored Drive credentials for a user from database and decrypts refresh token.
 */
export async function getStoredDriveCredentials(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{
  id: string;
  refreshToken: string;
  folderId: string | null;
  folderTree: DriveFolderTree | null;
  lastSyncedAt: string | null;
  googleEmail: string | null;
} | null> {
  const { data, error } = await supabase
    .from("drive_credentials")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  try {
    const refreshToken = decryptToken(data.encrypted_refresh_token);
    const row = data as unknown as {
      id: string;
      folder_id: string | null;
      folder_tree?: DriveFolderTree | null;
      last_synced_at: string | null;
      google_email?: string | null;
    };

    let folderTree = row.folder_tree || null;
    if (!folderTree && row.folder_id) {
      if (typeof row.folder_id === "string" && row.folder_id.startsWith("{")) {
        try {
          folderTree = JSON.parse(row.folder_id);
        } catch {
          folderTree = null;
        }
      }
      if (!folderTree) {
        folderTree = {
          root: row.folder_id,
          photosRoot: row.folder_id,
          photosCurrent: row.folder_id,
          videosRoot: row.folder_id,
          videosCurrent: row.folder_id,
          receipts: row.folder_id,
          voice: row.folder_id,
          backups: row.folder_id,
        };
      }
    }

    return {
      id: row.id,
      refreshToken,
      folderId: row.folder_id,
      folderTree,
      lastSyncedAt: row.last_synced_at,
      googleEmail: row.google_email || null,
    };
  } catch (err) {
    console.error("[getStoredDriveCredentials] Decryption error:", err);
    return null;
  }
}

/**
 * Saves or updates encrypted Google Drive credentials for a user.
 * Seamlessly falls back to serializing folder tree into folder_id if schema cache lacks newer columns.
 */
export async function saveDriveCredentials(
  supabase: SupabaseClient<Database>,
  userId: string,
  refreshToken: string,
  folderTree: DriveFolderTree,
  email?: string
): Promise<boolean> {
  const encryptedToken = encryptToken(refreshToken);

  const payload: Record<string, unknown> = {
    user_id: userId,
    encrypted_refresh_token: encryptedToken,
    folder_id: JSON.stringify(folderTree),
    folder_tree: folderTree,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (email) {
    payload.google_email = email;
  }

  let { error } = await supabase
    .from("drive_credentials")
    .upsert(payload as any, { onConflict: "user_id" });

  // Schema fallback if folder_tree or google_email columns do not exist yet in DB
  if (error && (error.message?.includes("column") || (error as any).code === "PGRST204")) {
    console.warn(
      "[saveDriveCredentials] Schema lacks newer columns, falling back to base columns:",
      error.message
    );
    const fallbackPayload = {
      user_id: userId,
      encrypted_refresh_token: encryptedToken,
      folder_id: JSON.stringify(folderTree),
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const fallbackRes = await supabase
      .from("drive_credentials")
      .upsert(fallbackPayload as any, { onConflict: "user_id" });

    error = fallbackRes.error;
  }

  if (error) {
    console.error("[saveDriveCredentials] Failed to upsert credentials:", error.message);
    return false;
  }

  return true;
}

/**
 * Disconnects and removes Drive credentials for a user.
 */
export async function disconnectDrive(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("drive_credentials")
    .delete()
    .eq("user_id", userId);

  return !error;
}
