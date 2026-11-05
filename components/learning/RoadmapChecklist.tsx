"use client";

// ============================================================================
// Sahil's Shore: Roadmap Checklist Component
// Interactive curriculum checklist with dynamic multi-pillar mastery scoring,
// full topic study workspace integration, and custom topic management.
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
  FolderGit2,
  HelpCircle,
  Lightbulb,
  FolderTree,
} from "lucide-react";
import type { LearningItem, Json } from "@/types";
import { type TrackMasteryBreakdown, parseTopicSubSections } from "@/lib/learning";
import { TopicStudyModal } from "./TopicStudyModal";
import { AddTopicModal } from "./AddTopicModal";

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
    }
  ) => Promise<void>;
  onAddTopic: (input: {
    topic: string;
    category: string;
    notes?: string;
    status: "planned" | "in_progress" | "completed";
  }) => Promise<void>;
  onDeleteTopic?: (itemId: string) => Promise<void>;
}

export function RoadmapChecklist({
  items,
  trackTitle,
  masteryBreakdown,
  onToggleStatus,
  onUpdateTopic,
  onAddTopic,
  onDeleteTopic,
}: RoadmapChecklistProps) {
  const [filter, setFilter] = useState<string>("all");
  const [selectedItemForStudy, setSelectedItemForStudy] = useState<LearningItem | null>(null);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

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

  const overallScore = masteryBreakdown?.overallScore ?? 0;
  const tier = masteryBreakdown?.masteryTier ?? "Beginner";

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-5">
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
            Holistic mastery based on curriculum progression, detailed notes, concepts logged, and projects
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

      {/* Dynamic Mastery Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallScore >= 80
                ? "bg-[var(--success)]"
                : overallScore >= 40
                  ? "bg-[var(--primary)]"
                  : "bg-[var(--accent-warm)]"
            }`}
            style={{ width: `${overallScore}%` }}
          />
        </div>

        {/* Sub-Pillars Quick Badges */}
        {masteryBreakdown && (
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-[var(--primary)]" />
                <span>Curriculum: {masteryBreakdown.curriculumScore}%</span>
              </span>
              <span className="flex items-center gap-1">
                <FolderGit2 className="h-3 w-3 text-[#2E9E6B]" />
                <span>Projects: {masteryBreakdown.projectsScore}%</span>
              </span>
              <span className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-[#E0A458]" />
                <span>Concepts: {masteryBreakdown.conceptsCount} logged</span>
              </span>
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-[#9D4EDD]" />
                <span>Interview: {masteryBreakdown.interviewScore}%</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Controls: Filter Pills and + Add Topic Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "in_progress", "planned", "completed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "border border-[var(--border)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/60"
              }`}
            >
              {f === "all" ? `All (${items.length})` : f.replace("_", " ")}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsAddTopicOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity self-start sm:self-auto shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Topic</span>
        </button>
      </div>

      {/* Roadmap Items List */}
      {filteredItems.length === 0 ? (
        <div className="w-full rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
          <h4 className="text-sm font-semibold text-[var(--text)]">
            No topics matching this filter
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Switch back to &ldquo;All&rdquo; or click &ldquo;Add Topic&rdquo; to customize this curriculum.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)] w-full">
          {filteredItems.map((item, index) => {
            const subSections = parseTopicSubSections(item);
            const hasMultipleSubSections = subSections.length > 1;
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

            return (
              <div
                key={item.id}
                className="py-3.5 first:pt-0 last:pb-0 space-y-2 w-full group transition-all"
              >
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
                        <span className="text-xs font-mono text-[var(--text-muted)] shrink-0">
                          #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedItemForStudy(item)}
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

                        {/* Sub-sections count badge */}
                        {hasMultipleSubSections && (
                          <span className="flex items-center gap-1 rounded bg-[var(--primary)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
                            <FolderTree className="h-2.5 w-2.5" />
                            <span>
                              {completedSubSections}/{subSections.length} sub-sections
                            </span>
                          </span>
                        )}

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

                      {item.notes && (
                        <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1 italic font-sans">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Study & Notes Workspace Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedItemForStudy(item)}
                    className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-all shrink-0"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>Study & Notes</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Topic Study Modal */}
      {selectedItemForStudy && (
        <TopicStudyModal
          isOpen={Boolean(selectedItemForStudy)}
          onClose={() => setSelectedItemForStudy(null)}
          item={selectedItemForStudy}
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
        onAddTopic={onAddTopic}
      />
    </div>
  );
}
