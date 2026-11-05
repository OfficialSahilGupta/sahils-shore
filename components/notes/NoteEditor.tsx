"use client";

// ============================================================================
// Sahil's Shore: Markdown Note Editor with Live Preview & [[Backlinks]]
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import type { NoteItem, UpdateNoteInput } from "@/lib/notes";
import {
  Pin,
  Folder,
  Tag,
  Save,
  Trash2,
  Eye,
  Edit3,
  Columns,
  Bold,
  Italic,
  Code,
  List,
  CheckSquare,
  Quote,
  Link2,
  Plus,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";

interface NoteEditorProps {
  note: NoteItem | null;
  folders: string[];
  allNotes: NoteItem[];
  onUpdate: (noteId: string, updates: UpdateNoteInput) => Promise<boolean>;
  onDelete: (noteId: string) => Promise<boolean>;
  onNavigateToTitle: (title: string) => void;
  onNewNoteInFolder?: (folder: string) => void;
}

export function NoteEditor({
  note,
  folders,
  allNotes,
  onUpdate,
  onDelete,
  onNavigateToTitle,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [folder, setFolder] = useState(note?.folder || "General");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [isPinned, setIsPinned] = useState(note?.is_pinned || false);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state on note change
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolder(note.folder || "General");
      setTags(note.tags || []);
      setIsPinned(note.is_pinned);
    }
  }, [note]);

  if (!note) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface p-8 text-center text-text-muted">
        <Folder className="h-10 w-10 text-primary/40 mb-3" />
        <h3 className="text-sm font-semibold text-text">No Note Selected</h3>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          Select a note from the sidebar or create a new note to start writing in your Second Brain.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onUpdate(note.id, {
      title,
      content,
      folder,
      tags,
      is_pinned: isPinned,
    });
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleTogglePin = async () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    await onUpdate(note.id, { is_pinned: nextPin });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (!tags.includes(clean)) {
        const nextTags = [...tags, clean];
        setTags(nextTags);
        onUpdate(note.id, { tags: nextTags });
      }
      setTagInput("");
    }
  };

  const removeTag = (t: string) => {
    const nextTags = tags.filter((item) => item !== t);
    setTags(nextTags);
    onUpdate(note.id, { tags: nextTags });
  };

  const insertTextAtCursor = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    const nextContent = content.substring(0, start) + replacement + content.substring(end);

    setContent(nextContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // Helper to render markdown preview with interactive [[backlinks]]
  const renderFormattedMarkdown = (text: string) => {
    if (!text) {
      return <p className="text-text-muted italic">Empty note. Start typing markdown...</p>;
    }

    const lines = text.split("\n");

    return lines.map((line, idx) => {
      // Parse [[Note Title]] inside the line
      const parts: React.ReactNode[] = [];
      const regex = /\[\[([^\]\n]+)\]\]/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }

        const linkedTitle = match[1].trim();
        parts.push(
          <button
            key={`${idx}-${match.index}`}
            type="button"
            onClick={() => onNavigateToTitle(linkedTitle)}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors mx-0.5"
            title={`Jump to [[${linkedTitle}]]`}
          >
            <Link2 className="h-3 w-3 inline" />
            <span>{linkedTitle}</span>
          </button>
        );

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      // Check headings
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="text-xl font-bold text-text mt-3 mb-1.5">{parts}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="text-base font-bold text-text mt-2.5 mb-1">{parts}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-sm font-semibold text-text mt-2 mb-1">{parts}</h3>;
      }
      if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
        const isChecked = line.startsWith("- [x] ");
        return (
          <div key={idx} className="flex items-center gap-2 my-1 text-xs text-text">
            <input type="checkbox" checked={isChecked} readOnly className="rounded text-primary" />
            <span className={isChecked ? "line-through text-text-muted" : ""}>{parts}</span>
          </div>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={idx} className="ml-4 list-disc text-xs text-text leading-relaxed">{parts}</li>;
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-3 border-primary/40 pl-3 my-1.5 italic text-xs text-text-muted">
            {parts}
          </blockquote>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return <p key={idx} className="text-xs text-text leading-relaxed my-0.5">{parts}</p>;
    });
  };

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
      {/* Top Bar: Title & Primary Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note..."
            className="w-full bg-transparent text-xl font-bold tracking-tight text-text placeholder:text-text-muted/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Pin Toggle */}
          <button
            type="button"
            onClick={handleTogglePin}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all ${
              isPinned
                ? "border-accent-warm bg-accent-warm/10 text-accent-warm"
                : "border-border text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
            title={isPinned ? "Unpin Note" : "Pin Note to Top"}
          >
            <Pin className="h-3.5 w-3.5" />
            <span>{isPinned ? "Pinned" : "Pin"}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-surface-muted/50 p-0.5">
            <button
              onClick={() => setViewMode("edit")}
              className={`rounded-lg p-1 text-xs transition-colors ${
                viewMode === "edit" ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text"
              }`}
              title="Edit Mode"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`rounded-lg p-1 text-xs transition-colors hidden sm:block ${
                viewMode === "split" ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text"
              }`}
              title="Split View"
            >
              <Columns className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`rounded-lg p-1 text-xs transition-colors ${
                viewMode === "preview" ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text"
              }`}
              title="Live Preview Mode"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </>
            )}
          </button>

          {/* Delete Button */}
          <button
            onClick={() => {
              if (confirm(`Delete "${note.title}"?`)) {
                onDelete(note.id);
              }
            }}
            className="rounded-xl border border-border p-1.5 text-text-muted hover:border-rose-400 hover:text-rose-500 transition-colors"
            title="Delete Note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Folder & Tags Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Folder Select */}
        <div className="flex items-center gap-1.5">
          <Folder className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-text-muted font-medium">Folder:</span>
          {isCreatingFolder ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newFolderInput}
                onChange={(e) => setNewFolderInput(e.target.value)}
                placeholder="Folder name"
                className="rounded-lg border border-border px-2 py-0.5 text-xs text-text outline-none focus:border-primary"
              />
              <button
                onClick={() => {
                  if (newFolderInput.trim()) {
                    setFolder(newFolderInput.trim());
                    setIsCreatingFolder(false);
                    setNewFolderInput("");
                  }
                }}
                className="rounded-md bg-primary px-2 py-0.5 text-[11px] text-primary-foreground font-medium"
              >
                Set
              </button>
              <button
                onClick={() => setIsCreatingFolder(false)}
                className="text-[11px] text-text-muted p-0.5 hover:text-text"
                aria-label="Cancel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <select
              value={folder}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setIsCreatingFolder(true);
                } else {
                  setFolder(e.target.value);
                  onUpdate(note.id, { folder: e.target.value });
                }
              }}
              className="rounded-lg border border-border bg-surface-muted/40 px-2 py-1 text-xs text-text font-medium outline-none cursor-pointer"
            >
              {Array.from(new Set([...folders, folder])).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value="__new__">+ New Folder...</option>
            </select>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-text-muted" />
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-text-muted"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-rose-500"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ tag"
            className="w-16 rounded-md border border-border/60 bg-transparent px-1.5 py-0.5 text-[11px] text-text outline-none focus:w-24 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Markdown Toolbar */}
      {viewMode !== "preview" && (
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/70 bg-surface-muted/30 p-1.5 text-xs text-text-muted">
          <button
            onClick={() => insertTextAtCursor("**", "**")}
            className="rounded-lg p-1.5 hover:bg-surface hover:text-text transition-colors"
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => insertTextAtCursor("*", "*")}
            className="rounded-lg p-1.5 hover:bg-surface hover:text-text transition-colors"
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => insertTextAtCursor("`", "`")}
            className="rounded-lg p-1.5 hover:bg-surface hover:text-text transition-colors"
            title="Inline Code"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => insertTextAtCursor("### ")}
            className="rounded-lg px-2 py-1 text-xs font-bold hover:bg-surface hover:text-text transition-colors"
            title="Heading"
          >
            H3
          </button>
          <button
            onClick={() => insertTextAtCursor("- ")}
            className="rounded-lg p-1.5 hover:bg-surface hover:text-text transition-colors"
            title="Bulleted List"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => insertTextAtCursor("- [ ] ")}
            className="rounded-lg p-1.5 hover:bg-surface hover:text-text transition-colors"
            title="Task Checkbox"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => insertTextAtCursor("> ")}
            className="rounded-lg p-1.5 hover:bg-surface hover:text-text transition-colors"
            title="Quote"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* Quick [[Backlink]] Insertion */}
          <button
            onClick={() => insertTextAtCursor("[[", "]]")}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            title="Insert [[Backlink]]"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>[[Link]]</span>
          </button>
        </div>
      )}

      {/* Editor & Preview Workspace */}
      <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor Box */}
        {(viewMode === "edit" || viewMode === "split") && (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
            placeholder="Write in markdown... Use [[Note Title]] to link thoughts together."
            className="w-full rounded-2xl border border-border bg-surface-muted/20 p-4 font-mono text-xs text-text placeholder:text-text-muted/60 outline-none focus:border-primary focus:bg-surface leading-relaxed resize-y transition-all"
          />
        )}

        {/* Live Preview Box */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="min-h-[350px] max-h-[550px] overflow-y-auto rounded-2xl border border-border/80 bg-surface-muted/20 p-4">
            <div className="prose prose-sm max-w-none text-text">
              {renderFormattedMarkdown(content)}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border/60">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Last modified: {new Date(note.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </span>
        <span>
          {content.length} characters • {content.split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </div>
  );
}
