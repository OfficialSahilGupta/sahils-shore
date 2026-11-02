// ============================================================================
// Sahil's Shore: Notes & Reflections Module
// Fast scratchpad, daily reflections, second brain notes with timeline integration
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { todayIST } from "../date-utils.ts";

export interface NoteItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  userId: string;
  title: string;
  content?: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  is_pinned?: boolean;
}

/**
 * Fetches all notes for the authenticated user, pinned first then newest updated.
 */
export async function getNotes(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<NoteItem[]> {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[getNotes] Failed to fetch notes:", error.message);
      return [];
    }

    return (data || []) as NoteItem[];
  } catch (err) {
    console.error("[getNotes] Unexpected error:", err);
    return [];
  }
}

/**
 * Creates a new note and writes an event to timeline_events.
 */
export async function createNote(
  supabase: SupabaseClient<Database>,
  input: CreateNoteInput
): Promise<NoteItem | null> {
  const { userId, title, content = "", tags = [], is_pinned = false } = input;

  try {
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        tags,
        is_pinned,
      })
      .select()
      .single();

    if (error) {
      console.error("[createNote] Insert error:", error.message);
      return null;
    }

    const note = data as NoteItem;

    // Log to timeline_events
    await writeTimelineEvent(supabase, {
      userId,
      type: "note_created",
      summary: `Created note: ${note.title}`,
      refTable: "notes",
      refId: note.id,
      meta: {
        title: note.title,
        tags: note.tags,
        is_pinned: note.is_pinned,
      },
    });

    return note;
  } catch (err) {
    console.error("[createNote] Unexpected error:", err);
    return null;
  }
}

/**
 * Updates an existing note.
 */
export async function updateNote(
  supabase: SupabaseClient<Database>,
  noteId: string,
  input: UpdateNoteInput
): Promise<NoteItem | null> {
  try {
    const updates: Partial<Database["public"]["Tables"]["notes"]["Update"]> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.content !== undefined) updates.content = input.content.trim();
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.is_pinned !== undefined) updates.is_pinned = input.is_pinned;

    const { data, error } = await supabase
      .from("notes")
      .update(updates as any)
      .eq("id", noteId)
      .select()
      .single();

    if (error) {
      console.error("[updateNote] Update error:", error.message);
      return null;
    }

    return data as NoteItem;
  } catch (err) {
    console.error("[updateNote] Unexpected error:", err);
    return null;
  }
}

/**
 * Deletes a note by ID.
 */
export async function deleteNote(
  supabase: SupabaseClient<Database>,
  noteId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) {
      console.error("[deleteNote] Delete error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[deleteNote] Unexpected error:", err);
    return false;
  }
}

/**
 * Fetches the daily reflection note for a specific IST date "YYYY-MM-DD".
 */
export async function getDailyNote(
  supabase: SupabaseClient<Database>,
  userId: string,
  dateStr: string = todayIST()
): Promise<NoteItem | null> {
  try {
    const tag = `reflection-${dateStr}`;
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .contains("tags", [tag])
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[getDailyNote] Error:", error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data[0] as NoteItem;
    }

    return null;
  } catch (err) {
    console.error("[getDailyNote] Unexpected error:", err);
    return null;
  }
}

/**
 * Creates or updates the daily reflection note for an IST date "YYYY-MM-DD".
 */
export async function upsertDailyNote(
  supabase: SupabaseClient<Database>,
  userId: string,
  dateStr: string,
  content: string
): Promise<NoteItem | null> {
  try {
    const existing = await getDailyNote(supabase, userId, dateStr);
    const tag = `reflection-${dateStr}`;

    if (existing) {
      const updated = await updateNote(supabase, existing.id, {
        content,
      });
      return updated;
    } else {
      const created = await createNote(supabase, {
        userId,
        title: `Reflection: ${dateStr}`,
        content,
        tags: [tag, "daily-reflection"],
        is_pinned: false,
      });
      return created;
    }
  } catch (err) {
    console.error("[upsertDailyNote] Unexpected error:", err);
    return null;
  }
}
