// ============================================================================
// Sahil's Shore: Google Drive Concept Map & Diagram Uploader Engine
// Saves images directly to Google Drive in structured folders:
// - Shore/Learning/<track-name>/
// - Shore/DSA/<problem-name>/
// Backed by high-capacity client-side IndexedDB so images are 100% resilient.
// ============================================================================

import {
  saveImageToIndexedDB,
  markImageSyncedToDrive,
  getPendingDriveUploads,
  type StoredConceptMapImage,
} from "../storage/indexed-db";
import type { ChapterConceptMap } from "../learning/concept-map";

export interface UploadConceptMapOptions {
  module: "learning" | "dsa";
  folderName: string; // Track name or DSA problem title
  caption?: string;
  fileName?: string;
}

export interface UploadConceptMapResult {
  map: ChapterConceptMap;
  syncedToDrive: boolean;
  driveFolder?: string;
  error?: string;
}

/**
 * Uploads an image or dataUrl to Google Drive with IndexedDB local vault fallback.
 */
export async function uploadConceptMapImage(
  dataUrl: string,
  options: UploadConceptMapOptions
): Promise<UploadConceptMapResult> {
  const mapId = `cm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanCaption = options.caption?.trim() || `Diagram: ${options.folderName}`;
  const now = new Date().toISOString();

  // 1. Save immediately to IndexedDB (Instant, virtually unlimited offline storage)
  try {
    const storedItem: StoredConceptMapImage = {
      id: mapId,
      dataUrl,
      mimeType: dataUrl.startsWith("data:image/png")
        ? "image/png"
        : dataUrl.startsWith("data:image/svg")
          ? "image/svg+xml"
          : "image/webp",
      sizeBytes: Math.round(dataUrl.length * 0.75),
      caption: cleanCaption,
      module: options.module,
      folderName: options.folderName,
      isSyncedToDrive: false,
      createdAt: now,
      updatedAt: now,
    };
    await saveImageToIndexedDB(storedItem);
  } catch (idbErr) {
    console.warn("[uploadConceptMapImage] IndexedDB save warning:", idbErr);
  }

  // 2. Attempt Google Drive Upload via Shore Server Endpoint
  try {
    const res = await fetch("/api/drive/upload-concept-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataUrl,
        caption: cleanCaption,
        fileName: options.fileName,
        module: options.module,
        folderName: options.folderName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.driveFileId) {
        // Mark as synced in IndexedDB
        await markImageSyncedToDrive(mapId, data.driveFileId, data.driveWebViewLink);

        return {
          map: {
            id: mapId,
            title: cleanCaption,
            caption: cleanCaption,
            url: data.url, // Public/preview URL from Drive or lightweight stream
            driveFileId: data.driveFileId,
            driveWebViewLink: data.driveWebViewLink,
            folderPath: data.folderPath,
            createdAt: now,
          },
          syncedToDrive: true,
          driveFolder: data.folderPath,
        };
      }
    }
  } catch (uploadErr: any) {
    console.warn("[uploadConceptMapImage] Drive upload failed, stored in IndexedDB:", uploadErr);
  }

  // 3. Fallback: Drive not connected or token expired; image is safely retained in IndexedDB
  return {
    map: {
      id: mapId,
      title: cleanCaption,
      caption: cleanCaption,
      url: dataUrl,
      createdAt: now,
    },
    syncedToDrive: false,
  };
}

/**
 * Retries uploading all pending images stored in IndexedDB to Google Drive.
 */
export async function syncAllPendingImagesToDrive(): Promise<number> {
  const pending = await getPendingDriveUploads();
  if (pending.length === 0) return 0;

  let successCount = 0;
  for (const item of pending) {
    try {
      const res = await fetch("/api/drive/upload-concept-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: item.dataUrl,
          caption: item.caption,
          module: item.module,
          folderName: item.folderName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.driveFileId) {
          await markImageSyncedToDrive(item.id, data.driveFileId, data.driveWebViewLink);
          successCount++;
        }
      }
    } catch (e) {
      console.warn(`[syncAllPendingImagesToDrive] Retry failed for ${item.id}:`, e);
    }
  }

  return successCount;
}
