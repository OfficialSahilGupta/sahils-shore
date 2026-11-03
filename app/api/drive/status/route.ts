// ============================================================================
// Sahil's Shore: Google Drive Connection Status API
// Route: GET /api/drive/status
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStoredDriveCredentials,
  refreshDriveAccessToken,
  type DriveConnectionStatus,
} from "@/lib/drive";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ connected: false, error: "Unauthorized" }, { status: 401 });
    }

    const creds = await getStoredDriveCredentials(supabase, user.id);

    if (!creds || !creds.refreshToken) {
      const status: DriveConnectionStatus = {
        connected: false,
        email: null,
        lastSyncedAt: null,
        folderTree: null,
      };
      return NextResponse.json(status);
    }

    // Verify token validity if not a mock token
    let tokenError: string | null = null;
    if (
      !creds.refreshToken.startsWith("mock_") &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
    ) {
      try {
        await refreshDriveAccessToken(creds.refreshToken);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Token validation failed";
        if (msg.includes("REVOKED_ACCESS")) {
          tokenError = "Google Drive access has been revoked or expired. Please re-authenticate.";
        }
      }
    }

    const status: DriveConnectionStatus = {
      connected: !tokenError,
      email: creds.googleEmail || user.email || null,
      lastSyncedAt: creds.lastSyncedAt,
      folderTree: creds.folderTree,
      error: tokenError,
    };

    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch status";
    return NextResponse.json({ connected: false, error: message }, { status: 500 });
  }
}
