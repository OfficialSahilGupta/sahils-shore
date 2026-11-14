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
  Image as ImageIcon,
  ImagePlus,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import type { LearningItem, Json } from "@/types";
import { ModalPortal } from "@/components/ui/modal-portal";
import { MarkdownView } from "@/components/common/MarkdownView";
import {
  parseTopicSubSections,
  packTopicSubSections,
  getTopicChapterNotes,
  parseTopicConceptMaps,
  sanitizeNotesExtractingImages,
  type TopicSubSection,
  type ChapterConceptMap,
} from "@/lib/learning";
import {
  prepareConceptMapImage,
  type ConceptMapImage,
} from "@/lib/learning/concept-map";
import { uploadConceptMapImage } from "@/lib/drive/concept-map-uploader";
import { AttachConceptMapModal } from "./AttachConceptMapModal";

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
  const [mode, setMode] = useState<"read" | "split" | "edit" | "visuals">("read");
  const [notes, setNotes] = useState("");
  const [conceptMaps, setConceptMaps] = useState<ChapterConceptMap[]>([]);
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed">("planned");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [subSections, setSubSections] = useState<TopicSubSection[]>([]);
  const [isAttachMapOpen, setIsAttachMapOpen] = useState(false);
  const [lightboxConceptMap, setLightboxConceptMap] = useState<ConceptMapImage | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);

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
      const rawEffectiveNotes = getTopicChapterNotes(item);
      const { cleanNotes, extractedMaps } = sanitizeNotesExtractingImages(rawEffectiveNotes);
      setNotes(cleanNotes);

      const loadedMaps = parseTopicConceptMaps(item);
      const seen = new Set<string>();
      const deduplicated: ChapterConceptMap[] = [];
      for (const m of [...loadedMaps, ...extractedMaps]) {
        if (m && m.url && !seen.has(m.url)) {
          seen.add(m.url);
          deduplicated.push(m);
        }
      }
      setConceptMaps(deduplicated);

      setStatus(item.status || "planned");
      // Default to read mode if notes exist, otherwise open edit mode
      setMode(cleanNotes.trim().length > 0 ? "read" : "edit");
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

  // Smooth scroll to heading in document body
  const handleScrollToHeading = (headingText: string) => {
    if (typeof document === "undefined") return;
    const clean = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4"));
    for (const h of headings) {
      const hClean = (h.textContent || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (hClean.includes(clean) || clean.includes(hClean)) {
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  };

  const handleAttachConceptMap = (newMap: ChapterConceptMap) => {
    setConceptMaps((prev) => {
      if (prev.some((m) => m.url === newMap.url)) return prev;
      return [...prev, newMap];
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAttachMultipleConceptMaps = (newMaps: ChapterConceptMap[]) => {
    setConceptMaps((prev) => {
      const existingUrls = new Set(prev.map((m) => m.url));
      const additions = newMaps.filter((m) => !existingUrls.has(m.url));
      return [...prev, ...additions];
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteConceptMap = (mapId: string) => {
    setConceptMaps((prev) => prev.filter((m) => m.id !== mapId));
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const itemFile = items[i];
      if (itemFile.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = itemFile.getAsFile();
        if (!file) continue;

        try {
          const prepared = await prepareConceptMapImage(file);
          const caption = prepared.caption || `Concept Map: ${item?.topic || "Architecture"}`;
          const uploadRes = await uploadConceptMapImage(prepared.dataUrl, {
            module: "learning",
            folderName: trackTitle || "Learning",
            caption,
            fileName: file.name,
          });
          handleAttachConceptMap(uploadRes.map);
        } catch (err) {
          console.error("Failed to paste image into study notes:", err);
        }
        return;
      }
    }
  };

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
          conceptMaps,
          isCompleted: status === "completed",
        });
      }

      const { notes: synthesizedNotes, resources: packedResources } =
        packTopicSubSections(updatedSubs, item.category, conceptMaps);

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
          <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur flex items-center justify-between gap-2 sm:gap-3 shrink-0 overflow-x-auto scrollbar-none">
            {/* Left: Back Arrow, Breadcrumbs, Category & Status */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[48%] lg:max-w-[40%]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 sm:p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors shrink-0"
                title="Back to Learning Hub (Esc)"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex items-center gap-2">
                <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[var(--text-muted)] truncate">
                    <span>Learning</span>
                    <span>/</span>
                    <span className="truncate">{trackTitle}</span>
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
            <div className="hidden xl:flex items-center gap-2 text-xs text-[var(--text-muted)] shrink-0">
              <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 font-mono text-[11px]">
                {readTimeMinutes} min read • {wordCount} words
                {conceptMaps.length > 0 && ` • ${conceptMaps.length} visual maps`}
              </span>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--success)] animate-in fade-in">
                  <Check className="h-3 w-3" />
                  <span>Saved</span>
                </span>
              )}
            </div>

            {/* Right: Mode Switcher & Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAttachMapOpen(true)}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all shrink-0"
                title="Attach Concept Map or Architecture Diagram (Upload / URL / Presets)"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Add Map</span>
              </button>

              {/* Segmented Mode Selector: Read | Split | Edit | Visuals */}
              <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl bg-[var(--surface-muted)]/60 p-0.5 border border-[var(--border)] shrink-0">
                <button
                  type="button"
                  onClick={() => setMode("read")}
                  className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "read"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Reading Document View"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Read</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("split")}
                  className={`hidden md:flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "split"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Side-by-side Editor & Live Markdown Preview"
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "edit"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Markdown Editor"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("visuals")}
                  className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "visuals"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Dedicated Chapter Visual Concept Maps & Flowcharts"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Visuals</span>
                  {conceptMaps.length > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-[var(--primary)] text-white rounded-full px-1">
                      {conceptMaps.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Document Actions Menu */}
              <button
                type="button"
                onClick={handleCopy}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors shrink-0"
                title="Copy Markdown to Clipboard"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                )}
                <span className="hidden lg:inline">{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="hidden md:flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors shrink-0"
                title="Download this note as a .md file"
              >
                <Download className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className="hidden lg:inline">.md</span>
              </button>

              {onOpenStudyWorkspace && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStudyWorkspace(item);
                  }}
                  className="hidden lg:flex items-center gap-1 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors shrink-0"
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
                className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                title="Save Document (Cmd+S)"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 sm:p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors shrink-0"
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
              <div className="flex-1 flex overflow-hidden">
                {/* Dedicated Document Outline Sidebar */}
                {outlineHeadings.length > 0 && (
                  <aside className="hidden xl:block w-64 border-r border-[var(--border)] bg-[var(--surface-muted)]/20 p-4 overflow-y-auto shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)] mb-3">
                      <List className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span>Document Outline</span>
                    </div>
                    <nav className="space-y-1">
                      {outlineHeadings.map((h, i) => (
                        <div
                          key={i}
                          onClick={() => handleScrollToHeading(h.text)}
                          className={`text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors truncate cursor-pointer py-1 ${
                            h.level === 1
                              ? "font-bold text-[var(--text)]"
                              : h.level === 2
                                ? "pl-2.5 font-medium"
                                : "pl-5 text-[11px]"
                          }`}
                          title={`Jump to: ${h.text}`}
                        >
                          {h.text}
                        </div>
                      ))}
                    </nav>

                    {/* Chapter Metadata Card */}
                    <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2 text-xs">
                      <div className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                        <FolderTree className="h-3.5 w-3.5 text-[var(--primary)]" />
                        <span>Chapter Specs</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] space-y-1 font-mono">
                        <div>Track: {trackTitle}</div>
                        <div>Category: {item.category || "Core"}</div>
                        <div>Sub-Sections: {subSections.length}</div>
                        <div>Diagrams: {conceptMaps.length}</div>
                        <div>Length: {wordCount} words ({readTimeMinutes}m)</div>
                      </div>
                    </div>
                  </aside>
                )}

                {/* Centered Document Body */}
                <main className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-12 py-8 bg-[var(--background)]">
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
                              <button
                                key={hIdx}
                                type="button"
                                onClick={() => handleScrollToHeading(h.text)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer hover:border-[var(--primary)] ${
                                  h.level === 1
                                    ? "bg-[var(--surface-muted)] text-[var(--text)] border-[var(--border)] font-semibold"
                                    : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]/60"
                                }`}
                              >
                                {h.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Concept Maps & Architecture Blueprints Gallery (if any) */}
                  {conceptMaps.length > 0 && (
                    <div className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4 sm:p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                              Visual Concept Maps & Diagrams ({conceptMaps.length})
                            </h4>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              Click any diagram to inspect in full-screen zoomable lightbox
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAttachMapOpen(true)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                        >
                          <ImagePlus className="h-3 w-3" />
                          <span>Attach Map</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {conceptMaps.map((cm, idx) => (
                          <div
                            key={cm.id || idx}
                            onClick={() => {
                              setLightboxConceptMap(cm);
                              setLightboxZoom(1);
                            }}
                            className="group/card rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 hover:border-[var(--primary)]/60 transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                          >
                            <div className="relative h-28 w-full overflow-hidden rounded-lg bg-[var(--background)] flex items-center justify-center p-1.5 border border-[var(--border)]/60">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cm.url}
                                alt={cm.title || cm.caption || "Concept Map"}
                                className="max-h-full max-w-full object-contain group-hover/card:scale-105 transition-transform duration-200"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/card:opacity-100">
                                <span className="rounded-lg bg-[var(--surface)]/90 backdrop-blur px-2 py-1 text-[10px] font-bold text-[var(--primary)] flex items-center gap-1 shadow-xs">
                                  <Maximize2 className="h-3 w-3" />
                                  <span>Zoom</span>
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className="font-semibold text-[var(--text)] truncate text-[11px]">
                                {(cm.title || cm.caption || "Concept Map").replace(/^Concept Map:\s*/i, "")}
                              </span>
                              <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 ml-1.5">
                                #{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
              </main>
            </div>
          )}

          {/* 2. SPLIT STUDIO MODE */}
            {mode === "split" && (
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)] bg-[var(--background)] min-w-0">
                {/* Left Column: Markdown Editor */}
                <div className="flex flex-col h-full overflow-hidden bg-[var(--surface)] min-w-0">
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
                        onClick={() => setIsAttachMapOpen(true)}
                        className="rounded border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors flex items-center gap-1"
                        title="Attach Concept Map or Architecture Diagram (Upload / URL / Presets)"
                      >
                        <ImagePlus className="h-3 w-3" />
                        <span>+ Map</span>
                      </button>
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
                    onPaste={handlePaste}
                    placeholder="Write detailed architecture notes, trade-offs, and design patterns in Markdown (Paste screenshots directly with Cmd+V)..."
                    className="flex-1 w-full p-4 sm:p-6 text-xs text-[var(--text)] font-mono leading-relaxed placeholder-[var(--text-muted)] bg-transparent resize-none focus:outline-none overflow-y-auto scrollbar-thin"
                  />
                </div>

                {/* Right Column: Live Markdown Preview */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--background)] scrollbar-thin min-w-0">
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

                    <span className="h-4 w-px bg-[var(--border)] mx-1" />

                    <button
                      type="button"
                      onClick={() => setIsAttachMapOpen(true)}
                      className="rounded-lg border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors flex items-center gap-1.5 shrink-0"
                      title="Attach Concept Map or Architecture Diagram"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>+ Concept Map / Diagram</span>
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
                    onPaste={handlePaste}
                    placeholder="Write detailed architecture notes, trade-offs, and mental models for this chapter in Markdown (Paste screenshots directly with Cmd+V)..."
                    className="flex-1 w-full text-xs sm:text-sm text-[var(--text)] font-sans leading-relaxed placeholder-[var(--text-muted)] bg-transparent resize-none focus:outline-none overflow-y-auto scrollbar-thin"
                  />
                </div>
              </div>
            )}

            {/* 4. DEDICATED VISUAL CONCEPT MAPS & BLUEPRINTS STUDIO */}
            {mode === "visuals" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[var(--background)]">
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Studio Header Card */}
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--text)]">
                          Visual Concept Maps & Chapter Diagrams
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Dedicated visual studio for &ldquo;{item.topic}&rdquo;. Store flowcharts, whiteboards, and infographics without cluttering your Markdown notes.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsAttachMapOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                      >
                        <ImagePlus className="h-4 w-4" />
                        <span>Upload Diagram</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Diagrams Grid */}
                  {conceptMaps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {conceptMaps.map((cm, idx) => (
                        <div
                          key={cm.id || idx}
                          className="group/card rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-2xs hover:border-[var(--primary)]/60 transition-all flex flex-col"
                        >
                          {/* Image Thumbnail Frame */}
                          <div
                            onClick={() => {
                              setLightboxConceptMap(cm);
                              setLightboxZoom(1);
                            }}
                            className="relative h-48 w-full overflow-hidden bg-[var(--background)] flex items-center justify-center p-2 cursor-pointer border-b border-[var(--border)]/70"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cm.url}
                              alt={cm.title || cm.caption || "Concept Map"}
                              className="max-h-full max-w-full object-contain group-hover/card:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/card:opacity-100">
                              <span className="rounded-xl bg-[var(--surface)]/95 backdrop-blur px-3 py-1.5 text-xs font-bold text-[var(--primary)] flex items-center gap-1.5 shadow-md">
                                <Maximize2 className="h-3.5 w-3.5" />
                                <span>Zoom Fullscreen</span>
                              </span>
                            </div>
                          </div>

                          {/* Card Meta & Actions */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <h4 className="text-xs font-bold text-[var(--text)] line-clamp-2">
                                {(cm.title || cm.caption || "Concept Map Diagram").replace(/^Concept Map:\s*/i, "")}
                              </h4>
                              {cm.createdAt && (
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                                  Attached {new Date(cm.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = cm.url;
                                    link.download = `${(cm.title || "concept-map").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                                  title="Download image file"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(cm.url);
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    } catch {}
                                  }}
                                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                                  title="Copy URL"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteConceptMap(cm.id)}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                                title="Remove from chapter visuals"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty State */
                    <div
                      onClick={() => setIsAttachMapOpen(true)}
                      className="rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/60 bg-[var(--surface)] p-12 text-center cursor-pointer transition-all space-y-3"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] mx-auto">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text)]">
                          No Visual Diagrams Attached Yet
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                          Upload architecture flowcharts, JVM execution diagrams, or system blueprints to master &ldquo;{item.topic}&rdquo; visually.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload or Pick Blueprint</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for Gallery clicked Concept Map */}
      {lightboxConceptMap && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => {
              setLightboxConceptMap(null);
              setLightboxZoom(1);
            }}
          >
            <header
              className="h-14 px-4 sm:px-6 border-b border-white/10 bg-black/40 backdrop-blur flex items-center justify-between gap-3 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="h-4 w-4 text-[var(--primary)] shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  {lightboxConceptMap.caption}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1 rounded-xl bg-white/10 p-0.5 border border-white/10 text-white">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))
                    }
                    className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1.5 min-w-[48px] text-center">
                    {Math.round(lightboxZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxZoom((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))
                    }
                    className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom(1)}
                    className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = lightboxConceptMap.url;
                    link.download = "concept-map.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="rounded-xl p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="Download Diagram"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLightboxConceptMap(null);
                    setLightboxZoom(1);
                  }}
                  className="rounded-xl p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div
              className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 select-none"
              onClick={() => {
                setLightboxConceptMap(null);
                setLightboxZoom(1);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxConceptMap.url}
                alt={lightboxConceptMap.caption || lightboxConceptMap.title || "Concept Map"}
                style={{ transform: `scale(${lightboxZoom})` }}
                className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-150 origin-center drop-shadow-2xl rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Attach Concept Map / Diagram Modal */}
      <AttachConceptMapModal
        isOpen={isAttachMapOpen}
        onClose={() => setIsAttachMapOpen(false)}
        topicTitle={item.topic}
        module="learning"
        folderName={trackTitle || "Learning"}
        onAttachConceptMap={handleAttachConceptMap}
        onAttachConceptMaps={handleAttachMultipleConceptMaps}
      />
    </ModalPortal>
  );
}
