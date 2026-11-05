// ============================================================================
// Sahil's Shore: Media Vault Data Access & Sync Layer
// Manages media items, albums, links, on-this-day memories, & sync_queue
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { formatISTDate, todayIST } from "../date-utils.ts";

export type MediaType = "photo" | "video" | "receipt" | "audio";
export type SyncStatus = "pending" | "synced" | "failed";

export interface MediaLinks {
  place_id?: string | null;
  place_name?: string | null;
  meal_id?: string | null;
  meal_name?: string | null;
  expense_id?: string | null;
  expense_amount_paise?: number | null;
  journal_id?: string | null;
}

export interface MediaItem {
  id: string;
  user_id: string;
  drive_file_id: string | null;
  file_name: string;
  mime_type: string;
  media_type: MediaType;
  thumb_path: string | null;
  taken_at: string;
  lat: number | null;
  lng: number | null;
  links: MediaLinks;
  album_id: string | null;
  album_title?: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  album_date: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  action: string;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaFilterOptions {
  albumId?: string | null;
  mediaType?: MediaType | "all";
  syncStatus?: SyncStatus | "all";
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Fetches media items with optional filters, ordered chronologically by taken_at desc.
 */
export async function getMediaItems(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: MediaFilterOptions = {}
): Promise<MediaItem[]> {
  try {
    let query = supabase
      .from("media_items")
      .select("*")
      .eq("user_id", userId)
      .order("taken_at", { ascending: false });

    if (options.albumId) {
      query = query.eq("album_id", options.albumId);
    }

    if (options.mediaType && options.mediaType !== "all") {
      query = query.eq("media_type", options.mediaType);
    }

    if (options.syncStatus && options.syncStatus !== "all") {
      query = query.eq("sync_status", options.syncStatus);
    }

    if (options.startDate) {
      query = query.gte("taken_at", options.startDate);
    }

    if (options.endDate) {
      query = query.lte("taken_at", options.endDate);
    }

    const [mediaRes, albumsRes] = await Promise.all([
      query,
      supabase.from("albums").select("id, title").eq("user_id", userId),
    ]);

    if (mediaRes.error) {
      console.error("[getMediaItems] Query error:", mediaRes.error.message);
      return [];
    }

    const albumMap = new Map(
      (albumsRes.data || []).map((a) => [a.id, a.title])
    );

    let items = (mediaRes.data || []).map((row) => ({
      ...row,
      album_title: row.album_id ? albumMap.get(row.album_id) || null : null,
      links: (row.links as unknown as MediaLinks) || {},
    })) as MediaItem[];

    if (options.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim();
      items = items.filter((item) =>
        item.file_name.toLowerCase().includes(term) ||
        item.links?.place_name?.toLowerCase().includes(term) ||
        item.links?.meal_name?.toLowerCase().includes(term)
      );
    }

    return items;
  } catch (err) {
    console.error("[getMediaItems] Unexpected error:", err);
    return [];
  }
}

/**
 * Saves a new media item to Supabase and logs a timeline event.
 */
export async function saveMediaItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: {
    driveFileId?: string | null;
    fileName: string;
    mimeType: string;
    mediaType?: MediaType;
    thumbPath?: string | null;
    takenAt?: string;
    lat?: number | null;
    lng?: number | null;
    links?: MediaLinks;
    albumId?: string | null;
    syncStatus?: SyncStatus;
  }
): Promise<MediaItem | null> {
  const {
    driveFileId = null,
    fileName,
    mimeType,
    mediaType = "photo",
    thumbPath = null,
    takenAt = new Date().toISOString(),
    lat = null,
    lng = null,
    links = {},
    albumId = null,
    syncStatus = "synced",
  } = params;

  try {
    const { data, error } = await supabase
      .from("media_items")
      .insert({
        user_id: userId,
        drive_file_id: driveFileId,
        file_name: fileName,
        mime_type: mimeType,
        media_type: mediaType,
        thumb_path: thumbPath,
        taken_at: takenAt,
        lat,
        lng,
        links: links as unknown as Json,
        album_id: albumId,
        sync_status: syncStatus,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[saveMediaItem] Insert failed:", error?.message);
      return null;
    }

    let albumTitle: string | null = null;
    if (data.album_id) {
      const { data: albumRow } = await supabase
        .from("albums")
        .select("title")
        .eq("id", data.album_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (albumRow) {
        albumTitle = albumRow.title;
      }
    }

    const saved = {
      ...data,
      album_title: albumTitle,
      links: (data.links as unknown as MediaLinks) || {},
    } as MediaItem;

    // Write timeline event
    const summaryTypeLabel =
      mediaType === "video"
        ? "Captured video"
        : mediaType === "receipt"
        ? "Saved receipt photo"
        : "Captured photo";

    await writeTimelineEvent(supabase, {
      userId,
      type: `${mediaType}_uploaded`,
      summary: `${summaryTypeLabel}: ${fileName}`,
      occurredAt: takenAt,
      refTable: "media_items",
      refId: saved.id,
      meta: {
        file_name: fileName,
        media_type: mediaType,
        thumb_path: thumbPath,
        drive_file_id: driveFileId,
        links,
      },
    });

    return saved;
  } catch (err) {
    console.error("[saveMediaItem] Unexpected error:", err);
    return null;
  }
}

/**
 * Updates a media item (e.g. sync status, links, album).
 */
export async function updateMediaItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  updates: Partial<MediaItem>
): Promise<MediaItem | null> {
  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.drive_file_id !== undefined) payload.drive_file_id = updates.drive_file_id;
    if (updates.sync_status !== undefined) payload.sync_status = updates.sync_status;
    if (updates.thumb_path !== undefined) payload.thumb_path = updates.thumb_path;
    if (updates.album_id !== undefined) payload.album_id = updates.album_id;
    if (updates.lat !== undefined) payload.lat = updates.lat;
    if (updates.lng !== undefined) payload.lng = updates.lng;
    if (updates.links !== undefined) payload.links = updates.links as unknown as Json;

    const { data, error } = await supabase
      .from("media_items")
      .update(payload as any)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      console.error("[updateMediaItem] Update failed:", error?.message);
      return null;
    }

    let albumTitle: string | null = null;
    if (data.album_id) {
      const { data: albumRow } = await supabase
        .from("albums")
        .select("title")
        .eq("id", data.album_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (albumRow) {
        albumTitle = albumRow.title;
      }
    }

    return {
      ...data,
      album_title: albumTitle,
      links: (data.links as unknown as MediaLinks) || {},
    } as MediaItem;
  } catch (err) {
    console.error("[updateMediaItem] Unexpected error:", err);
    return null;
  }
}

/**
 * Deletes a media item.
 */
export async function deleteMediaItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("media_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

/**
 * Bulk deletes multiple media items.
 */
export async function bulkDeleteMedia(
  supabase: SupabaseClient<Database>,
  userId: string,
  ids: string[]
): Promise<boolean> {
  if (ids.length === 0) return true;
  const { error } = await supabase
    .from("media_items")
    .delete()
    .in("id", ids)
    .eq("user_id", userId);

  return !error;
}

/**
 * Bulk assigns multiple media items to an album.
 */
export async function bulkAssignAlbum(
  supabase: SupabaseClient<Database>,
  userId: string,
  ids: string[],
  albumId: string | null
): Promise<boolean> {
  if (ids.length === 0) return true;
  const { error } = await supabase
    .from("media_items")
    .update({ album_id: albumId, updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", userId);

  return !error;
}

/**
 * Merges updated link fields into an existing MediaLinks object.
 */
export function mergeMediaLinks(
  existing: MediaLinks | undefined,
  updates: Partial<MediaLinks>
): MediaLinks {
  const merged: MediaLinks = { ...(existing || {}) };
  if (updates.place_id !== undefined) {
    merged.place_id = updates.place_id;
    merged.place_name = updates.place_name ?? null;
  }
  if (updates.meal_id !== undefined) {
    merged.meal_id = updates.meal_id;
    merged.meal_name = updates.meal_name ?? null;
  }
  if (updates.expense_id !== undefined) {
    merged.expense_id = updates.expense_id;
    merged.expense_amount_paise = updates.expense_amount_paise ?? null;
  }
  if (updates.journal_id !== undefined) {
    merged.journal_id = updates.journal_id;
  }
  return merged;
}

/**
 * Bulk updates links and optionally album for multiple media items.
 */
export async function bulkUpdateMediaLinks(
  supabase: SupabaseClient<Database>,
  userId: string,
  ids: string[],
  updates: {
    links?: Partial<MediaLinks>;
    albumId?: string | null | undefined;
  }
): Promise<boolean> {
  if (ids.length === 0) return true;

  try {
    const { data: rows, error: fetchErr } = await supabase
      .from("media_items")
      .select("id, links, album_id")
      .in("id", ids)
      .eq("user_id", userId);

    if (fetchErr || !rows) {
      console.error("[bulkUpdateMediaLinks] Fetch error:", fetchErr?.message);
      return false;
    }

    const now = new Date().toISOString();

    const updatePromises = rows.map((row) => {
      const existingLinks = (row.links as unknown as MediaLinks) || {};
      const newLinks = updates.links ? mergeMediaLinks(existingLinks, updates.links) : existingLinks;

      const payload: Record<string, unknown> = {
        links: newLinks as unknown as Json,
        updated_at: now,
      };

      if (updates.albumId !== undefined) {
        payload.album_id = updates.albumId;
      }

      return supabase
        .from("media_items")
        .update(payload as any)
        .eq("id", row.id)
        .eq("user_id", userId);
    });

    const results = await Promise.all(updatePromises);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      console.error("[bulkUpdateMediaLinks] One or more row updates failed");
      return false;
    }

    return true;
  } catch (err) {
    console.error("[bulkUpdateMediaLinks] Unexpected error:", err);
    return false;
  }
}

/**
 * Fetches all user albums with item counts.
 */
export async function getAlbums(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Album[]> {
  const { data, error } = await supabase
    .from("albums")
    .select("*, media_items(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .map((album) => {
      const raw = album as unknown as {
        id: string;
        user_id: string;
        title: string;
        description: string | null;
        album_date?: string | null;
        created_at: string;
        updated_at: string;
        media_items?: { count: number }[];
      };

      return {
        id: raw.id,
        user_id: raw.user_id,
        title: raw.title,
        description: raw.description,
        album_date: raw.album_date || raw.created_at,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        item_count: raw.media_items?.[0]?.count ?? 0,
      };
    })
    .sort((a, b) => {
      const timeA = new Date(a.album_date || a.created_at).getTime();
      const timeB = new Date(b.album_date || b.created_at).getTime();
      return timeB - timeA;
    });
}

/**
 * Creates a new album.
 * Fully resilient to schema cache states (gracefully falls back if album_date column is not yet migrated).
 */
export async function createAlbum(
  supabase: SupabaseClient<Database>,
  userId: string,
  title: string,
  description?: string,
  albumDate?: string | null
): Promise<Album | null> {
  const effectiveDate = albumDate || new Date().toISOString();
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    title,
    description: description || null,
    created_at: effectiveDate,
    album_date: effectiveDate,
  };

  // 1. Try inserting with both album_date and created_at
  let { data, error } = await supabase
    .from("albums")
    .insert(insertPayload as any)
    .select()
    .single();

  // 2. If album_date column is not yet migrated in Supabase, fall back seamlessly while preserving created_at = effectiveDate
  if (error && (error.message?.includes("album_date") || error.code === "PGRST204" || error.code === "42703")) {
    console.warn("[createAlbum] album_date not present in schema, falling back with created_at:", error.message);
    delete insertPayload.album_date;
    const fallbackRes = await supabase
      .from("albums")
      .insert(insertPayload as any)
      .select()
      .single();
    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error || !data) {
    console.error("[createAlbum] Error:", error?.message);
    return null;
  }

  const raw = data as any;
  return {
    ...raw,
    album_date: raw.album_date || raw.created_at || effectiveDate,
    created_at: raw.created_at || effectiveDate,
    item_count: 0,
  };
}

/**
 * Updates an album's title, description, or album date.
 */
export async function updateAlbum(
  supabase: SupabaseClient<Database>,
  userId: string,
  albumId: string,
  updates: {
    title?: string;
    description?: string | null;
    album_date?: string | null;
  }
): Promise<Album | null> {
  const payload: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  if (updates.album_date) {
    payload.created_at = updates.album_date;
  }

  let { data, error } = await supabase
    .from("albums")
    .update(payload as any)
    .eq("id", albumId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error && (error.message?.includes("album_date") || error.code === "PGRST204" || error.code === "42703")) {
    delete payload.album_date;
    const fallback = await supabase
      .from("albums")
      .update(payload as any)
      .eq("id", albumId)
      .eq("user_id", userId)
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    console.error("[updateAlbum] Error:", error?.message);
    return null;
  }

  const raw = data as any;
  return {
    ...raw,
    album_date: raw.album_date || raw.created_at,
    created_at: raw.created_at,
    item_count: 0,
  };
}

/**
 * Deletes an album.
 * If deletePhotosInside is true, also permanently deletes media items assigned to this album.
 * If false, safely unlinks media items (setting album_id to null).
 */
export async function deleteAlbum(
  supabase: SupabaseClient<Database>,
  userId: string,
  albumId: string,
  deletePhotosInside: boolean = false
): Promise<boolean> {
  if (deletePhotosInside) {
    await supabase
      .from("media_items")
      .delete()
      .eq("album_id", albumId)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("media_items")
      .update({ album_id: null, updated_at: new Date().toISOString() })
      .eq("album_id", albumId)
      .eq("user_id", userId);
  }

  const { error } = await supabase
    .from("albums")
    .delete()
    .eq("id", albumId)
    .eq("user_id", userId);

  return !error;
}

/**
 * "On This Day" memories algorithm.
 * Finds all media items taken on today's calendar date (MM-DD) in previous years.
 */
export async function getOnThisDayMemories(
  supabase: SupabaseClient<Database>,
  userId: string,
  todayStr: string = todayIST()
): Promise<{ yearsAgo: number; year: number; items: MediaItem[] }[]> {
  const [currentYearStr, currentMonth, currentDay] = todayStr.split("-");
  const currentYear = parseInt(currentYearStr, 10);
  const targetMMDD = `-${currentMonth}-${currentDay}`;

  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("user_id", userId)
    .order("taken_at", { ascending: false });

  if (error || !data) return [];

  const matched = (data as unknown as MediaItem[]).filter((item) => {
    const itemDate = formatISTDate(item.taken_at); // YYYY-MM-DD
    const itemYear = parseInt(itemDate.split("-")[0], 10);
    return itemYear < currentYear && itemDate.endsWith(targetMMDD);
  });

  const byYearMap = new Map<number, MediaItem[]>();
  for (const item of matched) {
    const itemYear = parseInt(formatISTDate(item.taken_at).split("-")[0], 10);
    const existing = byYearMap.get(itemYear) || [];
    existing.push(item);
    byYearMap.set(itemYear, existing);
  }

  const result: { yearsAgo: number; year: number; items: MediaItem[] }[] = [];
  for (const [year, items] of Array.from(byYearMap.entries())) {
    result.push({
      yearsAgo: currentYear - year,
      year,
      items,
    });
  }

  return result.sort((a, b) => a.yearsAgo - b.yearsAgo);
}

/**
 * Inserts a failed sync operation into the sync_queue table for automatic or manual retry.
 */
export async function enqueueSyncFailure(
  supabase: SupabaseClient<Database>,
  userId: string,
  mediaId: string,
  fileName: string,
  errorMessage: string
): Promise<void> {
  await supabase.from("sync_queue").insert({
    user_id: userId,
    action: "drive_media_upload",
    payload: {
      media_id: mediaId,
      file_name: fileName,
    },
    status: "pending",
    attempts: 1,
    last_error: errorMessage,
  });
}

/**
 * Fetches all pending or failed items in the sync queue.
 */
export async function getSyncQueue(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SyncQueueItem[]> {
  const { data, error } = await supabase
    .from("sync_queue")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as SyncQueueItem[];
}
