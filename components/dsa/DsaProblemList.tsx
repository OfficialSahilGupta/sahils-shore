"use client";

// ============================================================================
// Sahil's Shore: DSA Problem List (Search, Filters, and Table/Cards)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  Search,
  ExternalLink,
  Code2,
  BookOpen,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { DsaProblem } from "@/types";
import {
  DSA_TOPICS,
  DSA_DIFFICULTIES,
  DSA_PLATFORMS,
  DSA_STATUSES,
} from "@/lib/dsa/constants";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import { CodeEditor } from "./CodeEditor";
import { Select } from "@/components/ui/select";

interface DsaProblemListProps {
  problems: DsaProblem[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  onEdit: (problem: DsaProblem) => void;
  onDelete: (problemId: string) => Promise<void>;
}

export function DsaProblemList({
  problems,
  selectedTopic,
  onSelectTopic,
  onEdit,
  onDelete,
}: DsaProblemListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesTopic = (p.topic || "").toLowerCase().includes(query);
        const matchesPlatform = (p.platform || "").toLowerCase().includes(query);
        const matchesNotes = (p.approach_notes || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesTopic && !matchesPlatform && !matchesNotes) {
          return false;
        }
      }

      // Topic filter
      if (selectedTopic && p.topic !== selectedTopic) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) {
        return false;
      }

      // Platform filter
      if (platformFilter !== "all" && p.platform !== platformFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const s = (p.status || "").toLowerCase();
        const filter = statusFilter.toLowerCase();
        if (s !== filter) return false;
      }

      return true;
    });
  }, [
    problems,
    searchQuery,
    selectedTopic,
    difficultyFilter,
    platformFilter,
    statusFilter,
  ]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters =
    searchQuery ||
    selectedTopic ||
    difficultyFilter !== "all" ||
    platformFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    onSelectTopic(null);
    setDifficultyFilter("all");
    setPlatformFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by title, approach, topic..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 pl-10 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        {/* Filter dropdowns in a safe, non-outflowing flex wrap row */}
        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          {/* Topic Dropdown */}
          <Select
            value={selectedTopic || "all"}
            onChange={(e) =>
              onSelectTopic(e.target.value === "all" ? null : e.target.value)
            }
            className="text-xs"
            containerClassName="w-auto max-w-[150px]"
          >
            <option value="all">All Topics</option>
            {DSA_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          {/* Difficulty Dropdown */}
          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="text-xs"
            containerClassName="w-auto max-w-[135px]"
          >
            <option value="all">All Difficulties</option>
            {DSA_DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>

          {/* Platform Dropdown */}
          <Select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs"
            containerClassName="w-auto max-w-[130px]"
          >
            <option value="all">All Platforms</option>
            {DSA_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>

          {/* Status Dropdown */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs"
            containerClassName="w-auto max-w-[130px]"
          >
            <option value="all">All Statuses</option>
            {DSA_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
        <span>
          Showing <strong className="text-[var(--text)]">{filteredProblems.length}</strong> of{" "}
          {problems.length} problems
        </span>
      </div>

      {/* Problem Cards List */}
      {filteredProblems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--surface-muted)] p-8 text-center">
          <Code2 className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
          <h4 className="text-sm font-semibold text-[var(--text)]">
            No problems found
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {hasActiveFilters
              ? "Try adjusting your search query or filters."
              : "Log your first problem to start building your algorithm mastery."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--surface-muted)]">
          {filteredProblems.map((problem) => {
            const isCodeExpanded = expandedCodeId === problem.id;
            const diffClass =
              problem.difficulty === "Easy"
                ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                : problem.difficulty === "Medium"
                  ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30"
                  : "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30";

            const statusNormalized = (problem.status || "").toLowerCase();
            const statusClass =
              statusNormalized === "solved" || statusNormalized === "mastered"
                ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                : statusNormalized === "needs revision"
                  ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30"
                  : statusNormalized === "stuck"
                    ? "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30"
                    : "bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--surface-muted)]";

            return (
              <div key={problem.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${diffClass}`}
                      >
                        {problem.difficulty}
                      </span>

                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}
                      >
                        {problem.status}
                      </span>

                      {problem.link ? (
                        <a
                          href={problem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[var(--text)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors group"
                        >
                          <span>{problem.title}</span>
                          <ExternalLink className="h-3 w-3 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-[var(--text)]">
                          {problem.title}
                        </span>
                      )}
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-muted)]">
                      <span className="rounded bg-[var(--surface-muted)]/50 px-2 py-0.5 text-[10px] font-medium">
                        {problem.platform}
                      </span>
                      <span className="rounded bg-[var(--surface-muted)]/50 px-2 py-0.5 text-[10px] font-medium">
                        {problem.topic}
                      </span>
                      {problem.time_spent_minutes && problem.time_spent_minutes > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium">
                          <Clock className="h-3 w-3" />
                          {problem.time_spent_minutes}m
                        </span>
                      ) : null}
                      {problem.time_complexity && (
                        <span className="rounded bg-[var(--primary-soft)]/20 px-1.5 py-0.5 text-[10px] font-mono text-[var(--primary)]">
                          Time: {problem.time_complexity}
                        </span>
                      )}
                      {problem.space_complexity && (
                        <span className="rounded bg-[var(--primary-soft)]/20 px-1.5 py-0.5 text-[10px] font-mono text-[var(--primary)]">
                          Space: {problem.space_complexity}
                        </span>
                      )}
                      {problem.next_revision_at && (
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <Calendar className="h-3 w-3" />
                          Revise: {formatFriendlyISTDate(problem.next_revision_at)} ({problem.revision_interval_days || 1}d)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {problem.code_snippet && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCodeId(isCodeExpanded ? null : problem.id)
                        }
                        className="flex items-center gap-1 rounded-lg border border-[var(--surface-muted)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/40 transition-colors"
                        title="Toggle Code Snippet"
                      >
                        <Code2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                        <span>Code</span>
                        {isCodeExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEdit(problem)}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)] transition-colors"
                      title="Edit Problem"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === problem.id}
                      onClick={() => handleDelete(problem.id, problem.title)}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] disabled:opacity-50 transition-colors"
                      title="Delete Problem"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Approach Notes Preview */}
                {problem.approach_notes && !isCodeExpanded && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 pl-1 italic">
                    Approach: {problem.approach_notes}
                  </p>
                )}

                {/* Expanded Code & Approach View */}
                {isCodeExpanded && (
                  <div className="mt-2 rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-3.5 space-y-3 animate-in fade-in duration-150">
                    {problem.approach_notes && (
                      <div>
                        <h5 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Approach & Notes
                        </h5>
                        <p className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                          {problem.approach_notes}
                        </p>
                      </div>
                    )}

                    {problem.code_snippet && (
                      <div>
                        <CodeEditor
                          value={problem.code_snippet}
                          readOnly={true}
                          language={problem.language || "java"}
                          minHeight="140px"
                          maxHeight="300px"
                        />
                      </div>
                    )}
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
