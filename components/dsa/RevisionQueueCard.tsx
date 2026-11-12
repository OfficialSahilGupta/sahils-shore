"use client";

// ============================================================================
// Sahil's Shore: Spaced-Repetition Revision Queue ("Revise Today")
// ============================================================================

import React, { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ThumbsUp,
  RotateCcw,
  Code2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
} from "lucide-react";
import type { DsaProblem } from "@/types";
import { CodeEditor } from "./CodeEditor";

interface RevisionQueueCardProps {
  problems: DsaProblem[];
  onRate: (problem: DsaProblem, rating: "Easy" | "Hard") => Promise<void>;
  onEdit: (problem: DsaProblem) => void;
  onOpenStudyNotes?: (problem: DsaProblem) => void;
}

export function RevisionQueueCard({
  problems,
  onRate,
  onEdit,
  onOpenStudyNotes,
}: RevisionQueueCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingId, setRatingId] = useState<string | null>(null);

  const handleRate = async (problem: DsaProblem, rating: "Easy" | "Hard") => {
    setRatingId(problem.id);
    try {
      await onRate(problem, rating);
    } finally {
      setRatingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (problems.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)]/10 text-[var(--success)]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Revise Today (0 due)
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              All spaced-repetition revisions are caught up! Keep solving new problems.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-warm)]/15 text-[var(--accent-warm)]">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Revise Today
              </h3>
              <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                {problems.length} due
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Spaced repetition (1, 3, 7, 14, 30 days) • Rate Easy to extend interval, Hard to reset
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[var(--surface-muted)]">
        {problems.map((problem) => {
          const isExpanded = expandedId === problem.id;
          const isProcessing = ratingId === problem.id;
          const interval = problem.revision_interval_days || 1;

          return (
            <div key={problem.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      problem.difficulty === "Easy"
                        ? "bg-[var(--success)]"
                        : problem.difficulty === "Medium"
                          ? "bg-[var(--warning)]"
                          : "bg-[var(--danger)]"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenStudyNotes ? onOpenStudyNotes(problem) : onEdit(problem)
                        }
                        className="text-sm font-semibold text-left text-[var(--text)] hover:text-[var(--primary)] hover:underline transition-colors"
                        title="Click to open study notes & diagrams"
                      >
                        {problem.title}
                      </button>
                      <span className="rounded-md bg-[var(--surface-muted)]/60 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                        {problem.platform}
                      </span>
                      <span className="rounded-md bg-[var(--surface-muted)]/60 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                        {problem.topic}
                      </span>
                      {problem.time_complexity && (
                        <span className="rounded-md bg-[var(--primary-soft)]/20 px-1.5 py-0.5 text-[10px] font-mono text-[var(--primary)]">
                          {problem.time_complexity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-muted)]">
                      <span>Interval: <strong className="text-[var(--text)]">{interval}d</strong></span>
                      <span>•</span>
                      <span>Revised {problem.revision_count || 0} times</span>
                    </div>
                  </div>
                </div>

                {/* Rating Actions & Toggle */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {onOpenStudyNotes && (
                    <button
                      type="button"
                      onClick={() => onOpenStudyNotes(problem)}
                      className="flex items-center gap-1 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
                      title="Open full-page Study Notes & Code"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Study Notes</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleExpand(problem.id)}
                    className="flex items-center gap-1 rounded-lg border border-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span>Peek</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleRate(problem, "Hard")}
                    className="flex items-center gap-1 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/20 disabled:opacity-50 transition-colors"
                    title="Reset interval to 1 day"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Hard (1d)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleRate(problem, "Easy")}
                    className="flex items-center gap-1 rounded-lg bg-[var(--success)] px-3 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                    title="Advance to next interval (3d, 7d, 14d, 30d)"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span>Easy</span>
                  </button>
                </div>
              </div>

              {/* Expandable Peek View (Approach & Code snippet) */}
              {isExpanded && (
                <div className="mt-2 rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-3 space-y-3 animate-in fade-in duration-150">
                  {problem.approach_notes ? (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> Approach & Key Idea
                      </h4>
                      <p className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                        {problem.approach_notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs italic text-[var(--text-muted)]">
                      No approach notes recorded.
                    </p>
                  )}

                  {problem.code_snippet && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Code2 className="h-3 w-3" /> Code Solution ({problem.language || "Java"})
                      </h4>
                      <CodeEditor
                        value={problem.code_snippet}
                        readOnly={true}
                        language={problem.language || "java"}
                        minHeight="140px"
                        maxHeight="250px"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onEdit(problem)}
                      className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Edit Problem Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
