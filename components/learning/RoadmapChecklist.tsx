"use client";

// ============================================================================
// Sahil's Shore: Roadmap Checklist Component
// Interactive curriculum checklist with expandable inline sub-topics tree,
// dynamic multi-pillar mastery scoring, full topic study workspace integration,
// and safe deletion protection.
// ============================================================================

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Plus,
  Sparkles,
  Code2,
  ExternalLink,
  ShieldCheck,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  FileText,
  Maximize2,
  Image as ImageIcon,
  Info,
  Layers,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
} from "lucide-react";
import type { LearningItem, Json } from "@/types";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  type TrackMasteryBreakdown,
  parseTopicSubSections,
  packTopicSubSections,
  hasExplicitSubTopics,
  getTopicChapterNotes,
  parseTopicConceptMaps,
  type TopicSubSection,
  type ChapterConceptMap,
} from "@/lib/learning";
import { MarkdownView } from "@/components/common/MarkdownView";
import { TopicStudyModal } from "./TopicStudyModal";
import { FullPageNoteModal } from "./FullPageNoteModal";
import { AddTopicModal } from "./AddTopicModal";
import { EditTopicModal } from "./EditTopicModal";
import { SafeDeleteModal } from "./SafeDeleteModal";

interface RoadmapChecklistProps {
  items: LearningItem[];
  trackTitle: string;
  masteryBreakdown?: TrackMasteryBreakdown;
  onToggleStatus: (
    itemId: string,
    newStatus: "planned" | "in_progress" | "completed"
  ) => Promise<void>;
  onUpdateTopic: (
    itemId: string,
    updates: {
      topic?: string;
      category?: string | null;
      status?: "planned" | "in_progress" | "completed";
      notes?: string | null;
      resources?: Json;
      targetPosition?: number;
    }
  ) => Promise<void>;
  onAddTopic: (input: {
    topic: string;
    category: string;
    notes?: string;
    status: "planned" | "in_progress" | "completed";
    placement?: "top" | "bottom";
  }) => Promise<void>;
  onDeleteTopic?: (itemId: string) => Promise<void>;
  onReorderTopics?: (fromIndex: number, toIndex: number) => Promise<void>;
}

export function RoadmapChecklist({
  items,
  trackTitle,
  masteryBreakdown,
  onToggleStatus,
  onUpdateTopic,
  onAddTopic,
  onDeleteTopic,
  onReorderTopics,
}: RoadmapChecklistProps) {
  const [filter, setFilter] = useState<string>("all");
  const [selectedItemForStudy, setSelectedItemForStudy] = useState<LearningItem | null>(null);
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<string | undefined>(undefined);
  const [fullPageNoteItem, setFullPageNoteItem] = useState<LearningItem | null>(null);
  const [editingTopicItem, setEditingTopicItem] = useState<LearningItem | null>(null);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [lightboxMap, setLightboxMap] = useState<ChapterConceptMap | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Expanded topic IDs for the inline sub-topic tree
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(new Set());

  // Quick add sub-topic text input per topic (itemId -> text)
  const [quickAddSubTopicText, setQuickAddSubTopicText] = useState<Record<string, string>>({});

  // Safe delete target
  const [safeDeleteTarget, setSafeDeleteTarget] = useState<{
    type: "topic" | "sub-topic";
    itemId: string;
    subId?: string;
    title: string;
  } | null>(null);

  // Quick inline topic adder state
  const [inlineTopicText, setInlineTopicText] = useState("");
  const [inlineCategoryText, setInlineCategoryText] = useState("");
  const [isInlineAdding, setIsInlineAdding] = useState(false);

  const handleInlineAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inlineTopicText.trim();
    if (!trimmed || isInlineAdding) return;

    setIsInlineAdding(true);
    try {
      await onAddTopic({
        topic: trimmed,
        category: inlineCategoryText.trim() || "Core",
        status: "planned",
      });
      setInlineTopicText("");
      setInlineCategoryText("");
    } finally {
      setIsInlineAdding(false);
    }
  };

  const toggleExpand = (topicId: string) => {
    setExpandedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const filteredItems = items.filter((item) => {
    const subSections = parseTopicSubSections(item);
    const completedSubs = subSections.filter((s) => s.isCompleted).length;
    const effectiveStatus =
      subSections.length > 0 && completedSubs === subSections.length
        ? "completed"
        : subSections.length > 0 && completedSubs > 0
          ? item.status === "completed" ? "completed" : "in_progress"
          : item.status;

    if (filter === "completed") return effectiveStatus === "completed";
    if (filter === "in_progress") return effectiveStatus === "in_progress";
    if (filter === "planned") return effectiveStatus === "planned";
    return true;
  });

  const handleToggle = async (item: LearningItem) => {
    const subSections = parseTopicSubSections(item);
    const completedSubSections = subSections.filter((s) => s.isCompleted).length;
    const currentEffective =
      subSections.length > 0 && completedSubSections === subSections.length
        ? "completed"
        : subSections.length > 0 && completedSubSections > 0
          ? item.status === "completed" ? "completed" : "in_progress"
          : item.status;

    let nextStatus: "planned" | "in_progress" | "completed";
    if (currentEffective === "planned") nextStatus = "in_progress";
    else if (currentEffective === "in_progress") nextStatus = "completed";
    else nextStatus = "planned";

    let updatedSubs = subSections;
    if (nextStatus === "completed") {
      updatedSubs = subSections.map((s) => ({ ...s, isCompleted: true }));
    } else if (nextStatus === "planned") {
      updatedSubs = subSections.map((s) => ({ ...s, isCompleted: false }));
    }

    const { notes, resources } = packTopicSubSections(updatedSubs, item.category);

    await onUpdateTopic(item.id, {
      topic: item.topic,
      category: item.category,
      status: nextStatus,
      notes,
      resources,
    });

    onToggleStatus(item.id, nextStatus);
  };

  const handleOpenStudyModal = (item: LearningItem, subTopicId?: string) => {
    setSelectedItemForStudy(item);
    setSelectedSubTopicId(subTopicId);
  };

  const handleOpenFullPageNotes = (item: LearningItem) => {
    setFullPageNoteItem(item);
  };

  const activeFullPageItem = fullPageNoteItem
    ? items.find((i) => i.id === fullPageNoteItem.id) || fullPageNoteItem
    : null;

  const handleSaveFromFullPage = async (
    itemId: string,
    updates: {
      topic?: string;
      category?: string | null;
      status?: "planned" | "in_progress" | "completed";
      notes?: string | null;
      resources?: Json;
    }
  ) => {
    await onUpdateTopic(itemId, updates);
    setFullPageNoteItem((prev) =>
      prev && prev.id === itemId ? { ...prev, ...updates } : prev
    );
  };

  // Quick add a sub-topic inside an expanded topic
  const handleQuickAddSubTopic = async (item: LearningItem) => {
    const text = (quickAddSubTopicText[item.id] || "").trim();
    if (!text) return;

    const subSections = parseTopicSubSections(item);
    const hasSubTopics = hasExplicitSubTopics(item);

    const newSub: TopicSubSection = {
      id: `sub-${Date.now()}`,
      title: text,
      notes: "",
      codeSnippet: "",
      codeLanguage: "java",
      resources: [],
      isCompleted: false,
    };

    let updatedSubs: TopicSubSection[];
    if (!hasSubTopics && subSections.length === 1) {
      // If the single subsection had NO custom notes, code, or links, replace it
      const hasContent =
        Boolean(subSections[0].notes?.trim()) ||
        Boolean(subSections[0].codeSnippet?.trim()) ||
        (subSections[0].resources && subSections[0].resources.length > 0);

      if (!hasContent) {
        updatedSubs = [newSub];
      } else {
        // Keep existing notes/code, but use a clean title instead of dummy overview
        const cleanedTitle =
          subSections[0].title.toLowerCase().includes("overview")
            ? "Core Concepts & Architecture"
            : subSections[0].title;
        updatedSubs = [{ ...subSections[0], title: cleanedTitle }, newSub];
      }
    } else {
      updatedSubs = [...subSections, newSub];
    }

    const { notes, resources } = packTopicSubSections(updatedSubs, item.category);

    await onUpdateTopic(item.id, {
      topic: item.topic,
      category: item.category,
      status: item.status === "planned" ? "in_progress" : item.status,
      notes,
      resources,
    });

    setQuickAddSubTopicText((prev) => ({ ...prev, [item.id]: "" }));
    // Ensure expanded
    setExpandedTopicIds((prev) => new Set(prev).add(item.id));
  };

  // Toggle completion of a specific sub-topic
  const handleToggleSubTopic = async (item: LearningItem, subId: string) => {
    const subSections = parseTopicSubSections(item);
    const updatedSubs = subSections.map((s) =>
      s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s
    );

    const allCompleted = updatedSubs.every((s) => s.isCompleted);
    const someCompleted = updatedSubs.some((s) => s.isCompleted);

    let nextTopicStatus = item.status;
    if (allCompleted) {
      nextTopicStatus = "completed";
    } else if (someCompleted) {
      nextTopicStatus = "in_progress";
    } else {
      nextTopicStatus = "planned";
    }

    const { notes, resources } = packTopicSubSections(updatedSubs, item.category);

    await onUpdateTopic(item.id, {
      topic: item.topic,
      category: item.category,
      status: nextTopicStatus,
      notes,
      resources,
    });

    onToggleStatus(item.id, nextTopicStatus);
  };

  // Confirm safe delete action
  const handleConfirmSafeDelete = async () => {
    if (!safeDeleteTarget) return;

    if (safeDeleteTarget.type === "topic" && onDeleteTopic) {
      await onDeleteTopic(safeDeleteTarget.itemId);
    } else if (safeDeleteTarget.type === "sub-topic" && safeDeleteTarget.subId) {
      const item = items.find((i) => i.id === safeDeleteTarget.itemId);
      if (!item) return;

      const subSections = parseTopicSubSections(item);
      if (subSections.length <= 1) return; // Always keep at least 1 sub-topic

      const updatedSubs = subSections.filter((s) => s.id !== safeDeleteTarget.subId);
      const { notes, resources } = packTopicSubSections(updatedSubs, item.category);

      await onUpdateTopic(item.id, {
        topic: item.topic,
        category: item.category,
        status: item.status,
        notes,
        resources,
      });
    }
  };

  const overallScore = masteryBreakdown?.overallScore ?? 0;
  const tier = masteryBreakdown?.masteryTier ?? "Beginner";

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-5">
      {/* Dynamic Multi-Pillar Mastery Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4 w-full">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[var(--text)]">
              {trackTitle} Roadmap & Study Plan
            </h3>
            <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)] border border-[var(--primary)]/20">
              {tier}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Click any topic to expand its sub-topics, add sub-sections, notes, and code implementations
          </p>
        </div>

        {/* Dynamic Mastery Score Card */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold font-mono text-[var(--text)] flex items-center justify-end gap-1.5">
              <span>{overallScore}% Track Mastery</span>
              {overallScore >= 85 && (
                <ShieldCheck className="h-4 w-4 text-[var(--success)] inline" />
              )}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {masteryBreakdown?.topicsMastered || 0}/{items.length} mastered •{" "}
              {masteryBreakdown?.topicsNoted || 0} documented
            </div>
          </div>
          <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-xs font-mono border border-[var(--primary)]/20 shadow-2xs">
            {overallScore}%
          </div>
        </div>
      </div>

      {/* Filter and Topic Adder Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "planned", "in_progress", "completed"] as const).map((st) => {
            const count =
              st === "all"
                ? items.length
                : items.filter((i) => {
                    const subSections = parseTopicSubSections(i);
                    const completedSubs = subSections.filter((s) => s.isCompleted).length;
                    const effectiveStatus =
                      subSections.length > 0 && completedSubs === subSections.length
                        ? "completed"
                        : subSections.length > 0 && completedSubs > 0
                          ? i.status === "completed" ? "completed" : "in_progress"
                          : i.status;
                    return effectiveStatus === st;
                  }).length;
            const label =
              st === "all"
                ? "All Topics"
                : st === "in_progress"
                  ? "In Progress"
                  : st.charAt(0).toUpperCase() + st.slice(1);

            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === st
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "bg-[var(--surface-muted)]/40 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Add Topic Action Button */}
        <button
          type="button"
          onClick={() => setIsAddTopicOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity self-start sm:self-auto shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Topic</span>
        </button>
      </div>

      {/* Active Filter Notice Banner */}
      {filter !== "all" && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-3.5 py-2 text-xs text-[var(--primary)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Showing {filteredItems.length} {filter === "in_progress" ? "In Progress" : filter} {filteredItems.length === 1 ? "topic" : "topics"} ({items.length - filteredItems.length} other {items.length - filteredItems.length === 1 ? "topic" : "topics"} hidden).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="font-bold underline hover:opacity-80 shrink-0"
          >
            Show All ({items.length})
          </button>
        </div>
      )}

      {/* Roadmap Items List with Expandable Sub-Topic Drawers */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <BookOpen className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-semibold text-[var(--text)]">
            No topics matching this filter
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Switch back to &ldquo;All Topics&rdquo; or click &ldquo;Add Topic&rdquo; to customize this curriculum.
          </p>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {filteredItems.map((item, index) => {
            const subSections = parseTopicSubSections(item);
            const hasSubTopics = hasExplicitSubTopics(item);
            const chapterNotes = getTopicChapterNotes(item);
            const isExpanded = expandedTopicIds.has(item.id);
            const completedSubSections = subSections.filter((s) => s.isCompleted).length;
            const effectiveStatus: "planned" | "in_progress" | "completed" =
              subSections.length > 0 && completedSubSections === subSections.length
                ? "completed"
                : subSections.length > 0 && completedSubSections > 0
                  ? item.status === "completed" ? "completed" : "in_progress"
                  : item.status;
            const isCompleted = effectiveStatus === "completed";
            const isInProgress = effectiveStatus === "in_progress";

            const hasNotes =
              subSections.some((s) => s.notes && s.notes.trim().length > 0) ||
              Boolean(item.notes && item.notes.trim().length > 0);
            const hasCode = subSections.some(
              (s) => s.codeSnippet && s.codeSnippet.trim().length > 0
            );
            const totalLinks = subSections.reduce(
              (acc, s) => acc + (s.resources?.length || 0),
              0
            );
            const topicConceptMaps = parseTopicConceptMaps(item);
            const conceptMapsCount = topicConceptMaps.length;

            const itemCategory =
              item.category ||
              (Array.isArray(item.resources) && (item.resources[0] as { category?: string })?.category) ||
              "Core";

            const trueIndex = items.findIndex((i) => i.id === item.id);
            const displayIndex = trueIndex >= 0 ? trueIndex + 1 : index + 1;

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 space-y-2.5 w-full group transition-all rounded-xl border border-l-4 ${
                  isCompleted
                    ? "border-l-[var(--success)] border-t-[var(--success)]/25 border-r-[var(--success)]/25 border-b-[var(--success)]/25 bg-[var(--success)]/[0.04] hover:bg-[var(--success)]/[0.07] shadow-2xs"
                    : isInProgress
                      ? "border-l-[var(--warning)] border-t-[var(--warning)]/25 border-r-[var(--warning)]/25 border-b-[var(--warning)]/25 bg-[var(--warning)]/[0.03] hover:bg-[var(--warning)]/[0.06] shadow-2xs"
                      : "border-[var(--border)] border-l-[var(--border)]/70 bg-[var(--surface)] hover:bg-[var(--surface-muted)]/20 hover:border-[var(--border-hover)]"
                }`}
              >
                {/* Main Topic Row */}
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className="mt-0.5 shrink-0 transition-transform active:scale-95 p-0.5"
                      title={`Current: ${isCompleted ? "Mastered" : effectiveStatus.replace("_", " ")}. Click to cycle.`}
                    >
                      {isCompleted ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/40 shadow-2xs group-hover:scale-105 transition-transform">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </div>
                      ) : isInProgress ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/40">
                          <Clock className="h-3 w-3 text-[var(--warning)] animate-pulse" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                          <Circle className="h-3.5 w-3.5 opacity-60" />
                        </div>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Position Badge & Up/Down Toggling Controls */}
                        <div className="flex items-center gap-1 shrink-0 bg-[var(--surface-muted)]/40 rounded-lg px-1.5 py-0.5 border border-[var(--border)]">
                          {onReorderTopics && (
                            <div className="flex flex-col -space-y-1">
                              <button
                                type="button"
                                disabled={trueIndex <= 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReorderTopics(trueIndex, trueIndex - 1);
                                }}
                                className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                title="Move topic up (Shift above)"
                              >
                                <ArrowUp className="h-2.5 w-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={trueIndex < 0 || trueIndex >= items.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReorderTopics(trueIndex, trueIndex + 1);
                                }}
                                className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                title="Move topic down (Shift below)"
                              >
                                <ArrowDown className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}
                          <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
                            #{displayIndex}
                          </span>
                        </div>

                        {/* Topic title button - Pure clean typography with zero strikethrough */}
                        <button
                          type="button"
                          onClick={() => handleOpenStudyModal(item)}
                          className="text-sm font-semibold text-left transition-colors text-[var(--text)] hover:text-[var(--primary)] hover:underline truncate"
                          title="Click to open chapter in full-screen study workspace"
                        >
                          {item.topic}
                        </button>

                        <span className="rounded-md bg-[var(--surface-muted)]/70 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] shrink-0">
                          {itemCategory}
                        </span>

                        {/* Status Accomplishment Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--success)]/15 border border-[var(--success)]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--success)] shrink-0 shadow-2xs">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                            <span>Mastered</span>
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--warning)]/15 border border-[var(--warning)]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--warning)] shrink-0">
                            <Clock className="h-3 w-3 animate-pulse" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0">
                            <span>Planned</span>
                          </span>
                        )}

                        {/* Sub-topics count badge with real-time visual progress bar */}
                        {hasSubTopics ? (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenStudyModal(item)}
                              className={`flex items-center gap-1.5 rounded-l-lg px-2.5 py-0.5 text-[10px] font-semibold border border-r-0 transition-colors ${
                                isCompleted
                                  ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 hover:bg-[var(--success)]/20"
                                  : isInProgress
                                    ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30 hover:bg-[var(--warning)]/20"
                                    : "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 hover:bg-[var(--primary)]/20"
                              }`}
                              title="Click to open full-screen study workspace"
                            >
                              <FolderTree className="h-2.5 w-2.5" />
                              <span>
                                {completedSubSections}/{subSections.length} sub-topics
                              </span>
                              {/* Visual Progress Bar */}
                              <div className="w-8 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isCompleted
                                      ? "bg-[var(--success)]"
                                      : isInProgress
                                        ? "bg-[var(--warning)]"
                                        : "bg-[var(--primary)]"
                                  }`}
                                  style={{
                                    width: `${subSections.length > 0 ? (completedSubSections / subSections.length) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className={`rounded-r-lg p-1 border transition-colors ${
                                isCompleted
                                  ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 hover:bg-[var(--success)]/20"
                                  : isInProgress
                                    ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30 hover:bg-[var(--warning)]/20"
                                    : "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 hover:bg-[var(--primary)]/20"
                              }`}
                              title={isExpanded ? "Collapse inline preview" : "Expand inline preview"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-2.5 w-2.5" />
                              ) : (
                                <ChevronDown className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenFullPageNotes(item)}
                              className="flex items-center gap-1 rounded-l-lg bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] border border-r-0 border-[var(--border)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/80 transition-colors"
                              title="Click to open full-page study notes"
                            >
                              <BookOpen className="h-2.5 w-2.5 text-[var(--primary)]" />
                              <span>Study Notes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="rounded-r-lg bg-[var(--surface-muted)] p-1 text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/80 transition-colors"
                              title={isExpanded ? "Collapse inline preview" : "Expand inline preview"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-2.5 w-2.5" />
                              ) : (
                                <ChevronDown className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Badges for notes, code, links */}
                        {hasNotes && (
                          <button
                            type="button"
                            onClick={() => handleOpenFullPageNotes(item)}
                            className="flex items-center gap-1 rounded bg-[var(--primary)]/10 px-1.5 py-0.2 text-[10px] font-medium text-[var(--primary)] shrink-0 hover:bg-[var(--primary)]/20 transition-colors cursor-pointer"
                            title="Click to open full-page study notes"
                          >
                            <BookOpen className="h-2.5 w-2.5" />
                            <span>Notes</span>
                          </button>
                        )}
                        {conceptMapsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenFullPageNotes(item)}
                            className="flex items-center gap-1 rounded bg-[var(--primary)]/15 px-1.5 py-0.2 text-[10px] font-semibold text-[var(--primary)] shrink-0 hover:bg-[var(--primary)]/25 transition-colors border border-[var(--primary)]/20 cursor-pointer"
                            title={`Contains ${conceptMapsCount} visual concept map diagram${conceptMapsCount > 1 ? "s" : ""}`}
                          >
                            <ImageIcon className="h-2.5 w-2.5" />
                            <span>{conceptMapsCount} {conceptMapsCount === 1 ? "map" : "maps"}</span>
                          </button>
                        )}
                        {hasCode && (
                          <span className="flex items-center gap-1 rounded bg-[var(--primary)]/10 px-1.5 py-0.2 text-[10px] font-medium text-[var(--primary)] shrink-0">
                            <Code2 className="h-2.5 w-2.5" />
                            <span>Code</span>
                          </span>
                        )}
                        {totalLinks > 0 && (
                          <span className="flex items-center gap-1 rounded bg-[var(--surface-muted)] px-1.5 py-0.2 text-[10px] font-medium text-[var(--text-muted)] shrink-0">
                            <ExternalLink className="h-2.5 w-2.5" />
                            <span>{totalLinks} docs</span>
                          </span>
                        )}
                      </div>

                      {chapterNotes && !isExpanded && (
                        <p
                          onClick={() => handleOpenFullPageNotes(item)}
                          className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1 font-sans cursor-pointer hover:text-[var(--primary)] transition-colors"
                          title="Click to open full-page study notes"
                        >
                          {chapterNotes.replace(/[#*`_~>-]/g, "").trim()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions on topic */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onReorderTopics && trueIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => onReorderTopics(trueIndex, 0)}
                        className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-muted)] transition-all shrink-0"
                        title="Move directly to #1 (Top of curriculum)"
                      >
                        <ArrowUpToLine className="h-3.5 w-3.5 text-[var(--primary)]" />
                        <span className="hidden md:inline">To Top</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingTopicItem(item)}
                      className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-all shrink-0"
                      title="Edit Topic Title, Category & Position"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenFullPageNotes(item)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all shrink-0 shadow-2xs"
                      title="Open beautiful full-page Markdown study notes"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Study Notes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenStudyModal(item)}
                      className="hidden lg:flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-all shrink-0"
                      title="Open Code Implementation & Resources Workspace"
                    >
                      <Code2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span>Code Studio</span>
                    </button>

                    {onDeleteTopic && (
                      <button
                        type="button"
                        onClick={() =>
                          setSafeDeleteTarget({
                            type: "topic",
                            itemId: item.id,
                            title: item.topic,
                          })
                        }
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Topic"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Concept Maps Preview Strip */}
                {topicConceptMaps.length > 0 && (
                  <div className="pt-2 pb-1 border-t border-[var(--border)]/40 mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text)]">
                        <Layers className="h-3.5 w-3.5 text-[var(--primary)]" />
                        <span>Visual Diagrams & Concept Maps ({topicConceptMaps.length})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenFullPageNotes(item)}
                        className="text-[11px] font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        <span>Open Studio</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                      {topicConceptMaps.slice(0, 5).map((cm, cIdx) => (
                        <div
                          key={cm.id || cIdx}
                          onClick={() => {
                            setLightboxMap(cm);
                            setLightboxZoom(1);
                          }}
                          className="group/thumb relative h-20 w-32 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 overflow-hidden cursor-pointer hover:border-[var(--primary)] hover:shadow-xs transition-all flex flex-col justify-between p-1.5"
                          title={`Click to view "${cm.title || cm.caption}" in high definition`}
                        >
                          <div className="h-11 w-full overflow-hidden rounded-md bg-[var(--background)] flex items-center justify-center p-0.5 relative">
                            {cm.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cm.url}
                                alt={cm.title || "Diagram"}
                                className="max-h-full max-w-full object-contain group-hover/thumb:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-[var(--primary)]/60" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/25 flex items-center justify-center transition-all opacity-0 group-hover/thumb:opacity-100">
                              <Maximize2 className="h-3.5 w-3.5 text-white drop-shadow" />
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-[var(--text-muted)] group-hover/thumb:text-[var(--text)] truncate">
                            {cm.title || cm.caption || `Diagram #${cIdx + 1}`}
                          </span>
                        </div>
                      ))}

                      {topicConceptMaps.length > 5 && (
                        <button
                          type="button"
                          onClick={() => handleOpenFullPageNotes(item)}
                          className="h-20 w-24 shrink-0 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface-muted)]/20 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--surface-muted)]/50 transition-all"
                        >
                          <Plus className="h-4 w-4" />
                          <span>+{topicConceptMaps.length - 5} More</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline Sub-Topics Tree & Quick Adder Drawer */}
                {isExpanded && (
                  <div className="mt-3 pl-5 sm:pl-8 pr-1 space-y-3 border-l-2 border-[var(--primary)]/30 ml-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {hasSubTopics ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)]">
                            <FolderTree className="h-3.5 w-3.5 text-[var(--primary)]" />
                            <span>Sub-Topics Inside &ldquo;{item.topic}&rdquo; ({subSections.length})</span>
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono">
                            {completedSubSections}/{subSections.length} Mastered
                          </span>
                        </div>

                        {/* Sub-topics list */}
                        <div className="space-y-1.5 pt-1">
                          {subSections.map((sub, sIdx) => (
                            <div
                              key={sub.id}
                              className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2 text-xs transition-all group/sub ${
                                sub.isCompleted
                                  ? "border-[var(--success)]/30 border-l-2 border-l-[var(--success)] bg-[var(--success)]/[0.04] hover:border-[var(--success)]/50"
                                  : "border-[var(--border)] bg-[var(--surface-muted)]/20 hover:border-[var(--primary)]/30"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {/* Sub-topic toggle completion */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubTopic(item, sub.id)}
                                  className="shrink-0 transition-transform active:scale-95"
                                  title={sub.isCompleted ? "Completed. Click to uncheck." : "Mark complete."}
                                >
                                  {sub.isCompleted ? (
                                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/40 shadow-2xs">
                                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                                      <Circle className="h-3 w-3 opacity-60" />
                                    </div>
                                  )}
                                </button>

                                <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
                                  {sIdx + 1}.
                                </span>

                                <span
                                  onClick={() => handleOpenStudyModal(item, sub.id)}
                                  className="font-semibold cursor-pointer text-[var(--text)] hover:text-[var(--primary)] hover:underline truncate"
                                >
                                  {sub.title}
                                </span>

                                {sub.isCompleted && (
                                  <span className="inline-flex items-center gap-0.5 rounded-md bg-[var(--success)]/15 border border-[var(--success)]/30 px-1.5 py-0.5 text-[9px] font-bold text-[var(--success)] shrink-0">
                                    <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                                    <span>Done</span>
                                  </span>
                                )}

                                {/* Indicators */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {sub.notes && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenFullPageNotes(item)}
                                      className="flex items-center gap-0.5 rounded bg-[var(--primary)]/10 px-1.5 py-0.2 text-[9px] font-medium text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
                                      title="Open chapter notes in Full-Page Studio"
                                    >
                                      <BookOpen className="h-2 w-2" />
                                      <span>Notes</span>
                                    </button>
                                  )}
                                  {sub.codeSnippet && (
                                    <span className="flex items-center gap-0.5 rounded bg-[var(--primary)]/10 px-1.5 py-0.2 text-[9px] font-medium text-[var(--primary)]">
                                      <Code2 className="h-2 w-2" />
                                      <span>Code</span>
                                    </span>
                                  )}
                                  {sub.resources?.length > 0 && (
                                    <span className="flex items-center gap-0.5 rounded bg-[var(--surface)] px-1.5 py-0.2 text-[9px] font-medium text-[var(--text-muted)] border border-[var(--border)]">
                                      <ExternalLink className="h-2 w-2" />
                                      <span>{sub.resources.length} docs</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenStudyModal(item, sub.id)}
                                  className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors"
                                >
                                  <BookOpen className="h-3 w-3 text-[var(--primary)]" />
                                  <span>Study & Code</span>
                                </button>

                                {subSections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSafeDeleteTarget({
                                        type: "sub-topic",
                                        itemId: item.id,
                                        subId: sub.id,
                                        title: sub.title,
                                      })
                                    }
                                    className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 opacity-0 group-hover/sub:opacity-100 transition-opacity"
                                    title="Delete this sub-topic"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Quick Add Sub-Topic Input Row */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleQuickAddSubTopic(item);
                          }}
                          className="flex items-center gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={quickAddSubTopicText[item.id] || ""}
                            onChange={(e) =>
                              setQuickAddSubTopicText((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder={`+ Add sub-topic to "${item.topic}" (e.g. Bean Scopes & Lifecycle)...`}
                            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!(quickAddSubTopicText[item.id] || "").trim()}
                            className="flex items-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Sub-Topic</span>
                          </button>
                        </form>
                      </>
                    ) : (
                      <>
                        {/* Standalone Chapter View with Beautiful Markdown */}
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)]">
                            <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                            <span>Chapter Architecture & Study Notes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenFullPageNotes(item)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Open Full-Page Studio</span>
                            </button>
                            <span className="text-[var(--text-muted)] opacity-30">•</span>
                            <button
                              type="button"
                              onClick={() => handleOpenStudyModal(item)}
                              className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:underline"
                            >
                              <Code2 className="h-3 w-3" />
                              <span>Code Studio</span>
                            </button>
                          </div>
                        </div>

                        {chapterNotes ? (
                          <div
                            onClick={() => handleOpenFullPageNotes(item)}
                            className="group/notes relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-2xs cursor-pointer hover:border-[var(--primary)]/40 transition-all"
                            title="Click to open full-page Markdown study studio"
                          >
                            <div className="absolute top-2 right-2.5 opacity-0 group-hover/notes:opacity-100 transition-opacity bg-[var(--surface-muted)]/90 backdrop-blur rounded-lg px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)] flex items-center gap-1 shadow-2xs border border-[var(--border)]">
                              <Maximize2 className="h-2.5 w-2.5" />
                              <span>Full Page</span>
                            </div>
                            <MarkdownView content={chapterNotes} />
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center bg-[var(--surface-muted)]/10">
                            <BookOpen className="h-6 w-6 text-[var(--text-muted)] mx-auto mb-1.5 opacity-40" />
                            <p className="text-xs text-[var(--text-muted)]">
                              No notes documented yet for &ldquo;{item.topic}&rdquo;.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenFullPageNotes(item)}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-opacity"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Write Full-Page Notes</span>
                            </button>
                          </div>
                        )}

                        {/* Optional standalone code snippet */}
                        {subSections[0]?.codeSnippet && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                              <Code2 className="h-3 w-3 text-[var(--primary)]" />
                              <span>Code Implementation</span>
                            </span>
                            <MarkdownView
                              content={`\`\`\`${subSections[0].codeLanguage || "java"}\n${subSections[0].codeSnippet}\n\`\`\``}
                            />
                          </div>
                        )}

                        {/* Quick Add Sub-Topic Input Row to break down into sub-topics */}
                        <div className="pt-2 border-t border-[var(--border)]/60">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                              <FolderTree className="h-3 w-3 text-[var(--primary)]" />
                              <span>Break this chapter down into sub-topics:</span>
                            </span>
                          </div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleQuickAddSubTopic(item);
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={quickAddSubTopicText[item.id] || ""}
                              onChange={(e) =>
                                setQuickAddSubTopicText((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder={`+ Add first sub-topic (e.g. Bean Scopes & Lifecycle)...`}
                              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={!(quickAddSubTopicText[item.id] || "").trim()}
                              className="flex items-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Sub-Topic</span>
                            </button>
                          </form>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Quick Add Topic bar at bottom of curriculum */}
      <div className="pt-2">
        <form
          onSubmit={handleInlineAddTopic}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[var(--surface-muted)]/15 p-2.5 rounded-2xl border border-[var(--border)]"
        >
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 focus-within:border-[var(--primary)] transition-all">
            <Plus className="h-4 w-4 text-[var(--primary)] shrink-0" />
            <input
              type="text"
              value={inlineTopicText}
              onChange={(e) => setInlineTopicText(e.target.value)}
              placeholder={`+ Quick add topic #${items.length + 1} (e.g. Distributed Tracing & OpenTelemetry)...`}
              className="w-full bg-transparent text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
            />
          </div>

          <div className="sm:w-44">
            <input
              type="text"
              value={inlineCategoryText}
              onChange={(e) => setInlineCategoryText(e.target.value)}
              placeholder="Category (e.g. Observability)"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!inlineTopicText.trim() || isInlineAdding}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isInlineAdding ? "Adding..." : "Add Topic"}</span>
          </button>
        </form>
      </div>

      {/* Topic Study Modal with body scroll lock */}
      {selectedItemForStudy && (
        <TopicStudyModal
          isOpen={Boolean(selectedItemForStudy)}
          onClose={() => {
            setSelectedItemForStudy(null);
            setSelectedSubTopicId(undefined);
          }}
          item={selectedItemForStudy}
          initialSubSectionId={selectedSubTopicId}
          trackTitle={trackTitle}
          onSave={onUpdateTopic}
          onDeleteTopic={onDeleteTopic}
          onOpenFullPageNotes={(item) => {
            setSelectedItemForStudy(null);
            setFullPageNoteItem(item);
          }}
        />
      )}

      {/* Full-Page Markdown Document Studio Modal */}
      {activeFullPageItem && (
        <FullPageNoteModal
          isOpen={Boolean(activeFullPageItem)}
          onClose={() => setFullPageNoteItem(null)}
          item={activeFullPageItem}
          trackTitle={trackTitle}
          onSave={handleSaveFromFullPage}
          onOpenStudyWorkspace={(item) => {
            setFullPageNoteItem(null);
            handleOpenStudyModal(item);
          }}
        />
      )}

      {/* Add Topic Modal */}
      <AddTopicModal
        isOpen={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
        trackTitle={trackTitle}
        totalTopics={items.length}
        onAddTopic={onAddTopic}
      />

      {/* Edit Topic Modal */}
      {editingTopicItem && (
        <EditTopicModal
          isOpen={Boolean(editingTopicItem)}
          onClose={() => setEditingTopicItem(null)}
          item={editingTopicItem}
          trackTitle={trackTitle}
          totalTopics={items.length}
          currentPosition={items.findIndex((i) => i.id === editingTopicItem.id) + 1}
          onSave={onUpdateTopic}
          onOpenStudyWorkspace={(item) => {
            setEditingTopicItem(null);
            handleOpenStudyModal(item);
          }}
          onDeleteTopic={onDeleteTopic}
        />
      )}

      {/* Safe Delete Modal for Topic or Sub-Topic */}
      {safeDeleteTarget && (
        <SafeDeleteModal
          isOpen={Boolean(safeDeleteTarget)}
          onClose={() => setSafeDeleteTarget(null)}
          onConfirm={handleConfirmSafeDelete}
          title={
            safeDeleteTarget.type === "topic"
              ? "Delete Roadmap Topic"
              : "Delete Sub-Topic"
          }
          itemName={safeDeleteTarget.title}
          itemType={safeDeleteTarget.type}
          warningText={
            safeDeleteTarget.type === "topic"
              ? `This will permanently delete topic "${safeDeleteTarget.title}" and all its sub-topics, architecture notes, and code snippets.`
              : `This will permanently delete sub-topic "${safeDeleteTarget.title}" and its notes, code implementations, and reference links.`
          }
        />
      )}

      {/* Lightbox Modal for High-Definition Viewing of Concept Maps */}
      {lightboxMap && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => {
              setLightboxMap(null);
              setLightboxZoom(1);
            }}
          >
            <header
              className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lightboxMap.title || lightboxMap.caption}
                  </h3>
                  <p className="text-xs text-white/60">
                    High-Definition Architecture Diagram
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono text-white/60 min-w-[40px] text-center">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxZoom(1)}
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {lightboxMap.driveWebViewLink && (
                  <a
                    href={lightboxMap.driveWebViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setLightboxMap(null);
                    setLightboxZoom(1);
                  }}
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors ml-2"
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div
              className="flex-1 overflow-auto flex items-center justify-center p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxMap.url}
                alt={lightboxMap.title || "Concept Map"}
                style={{ transform: `scale(${lightboxZoom})` }}
                className="max-h-[82vh] max-w-[90vw] object-contain transition-transform duration-150 rounded-lg shadow-2xl select-none"
              />
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
