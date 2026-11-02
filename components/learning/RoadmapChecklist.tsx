"use client";

// ============================================================================
// Sahil's Shore: Roadmap Checklist Component
// Interactive curriculum checklist with progress %, notes editor, and status toggles
// ============================================================================

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Save,
  Sparkles,
} from "lucide-react";
import type { LearningItem } from "@/types";
import { calculateRoadmapProgress } from "@/lib/learning";

interface RoadmapChecklistProps {
  items: LearningItem[];
  trackTitle: string;
  onToggleStatus: (
    itemId: string,
    newStatus: "planned" | "in_progress" | "completed"
  ) => Promise<void>;
  onUpdateNotes: (itemId: string, notes: string) => Promise<void>;
}

export function RoadmapChecklist({
  items,
  trackTitle,
  onToggleStatus,
  onUpdateNotes,
}: RoadmapChecklistProps) {
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});
  const [isSavingNote, setIsSavingNote] = useState<string | null>(null);

  const progress = calculateRoadmapProgress(items);

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

  const handleSaveNote = async (item: LearningItem) => {
    const noteText = editingNotes[item.id] !== undefined ? editingNotes[item.id] : (item.notes || "");
    setIsSavingNote(item.id);
    try {
      await onUpdateNotes(item.id, noteText);
    } finally {
      setIsSavingNote(null);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm space-y-5">
      {/* Progress Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--surface-muted)] pb-4 w-full">
        <div>
          <h3 className="text-base font-bold text-[var(--text)]">
            {trackTitle} Roadmap Checklist
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Step-by-step curriculum with progress tracking and revision notes
          </p>
        </div>

        {/* Progress Metric */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold font-mono text-[var(--text)]">
              {progress.completed} / {progress.total} topics
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {progress.percentage}% completed
            </div>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-xs font-mono">
            {progress.percentage}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div
          className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "in_progress", "planned", "completed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
              filter === f
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "border border-[var(--surface-muted)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/60"
            }`}
          >
            {f === "all" ? `All (${items.length})` : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Roadmap Items List */}
      {filteredItems.length === 0 ? (
        <div className="w-full rounded-xl border border-dashed border-[var(--surface-muted)] p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
          <h4 className="text-sm font-semibold text-[var(--text)]">
            No topics matching this filter
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Switch back to &ldquo;All&rdquo; to view the complete curriculum checklist.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--surface-muted)] w-full">
          {filteredItems.map((item, index) => {
            const isExpanded = expandedId === item.id;
            const noteValue =
              editingNotes[item.id] !== undefined
                ? editingNotes[item.id]
                : item.notes || "";

            const itemCategory =
              item.category ||
              (Array.isArray(item.resources) && (item.resources[0] as { category?: string })?.category) ||
              null;

            return (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2 w-full">
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
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
                        <span
                          className={`text-sm font-semibold transition-colors ${
                            item.status === "completed"
                              ? "text-[var(--text-muted)] line-through"
                              : "text-[var(--text)]"
                          }`}
                        >
                          {item.topic}
                        </span>
                        {itemCategory && (
                          <span className="rounded-md bg-[var(--surface-muted)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] shrink-0">
                            {itemCategory}
                          </span>
                        )}
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
                      </div>

                    {item.notes && !isExpanded && (
                      <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expand Notes Button */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex items-center gap-1 rounded-lg border border-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors shrink-0"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{isExpanded ? "Close" : "Notes"}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </div>

              {/* Notes Editor Drawer */}
              {isExpanded && (
                <div className="mt-2 rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-3 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-[var(--primary)]" />
                      Topic Summary & Key Learnings
                    </span>
                    <button
                      type="button"
                      disabled={isSavingNote === item.id}
                      onClick={() => handleSaveNote(item)}
                      className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      <Save className="h-3 w-3" />
                      <span>{isSavingNote === item.id ? "Saving..." : "Save Note"}</span>
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={noteValue}
                    onChange={(e) =>
                      setEditingNotes({
                        ...editingNotes,
                        [item.id]: e.target.value,
                      })
                    }
                    placeholder="Document architecture principles, gotchas, interview insights..."
                    className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface)] p-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-y"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
