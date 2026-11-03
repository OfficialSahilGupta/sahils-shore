// ============================================================================
// Sahil's Shore: Google Drive OAuth Callback Endpoint
// Route: GET /api/drive/callback
// Handles token exchange, folder tree bootstrap, and encrypted storage
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeDriveAuthCode,
  ensureDriveFolderTree,
  saveDriveCredentials,
  type DriveFolderTree,
} from "@/lib/drive";
import { writeTimelineEvent } from "@/lib/timeline";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const isSimulated = url.searchParams.get("simulate") === "true";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 1. Check for OAuth error from Google
  if (errorParam) {
    console.error("[drive/callback] Google OAuth error:", errorParam);
    return NextResponse.redirect(
      new URL(`/settings?tab=drive&drive_error=${encodeURIComponent(errorParam)}`, request.url)
    );
  }

  // 2. Simulated connect mode (for offline/local testing when keys aren't provisioned yet)
  if (isSimulated) {
    const mockFolderTree: DriveFolderTree = {
      root: "mock_shore_root_folder",
      photosRoot: "mock_photos_root",
      photosCurrent: "mock_photos_curr_ym",
      videosRoot: "mock_videos_root",
      videosCurrent: "mock_videos_curr_ym",
      receipts: "mock_receipts_folder",
      voice: "mock_voice_folder",
      backups: "mock_backups_folder",
    };

    await saveDriveCredentials(
      supabase,
      user.id,
      "mock_refresh_token_dev_environment",
      mockFolderTree,
      user.email || "sahil@example.com"
    );

    await writeTimelineEvent(supabase, {
      userId: user.id,
      type: "drive_connected",
      summary: "Connected Google Drive with drive.file scope",
      refTable: "drive_credentials",
      meta: { folder_tree: mockFolderTree },
    });

    return NextResponse.redirect(new URL("/settings?tab=drive&drive=connected", request.url));
  }

  // 3. Real Google OAuth validation
  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?tab=drive&drive_error=missing_authorization_code", request.url)
    );
  }

  // Verify CSRF state
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (decoded.userId !== user.id) {
        return NextResponse.redirect(
          new URL("/settings?tab=drive&drive_error=state_mismatch", request.url)
        );
      }
    } catch {
      // Ignored if state format differs
    }
  }

  try {
    // 4. Exchange authorization code for tokens
    const { accessToken, refreshToken, email } = await exchangeDriveAuthCode(code);

    if (!refreshToken) {
      // If user had previously authorized and prompt wasn't consent, we might not get refresh token
      console.warn("[drive/callback] No refresh token returned. Re-prompting consent.");
      return NextResponse.redirect(
        new URL(
          "/settings?drive_error=no_refresh_token&tip=Please+re-authorize+with+consent",
          request.url
        )
      );
    }

    // 5. Initialize the Shore/ folder hierarchy on first connect
    const folderTree = await ensureDriveFolderTree(accessToken);

    // 6. Save encrypted credentials in Supabase
    const saved = await saveDriveCredentials(
      supabase,
      user.id,
      refreshToken,
      folderTree,
      email || user.email || undefined
    );

    if (!saved) {
      throw new Error("Failed to save credentials in database table.");
    }

    // 7. Write timeline event
    await writeTimelineEvent(supabase, {
      userId: user.id,
      type: "drive_connected",
      summary: "Connected Google Drive with drive.file scope",
      refTable: "drive_credentials",
      meta: {
        google_email: email,
        folder_tree: folderTree,
      },
    });

    return NextResponse.redirect(new URL("/settings?tab=drive&drive=connected", request.url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect Google Drive";
    console.error("[drive/callback] Error:", message);
    return NextResponse.redirect(
      new URL(`/settings?tab=drive&drive_error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
