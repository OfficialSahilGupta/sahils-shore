"use client";

// ============================================================================
// Sahil's Shore: Blind 150 / NeetCode 150 Interactive Roadmap Tracker
// Curated list of top 150 algorithm questions with instant solve logging,
// completion metrics, topic filters, approach hints, and LeetCode deep-links.
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Circle,
  Search,
  BookOpen,
  X,
  Code2,
  Download,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { DsaProblem } from "@/types";
import {
  BLIND_150_LIST,
  calculateBlind150Stats,
  findMatchingUserProblem,
  type Blind150Problem,
} from "@/lib/dsa/blind150";
import { DSA_TOPICS, type DsaTopic, type DsaDifficulty } from "@/lib/dsa/constants";
import { Select } from "@/components/ui/select";
import type { CreateDsaProblemInput } from "@/lib/dsa";

interface Blind150TrackerProps {
  userProblems: DsaProblem[];
  onOpenSolveModal: (prefill: Partial<CreateDsaProblemInput>) => void;
  onQuickToggleSolved: (blind: Blind150Problem, currentProblem?: DsaProblem) => Promise<void>;
  onBatchImport: (unsolvedOnly: boolean) => Promise<void>;
}

export function Blind150Tracker({
  userProblems,
  onOpenSolveModal,
  onQuickToggleSolved,
  onBatchImport,
}: Blind150TrackerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedHintId, setExpandedHintId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Overall stats
  const stats = useMemo(() => {
    return calculateBlind150Stats(userProblems);
  }, [userProblems]);

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return BLIND_150_LIST.filter((b) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesTopic = b.topic.toLowerCase().includes(q);
        const matchesPattern = b.pattern.toLowerCase().includes(q);
        const matchesHints = b.hints.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTopic && !matchesPattern && !matchesHints) {
          return false;
        }
      }

      // Topic
      if (topicFilter !== "all" && b.topic !== topicFilter) {
        return false;
      }

      // Difficulty
      if (difficultyFilter !== "all" && b.difficulty !== difficultyFilter) {
        return false;
      }

      // Status
      const matchedUserProblem = findMatchingUserProblem(b, userProblems);
      const isSolved =
        matchedUserProblem &&
        ((matchedUserProblem.status || "").toLowerCase() === "solved" ||
          (matchedUserProblem.status || "").toLowerCase() === "mastered");

      if (statusFilter === "solved" && !isSolved) return false;
      if (statusFilter === "unsolved" && isSolved) return false;

      return true;
    });
  }, [searchQuery, topicFilter, difficultyFilter, statusFilter, userProblems]);

  const hasActiveFilters =
    searchQuery ||
    topicFilter !== "all" ||
    difficultyFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTopicFilter("all");
    setDifficultyFilter("all");
    setStatusFilter("all");
  };

  const handleBatchImportClick = async () => {
    if (
      !window.confirm(
        `Import ${BLIND_150_LIST.length - stats.solvedCount} unsolved Blind 150 problems into your DSA Tracker as "todo"?`
      )
    ) {
      return;
    }
    setIsImporting(true);
    try {
      await onBatchImport(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* 1. Header Progress Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-[var(--text)]">
                Blind 150 / NeetCode 150 Master Roadmap
              </h2>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)] max-w-xl">
              The 150 most frequently tested DSA patterns for top-tier tech interviews.
              Track your completion rate, practice intuition hints, and prefill solutions in 1 tap.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBatchImportClick}
              disabled={isImporting || stats.solvedCount === stats.total}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-50"
            >
              <Download className={`h-3.5 w-3.5 ${isImporting ? "animate-bounce" : ""}`} />
              <span>{isImporting ? "Importing..." : "Import Unsolved"}</span>
            </button>
          </div>
        </div>

        {/* Progress bar and badges */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)]">
              Overall Progress:{" "}
              <strong className="text-[var(--primary)]">
                {stats.solvedCount} / {stats.total}
              </strong>{" "}
              ({Math.round(stats.completionRate * 100)}%)
            </span>
            <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--text-muted)]">
              <span className="text-[var(--success)] font-medium">
                Easy: {stats.easySolved}/{stats.easyTotal}
              </span>
              <span className="text-[var(--warning)] font-medium">
                Medium: {stats.mediumSolved}/{stats.mediumTotal}
              </span>
              <span className="text-[var(--danger)] font-medium">
                Hard: {stats.hardSolved}/{stats.hardTotal}
              </span>
            </div>
          </div>

          {/* Stacked bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-warm)] transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(stats.completionRate * 100, 1)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Search & Responsive Filters */}
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search box with min-w-0 flex-1 */}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 150 problems by title, pattern, or intuition hints..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 pl-10 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {/* Filter dropdowns in a responsive flex wrap container */}
          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            {/* Topic Filter */}
            <Select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="text-xs"
              containerClassName="w-auto max-w-[160px]"
            >
              <option value="all">All Topics</option>
              {DSA_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            {/* Difficulty Filter */}
            <Select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="text-xs"
              containerClassName="w-auto max-w-[140px]"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs"
              containerClassName="w-auto max-w-[130px]"
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </Select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
                title="Reset filters"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Count */}
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]/60">
          <span>
            Showing <strong className="text-[var(--text)]">{filteredProblems.length}</strong> of{" "}
            {BLIND_150_LIST.length} problems
          </span>
          {hasActiveFilters && (
            <span className="text-[11px] text-[var(--primary)] font-medium">
              Filtered view
            </span>
          )}
        </div>
      </div>

      {/* 3. Problems Grid / List */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProblems.map((b) => {
          const userMatch = findMatchingUserProblem(b, userProblems);
          const isSolved =
            userMatch &&
            ((userMatch.status || "").toLowerCase() === "solved" ||
              (userMatch.status || "").toLowerCase() === "mastered");

          const isHintExpanded = expandedHintId === b.id;

          const diffColor =
            b.difficulty === "Easy"
              ? "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20"
              : b.difficulty === "Medium"
                ? "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20"
                : "text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20";

          return (
            <div
              key={b.id}
              className={`group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                isSolved
                  ? "border-[var(--success)]/30 bg-[var(--surface)] hover:border-[var(--success)]/60"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40 hover:shadow-xs"
              }`}
            >
              <div>
                {/* Header row: Order index, Difficulty, Status indicator */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                      #{b.orderIndex}
                    </span>
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${diffColor}`}
                    >
                      {b.difficulty}
                    </span>
                    <span className="truncate rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] font-medium">
                      {b.topic}
                    </span>
                  </div>

                  {/* 1-click Quick Solved toggle */}
                  <button
                    type="button"
                    onClick={() => onQuickToggleSolved(b, userMatch)}
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    title={isSolved ? "Mark as unsolved" : "Mark as solved"}
                  >
                    {isSolved ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--success)] fill-[var(--success)]/20" />
                    ) : (
                      <Circle className="h-4 w-4 hover:text-[var(--primary)]" />
                    )}
                  </button>
                </div>

                {/* Problem Title & LeetCode Link */}
                <div className="mt-2.5">
                  <a
                    href={b.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text)] hover:text-[var(--primary)] transition-colors group-hover:underline"
                  >
                    <span className="truncate">{b.title}</span>
                    <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
                  </a>
                </div>

                {/* Core Pattern & Complexity */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[var(--primary)] font-medium">
                    {b.pattern}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {b.timeComplexity} | {b.spaceComplexity}
                  </span>
                </div>

                {/* Expandable Intuition Hints */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedHintId(isHintExpanded ? null : b.id)
                    }
                    className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span>{isHintExpanded ? "Hide intuition" : "Approach hint"}</span>
                    <ChevronRight
                      className={`h-3 w-3 transition-transform ${
                        isHintExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {isHintExpanded && (
                    <div className="mt-1.5 rounded-xl border border-[var(--border)]/70 bg-[var(--surface-muted)]/30 p-2.5 text-xs text-[var(--text)] animate-in fade-in duration-150">
                      <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                        {b.hints}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-[var(--border)]/60 flex items-center justify-between gap-2">
                {isSolved ? (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--success)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mastered</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Not solved yet
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    onOpenSolveModal({
                      title: b.title,
                      link: b.link,
                      topic: b.topic,
                      difficulty: b.difficulty,
                      platform: "LeetCode",
                      time_complexity: b.timeComplexity,
                      space_complexity: b.spaceComplexity,
                      approach_notes: `${b.pattern}: ${b.hints}`,
                      status: "Solved",
                    })
                  }
                  className="flex items-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>{isSolved ? "Edit Code" : "Solve Now"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
