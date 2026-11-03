// ============================================================================
// Sahil's Shore: Google Drive Resumable Upload Session Initiator
// Route: POST /api/drive/upload-session
// Generates direct-to-Drive upload URI for the browser (bypassing Vercel limits)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStoredDriveCredentials,
  refreshDriveAccessToken,
  initiateResumableUpload,
  findOrCreateDriveFolder,
  ensurePhotosMonthFolder,
  ensureDriveFolderTree,
  saveDriveCredentials,
} from "@/lib/drive";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      fileName,
      mimeType = "image/jpeg",
      size,
      folderType = "photos",
      albumId,
    } = body;

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const creds = await getStoredDriveCredentials(supabase, user.id);

    if (!creds || !creds.refreshToken) {
      return NextResponse.json(
        {
          error: "DRIVE_NOT_CONNECTED",
          message: "Please connect Google Drive in Settings to upload media.",
        },
        { status: 400 }
      );
    }

    // Development mock token handling
    if (creds.refreshToken.startsWith("mock_")) {
      return NextResponse.json({
        mock: true,
        uploadUrl: null,
        fileId: `mock_drive_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        folderId: creds.folderTree?.photosCurrent || "mock_photos_folder",
      });
    }

    // Refresh Google access token
    const { accessToken } = await refreshDriveAccessToken(creds.refreshToken);

    // Pick target folder ID from folder tree
    const tree = creds.folderTree;
    let targetFolderId = tree?.photosCurrent || tree?.root || creds.folderId;

    if (albumId) {
      // Find or create the album folder inside Shore/Photos/YYYY/MM/<album.title>
      const { data: album } = await supabase
        .from("albums")
        .select("title")
        .eq("id", albumId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (album?.title) {
        const monthFolderId = await ensurePhotosMonthFolder(accessToken, tree);
        targetFolderId = await findOrCreateDriveFolder(
          accessToken,
          album.title.trim(),
          monthFolderId
        );
      }
    } else {
      // No album specified: stays directly in the specific month folder (e.g. 11 for November)
      if (folderType === "photos") {
        targetFolderId = await ensurePhotosMonthFolder(accessToken, tree);
      } else if (folderType === "videos" && tree?.videosCurrent) {
        targetFolderId = tree.videosCurrent;
      } else if (folderType === "receipts" && tree?.receipts) {
        targetFolderId = tree.receipts;
      } else if (folderType === "voice" && tree?.voice) {
        targetFolderId = tree.voice;
      } else if (folderType === "backups" && tree?.backups) {
        targetFolderId = tree.backups;
      }
    }

    if (!targetFolderId) {
      throw new Error("Unable to locate destination Google Drive folder.");
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    // Initiate resumable session with Google Drive v3
    let uploadUrl: string | null = null;
    try {
      uploadUrl = await initiateResumableUpload(
        accessToken,
        targetFolderId,
        {
          name: fileName,
          mimeType,
          size,
        },
        origin
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("404") || errMsg.includes("File not found")) {
        console.warn("[upload-session] Target folder missing in Drive. Auto-repairing folder tree...");
        const freshTree = await ensureDriveFolderTree(accessToken);
        await saveDriveCredentials(supabase, user.id, creds.refreshToken, freshTree);

        if (albumId) {
          const { data: album } = await supabase
            .from("albums")
            .select("title")
            .eq("id", albumId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (album?.title) {
            targetFolderId = await findOrCreateDriveFolder(
              accessToken,
              album.title.trim(),
              freshTree.photosCurrent
            );
          } else {
            targetFolderId = freshTree.photosCurrent;
          }
        } else {
          targetFolderId = folderType === "videos" ? freshTree.videosCurrent : freshTree.photosCurrent;
        }

        uploadUrl = await initiateResumableUpload(
          accessToken,
          targetFolderId,
          {
            name: fileName,
            mimeType,
            size,
          },
          origin
        );
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      uploadUrl,
      folderId: targetFolderId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to initiate session";
    console.error("[upload-session] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
