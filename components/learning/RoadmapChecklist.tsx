"use client";

// ============================================================================
// Sahil's Shore: Roadmap Checklist Component
// Interactive curriculum checklist with expandable inline sub-topics tree,
// dynamic multi-pillar mastery scoring, full topic study workspace integration,
// and safe deletion protection.
// ============================================================================

import React, { useState } from "react";
import {
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
} from "lucide-react";
import type { LearningItem, Json } from "@/types";
import {
  type TrackMasteryBreakdown,
  parseTopicSubSections,
  packTopicSubSections,
  type TopicSubSection,
} from "@/lib/learning";
import { TopicStudyModal } from "./TopicStudyModal";
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
  const [editingTopicItem, setEditingTopicItem] = useState<LearningItem | null>(null);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

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
    if (filter === "completed") return item.status === "completed";
    if (filter === "in_progress") return item.status === "in_progress";
    if (filter === "planned") return item.status === "planned";
    return true;
  });

  const handleToggle = (item: LearningItem) => {
    let nextStatus: "planned" | "in_progress" | "completed";
    if (item.status === "planned") nextStatus = "in_progress";
    else if (item.status === "in_progress") nextStatus = "completed";
    else nextStatus = "planned";

    onToggleStatus(item.id, nextStatus);
  };

  const handleOpenStudyModal = (item: LearningItem, subTopicId?: string) => {
    setSelectedItemForStudy(item);
    setSelectedSubTopicId(subTopicId);
  };

  // Quick add a sub-topic inside an expanded topic
  const handleQuickAddSubTopic = async (item: LearningItem) => {
    const text = (quickAddSubTopicText[item.id] || "").trim();
    if (!text) return;

    const subSections = parseTopicSubSections(item);
    const newSub: TopicSubSection = {
      id: `sub-${Date.now()}`,
      title: text,
      notes: "",
      codeSnippet: "",
      codeLanguage: "java",
      resources: [],
      isCompleted: false,
    };

    const updatedSubs = [...subSections, newSub];
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
    } else if (someCompleted && item.status === "planned") {
      nextTopicStatus = "in_progress";
    }

    const { notes, resources } = packTopicSubSections(updatedSubs, item.category);

    await onUpdateTopic(item.id, {
      topic: item.topic,
      category: item.category,
      status: nextTopicStatus,
      notes,
      resources,
    });
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
              st === "all" ? items.length : items.filter((i) => i.status === st).length;
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
        <div className="divide-y divide-[var(--border)] w-full">
          {filteredItems.map((item, index) => {
            const subSections = parseTopicSubSections(item);
            const isExpanded = expandedTopicIds.has(item.id);
            const completedSubSections = subSections.filter((s) => s.isCompleted).length;
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

            const itemCategory =
              item.category ||
              (Array.isArray(item.resources) && (item.resources[0] as { category?: string })?.category) ||
              "Core";

            const trueIndex = items.findIndex((i) => i.id === item.id);
            const displayIndex = trueIndex >= 0 ? trueIndex + 1 : index + 1;

            return (
              <div
                key={item.id}
                className="py-3.5 first:pt-0 last:pb-0 space-y-2 w-full group transition-all"
              >
                {/* Main Topic Row */}
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-0.5"
                      title={`Current: ${item.status}. Click to cycle.`}
                    >
                      {item.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                      ) : item.status === "in_progress" ? (
                        <Clock className="h-5 w-5 text-[var(--warning)] animate-pulse" />
                      ) : (
                        <Circle className="h-5 w-5 text-[var(--text-muted)]" />
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

                        {/* Topic title button - Clicking toggles sub-topic drawer */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className={`text-sm font-semibold text-left transition-colors hover:text-[var(--primary)] hover:underline truncate ${
                            item.status === "completed"
                              ? "text-[var(--text-muted)] line-through"
                              : "text-[var(--text)]"
                          }`}
                        >
                          {item.topic}
                        </button>

                        <span className="rounded-md bg-[var(--surface-muted)]/70 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] shrink-0">
                          {itemCategory}
                        </span>

                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            item.status === "completed"
                              ? "bg-[var(--success)]/15 text-[var(--success)]"
                              : item.status === "in_progress"
                                ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                                : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>

                        {/* Sub-sections count badge (clicking also toggles expansion) */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="flex items-center gap-1 rounded bg-[var(--primary)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors shrink-0"
                          title="Click to view and add sub-topics"
                        >
                          <FolderTree className="h-2.5 w-2.5" />
                          <span>
                            {completedSubSections}/{subSections.length} sub-topics
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-2.5 w-2.5 ml-0.5" />
                          ) : (
                            <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                          )}
                        </button>

                        {/* Badges for notes, code, links */}
                        {hasNotes && (
                          <span className="flex items-center gap-1 rounded bg-[var(--primary)]/10 px-1.5 py-0.2 text-[10px] font-medium text-[var(--primary)] shrink-0">
                            <BookOpen className="h-2.5 w-2.5" />
                            <span>Notes</span>
                          </span>
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

                      {item.notes && !isExpanded && (
                        <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1 italic font-sans">
                          {item.notes}
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
                      onClick={() => handleOpenStudyModal(item)}
                      className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-all shrink-0"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span>Study All</span>
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

                {/* Inline Sub-Topics Tree & Quick Adder Drawer */}
                {isExpanded && (
                  <div className="mt-3 pl-5 sm:pl-8 pr-1 space-y-2.5 border-l-2 border-[var(--primary)]/30 ml-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
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
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs hover:border-[var(--primary)]/30 transition-all group/sub"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Sub-topic toggle completion */}
                            <button
                              type="button"
                              onClick={() => handleToggleSubTopic(item, sub.id)}
                              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                              title={sub.isCompleted ? "Completed. Click to uncheck." : "Mark complete."}
                            >
                              {sub.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                              ) : (
                                <Circle className="h-4 w-4 text-[var(--text-muted)]" />
                              )}
                            </button>

                            <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
                              {sIdx + 1}.
                            </span>

                            <span
                              onClick={() => handleOpenStudyModal(item, sub.id)}
                              className={`font-semibold cursor-pointer hover:text-[var(--primary)] hover:underline truncate ${
                                sub.isCompleted
                                  ? "text-[var(--text-muted)] line-through"
                                  : "text-[var(--text)]"
                              }`}
                            >
                              {sub.title}
                            </span>

                            {/* Indicators */}
                            <div className="flex items-center gap-1 shrink-0">
                              {sub.notes && (
                                <span className="flex items-center gap-0.5 rounded bg-[var(--primary)]/10 px-1.5 py-0.2 text-[9px] font-medium text-[var(--primary)]">
                                  <BookOpen className="h-2 w-2" />
                                  <span>Notes</span>
                                </span>
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
    </div>
  );
}
