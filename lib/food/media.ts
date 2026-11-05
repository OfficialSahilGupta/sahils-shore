// ============================================================================
// Sahil's Shore: Food Diary Media Helpers
// Permanent photo compression, Google Drive sync, and Media Vault linking
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { MediaItem } from "@/types";
import { generateImageThumbnail } from "../media/thumbnail";

/**
 * Compresses an attached food image file to a permanent, web-ready data URL
 * so it survives browser refreshes and tab closures without disappearing.
 */
export async function prepareFoodPhoto(file: File): Promise<string> {
  try {
    const thumb = await generateImageThumbnail(file, 800);
    if (thumb.dataUrl) {
      return thumb.dataUrl;
    }
  } catch (err) {
    console.warn("[prepareFoodPhoto] Canvas thumbnail failed, reading as base64 dataUrl:", err);
  }

  // Fallback: Read full file as base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Asynchronously uploads a food photo to Google Drive (if connected)
 * and links it in the media_items table.
 */
export async function uploadFoodPhotoToDrive(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File,
  thumbDataUrl: string,
  mealInfo: { id: string; description: string }
): Promise<string | null> {
  try {
    const sessionRes = await fetch("/api/drive/upload-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: `Meal_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
        mimeType: file.type || "image/jpeg",
        size: file.size,
        folderType: "photos",
      }),
    });

    if (!sessionRes.ok) {
      return null;
    }

    const sessionData = await sessionRes.json();
    let driveFileId: string | null = sessionData.fileId || null;

    if (sessionData.uploadUrl) {
      const putRes = await fetch(sessionData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (putRes.ok) {
        const driveData = await putRes.json().catch(() => ({}));
        driveFileId = driveData.id || driveFileId;
      }
    }

    // Insert media_items row with linked meal info
    const { data: mediaRow } = await supabase
      .from("media_items")
      .insert({
        user_id: userId,
        file_name: file.name,
        mime_type: file.type || "image/jpeg",
        media_type: "photo",
        thumb_path: thumbDataUrl,
        drive_file_id: driveFileId,
        sync_status: driveFileId ? "synced" : "pending",
        links: {
          meal_id: mealInfo.id,
          meal_name: mealInfo.description,
        } as any,
      })
      .select("id")
      .single();

    return mediaRow ? mediaRow.id : null;
  } catch (err) {
    console.warn("[uploadFoodPhotoToDrive] Background upload skipped or failed:", err);
    return null;
  }
}

/**
 * Fetches media items from Media Vault linked to a given meal.
 */
export async function getLinkedMediaForMeal(
  supabase: SupabaseClient<Database>,
  userId: string,
  mealId: string
): Promise<MediaItem[]> {
  try {
    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .eq("user_id", userId)
      .filter("links->>meal_id", "eq", mealId);

    if (error || !data) return [];
    return data as unknown as MediaItem[];
  } catch (err) {
    console.warn("[getLinkedMediaForMeal] Error:", err);
    return [];
  }
}
