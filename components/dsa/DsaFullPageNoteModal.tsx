"use client";

// ============================================================================
// Sahil's Shore: DsaFullPageNoteModal Component
// Full-page, distraction-free Markdown Document Studio for DSA Problems.
// Features:
// - Read Document View (Notion/Obsidian style centered luxury typography)
// - Split Studio View (Editor on left, live Markdown preview on right)
// - Write Markdown View with formatting toolbar & DSA engineering templates
// - Visuals (Diagrams, Recursion Trees & Concept Maps gallery with Lightbox Zoom)
// - Solution Code Studio with CodeMirror & Language selector
// - Dynamic Table of Contents outline quick-jumps
// - Word count & read time estimations
// - 1-click Download .md & Copy Markdown
// - Spaced repetition quick review rating
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
  Star,
  ExternalLink,
  Image as ImageIcon,
  ImagePlus,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  FolderTree,
  Calendar,
} from "lucide-react";
import type { DsaProblem, Json } from "@/types";
import { ModalPortal } from "@/components/ui/modal-portal";
import { MarkdownView } from "@/components/common/MarkdownView";
import { Select } from "@/components/ui/select";
import { CodeEditor } from "./CodeEditor";
import {
  DSA_TOPICS,
  DSA_DIFFICULTIES,
  DSA_PLATFORMS,
  DSA_STATUSES,
  SUPPORTED_LANGUAGES,
  canonicalDsaTopic,
  type DsaDifficulty,
  type DsaStatus,
  type SupportedLanguage,
} from "@/lib/dsa/constants";
import {
  parseDsaConceptMaps,
  packDsaNotesAndMaps,
  generateDsaMarkdownDocument,
  CURATED_DSA_PRESETS,
  type DsaConceptMap,
} from "@/lib/dsa/concept-map";
import {
  prepareConceptMapImage,
  sanitizeNotesExtractingImages,
  formatImageFileSize,
  type ChapterConceptMap,
  type ConceptMapImage,
} from "@/lib/learning/concept-map";
import { uploadConceptMapImage } from "@/lib/drive/concept-map-uploader";
import { AttachConceptMapModal } from "@/components/learning/AttachConceptMapModal";
import { formatFriendlyISTDate } from "@/lib/date-utils";

interface DsaFullPageNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: DsaProblem | null;
  onSave: (
    problemId: string,
    updates: Partial<DsaProblem>
  ) => Promise<void>;
  onRate?: (problem: DsaProblem, rating: "Easy" | "Hard") => Promise<void>;
  onToggleFavorite?: (problemId: string) => Promise<void>;
}

export function DsaFullPageNoteModal({
  isOpen,
  onClose,
  problem,
  onSave,
  onRate,
  onToggleFavorite,
}: DsaFullPageNoteModalProps) {
  const [mode, setMode] = useState<"read" | "split" | "edit" | "visuals" | "code">("read");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState<DsaDifficulty>("Medium");
  const [status, setStatus] = useState<DsaStatus>("Solved");
  const [platform, setPlatform] = useState("LeetCode");
  const [link, setLink] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("O(N)");
  const [spaceComplexity, setSpaceComplexity] = useState("O(1)");
  const [notes, setNotes] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("java");
  const [conceptMaps, setConceptMaps] = useState<ChapterConceptMap[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Studio UI states
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAttachMapOpen, setIsAttachMapOpen] = useState(false);
  const [lightboxConceptMap, setLightboxConceptMap] = useState<ConceptMapImage | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

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

  // Hydrate state from problem
  useEffect(() => {
    if (problem && isOpen) {
      setTitle(problem.title || "");
      setTopic(canonicalDsaTopic(problem.topic || "Arrays"));
      setDifficulty((problem.difficulty as DsaDifficulty) || "Medium");
      setStatus(
        (problem.status as DsaStatus) ||
          (problem.status === "solved" ? "Solved" : "Needs revision")
      );
      setPlatform(problem.platform || "LeetCode");
      setLink(problem.link || "");
      setTimeComplexity(problem.time_complexity || "");
      setSpaceComplexity(problem.space_complexity || "");
      setCodeSnippet(problem.code_snippet || "");
      setLanguage((problem.language as SupportedLanguage) || "java");
      setIsFavorite(Boolean(problem.is_favorite));

      // Extract notes and embedded image diagrams
      const rawNotes = problem.approach_notes || "";
      const { cleanNotes, extractedMaps } = sanitizeNotesExtractingImages(rawNotes);
      setNotes(cleanNotes);

      const parsedMaps = parseDsaConceptMaps(problem);
      const seen = new Set<string>();
      const deduplicated: ChapterConceptMap[] = [];
      for (const m of [...parsedMaps, ...extractedMaps]) {
        if (m && m.url && !seen.has(m.url)) {
          seen.add(m.url);
          deduplicated.push(m);
        }
      }
      setConceptMaps(deduplicated);

      // Default view mode: read if notes exist, otherwise edit
      setMode(cleanNotes.trim().length > 0 ? "read" : "edit");
      setSaveSuccess(false);
      setIsEditingTitle(false);
    }
  }, [problem, isOpen]);

  // Keyboard shortcut: Cmd/Ctrl + S to save, Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape" && !isSaving && !lightboxConceptMap && !isAttachMapOpen) {
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

  // Clipboard paste image directly into notes
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
          const caption = prepared.caption || `Diagram: ${title || "Algorithm Blueprint"}`;
          const uploadRes = await uploadConceptMapImage(prepared.dataUrl, {
            module: "dsa",
            folderName: title || "DSA",
            caption,
            fileName: file.name,
          });
          handleAttachConceptMap(uploadRes.map);
        } catch (err) {
          console.error("Failed to paste image into DSA notes:", err);
        }
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

  // Embed image markdown tag at cursor position
  const handleEmbedMapInNotes = (map: ChapterConceptMap) => {
    const embedTag = `\n\n![${map.caption || map.title}](${map.url})\n\n`;
    setNotes((prev) => prev.trim() + embedTag);
    setMode("split");
  };

  if (!isOpen || !problem) return null;

  // Save handler
  const handleSave = async () => {
    if (!problem) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const cleanNotes = notes.trim();
      const { approach_notes, revision_history } = packDsaNotesAndMaps(
        cleanNotes,
        conceptMaps,
        problem.revision_history
      );

      await onSave(problem.id, {
        title: title.trim() || problem.title,
        topic: canonicalDsaTopic(topic),
        difficulty,
        status,
        platform,
        link: link.trim() || null,
        time_complexity: timeComplexity.trim() || null,
        space_complexity: spaceComplexity.trim() || null,
        code_snippet: codeSnippet || null,
        language,
        is_favorite: isFavorite,
        approach_notes,
        revision_history,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("[DsaFullPageNoteModal] Failed to save problem:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Copy Markdown Document
  const handleCopyMarkdown = async () => {
    const fullDoc = generateDsaMarkdownDocument(
      {
        ...problem,
        title,
        platform,
        topic,
        difficulty,
        time_complexity: timeComplexity,
        space_complexity: spaceComplexity,
        language,
      },
      notes,
      conceptMaps
    );

    try {
      await navigator.clipboard.writeText(fullDoc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // 1-Click Copy Code
  const handleCopyCode = async () => {
    if (!codeSnippet) return;
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  // 1-Click Download .md File
  const handleDownload = () => {
    const slug = (title || "dsa-problem")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const fullDoc = generateDsaMarkdownDocument(
      {
        ...problem,
        title,
        platform,
        topic,
        difficulty,
        time_complexity: timeComplexity,
        space_complexity: spaceComplexity,
        language,
      },
      notes,
      conceptMaps
    );

    const blob = new Blob([fullDoc], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${slug}.md`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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

  // Difficulty styling
  const diffClass =
    difficulty === "Easy"
      ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
      : difficulty === "Medium"
        ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30"
        : "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        {/* Full-Page Document Shell */}
        <div className="w-full h-full sm:m-2.5 sm:w-[calc(100vw-20px)] sm:h-[calc(100vh-20px)] rounded-none sm:rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl flex flex-col overflow-hidden transition-all">
          
          {/* Top Document Studio Navigation Bar */}
          <header className="h-14 sm:h-16 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur flex items-center justify-between gap-3 shrink-0">
            {/* Left: Back Arrow, Title, Difficulty & Status */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[50%] lg:max-w-[45%]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 sm:p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors shrink-0"
                title="Back to DSA Problem List (Esc)"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex items-center gap-2">
                <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                  <Code2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[var(--text-muted)] truncate">
                    <span className="font-semibold text-[var(--primary)]">{topic}</span>
                    <span>•</span>
                    <span>{platform}</span>
                  </div>

                  {isEditingTitle ? (
                    <input
                      type="text"
                      autoFocus
                      value={title}
                      onBlur={() => setIsEditingTitle(false)}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setIsEditingTitle(false);
                      }}
                      className="text-xs sm:text-sm font-bold text-[var(--text)] bg-transparent border-b border-[var(--primary)] focus:outline-none w-full"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 group/title min-w-0">
                      <h2
                        onClick={() => setIsEditingTitle(true)}
                        className="text-xs sm:text-sm font-bold text-[var(--text)] truncate cursor-pointer hover:text-[var(--primary)] transition-colors"
                        title="Click to edit title"
                      >
                        {title}
                      </h2>
                      <Edit3
                        onClick={() => setIsEditingTitle(true)}
                        className="h-3 w-3 text-[var(--text-muted)] opacity-0 group-hover/title:opacity-100 transition-opacity cursor-pointer shrink-0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Difficulty Badge */}
              <span className={`hidden md:inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold shrink-0 ${diffClass}`}>
                {difficulty}
              </span>

              {/* Status Cycle Button */}
              <button
                type="button"
                onClick={() => {
                  const statuses: DsaStatus[] = ["Solved", "Needs revision", "Stuck", "Revisit", "Todo"];
                  const currIdx = statuses.indexOf(status);
                  const nextStatus = statuses[(currIdx + 1) % statuses.length];
                  setStatus(nextStatus);
                }}
                className={`hidden lg:flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
                  status === "Solved"
                    ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                    : status === "Needs revision"
                      ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30"
                      : status === "Stuck"
                        ? "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30"
                        : "bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)]"
                }`}
                title="Click to cycle status"
              >
                {status === "Solved" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : status === "Needs revision" ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                <span>{status}</span>
              </button>
            </div>

            {/* Right: Diagram Button, Mode Switcher, Save & Close */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Star Favorite Button */}
              <button
                type="button"
                onClick={() => {
                  setIsFavorite(!isFavorite);
                  if (onToggleFavorite && problem) {
                    onToggleFavorite(problem.id);
                  }
                }}
                className={`p-1.5 rounded-xl border transition-colors shrink-0 ${
                  isFavorite
                    ? "border-[var(--accent-warm)] bg-[var(--accent-warm)]/15 text-[var(--accent-warm)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                }`}
                title={isFavorite ? "Favorited" : "Mark as Favorite"}
              >
                <Star
                  className={`h-4 w-4 ${
                    isFavorite ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]" : ""
                  }`}
                />
              </button>

              {/* Add Diagram Button */}
              <button
                type="button"
                onClick={() => setIsAttachMapOpen(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all shrink-0"
                title="Attach Diagram or Concept Map"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span>+ Diagram</span>
              </button>

              {/* Segmented Mode Selector: Notes | Split | Write | Visuals | Code */}
              <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl bg-[var(--surface-muted)]/60 p-0.5 border border-[var(--border)] shrink-0">
                <button
                  type="button"
                  onClick={() => setMode("read")}
                  className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "read"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Read Document View"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("split")}
                  className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "split"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Side-by-Side Split Studio"
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "edit"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Full Markdown Editor"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("visuals")}
                  className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all relative ${
                    mode === "visuals"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Visual Diagrams & Concept Maps Gallery"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Visuals</span>
                  {conceptMaps.length > 0 && (
                    <span className="h-4 w-4 rounded-full bg-[var(--primary)] text-white text-[9px] font-bold flex items-center justify-center">
                      {conceptMaps.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("code")}
                  className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === "code"
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Solution Code Studio"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Code</span>
                </button>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
                title="Save Notes & Code (Cmd/Ctrl + S)"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors shrink-0"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Sub-Header Metadata Ribbon: Complexities, Stats, Links & Fast Actions */}
          <div className="px-4 sm:px-6 py-2 border-b border-[var(--border)] bg-[var(--surface-muted)]/20 flex items-center justify-between gap-3 text-xs overflow-x-auto scrollbar-none shrink-0">
            {/* Left: Complexities & Metrics */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                {readTimeMinutes} min read • {wordCount} words
                {conceptMaps.length > 0 && ` • ${conceptMaps.length} diagrams`}
              </span>

              {timeComplexity && (
                <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--primary)]">
                  Time: {timeComplexity}
                </span>
              )}

              {spaceComplexity && (
                <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--primary)]">
                  Space: {spaceComplexity}
                </span>
              )}

              {saveSuccess && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--success)] animate-in fade-in">
                  <Check className="h-3 w-3" />
                  <span>Saved</span>
                </span>
              )}
            </div>

            {/* Right: Quick Ratings, External Link, Copy & Download */}
            <div className="flex items-center gap-2 shrink-0">
              {onRate && problem && (
                <div className="hidden sm:flex items-center gap-1.5 border-r border-[var(--border)] pr-2">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">Review:</span>
                  <button
                    type="button"
                    onClick={() => onRate(problem, "Hard")}
                    className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors"
                  >
                    Hard (1d)
                  </button>
                  <button
                    type="button"
                    onClick={() => onRate(problem, "Easy")}
                    className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors"
                  >
                    Easy (+3d)
                  </button>
                </div>
              )}

              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)] transition-colors"
                  title="Open Problem in LeetCode / External"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="hidden md:inline">Open Problem</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                title="Copy Full Problem Markdown"
              >
                {copied ? <Check className="h-3 w-3 text-[var(--success)]" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy MD"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                title="Download .md file"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">.md</span>
              </button>
            </div>
          </div>

          {/* Main Studio Viewport */}
          <div className="flex-1 flex overflow-hidden">
            {/* ---------------------------------------------------------------- */}
            {/* Pillar 1: Read Document View (Centered Obsidian / Notion Layout) */}
            {/* ---------------------------------------------------------------- */}
            {mode === "read" && (
              <div className="flex-1 flex overflow-hidden">
                {/* Collapsible Left Outline / Table of Contents */}
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
                          className={`text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors truncate cursor-pointer py-1 ${
                            h.level === 1
                              ? "font-bold text-[var(--text)]"
                              : h.level === 2
                                ? "pl-2.5 font-medium"
                                : "pl-5 text-[11px]"
                          }`}
                        >
                          {h.text}
                        </div>
                      ))}
                    </nav>

                    {/* Quick Spaced Repetition Card */}
                    {problem.next_revision_at && (
                      <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2 text-xs">
                        <div className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[var(--primary)]" />
                          <span>Spaced Revision</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] space-y-1 font-mono">
                          <div>Interval: {problem.revision_interval_days || 1} days</div>
                          <div>Revised: {problem.revision_count || 0} times</div>
                          <div>Next: {formatFriendlyISTDate(problem.next_revision_at)}</div>
                        </div>
                        {onRate && (
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onRate(problem, "Hard")}
                              className="flex-1 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 py-1 text-[10px] font-bold text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors"
                            >
                              Hard (1d)
                            </button>
                            <button
                              type="button"
                              onClick={() => onRate(problem, "Easy")}
                              className="flex-1 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 py-1 text-[10px] font-bold text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors"
                            >
                              Easy (+3d)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </aside>
                )}

                {/* Centered Document Body */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-16 py-8">
                  <div className="max-w-4xl mx-auto space-y-8">
                    {/* Document Header */}
                    <div className="border-b border-[var(--border)] pb-6 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${diffClass}`}>
                          {difficulty}
                        </span>
                        <span className="rounded-md bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--text)]">
                          {topic}
                        </span>
                        <span className="rounded-md bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                          {platform}
                        </span>
                        {timeComplexity && (
                          <span className="rounded-md bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-mono font-medium text-[var(--primary)]">
                            Time: {timeComplexity}
                          </span>
                        )}
                        {spaceComplexity && (
                          <span className="rounded-md bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-mono font-medium text-[var(--primary)]">
                            Space: {spaceComplexity}
                          </span>
                        )}
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                        {title}
                      </h1>

                      {link && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--primary)]">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline font-mono"
                          >
                            {link}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Markdown Content */}
                    {notes.trim().length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center space-y-3">
                        <BookOpen className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-50" />
                        <h3 className="text-base font-bold text-[var(--text)]">
                          No Engineering Notes Written Yet
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                          Capture your intuition, core invariants, edge cases, dry-run traces, and mathematical proofs for this algorithm.
                        </p>
                        <button
                          type="button"
                          onClick={() => setMode("edit")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Start Writing Notes</span>
                        </button>
                      </div>
                    ) : (
                      <div className="prose max-w-none text-[var(--text)]">
                        <MarkdownView content={notes} />
                      </div>
                    )}

                    {/* Attached Visual Diagrams Preview */}
                    {conceptMaps.length > 0 && (
                      <div className="border-t border-[var(--border)] pt-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-[var(--primary)]" />
                            <span>Visual Architecture & Algorithm Diagrams ({conceptMaps.length})</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => setMode("visuals")}
                            className="text-xs font-semibold text-[var(--primary)] hover:underline"
                          >
                            Manage Diagrams &rarr;
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {conceptMaps.map((map) => (
                            <div
                              key={map.id}
                              onClick={() => {
                                setLightboxConceptMap(map);
                                setLightboxZoom(1);
                              }}
                              className="group rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-2.5 hover:border-[var(--primary)]/50 transition-all cursor-zoom-in space-y-2"
                            >
                              <div className="aspect-video w-full overflow-hidden rounded-lg bg-[var(--surface)] flex items-center justify-center">
                                <img
                                  src={map.url}
                                  alt={map.caption || map.title}
                                  className="h-full w-full object-contain group-hover:scale-102 transition-transform"
                                />
                              </div>
                              <div className="text-xs font-medium text-[var(--text)] truncate">
                                {map.caption || map.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Solution Code Section Preview */}
                    {codeSnippet && (
                      <div className="border-t border-[var(--border)] pt-8 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-[var(--primary)]" />
                            <span>Solution Code ({language})</span>
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCopyCode}
                              className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                            >
                              {copiedCode ? <Check className="h-3 w-3 text-[var(--success)]" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMode("code")}
                              className="text-xs font-semibold text-[var(--primary)] hover:underline"
                            >
                              Edit in Code Studio &rarr;
                            </button>
                          </div>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                          <CodeEditor
                            value={codeSnippet}
                            readOnly={true}
                            language={language}
                            minHeight="220px"
                            maxHeight="420px"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </main>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Pillar 2 & 3: Split Studio & Full Write Editor */}
            {/* ---------------------------------------------------------------- */}
            {(mode === "split" || mode === "edit") && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Markdown Formatting Toolbar */}
                <div className="h-10 px-4 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertFormatting("# ")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Heading 1"
                    >
                      <Heading1 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("## ")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Heading 2"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("### ")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Heading 3"
                    >
                      <Heading3 className="h-3.5 w-3.5" />
                    </button>

                    <div className="h-4 w-px bg-[var(--border)] mx-1" />

                    <button
                      type="button"
                      onClick={() => insertFormatting("**", "**")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-bold"
                      title="Bold"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("*", "*")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors italic"
                      title="Italic"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("> ")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Blockquote"
                    >
                      <Quote className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("`", "`")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-mono"
                      title="Inline Code"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="h-4 w-px bg-[var(--border)] mx-1" />

                    <button
                      type="button"
                      onClick={() => insertFormatting("- ")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Bullet List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("- [ ] ")}
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Checklist"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertTemplate(
                          "| Step | State / Pointer | Decision | Invariant |\n|---|---|---|---|\n| 1 | i=0, j=n-1 | Check sum | sum < target |\n| 2 | i=1, j=n-1 | Move left | Maintain sorted window |"
                        )
                      }
                      className="p-1.5 rounded hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Insert Table"
                    >
                      <TableIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Quick DSA Architecture Templates */}
                  <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() =>
                        insertTemplate(
                          "### Key Intuition & Invariant\n- **Core Pattern:** \n- **Loop Invariant:** Maintain the invariant that...\n- **Why this works:** "
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors shrink-0"
                    >
                      + Invariant
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertTemplate(
                          "### Edge Cases Considered\n- Empty input or length < 2\n- Duplicate values & negative numbers\n- Extreme bounds & integer overflow\n- Cycle or disconnected components"
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors shrink-0"
                    >
                      + Edge Cases
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertTemplate(
                          "### Dry Run Testcase\n- **Input:** `nums = [2, 7, 11, 15], target = 9`\n- **Trace Table:**\n  | Iteration | Pointers | Condition | Action |\n  |---|---|---|---|\n  | 1 | L=0, R=3 | sum=17 > 9 | R-- |\n  | 2 | L=0, R=2 | sum=13 > 9 | R-- |\n  | 3 | L=0, R=1 | sum=9 == 9 | Return [0, 1] |"
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors shrink-0"
                    >
                      + Dry Run
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertTemplate(
                          "### Complexity Proof\n- **Time Complexity:** $O(N)$ because each element is pushed/popped at most once.\n- **Space Complexity:** $O(1)$ auxiliary space excluding the return buffer."
                        )
                      }
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors shrink-0"
                    >
                      + Complexity
                    </button>
                  </div>
                </div>

                {/* Editor & Preview Panes */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Left: Textarea Editor */}
                  <div className={`flex-1 flex flex-col p-4 sm:p-6 overflow-hidden ${mode === "split" ? "border-r border-[var(--border)]" : ""}`}>
                    <textarea
                      ref={textareaRef}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Write your mental model, core algorithm pattern, invariant rules, and dry-run steps here... (Markdown supported, paste screenshots directly)"
                      className="w-full flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs font-mono text-[var(--text)] leading-relaxed focus:border-[var(--primary)] focus:outline-none resize-none overflow-y-auto"
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Pro-tip: Paste screenshots (Cmd+V) or click &ldquo;Add Diagram&rdquo; to attach visual recursion trees.</span>
                      <span>{wordCount} words</span>
                    </div>
                  </div>

                  {/* Right: Real-time Markdown Preview (Split Mode only) */}
                  {mode === "split" && (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--surface-muted)]/15">
                      <div className="max-w-2xl mx-auto prose text-[var(--text)]">
                        <MarkdownView content={notes} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Pillar 4: Visual Diagrams & Concept Maps Gallery */}
            {/* ---------------------------------------------------------------- */}
            {mode === "visuals" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Visuals Banner & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-[var(--primary)]" />
                        <span>Visual Diagrams & Concept Maps ({conceptMaps.length})</span>
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Attach whiteboard drawings, recursion trees, pointer graphs, and memory state blueprints to this question.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAttachMapOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity shrink-0"
                    >
                      <ImagePlus className="h-4 w-4" />
                      <span>Upload / Attach Diagram</span>
                    </button>
                  </div>

                  {/* Curated DSA Algorithm Presets */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Curated Algorithm Blueprints (1-Click Add)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {CURATED_DSA_PRESETS.map((preset) => (
                        <div
                          key={preset.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2 hover:border-[var(--primary)]/50 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <span className="rounded bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[var(--primary)]">
                              {preset.category}
                            </span>
                            <h5 className="text-xs font-bold text-[var(--text)] mt-1 truncate">
                              {preset.title}
                            </h5>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">
                              {preset.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleAttachConceptMap({
                                id: `preset-${Date.now()}-${preset.id}`,
                                title: preset.title,
                                caption: preset.description,
                                url: preset.svgDataUrl,
                                createdAt: new Date().toISOString(),
                              })
                            }
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 py-1 text-xs font-semibold text-[var(--text)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors"
                          >
                            + Attach Blueprint
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attached Concept Maps Grid */}
                  <div className="space-y-3 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Attached Diagrams for this Problem
                    </h4>

                    {conceptMaps.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center space-y-3">
                        <ImageIcon className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-50" />
                        <h4 className="text-sm font-bold text-[var(--text)]">
                          No Visual Diagrams Attached
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                          Upload your problem sketches, screenshot traces, or click &ldquo;Upload / Attach Diagram&rdquo; to add drawings.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {conceptMaps.map((map) => (
                          <div
                            key={map.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs space-y-3 p-3 flex flex-col justify-between"
                          >
                            <div
                              onClick={() => {
                                setLightboxConceptMap(map);
                                setLightboxZoom(1);
                              }}
                              className="aspect-video w-full overflow-hidden rounded-xl bg-[var(--surface-muted)]/30 flex items-center justify-center cursor-zoom-in group"
                            >
                              <img
                                src={map.url}
                                alt={map.caption || map.title}
                                className="h-full w-full object-contain group-hover:scale-102 transition-transform"
                              />
                            </div>

                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-[var(--text)] truncate">
                                {map.title}
                              </h5>
                              {map.caption && (
                                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                                  {map.caption}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                              <button
                                type="button"
                                onClick={() => handleEmbedMapInNotes(map)}
                                className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 px-2.5 py-1 text-xs font-medium text-[var(--text)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors"
                                title="Insert image markdown code into study notes"
                              >
                                <Copy className="h-3 w-3" />
                                <span>Embed in Notes</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteConceptMap(map.id)}
                                className="flex items-center gap-1 rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                                title="Delete diagram"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Pillar 5: Solution Code Studio */}
            {/* ---------------------------------------------------------------- */}
            {mode === "code" && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-[var(--primary)]" />
                    <h3 className="text-sm font-bold text-[var(--text)]">
                      Solution Code Implementation
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      disabled={!codeSnippet}
                      className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-40"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-[var(--success)]" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>

                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                      size="sm"
                      containerClassName="w-auto min-w-[110px]"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
                  <CodeEditor
                    value={codeSnippet}
                    onChange={(val) => setCodeSnippet(val)}
                    language={language}
                    minHeight="100%"
                    maxHeight="100%"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attach Concept Map / Diagram Modal */}
        {isAttachMapOpen && (
          <AttachConceptMapModal
            isOpen={isAttachMapOpen}
            onClose={() => setIsAttachMapOpen(false)}
            topicTitle={title}
            module="dsa"
            folderName={title || "DSA"}
            onAttachConceptMap={handleAttachConceptMap}
            onAttachConceptMaps={handleAttachMultipleConceptMaps}
            onInsertImage={async (caption, url) => {
              const res = await uploadConceptMapImage(url, {
                module: "dsa",
                folderName: title || "DSA",
                caption: caption || "Algorithm Diagram",
              });
              handleAttachConceptMap(res.map);
              setIsAttachMapOpen(false);
            }}
          />
        )}

        {/* Lightbox Modal with Zoom */}
        {lightboxConceptMap && (
          <ModalPortal>
            <div
              onClick={() => setLightboxConceptMap(null)}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
                  <h4 className="text-sm font-bold text-[var(--text)] truncate">
                    {lightboxConceptMap.caption || lightboxConceptMap.title}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
                      className="p-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxZoom(1)}
                      className="p-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxConceptMap(null)}
                      className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition-colors ml-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  <img
                    src={lightboxConceptMap.url}
                    alt={lightboxConceptMap.caption || lightboxConceptMap.title}
                    style={{ transform: `scale(${lightboxZoom})`, transformOrigin: "center center" }}
                    className="max-h-[75vh] max-w-full object-contain transition-transform"
                  />
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </ModalPortal>
  );
}
