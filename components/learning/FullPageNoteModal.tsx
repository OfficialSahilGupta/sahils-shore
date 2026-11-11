"use client";

// ============================================================================
// Sahil's Shore: FullPageNoteModal Component
// Full-page, distraction-free Markdown Document Studio for Chapter Study Notes.
// Features:
// - Read Document View (Notion/Obsidian style centered luxury typography)
// - Split Studio View (Editor on left, live Markdown preview on right)
// - Write Markdown View with formatting toolbar & architecture templates
// - Dynamic Table of Contents outline quick-jumps
// - Word count & read time estimations
// - 1-click Download .md & Copy Markdown
// - Seamless switch to Code Workspace
// Strictly adheres to Shore rules: Zero Emojis (Lucide SVGs only),
// CSS tokenized colors, and WCAG AA contrast.
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  BookOpen,
  Edit3,
  Columns,
  Eye,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Circle,
  Code2,
  Sparkles,
  Save,
  ArrowLeft,
  Share2,
  Maximize2,
  Minimize2,
  List,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Quote,
  Table as TableIcon,
  CheckSquare,
  FileText,
  FolderTree,
} from "lucide-react";
import type { LearningItem, Json } from "@/types";
import { ModalPortal } from "@/components/ui/modal-portal";
import { MarkdownView } from "@/components/common/MarkdownView";
import {
  parseTopicSubSections,
  packTopicSubSections,
  getTopicChapterNotes,
  type TopicSubSection,
} from "@/lib/learning";

interface FullPageNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LearningItem | null;
  trackTitle: string;
  onSave: (
    itemId: string,
    updates: {
      topic?: string;
      category?: string | null;
      status?: "planned" | "in_progress" | "completed";
      notes?: string | null;
      resources?: Json;
    }
  ) => Promise<void>;
  onOpenStudyWorkspace?: (item: LearningItem) => void;
}

export function FullPageNoteModal({
  isOpen,
  onClose,
  item,
  trackTitle,
  onSave,
  onOpenStudyWorkspace,
}: FullPageNoteModalProps) {
  const [mode, setMode] = useState<"read" | "split" | "edit">("read");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed">("planned");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [subSections, setSubSections] = useState<TopicSubSection[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Background scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Hydrate notes & state from item
  useEffect(() => {
    if (item && isOpen) {
      const parsedSubs = parseTopicSubSections(item);
      setSubSections(parsedSubs);
      const effectiveNotes = getTopicChapterNotes(item);
      setNotes(effectiveNotes);
      setStatus(item.status || "planned");
      // Default to read mode if notes exist, otherwise open edit mode
      setMode(effectiveNotes.trim().length > 0 ? "read" : "edit");
      setSaveSuccess(false);
    }
  }, [item, isOpen]);

  // Keyboard shortcut: Cmd/Ctrl + S to save, Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Calculate reading stats
  const { wordCount, readTimeMinutes } = useMemo(() => {
    const trimmed = notes.trim();
    if (!trimmed) return { wordCount: 0, readTimeMinutes: 0 };
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, readTimeMinutes: minutes };
  }, [notes]);

  // Extract table of contents headings (H1, H2, H3)
  const outlineHeadings = useMemo(() => {
    const lines = notes.split("\n");
    const headings: { level: number; text: string }[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        headings.push({ level: 3, text: trimmed.slice(4).trim() });
      } else if (trimmed.startsWith("## ")) {
        headings.push({ level: 2, text: trimmed.slice(3).trim() });
      } else if (trimmed.startsWith("# ")) {
        headings.push({ level: 1, text: trimmed.slice(2).trim() });
      }
    }
    return headings;
  }, [notes]);

  if (!isOpen || !item) return null;

  // Save handler
  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const trimmedNotes = notes.trim();
      const updatedSubs = [...subSections];
      if (updatedSubs.length > 0) {
        updatedSubs[0].notes = trimmedNotes;
      } else {
        updatedSubs.push({
          id: `sub-${Date.now()}`,
          title: item.topic,
          notes: trimmedNotes,
          codeSnippet: "",
          codeLanguage: "java",
          resources: [],
          isCompleted: status === "completed",
        });
      }

      const { notes: synthesizedNotes, resources: packedResources } =
        packTopicSubSections(updatedSubs, item.category);

      await onSave(item.id, {
        topic: item.topic,
        category: item.category,
        status,
        notes: synthesizedNotes || trimmedNotes,
        resources: packedResources,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("[FullPageNoteModal] Failed to save notes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Copy Markdown
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // 1-Click Download .md File
  const handleDownload = () => {
    const slug = (item.topic || "study-notes")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const headerMeta = `# ${item.topic}\n> Track: ${trackTitle} | Category: ${item.category || "Core"}\n\n`;
    const fullDoc = headerMeta + notes;
    const blob = new Blob([fullDoc], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Toolbar Insert Helpers
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = notes.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const nextNotes = notes.substring(0, start) + replacement + notes.substring(end);
    setNotes(nextNotes);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 0);
  };

  const insertTemplate = (template: string) => {
    const existing = notes.trim();
    const updated = existing ? `${existing}\n\n${template}` : template;
    setNotes(updated);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        {/* Full-Page Document Shell */}
        <div className="w-full h-full sm:m-2.5 sm:w-[calc(100vw-20px)] sm:h-[calc(100vh-20px)] rounded-none sm:rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl flex flex-col overflow-hidden transition-all">
          
          {/* Top Document Studio Navigation Bar */}
          <header className="h-14 sm:h-16 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur flex items-center justify-between gap-3 shrink-0">
            {/* Left: Back Arrow, Breadcrumbs, Category & Status */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors shrink-0"
                title="Back to Learning Hub (Esc)"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] truncate">
                    <span>Learning Hub</span>
                    <span>/</span>
                    <span>{trackTitle}</span>
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                    {item.topic}
                  </h2>
                </div>
              </div>

              {/* Status Badge */}
              <button
                type="button"
                onClick={() => {
                  const nextStatus =
                    status === "planned"
                      ? "in_progress"
                      : status === "in_progress"
                        ? "completed"
                        : "planned";
                  setStatus(nextStatus);
                }}
                className={`hidden md:flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
                  status === "completed"
                    ? "bg-[var(--success)]/15 text-[var(--success)]"
                    : status === "in_progress"
                      ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                      : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                }`}
                title="Click to cycle status"
              >
                {status === "completed" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : status === "in_progress" ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                <span>{status.replace("_", " ")}</span>
              </button>
            </div>

            {/* Center: Reading Stats & Save Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--text-muted)] shrink-0">
              <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 font-mono text-[11px]">
                {readTimeMinutes} min read • {wordCount} words
              </span>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--success)] animate-in fade-in">
                  <Check className="h-3 w-3" />
                  <span>Saved</span>
                </span>
              )}
            </div>

            {/* Right: Mode Switcher & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Segmented Mode Selector: Read | Split | Edit */}
              <div className="flex items-center gap-1 rounded-xl bg-[var(--surface-muted)]/60 p-0.5 border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setMode("read")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "read"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Reading Document View"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Read</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("split")}
                  className={`hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "split"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Side-by-side Editor & Live Markdown Preview"
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "edit"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Markdown Editor"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>

              {/* Document Actions Menu */}
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                title="Copy Markdown to Clipboard"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                )}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                title="Download this note as a .md file"
              >
                <Download className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className="hidden md:inline">.md</span>
              </button>

              {onOpenStudyWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStudyWorkspace(item);
                  }}
                  className="hidden sm:flex items-center gap-1 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
                  title="Open hands-on Code Implementation & Resources"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Code Studio</span>
                </button>
              )}

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                title="Save Document (Cmd+S)"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Document Content Canvas */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* 1. READ DOCUMENT MODE */}
            {mode === "read" && (
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-12 py-8 bg-[var(--background)]">
                <article className="max-w-4xl mx-auto space-y-6">
                  {/* Article Title & Metadata Banner */}
                  <div className="border-b border-[var(--border)] pb-6 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-md bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--primary)] border border-[var(--primary)]/20">
                        {item.category || "Core"}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {trackTitle} • Chapter Architecture Notes
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
                      {item.topic}
                    </h1>

                    {/* Table of Contents Pill Outline */}
                    {outlineHeadings.length > 0 && (
                      <div className="pt-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                          Document Outline:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {outlineHeadings.map((h, hIdx) => (
                            <span
                              key={hIdx}
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-medium border ${
                                h.level === 1
                                  ? "bg-[var(--surface-muted)] text-[var(--text)] border-[var(--border)] font-semibold"
                                  : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]/60"
                              }`}
                            >
                              {h.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rendered Markdown Body */}
                  {notes.trim() ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xs">
                      <MarkdownView content={notes} />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center bg-[var(--surface)]">
                      <FileText className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                      <h3 className="text-sm font-semibold text-[var(--text)]">
                        No study notes written yet for &ldquo;{item.topic}&rdquo;
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                        Capture core architecture patterns, JVM internals, and interview trade-offs.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMode("edit")}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Write Study Notes</span>
                      </button>
                    </div>
                  )}

                  {/* Document Footer Bar */}
                  <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("edit")}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit this Document</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {onOpenStudyWorkspace && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenStudyWorkspace(item);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          <span>Open Code Studio</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            )}

            {/* 2. SPLIT STUDIO MODE */}
            {mode === "split" && (
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)] bg-[var(--background)]">
                {/* Left Column: Markdown Editor */}
                <div className="flex flex-col h-full overflow-hidden bg-[var(--surface)]">
                  {/* Markdown Helper Toolbar */}
                  <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-muted)]/30 flex items-center justify-between gap-1 overflow-x-auto scrollbar-thin shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertFormatting("### ", "")}
                        className="rounded px-2 py-0.5 text-xs font-mono font-bold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("**", "**")}
                        className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        title="Bold"
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("*", "*")}
                        className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        title="Italic"
                      >
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("`", "`")}
                        className="rounded px-1.5 py-0.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        title="Inline Code"
                      >
                        {"`code`"}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("```java\n", "\n```")}
                        className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        title="Code Block"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("> ")}
                        className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        title="Quote / Callout"
                      >
                        <Quote className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("- [ ] ")}
                        className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                        title="Task Item"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Quick Template Chips */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          insertTemplate(
                            "### Core Architecture & Invariant\n- Principle: \n- Why this design is chosen: \n- Trade-offs considered: "
                          )
                        }
                        className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                      >
                        + Architecture
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertTemplate(
                            "### Concurrency & Performance Gotchas\n- Race conditions hazards:\n- Memory leak / connection hazards:\n- Cache stampede mitigation:"
                          )
                        }
                        className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                      >
                        + Gotchas
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write detailed architecture notes, trade-offs, and design patterns in Markdown..."
                    className="flex-1 w-full p-4 sm:p-6 text-xs text-[var(--text)] font-mono leading-relaxed placeholder-[var(--text-muted)] bg-transparent resize-none focus:outline-none overflow-y-auto scrollbar-thin"
                  />
                </div>

                {/* Right Column: Live Markdown Preview */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--background)] scrollbar-thin">
                  <div className="mb-3 pb-2 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span>Live Formatted Preview</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Instant update
                    </span>
                  </div>
                  <MarkdownView content={notes} />
                </div>
              </div>
            )}

            {/* 3. FULL WRITE MARKDOWN MODE */}
            {mode === "edit" && (
              <div className="flex-1 overflow-hidden flex flex-col bg-[var(--surface)]">
                {/* Full Formatting Toolbar */}
                <div className="px-4 sm:px-8 py-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]/30 flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertFormatting("# ", "")}
                      className="rounded px-2 py-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Heading 1"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("## ", "")}
                      className="rounded px-2 py-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Heading 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("### ", "")}
                      className="rounded px-2 py-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Heading 3"
                    >
                      H3
                    </button>
                    <span className="h-4 w-px bg-[var(--border)] mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting("**", "**")}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Bold (**text**)"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("*", "*")}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Italic (*text*)"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("`", "`")}
                      className="rounded px-1.5 py-0.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Inline Code (`code`)"
                    >
                      {"`code`"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("```java\n", "\n```")}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Fenced Code Block"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("> ")}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Callout Quote (> quote)"
                    >
                      <Quote className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("- [ ] ")}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Task List Item (- [ ])"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("- ")}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      title="Bullet List Item (- item)"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Architecture Engineering Templates */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        insertTemplate(
                          "### Core Architecture & Invariant\n- Principle: \n- Why this design is chosen: \n- Trade-offs considered: "
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    >
                      + Architecture
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertTemplate(
                          "### Concurrency & Performance Gotchas\n- Deadlocks / Race conditions:\n- Memory leak / connection leak hazards:\n- Caching invalidation subtleties:"
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    >
                      + Gotchas
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertTemplate(
                          "### Staff Engineer Interview Summary\n- 2-Sentence Pitch:\n- Failure Modes to Discuss:\n- Production Monitoring Metrics (RED/USE):"
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    >
                      + Interview Pitch
                    </button>
                  </div>
                </div>

                {/* Full-width Markdown Writing Canvas */}
                <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col">
                  <textarea
                    ref={textareaRef}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write detailed architecture notes, trade-offs, and mental models for this chapter in Markdown..."
                    className="flex-1 w-full text-xs sm:text-sm text-[var(--text)] font-sans leading-relaxed placeholder-[var(--text-muted)] bg-transparent resize-none focus:outline-none overflow-y-auto scrollbar-thin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
