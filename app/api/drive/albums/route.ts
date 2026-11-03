// ============================================================================
// Sahil's Shore: Google Drive Album Sync Route
// Route: /api/drive/albums
// Creates, syncs, or deletes matching folders in Google Drive under:
// Shore/Photos/YYYY/MM/<Album Title>
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStoredDriveCredentials,
  refreshDriveAccessToken,
  findOrCreateDriveFolder,
  ensurePhotosMonthFolder,
  trashDriveFolder,
  moveDriveFolderContents,
  moveDriveFolder,
} from "@/lib/drive";

// GET: Syncs all Shore albums to Google Drive inside Shore/Photos/YYYY/MM/<Album Title>
// Also relocates any legacy album folder created directly under Shore/Photos/ into the month folder
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creds = await getStoredDriveCredentials(supabase, user.id);
    if (!creds || !creds.refreshToken || creds.refreshToken.startsWith("mock_")) {
      return NextResponse.json({ synced: false, message: "Drive not connected" });
    }

    const { accessToken } = await refreshDriveAccessToken(creds.refreshToken);
    const monthFolderId = await ensurePhotosMonthFolder(accessToken, creds.folderTree);
    const photosRootId = creds.folderTree?.photosRoot;

    const { data: albums } = await supabase
      .from("albums")
      .select("id, title")
      .eq("user_id", user.id);

    const results: { id: string; title: string; folderId: string }[] = [];

    for (const album of albums || []) {
      if (!album.title.trim()) continue;
      const safeTitle = album.title.trim().replace(/'/g, "\\'");

      // Check if folder was created directly under photosRoot (legacy)
      if (photosRootId) {
        const qRoot = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeTitle}' and '${photosRootId}' in parents and trashed = false`;
        const rootRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            qRoot
          )}&spaces=drive&fields=files(id, name)&pageSize=1`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (rootRes.ok) {
          const rootData = await rootRes.json();
          if (rootData.files && rootData.files.length > 0) {
            const legacyFolderId = rootData.files[0].id;
            // Relocate into the Month folder (Shore/Photos/YYYY/MM/)
            await moveDriveFolder(accessToken, legacyFolderId, monthFolderId, photosRootId);
            results.push({ id: album.id, title: album.title, folderId: legacyFolderId });
            continue;
          }
        }
      }

      // Ensure inside month folder: Shore/Photos/YYYY/MM/<album.title>
      const folderId = await findOrCreateDriveFolder(
        accessToken,
        album.title.trim(),
        monthFolderId
      );
      results.push({ id: album.id, title: album.title, folderId });
    }

    return NextResponse.json({
      synced: true,
      syncedCount: results.length,
      albums: results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[api/drive/albums GET] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Creates a new album folder in Google Drive under Shore/Photos/YYYY/MM/<Album Title>
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
    const { title } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const creds = await getStoredDriveCredentials(supabase, user.id);
    if (!creds || !creds.refreshToken || creds.refreshToken.startsWith("mock_")) {
      return NextResponse.json({ driveConnected: false });
    }

    const { accessToken } = await refreshDriveAccessToken(creds.refreshToken);
    // Locate or create the current month folder: Shore/Photos/YYYY/MM/
    const monthFolderId = await ensurePhotosMonthFolder(accessToken, creds.folderTree);

    const folderId = await findOrCreateDriveFolder(
      accessToken,
      title.trim(),
      monthFolderId
    );

    return NextResponse.json({ success: true, folderId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create folder in Drive";
    console.error("[api/drive/albums POST] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Deletes an album folder from Google Drive
export async function DELETE(request: NextRequest) {
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
    const { title, deletePhotosInside = false } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const creds = await getStoredDriveCredentials(supabase, user.id);
    if (!creds || !creds.refreshToken || creds.refreshToken.startsWith("mock_")) {
      return NextResponse.json({ driveConnected: false });
    }

    const { accessToken } = await refreshDriveAccessToken(creds.refreshToken);
    const monthFolderId = await ensurePhotosMonthFolder(accessToken, creds.folderTree);
    const photosRootId = creds.folderTree?.photosRoot;

    // Locate the folder in monthFolderId first, fallback to photosRootId
    const safeTitle = title.trim().replace(/'/g, "\\'");
    let folderId: string | null = null;

    const qMonth = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeTitle}' and '${monthFolderId}' in parents and trashed = false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        qMonth
      )}&spaces=drive&fields=files(id, name)&pageSize=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
      }
    }

    // Check legacy root position if not found in month
    if (!folderId && photosRootId) {
      const qRoot = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeTitle}' and '${photosRootId}' in parents and trashed = false`;
      const rootRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          qRoot
        )}&spaces=drive&fields=files(id, name)&pageSize=1`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (rootRes.ok) {
        const rootData = await rootRes.json();
        if (rootData.files && rootData.files.length > 0) {
          folderId = rootData.files[0].id;
        }
      }
    }

    if (folderId) {
      if (!deletePhotosInside && monthFolderId) {
        // Keep photos: move files into parent month folder before removing album folder
        await moveDriveFolderContents(accessToken, folderId, monthFolderId);
      }

      // Trash the album folder
      await trashDriveFolder(accessToken, folderId);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete folder from Drive";
    console.error("[api/drive/albums DELETE] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
