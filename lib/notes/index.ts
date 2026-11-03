// ============================================================================
// Sahil's Shore: Notes & Second Brain Data Layer
// Fast scratchpad, markdown knowledge base, [[backlinks]], and graph network
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
  folder: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  userId: string;
  title: string;
  content?: string;
  folder?: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  folder?: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface BacklinkReference {
  sourceNoteId: string;
  sourceNoteTitle: string;
  folder: string;
  contextExcerpt: string;
}

export interface GraphNode {
  id: string;
  title: string;
  folder: string;
  linkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface NotesGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Extracts all [[Note Title]] backlink references from markdown text.
 */
export function extractBacklinks(markdown: string): string[] {
  if (!markdown) return [];
  const regex = /\[\[([^\]\n]+)\]\]/g;
  const matches: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(markdown)) !== null) {
    const rawTitle = m[1].trim();
    if (rawTitle && !matches.includes(rawTitle)) {
      matches.push(rawTitle);
    }
  }

  return matches;
}

/**
 * Finds a snippet of text surrounding the mention of [[targetTitle]].
 */
export function extractContextSnippet(content: string, targetTitle: string): string {
  if (!content) return "";
  const lines = content.split("\n");
  const targetLower = targetTitle.toLowerCase();

  for (const line of lines) {
    if (line.toLowerCase().includes(`[[${targetLower}]]`)) {
      return line.trim();
    }
  }

  // Fallback to first line
  return lines[0]?.trim() || "";
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

    return (data || []).map((row) => ({
      ...row,
      folder: (row as any).folder || "General",
    })) as NoteItem[];
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
  const {
    userId,
    title,
    content = "",
    folder = "General",
    tags = [],
    is_pinned = false,
  } = input;

  try {
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        folder: folder.trim() || "General",
        tags,
        is_pinned,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("[createNote] Insert error:", error.message);
      return null;
    }

    const note: NoteItem = {
      ...(data as any),
      folder: (data as any).folder || folder,
    };

    // Log to timeline_events
    await writeTimelineEvent(supabase, {
      userId,
      type: "note_created",
      summary: `Created note: ${note.title}`,
      refTable: "notes",
      refId: note.id,
      meta: {
        title: note.title,
        folder: note.folder,
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
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.content !== undefined) updates.content = input.content.trim();
    if (input.folder !== undefined) updates.folder = input.folder.trim() || "General";
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.is_pinned !== undefined) updates.is_pinned = input.is_pinned;

    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", noteId)
      .select()
      .single();

    if (error) {
      console.error("[updateNote] Update error:", error.message);
      return null;
    }

    return {
      ...(data as any),
      folder: (data as any).folder || "General",
    } as NoteItem;
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
 * Synchronizes outgoing [[backlinks]] from a source note into the `note_links` table.
 */
export async function syncNoteLinks(
  supabase: SupabaseClient<Database>,
  userId: string,
  sourceNoteId: string,
  content: string,
  allNotes: NoteItem[]
): Promise<void> {
  try {
    const extractedTitles = extractBacklinks(content);
    if (extractedTitles.length === 0) {
      // Remove any previously recorded links
      await supabase.from("note_links").delete().eq("source_note_id", sourceNoteId);
      return;
    }

    // Match titles to note IDs (case-insensitive)
    const titleMap = new Map<string, string>();
    allNotes.forEach((n) => {
      if (n.id !== sourceNoteId) {
        titleMap.set(n.title.toLowerCase().trim(), n.id);
      }
    });

    const targetIds: string[] = [];
    extractedTitles.forEach((t) => {
      const match = titleMap.get(t.toLowerCase().trim());
      if (match && !targetIds.includes(match)) {
        targetIds.push(match);
      }
    });

    // Replace links
    await supabase.from("note_links").delete().eq("source_note_id", sourceNoteId);

    if (targetIds.length > 0) {
      const rows = targetIds.map((targetId) => ({
        user_id: userId,
        source_note_id: sourceNoteId,
        target_note_id: targetId,
      }));

      await supabase.from("note_links").insert(rows as any);
    }
  } catch (err) {
    console.warn("[syncNoteLinks] Error updating backlinks:", err);
  }
}

/**
 * Fetches all incoming backlink references pointing to the target note.
 */
export async function getBacklinksForNote(
  supabase: SupabaseClient<Database>,
  targetNoteId: string,
  targetNoteTitle: string,
  allNotes: NoteItem[]
): Promise<BacklinkReference[]> {
  try {
    const { data: links, error } = await supabase
      .from("note_links")
      .select("source_note_id")
      .eq("target_note_id", targetNoteId);

    if (error || !links) return [];

    const notesMap = new Map<string, NoteItem>();
    allNotes.forEach((n) => notesMap.set(n.id, n));

    const references: BacklinkReference[] = [];

    links.forEach((l) => {
      const source = notesMap.get(l.source_note_id);
      if (source) {
        references.push({
          sourceNoteId: source.id,
          sourceNoteTitle: source.title,
          folder: source.folder,
          contextExcerpt: extractContextSnippet(source.content, targetNoteTitle),
        });
      }
    });

    return references;
  } catch (err) {
    console.error("[getBacklinksForNote] Error:", err);
    return [];
  }
}

/**
 * Fetches all note links and builds the network graph structure.
 */
export async function getNotesGraphData(
  supabase: SupabaseClient<Database>,
  userId: string,
  notes: NoteItem[]
): Promise<NotesGraphData> {
  try {
    const { data: links } = await supabase
      .from("note_links")
      .select("source_note_id, target_note_id")
      .eq("user_id", userId);

    const edges: GraphEdge[] = (links || []).map((l) => ({
      source: l.source_note_id,
      target: l.target_note_id,
    }));

    // Count degrees
    const degreeMap = new Map<string, number>();
    edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });

    const nodes: GraphNode[] = notes.map((n) => ({
      id: n.id,
      title: n.title,
      folder: n.folder,
      linkCount: degreeMap.get(n.id) || 0,
    }));

    return { nodes, edges };
  } catch (err) {
    console.error("[getNotesGraphData] Error:", err);
    return { nodes: [], edges: [] };
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

    if (error || !data || data.length === 0) {
      return null;
    }

    return {
      ...(data[0] as any),
      folder: (data[0] as any).folder || "General",
    } as NoteItem;
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
        folder: "Reflections",
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
