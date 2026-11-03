// ============================================================================
// Sahil's Shore: Offline Queue Processor & Auto-Sync Engine
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import {
  getPendingMutations,
  removeMutationFromDb,
  updateMutationStatus,
  getPendingPhotos,
  removePhotoFromDb,
} from "./db.ts";
import { SyncResult, QueuedMutation } from "./types.ts";
import { writeTimelineEvent } from "../timeline/index.ts";

let isSyncInProgress = false;

/**
 * Iterates through all queued mutations and synchronizes them to Supabase.
 */
export async function syncOfflineQueue(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SyncResult> {
  if (isSyncInProgress) {
    return { syncedCount: 0, failedCount: 0, errors: ["Sync already in progress."] };
  }

  isSyncInProgress = true;
  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  try {
    const mutations = await getPendingMutations();

    for (const mutation of mutations) {
      try {
        await updateMutationStatus(mutation.id, "syncing");
        await processSingleMutation(supabase, userId, mutation);
        await removeMutationFromDb(mutation.id);
        syncedCount++;
      } catch (err: any) {
        failedCount++;
        const errMsg = err?.message || "Unknown sync error";
        errors.push(`${mutation.entityType}: ${errMsg}`);
        await updateMutationStatus(mutation.id, "failed", errMsg);
      }
    }

    // Process queued photos if any
    const photos = await getPendingPhotos();
    for (const photo of photos) {
      try {
        // Create an optimistic or metadata record for the photo
        const { error } = await supabase.from("media_items").insert({
          id: photo.id,
          user_id: userId,
          album_id: photo.metadata.albumId || null,
          file_name: photo.fileName,
          mime_type: photo.mimeType,
          media_type: "photo",
          taken_at: photo.metadata.takenAt || new Date().toISOString(),
          sync_status: "pending",
          links: {
            place_id: photo.metadata.placeId || null,
            meal_id: photo.metadata.mealId || null,
          },
        });

        if (!error) {
          await removePhotoFromDb(photo.id);
          syncedCount++;
        }
      } catch (photoErr: any) {
        failedCount++;
        errors.push(`photo: ${photoErr?.message}`);
      }
    }

    return { syncedCount, failedCount, errors };
  } catch (fatalErr: any) {
    return {
      syncedCount,
      failedCount,
      errors: [fatalErr?.message || "Queue processing error"],
    };
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Handles executing a single mutation against the Supabase database.
 */
async function processSingleMutation(
  supabase: SupabaseClient<Database>,
  userId: string,
  mutation: QueuedMutation
): Promise<void> {
  const { entityType, payload, idempotencyKey } = mutation;
  const targetId = payload.id || idempotencyKey;

  switch (entityType) {
    case "task": {
      const { error } = await supabase.from("tasks").upsert({
        id: targetId,
        user_id: userId,
        title: payload.title || "Untitled task",
        priority: payload.priority || "medium",
        tags: payload.tags || [],
        due_date: payload.due_date || null,
        due_time: payload.due_time || null,
        status: payload.status || "todo",
        created_at: mutation.createdAt,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await writeTimelineEvent(supabase, {
        userId,
        type: "task",
        summary: `Created task "${payload.title}" (synced from offline)`,
        refTable: "tasks",
        refId: targetId,
      });
      break;
    }

    case "expense": {
      const { error } = await supabase.from("expenses").upsert({
        id: targetId,
        user_id: userId,
        category_id: payload.category_id || null,
        amount_paise: payload.amount_paise || 0,
        payment_method: payload.payment_method || "upi",
        spent_at: payload.spent_at || mutation.createdAt,
        place: payload.place || payload.place_name || null,
        notes: payload.notes || null,
        drive_file_id: payload.drive_file_id || payload.receipt_drive_file_id || null,
        is_recurring: false,
        created_at: mutation.createdAt,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      const placeLabel = payload.place || payload.place_name || "Unknown";
      const amtRupees = ((payload.amount_paise || 0) / 100).toFixed(2);
      await writeTimelineEvent(supabase, {
        userId,
        type: "expense",
        summary: `Logged expense of ₹${amtRupees} at ${placeLabel} (synced from offline)`,
        refTable: "expenses",
        refId: targetId,
      });
      break;
    }

    case "meal": {
      const { error } = await supabase.from("meals").upsert({
        id: targetId,
        user_id: userId,
        meal_type: payload.meal_type || "lunch",
        eaten_at: payload.eaten_at || payload.logged_at || mutation.createdAt,
        description: payload.description || "",
        restaurant_name: payload.restaurant_name || null,
        location_type: payload.restaurant_name ? "restaurant" : "home",
        rating: payload.rating || null,
        notes_taste: payload.notes_taste || payload.taste_notes || null,
        notes_health: payload.notes_health || payload.health_notes || null,
        created_at: mutation.createdAt,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await writeTimelineEvent(supabase, {
        userId,
        type: "meal",
        summary: `Logged meal (${payload.meal_type}) ${payload.description} (synced from offline)`,
        refTable: "meals",
        refId: targetId,
      });
      break;
    }

    case "note": {
      const { error } = await supabase.from("notes").upsert({
        id: targetId,
        user_id: userId,
        title: payload.title || "Untitled Note",
        content: payload.content || "",
        folder: payload.folder || "Inbox",
        tags: payload.tags || [],
        is_pinned: payload.is_pinned || false,
        created_at: mutation.createdAt,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      break;
    }

    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}
