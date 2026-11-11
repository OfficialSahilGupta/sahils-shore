"use client";

// ============================================================================
// Sahil's Shore: Topic Study & Engineering Notes Workspace Modal
// Deep-dive topic study environment supporting multiple sub-sections per topic.
// In each sub-section: Architecture & Notes, Code Implementation, and Doc & Resource Links.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Code2,
  ExternalLink,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Circle,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Layers,
  Link as LinkIcon,
  Plus,
  Trash2,
  Edit3,
  FolderTree,
  ChevronRight,
  Eye,
  Columns,
  FileText,
} from "lucide-react";
import type { LearningItem, Json } from "@/types";
import { Select } from "@/components/ui/select";
import {
  parseTopicSubSections,
  packTopicSubSections,
  hasExplicitSubTopics,
  type TopicSubSection,
} from "@/lib/learning";
import { MarkdownView } from "@/components/common/MarkdownView";
import { CodeEditor } from "../dsa/CodeEditor";
import { SafeDeleteModal } from "./SafeDeleteModal";
import { ModalPortal } from "@/components/ui/modal-portal";

interface TopicStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LearningItem | null;
  trackTitle: string;
  initialSubSectionId?: string;
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
  onDeleteTopic?: (itemId: string) => Promise<void>;
  onOpenFullPageNotes?: (item: LearningItem) => void;
}

export function TopicStudyModal({
  isOpen,
  onClose,
  item,
  trackTitle,
  initialSubSectionId,
  onSave,
  onDeleteTopic,
  onOpenFullPageNotes,
}: TopicStudyModalProps) {
  const [topicTitle, setTopicTitle] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed">("planned");

  // Sub-sections array
  const [subSections, setSubSections] = useState<TopicSubSection[]>([]);
  const [activeSubSectionId, setActiveSubSectionId] = useState<string>("");

  // Sub-section active pillar: notes | code | resources
  const [activePillar, setActivePillar] = useState<"notes" | "code" | "resources">("notes");
  // Notes view mode: write | split | preview
  const [notesViewMode, setNotesViewMode] = useState<"write" | "split" | "preview">("write");

  // Links input state for active sub-section
  const [newUrlTitle, setNewUrlTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe delete modals state
  const [isDeleteTopicModalOpen, setIsDeleteTopicModalOpen] = useState(false);
  const [deleteSubTarget, setDeleteSubTarget] = useState<TopicSubSection | null>(null);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      setTopicTitle(item.topic || "");
      setCategory(item.category || "General");
      setStatus(item.status || "planned");

      const parsed = parseTopicSubSections(item);
      const hasExplicit = hasExplicitSubTopics(item);
      const cleaned = parsed.map((s) => {
        if (!hasExplicit && parsed.length === 1) {
          const lower = s.title.toLowerCase();
          if (lower.includes("overview") || lower === "sub-section 1") {
            return { ...s, title: item.topic ? `Core ${item.topic}` : "Chapter Study Notes" };
          }
        }
        return s;
      });

      setSubSections(cleaned);
      if (initialSubSectionId && cleaned.some((s) => s.id === initialSubSectionId)) {
        setActiveSubSectionId(initialSubSectionId);
      } else if (cleaned.length > 0) {
        setActiveSubSectionId(cleaned[0].id);
      }
    }
  }, [item, isOpen, initialSubSectionId]);

  if (!isOpen || !item) return null;

  // Active sub-section
  const activeSubSection =
    subSections.find((s) => s.id === activeSubSectionId) || subSections[0];

  const updateActiveSubSection = (updates: Partial<TopicSubSection>) => {
    if (!activeSubSection) return;
    setSubSections((prev) =>
      prev.map((s) => (s.id === activeSubSection.id ? { ...s, ...updates } : s))
    );
  };

  // Add new sub-section
  const handleAddSubSection = () => {
    const newId = `sub-${Date.now()}`;
    const newNumber = subSections.length + 1;
    const newSub: TopicSubSection = {
      id: newId,
      title: `Sub-Section ${newNumber}`,
      notes: "",
      codeSnippet: "",
      codeLanguage: activeSubSection?.codeLanguage || "java",
      resources: [],
      isCompleted: false,
    };
    setSubSections((prev) => [...prev, newSub]);
    setActiveSubSectionId(newId);
    setActivePillar("notes");
  };

  // Delete sub-section (keep at least one)
  const handleDeleteSubSectionClick = (sub: TopicSubSection, e: React.MouseEvent) => {
    e.stopPropagation();
    if (subSections.length <= 1) return;
    setDeleteSubTarget(sub);
  };

  const handleConfirmDeleteSubSection = () => {
    if (!deleteSubTarget || subSections.length <= 1) return;
    const id = deleteSubTarget.id;
    setSubSections((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (activeSubSectionId === id && filtered.length > 0) {
        setActiveSubSectionId(filtered[0].id);
      }
      return filtered;
    });
    setDeleteSubTarget(null);
  };

  const insertTemplate = (template: string) => {
    if (!activeSubSection) return;
    const existing = activeSubSection.notes || "";
    const updated = existing ? `${existing.trim()}\n\n${template}` : template;
    updateActiveSubSection({ notes: updated });
  };

  const handleAddLink = () => {
    if (!activeSubSection || !newUrl.trim()) return;
    const itemToAdd = {
      title: newUrlTitle.trim() || "Documentation",
      url: newUrl.trim().startsWith("http") ? newUrl.trim() : `https://${newUrl.trim()}`,
      category: "Docs",
    };
    const updatedLinks = [...(activeSubSection.resources || []), itemToAdd];
    updateActiveSubSection({ resources: updatedLinks });
    setNewUrlTitle("");
    setNewUrl("");
  };

  const handleRemoveLink = (index: number) => {
    if (!activeSubSection) return;
    const updatedLinks = (activeSubSection.resources || []).filter((_, i) => i !== index);
    updateActiveSubSection({ resources: updatedLinks });
  };

  const handleCopyCode = async () => {
    if (!activeSubSection?.codeSnippet) return;
    try {
      await navigator.clipboard.writeText(activeSubSection.codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn("Failed to copy code snippet:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Pack all sub-sections into markdown notes and JSON resources
      const { notes: synthesizedNotes, resources: packedResources } =
        packTopicSubSections(subSections, category);

      await onSave(item.id, {
        topic: topicTitle.trim(),
        category: category.trim() || null,
        status,
        notes: synthesizedNotes || null,
        resources: packedResources,
      });

      onClose();
    } catch (err) {
      console.error("Error saving topic study notes:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className={`relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 shadow-2xl transition-all flex flex-col ${
            isFullscreen
              ? "max-w-[99vw] h-[98vh] overflow-y-auto"
              : "max-w-6xl w-full h-[94vh] sm:h-[92vh] overflow-y-auto"
          }`}
        >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-3 gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">
                  {topicTitle || "Topic Study Workspace"}
                </h2>
                <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] shrink-0">
                  {trackTitle}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">
                Modular sub-sections: Architecture notes, code implementation, and resource links
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-xl border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors hidden sm:flex"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status & Category Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3 shrink-0">
          <div className="sm:col-span-6 flex flex-col justify-center">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Topic Name & Category
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] font-semibold focus:border-[var(--primary)] focus:outline-none"
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="w-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Mastery Status Selector */}
          <div className="sm:col-span-6 flex flex-col justify-center">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Overall Topic Mastery Stage
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setStatus("planned")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
                  status === "planned"
                    ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Circle className="h-3.5 w-3.5" />
                <span>Planned</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("in_progress")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
                  status === "in_progress"
                    ? "bg-[var(--warning)]/15 border border-[var(--warning)]/30 text-[var(--warning)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>In Progress</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("completed")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
                  status === "completed"
                    ? "bg-[var(--success)]/15 border border-[var(--success)]/30 text-[var(--success)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mastered</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Section Navigator Strip */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 mb-3 shrink-0">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)]">
              {subSections.length > 1 ? (
                <>
                  <FolderTree className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Topic Sub-Sections ({subSections.length})</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Chapter Study Workspace</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddSubSection}
              className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:opacity-90 transition-opacity"
              title="Add a sub-topic to break down this chapter"
            >
              <Plus className="h-3 w-3" />
              <span>Add Sub-Topic</span>
            </button>
          </div>

          {/* Sub-section horizontal pill list (only show when multiple sub-sections exist) */}
          {subSections.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-thin">
              {subSections.map((sub, idx) => {
                const isActive = sub.id === (activeSubSection?.id || "");
                const hasNotes = Boolean(sub.notes && sub.notes.trim().length > 0);
                const hasCode = Boolean(sub.codeSnippet && sub.codeSnippet.trim().length > 0);
                const linkCount = (sub.resources || []).length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setActiveSubSectionId(sub.id)}
                    className={`group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer transition-all shrink-0 border ${
                      isActive
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-semibold shadow-2xs"
                        : "border-[var(--border)] bg-[var(--surface-muted)]/20 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {sub.isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)] shrink-0" />
                      ) : (
                        <span className="h-4 w-4 rounded-full bg-[var(--border)] text-[var(--text-muted)] flex items-center justify-center text-[10px] font-mono shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate max-w-[150px] sm:max-w-[190px]">
                        {sub.title || `Sub-Section ${idx + 1}`}
                      </span>
                    </div>

                    {/* Indicator badges */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-70">
                      {hasNotes && (
                        <span title="Has Architecture Notes">
                          <BookOpen className="h-2.5 w-2.5" />
                        </span>
                      )}
                      {hasCode && (
                        <span title="Has Code Snippet">
                          <Code2 className="h-2.5 w-2.5" />
                        </span>
                      )}
                      {linkCount > 0 && (
                        <span title={`${linkCount} doc links`}>
                          <LinkIcon className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Delete button (if more than 1 subsection) */}
                    {subSections.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSubSectionClick(sub, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-[var(--danger)] transition-opacity p-0.5 ml-0.5"
                        title="Delete this sub-section"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Sub-Section Header: Title & Completion */}
        {activeSubSection && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 p-2.5 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            {subSections.length > 1 ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0 flex items-center gap-1">
                  <Edit3 className="h-3 w-3 text-[var(--primary)]" />
                  <span>Sub-Section Title:</span>
                </span>
                <input
                  type="text"
                  value={activeSubSection.title}
                  onChange={(e) => updateActiveSubSection({ title: e.target.value })}
                  placeholder="e.g. Cache Invalidation & Eviction Strategies"
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)] font-semibold focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0 flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-[var(--primary)]" />
                  <span>Study Notes:</span>
                </span>
                <span className="text-xs font-bold text-[var(--text)] truncate">
                  {topicTitle || "Chapter Overview"}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                updateActiveSubSection({ isCompleted: !activeSubSection.isCompleted })
              }
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all shrink-0 border ${
                activeSubSection.isCompleted
                  ? "bg-[var(--success)]/15 border-[var(--success)]/30 text-[var(--success)]"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {activeSubSection.isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              <span>
                {activeSubSection.isCompleted
                  ? subSections.length > 1
                    ? "Sub-Section Completed"
                    : "Chapter Completed"
                  : subSections.length > 1
                    ? "Mark Sub-Section Completed"
                    : "Mark Chapter Completed"}
              </span>
            </button>
          </div>
        )}

        {/* 3 Pillar Tabs for Active Sub-Section */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActivePillar("notes")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activePillar === "notes"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Architecture & Notes</span>
            {activeSubSection?.notes?.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActivePillar("code")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activePillar === "code"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Code Implementation</span>
            {activeSubSection?.codeSnippet?.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActivePillar("resources")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activePillar === "resources"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>
              Doc & Resource Links ({activeSubSection?.resources?.length || 0})
            </span>
          </button>
        </div>

        {/* Main Workspace Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
          {/* Pillar 1: Architecture Notes */}
          {activePillar === "notes" && (
            <div className="flex-1 flex flex-col space-y-2.5 min-h-[300px]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>Architecture, Trade-offs & Mental Models</span>
                  </span>

                  {/* Mode Selector: Write | Split | Preview */}
                  <div className="flex items-center gap-1 rounded-xl bg-[var(--surface-muted)]/50 p-0.5 border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setNotesViewMode("write")}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                        notesViewMode === "write"
                          ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                          : "text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                      title="Write / Edit Markdown"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Write</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesViewMode("split")}
                      className={`hidden sm:flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                        notesViewMode === "split"
                          ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                          : "text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                      title="Side-by-side Editor & Formatted Preview"
                    >
                      <Columns className="h-3 w-3" />
                      <span>Split</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesViewMode("preview")}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                        notesViewMode === "preview"
                          ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs"
                          : "text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                      title="Full Formatted Markdown View"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {onOpenFullPageNotes && (
                    <button
                      type="button"
                      onClick={() => {
                        if (item) {
                          onClose();
                          onOpenFullPageNotes(item);
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all shrink-0"
                      title="Open as beautiful edge-to-edge full-page Markdown study studio"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Full-Page Studio</span>
                    </button>
                  )}
                </div>

                {/* Quick Template Insertion Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplate(
                        "### Core Architecture & Invariant\n- Principle: \n- Why this design is chosen: \n- Trade-offs considered: "
                      )
                    }
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
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
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
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
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    + Interview Summary
                  </button>
                </div>
              </div>

              {/* View Rendering based on notesViewMode */}
              {notesViewMode === "write" && (
                <textarea
                  rows={13}
                  value={activeSubSection?.notes || ""}
                  onChange={(e) => updateActiveSubSection({ notes: e.target.value })}
                  placeholder={`Write detailed architecture notes, trade-offs, and mental models for "${activeSubSection?.title || "this chapter"}"... (Markdown supported)`}
                  className="w-full flex-1 min-h-[260px] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3.5 text-xs text-[var(--text)] font-sans leading-relaxed placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-none"
                />
              )}

              {notesViewMode === "preview" && (
                <div className="w-full flex-1 min-h-[260px] max-h-[520px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xs scrollbar-thin">
                  <MarkdownView content={activeSubSection?.notes} />
                </div>
              )}

              {notesViewMode === "split" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-[260px]">
                  <textarea
                    rows={13}
                    value={activeSubSection?.notes || ""}
                    onChange={(e) => updateActiveSubSection({ notes: e.target.value })}
                    placeholder="Write markdown architecture notes here..."
                    className="w-full h-full min-h-[260px] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3.5 text-xs text-[var(--text)] font-sans leading-relaxed placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-none"
                  />
                  <div className="w-full h-full min-h-[260px] max-h-[520px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-2xs scrollbar-thin">
                    <MarkdownView content={activeSubSection?.notes} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pillar 2: Code Implementation */}
          {activePillar === "code" && (
            <div className="flex-1 flex flex-col space-y-2.5 min-h-[300px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Hands-on Code Implementation</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={!activeSubSection?.codeSnippet}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors disabled:opacity-40"
                  >
                    {copiedCode ? (
                      <Check className="h-3 w-3 text-[var(--success)]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>

                  <Select
                    value={activeSubSection?.codeLanguage || "java"}
                    onChange={(e) => updateActiveSubSection({ codeLanguage: e.target.value })}
                    size="sm"
                    containerClassName="w-32"
                    options={[
                      { value: "java", label: "Java" },
                      { value: "typescript", label: "TypeScript" },
                      { value: "javascript", label: "JavaScript" },
                      { value: "python", label: "Python" },
                      { value: "go", label: "Go" },
                      { value: "sql", label: "SQL" },
                      { value: "rust", label: "Rust" },
                      { value: "cpp", label: "C++" },
                    ]}
                  />
                </div>
              </div>

              <div className="flex-1 min-h-[260px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <CodeEditor
                  value={activeSubSection?.codeSnippet || ""}
                  onChange={(val) => updateActiveSubSection({ codeSnippet: val })}
                  language={(activeSubSection?.codeLanguage as any) || "java"}
                  minHeight="260px"
                  maxHeight={isFullscreen ? "65vh" : "360px"}
                />
              </div>
            </div>
          )}

          {/* Pillar 3: Resource Links */}
          {activePillar === "resources" && (
            <div className="flex-1 flex flex-col space-y-3 min-h-[300px]">
              <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-[var(--primary)]" />
                <span>Reference Links & Official Documentation for this Sub-Section</span>
              </span>

              {/* Add New Link Row */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newUrlTitle}
                  onChange={(e) => setNewUrlTitle(e.target.value)}
                  placeholder="Link Title (e.g. Redis Docs, Spring Reference)"
                  className="w-full sm:w-1/3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full sm:flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="w-full sm:w-auto flex items-center justify-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Link</span>
                </button>
              </div>

              {/* Links List */}
              <div className="space-y-2 pt-2">
                {(!activeSubSection?.resources || activeSubSection.resources.length === 0) ? (
                  <p className="text-xs text-[var(--text-muted)] italic text-center py-6">
                    No reference links attached to this sub-section yet. Add official docs, deep-dive articles, or RFCs above.
                  </p>
                ) : (
                  activeSubSection.resources.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ExternalLink className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                        <span className="font-semibold text-[var(--text)] truncate">
                          {r.title}
                        </span>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-[var(--primary)] truncate underline"
                        >
                          {r.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(i)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-1"
                        title="Remove link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 shrink-0">
            {onDeleteTopic ? (
              <button
                type="button"
                onClick={() => setIsDeleteTopicModalOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/10 px-3 py-2 text-xs font-semibold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Topic</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? "Saving..." : "Save Notes & Progress"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Safe Deletion Modal for Entire Topic */}
        {onDeleteTopic && (
          <SafeDeleteModal
            isOpen={isDeleteTopicModalOpen}
            onClose={() => setIsDeleteTopicModalOpen(false)}
            onConfirm={async () => {
              await onDeleteTopic(item.id);
              onClose();
            }}
            title="Delete Roadmap Topic"
            itemName={item.topic}
            itemType="topic"
            warningText={`This will permanently remove "${item.topic}" and all its sub-sections, architecture notes, and code snippets from this track.`}
          />
        )}

        {/* Safe Deletion Modal for Sub-Section */}
        {deleteSubTarget && (
          <SafeDeleteModal
            isOpen={Boolean(deleteSubTarget)}
            onClose={() => setDeleteSubTarget(null)}
            onConfirm={handleConfirmDeleteSubSection}
            title="Delete Sub-Section"
            itemName={deleteSubTarget.title}
            itemType="sub-topic"
            warningText={`This will permanently delete sub-section "${deleteSubTarget.title}" and its notes, code implementations, and reference links.`}
          />
        )}
      </div>
    </div>
  </ModalPortal>
  );
}
