"use client";

// ============================================================================
// Sahil's Shore: Notes / Second Brain Top-Level Container
// Search, folders, tags, pinning, markdown editor, backlinks panel, and graph
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  NoteItem,
  CreateNoteInput,
  UpdateNoteInput,
  BacklinkReference,
  NotesGraphData,
} from "@/lib/notes";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  syncNoteLinks,
  getBacklinksForNote,
  getNotesGraphData,
} from "@/lib/notes";
import { NoteEditor } from "./NoteEditor";
import { BacklinksPanel } from "./BacklinksPanel";
import { NotesGraphView } from "./NotesGraphView";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Folder,
  Network,
  Tag,
  ChevronDown,
  Layers,
} from "lucide-react";

export function NotesContainer() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [backlinks, setBacklinks] = useState<BacklinkReference[]>([]);
  const [graphData, setGraphData] = useState<NotesGraphData>({ nodes: [], edges: [] });
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch notes
  const fetchAllNotes = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const supabase = createClient();
    const fetched = await getNotes(supabase, userId);
    setNotes(fetched);
    if (fetched.length > 0 && !activeNoteId) {
      setActiveNoteId(fetched[0].id);
    }
    setIsLoading(false);
  }, [userId, activeNoteId]);

  useEffect(() => {
    if (userId) {
      fetchAllNotes();
    }
  }, [userId, fetchAllNotes]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Distinct folders and tags
  const folders = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => set.add(n.folder || "General"));
    return Array.from(set).sort();
  }, [notes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  // Fetch backlinks for active note
  useEffect(() => {
    if (!userId || !activeNote) {
      setBacklinks([]);
      return;
    }
    const supabase = createClient();
    getBacklinksForNote(supabase, activeNote.id, activeNote.title, notes).then(setBacklinks);
  }, [userId, activeNote, notes]);

  // Load graph data when opening graph
  const handleOpenGraph = async () => {
    if (!userId) return;
    const supabase = createClient();
    const data = await getNotesGraphData(supabase, userId, notes);
    setGraphData(data);
    setIsGraphOpen(true);
  };

  // Handlers
  const handleCreateNote = async (initialFolder: string = "General", initialTitle?: string) => {
    if (!userId) return;
    const supabase = createClient();
    const newNote = await createNote(supabase, {
      userId,
      title: initialTitle || "Untitled Note",
      content: "",
      folder: initialFolder === "All" ? "General" : initialFolder,
      tags: [],
    });

    if (newNote) {
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    }
  };

  const handleUpdateNote = async (
    noteId: string,
    updates: UpdateNoteInput
  ): Promise<boolean> => {
    if (!userId) return false;
    const supabase = createClient();
    const updated = await updateNote(supabase, noteId, updates);

    if (updated) {
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));

      // Sync backlinks if content was updated
      if (updates.content !== undefined) {
        await syncNoteLinks(supabase, userId, noteId, updates.content, notes);
        if (activeNote) {
          getBacklinksForNote(supabase, activeNote.id, activeNote.title, notes).then(setBacklinks);
        }
      }
      return true;
    }
    return false;
  };

  const handleDeleteNote = async (noteId: string): Promise<boolean> => {
    if (!userId) return false;
    const supabase = createClient();
    const ok = await deleteNote(supabase, noteId);
    if (ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (activeNoteId === noteId) {
        const remaining = notes.filter((n) => n.id !== noteId);
        setActiveNoteId(remaining[0]?.id || null);
      }
      return true;
    }
    return false;
  };

  const handleNavigateToTitle = (title: string) => {
    const existing = notes.find((n) => n.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (existing) {
      setActiveNoteId(existing.id);
    } else {
      // Create it if it doesn't exist
      handleCreateNote("General", title);
    }
  };

  // Filter notes by search query, folder, and tag
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Folder filter
      if (selectedFolder !== "All" && note.folder !== selectedFolder) {
        return false;
      }
      // Tag filter
      if (selectedTag && !(note.tags || []).includes(selectedTag)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = note.title.toLowerCase().includes(q);
        const inContent = note.content.toLowerCase().includes(q);
        const inTags = (note.tags || []).some((t) => t.toLowerCase().includes(q));
        const inFolder = note.folder.toLowerCase().includes(q);
        return inTitle || inContent || inTags || inFolder;
      }
      return true;
    });
  }, [notes, selectedFolder, selectedTag, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 md:px-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Second Brain Knowledge Base
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Notes & [[Backlinks]]
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Knowledge Graph Button */}
          <button
            onClick={handleOpenGraph}
            className="flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:bg-primary/10 active:scale-95 transition-all"
            title="Open Interactive Knowledge Graph"
          >
            <Network className="h-4 w-4" />
            <span>Graph View</span>
          </button>

          {/* New Note Button */}
          <button
            onClick={() => handleCreateNote(selectedFolder)}
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar (3 cols), Editor (6 cols), Backlinks Panel (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Folders, Search & Note List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all notes, #tags, content..."
              className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2 text-xs text-text placeholder:text-text-muted/60 outline-none focus:border-primary shadow-xs transition-all"
            />
          </div>

          {/* Folder Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedFolder("All")}
              className={`rounded-xl px-3 py-1 font-semibold transition-all shrink-0 ${
                selectedFolder === "All"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface border border-border text-text-muted hover:text-text"
              }`}
            >
              All ({notes.length})
            </button>
            {folders.map((f) => {
              const count = notes.filter((n) => n.folder === f).length;
              const isSelected = selectedFolder === f;
              return (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1 font-medium transition-all shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-surface border border-border text-text-muted hover:text-text"
                  }`}
                >
                  <Folder className="h-3 w-3" />
                  <span>{f}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Tag Filter Pills */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-500 font-medium"
                >
                  Clear #{selectedTag} ×
                </button>
              )}
              {allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`rounded-md px-2 py-0.5 font-medium transition-all ${
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-text-muted hover:text-text"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Notes List */}
          <div className="rounded-3xl border border-border bg-surface p-2 shadow-sm space-y-1 max-h-[600px] overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-muted">
                No notes found. Click &quot;New Note&quot; to create one.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = activeNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`group cursor-pointer rounded-2xl p-3 transition-all ${
                      isActive
                        ? "bg-primary/10 border border-primary/30 shadow-xs"
                        : "hover:bg-surface-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {note.is_pinned && (
                          <Pin className="h-3.5 w-3.5 text-accent-warm shrink-0 fill-accent-warm" />
                        )}
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isActive ? "text-primary" : "text-text"
                          }`}
                        >
                          {note.title || "Untitled Note"}
                        </h4>
                      </div>
                      <span className="text-[10px] text-text-muted shrink-0 ml-2">
                        {note.folder}
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                      {note.content ? note.content.slice(0, 120) : <span className="italic">Empty note</span>}
                    </p>

                    {note.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-surface-muted/80 px-1.5 py-0.2 text-[9px] text-text-muted font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Note Editor (5 cols) */}
        <div className="lg:col-span-5">
          <NoteEditor
            note={activeNote}
            folders={folders}
            allNotes={notes}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            onNavigateToTitle={handleNavigateToTitle}
          />
        </div>

        {/* Right Column: Backlinks Panel (3 cols) */}
        <div className="lg:col-span-3">
          <BacklinksPanel
            currentNoteTitle={activeNote?.title || ""}
            backlinks={backlinks}
            onSelectNote={(noteId) => setActiveNoteId(noteId)}
          />
        </div>
      </div>

      {/* Graph View Modal Dialog */}
      {isGraphOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl animate-fadeIn">
            <NotesGraphView
              graphData={graphData}
              activeNoteId={activeNoteId || undefined}
              onSelectNote={(noteId) => {
                setActiveNoteId(noteId);
                setIsGraphOpen(false);
              }}
              onClose={() => setIsGraphOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
