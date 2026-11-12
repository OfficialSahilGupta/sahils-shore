"use client";

// ============================================================================
// Sahil's Shore: DSA Problem List (Search, Filters, Favorites, Expanded Notes)
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
  Star,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  GitBranch,
} from "lucide-react";
import type { DsaProblem } from "@/types";
import {
  DSA_TOPICS,
  DSA_DIFFICULTIES,
  DSA_PLATFORMS,
  DSA_STATUSES,
  canonicalDsaTopic,
  isSameDsaTopic,
} from "@/lib/dsa/constants";
import { parseDsaConceptMaps } from "@/lib/dsa/concept-map";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import { CodeEditor } from "./CodeEditor";
import { Select } from "@/components/ui/select";

function getPlatformBadgeStyle(platform: string | null | undefined) {
  const p = (platform || "").toLowerCase();
  if (p.includes("leetcode")) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25";
  }
  if (p.includes("codeforces")) {
    return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25";
  }
  if (p.includes("hackerrank")) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
  }
  if (p.includes("geeks")) {
    return "bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border-emerald-600/25";
  }
  return "bg-[var(--surface-muted)]/60 text-[var(--text-muted)] border-[var(--border)]";
}

interface DsaProblemListProps {
  problems: DsaProblem[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  onEdit: (problem: DsaProblem) => void;
  onDelete: (problemId: string) => Promise<void>;
  onToggleFavorite?: (problemId: string) => Promise<void>;
  onCleanStubs?: () => Promise<void>;
  stubsCount?: number;
  onOpenStudyNotes?: (problem: DsaProblem) => void;
}

export function DsaProblemList({
  problems,
  selectedTopic,
  onSelectTopic,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCleanStubs,
  stubsCount = 0,
  onOpenStudyNotes,
}: DsaProblemListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const favoritedCount = useMemo(() => {
    return problems.filter((p) => p.is_favorite).length;
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Starred only filter
      if (starredOnly && !p.is_favorite) {
        return false;
      }

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
      if (selectedTopic && selectedTopic !== "all" && !isSameDsaTopic(p.topic, selectedTopic)) {
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
    starredOnly,
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

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn("Failed to copy code snippet:", e);
    }
  };

  const hasActiveFilters =
    searchQuery ||
    selectedTopic ||
    starredOnly ||
    difficultyFilter !== "all" ||
    platformFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    onSelectTopic(null);
    setStarredOnly(false);
    setDifficultyFilter("all");
    setPlatformFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by title, intuition, complexity, topic..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 pl-10 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          {/* Starred Filter Button */}
          <button
            type="button"
            onClick={() => setStarredOnly(!starredOnly)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
              starredOnly
                ? "border-[var(--accent-warm)] bg-[var(--accent-warm)]/15 text-[var(--accent-warm)] shadow-2xs"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
            title="Filter Starred Problems"
          >
            <Star
              className={`h-3.5 w-3.5 ${
                starredOnly ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]" : ""
              }`}
            />
            <span>Starred</span>
            {favoritedCount > 0 && (
              <span className="rounded-full bg-[var(--surface-muted)] px-1.5 py-0.2 text-[10px] font-mono">
                {favoritedCount}
              </span>
            )}
          </button>

          {/* Topic Dropdown */}
          <Select
            value={selectedTopic || "all"}
            onChange={(e) =>
              onSelectTopic(e.target.value === "all" ? null : e.target.value)
            }
            size="sm"
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
            size="sm"
            containerClassName="w-auto max-w-[130px]"
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
            size="sm"
            containerClassName="w-auto max-w-[125px]"
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
            size="sm"
            containerClassName="w-auto max-w-[125px]"
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
              className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-2.5 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Stubs Cleanup Banner (if user previously imported empty 150 stubs) */}
      {stubsCount > 0 && onCleanStubs && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--primary)] shrink-0" />
            <span className="text-[var(--text)]">
              You have <strong>{stubsCount}</strong> empty Blind 150 placeholder rows in your solution list.
            </span>
          </div>
          <button
            type="button"
            onClick={onCleanStubs}
            className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity self-start sm:self-auto shrink-0"
          >
            Clean Up Empty Stubs
          </button>
        </div>
      )}

      {/* Results Count Summary */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
        <span>
          Showing <strong className="text-[var(--text)]">{filteredProblems.length}</strong> of{" "}
          {problems.length} problems
        </span>
        {starredOnly && (
          <span className="text-[var(--accent-warm)] font-medium">
            Filtered by Starred
          </span>
        )}
      </div>

      {/* Problem Cards List */}
      {filteredProblems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <Code2 className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
          <h4 className="text-sm font-semibold text-[var(--text)]">
            No problems found
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {hasActiveFilters
              ? "Try adjusting your search query or reset filters."
              : "Log your first problem to start building your algorithm notebook."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {filteredProblems.map((problem) => {
            const isCodeExpanded = expandedCodeId === problem.id;
            const conceptMapsCount = parseDsaConceptMaps(problem).length;
            const hasNotes = Boolean(problem.approach_notes && problem.approach_notes.trim().length > 0);
            const hasCode = Boolean(problem.code_snippet && problem.code_snippet.trim().length > 0);

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
                : statusNormalized === "needs revision" || statusNormalized === "revisit"
                  ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30"
                  : statusNormalized === "stuck"
                    ? "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30"
                    : "bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)]";

            const patternName =
              problem.revision_history &&
              typeof problem.revision_history === "object" &&
              !Array.isArray(problem.revision_history) &&
              (problem.revision_history as Record<string, any>).pattern
                ? (problem.revision_history as Record<string, any>).pattern
                : null;

            return (
              <div
                key={problem.id}
                className={`p-3.5 sm:p-4 space-y-2.5 w-full group transition-all duration-200 rounded-2xl border border-l-4 hover:-translate-y-0.5 hover:shadow-md ${
                  statusNormalized === "solved" || statusNormalized === "mastered"
                    ? "border-l-[var(--success)] border-t-[var(--success)]/25 border-r-[var(--success)]/25 border-b-[var(--success)]/25 bg-[var(--surface)] hover:bg-[var(--success)]/[0.04] shadow-2xs"
                    : statusNormalized === "needs revision" || statusNormalized === "revisit"
                      ? "border-l-[var(--warning)] border-t-[var(--warning)]/25 border-r-[var(--warning)]/25 border-b-[var(--warning)]/25 bg-[var(--surface)] hover:bg-[var(--warning)]/[0.04] shadow-2xs"
                      : statusNormalized === "stuck"
                        ? "border-l-[var(--danger)] border-t-[var(--danger)]/25 border-r-[var(--danger)]/25 border-b-[var(--danger)]/25 bg-[var(--surface)] hover:bg-[var(--danger)]/[0.04] shadow-2xs"
                        : "border-[var(--border)] border-l-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]/20 hover:border-[var(--primary)]/40 shadow-2xs"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Star Favorite Button */}
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(problem.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--accent-warm)] transition-colors p-0.5"
                          title={problem.is_favorite ? "Starred" : "Star problem"}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              problem.is_favorite
                                ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]"
                                : ""
                            }`}
                          />
                        </button>
                      )}

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

                      {/* Problem Title Button - click opens Full Page Study Notes */}
                      <button
                        type="button"
                        onClick={() =>
                          onOpenStudyNotes ? onOpenStudyNotes(problem) : onEdit(problem)
                        }
                        className="text-sm font-semibold text-left text-[var(--text)] hover:text-[var(--primary)] hover:underline transition-colors truncate"
                        title="Click to open full-page Markdown study notes & diagrams"
                      >
                        {problem.title}
                      </button>

                      {problem.link && (
                        <a
                          href={problem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors shrink-0"
                          title="Open problem link in new tab"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {/* Badges for notes, diagrams, code */}
                      {hasNotes && onOpenStudyNotes && (
                        <button
                          type="button"
                          onClick={() => onOpenStudyNotes(problem)}
                          className="flex items-center gap-1 rounded bg-[var(--primary)]/10 px-1.5 py-0.2 text-[10px] font-medium text-[var(--primary)] shrink-0 hover:bg-[var(--primary)]/20 transition-colors cursor-pointer"
                          title="Click to open study notes"
                        >
                          <FileText className="h-2.5 w-2.5" />
                          <span>Notes</span>
                        </button>
                      )}

                      {conceptMapsCount > 0 && onOpenStudyNotes && (
                        <button
                          type="button"
                          onClick={() => onOpenStudyNotes(problem)}
                          className="flex items-center gap-1 rounded bg-[var(--primary)]/15 px-1.5 py-0.2 text-[10px] font-semibold text-[var(--primary)] shrink-0 hover:bg-[var(--primary)]/25 transition-colors border border-[var(--primary)]/20 cursor-pointer"
                          title={`Contains ${conceptMapsCount} visual diagram${conceptMapsCount > 1 ? "s" : ""}`}
                        >
                          <ImageIcon className="h-2.5 w-2.5" />
                          <span>{conceptMapsCount} {conceptMapsCount === 1 ? "diagram" : "diagrams"}</span>
                        </button>
                      )}

                      {hasCode && (
                        <span className="flex items-center gap-1 rounded bg-[var(--primary)]/10 px-1.5 py-0.2 text-[10px] font-medium text-[var(--primary)] shrink-0">
                          <Code2 className="h-2.5 w-2.5" />
                          <span>Code</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-muted)]">
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-medium ${getPlatformBadgeStyle(
                          problem.platform
                        )}`}
                      >
                        {problem.platform}
                      </span>
                      <span className="rounded bg-[var(--surface-muted)]/60 px-2 py-0.5 text-[10px] font-medium border border-[var(--border)]">
                        {canonicalDsaTopic(problem.topic)}
                      </span>
                      {patternName && (
                        <span className="flex items-center gap-1 rounded-md border border-[var(--primary)]/25 bg-[var(--primary)]/5 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                          <GitBranch className="h-2.5 w-2.5" />
                          <span>{patternName}</span>
                        </span>
                      )}
                      {problem.time_spent_minutes && problem.time_spent_minutes > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium">
                          <Clock className="h-3 w-3" />
                          {problem.time_spent_minutes}m
                        </span>
                      ) : null}
                      {problem.time_complexity && (
                        <span className="rounded bg-[var(--primary)]/10 px-1.5 py-0.5 text-[10px] font-mono text-[var(--primary)] font-medium">
                          Time: {problem.time_complexity}
                        </span>
                      )}
                      {problem.space_complexity && (
                        <span className="rounded bg-[var(--primary)]/10 px-1.5 py-0.5 text-[10px] font-mono text-[var(--primary)] font-medium">
                          Space: {problem.space_complexity}
                        </span>
                      )}
                      {problem.next_revision_at && (
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-medium">
                          <Calendar className="h-3 w-3" />
                          Revise: {formatFriendlyISTDate(problem.next_revision_at)} ({problem.revision_interval_days || 1}d)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {onOpenStudyNotes && (
                      <button
                        type="button"
                        onClick={() => onOpenStudyNotes(problem)}
                        className="flex items-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary)]/15 to-[var(--primary)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/20 hover:shadow-xs transition-all shrink-0 shadow-2xs"
                        title="Open beautiful full-page Markdown study notes & diagrams"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Study Notes</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCodeId(isCodeExpanded ? null : problem.id)
                      }
                      className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isCodeExpanded
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/40 hover:text-[var(--text)]"
                      }`}
                      title="Quick Preview Notebook View"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">{isCodeExpanded ? "Close" : "Preview"}</span>
                      {isCodeExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(problem)}
                      className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] hover:text-[var(--primary)] transition-all shrink-0"
                      title="Quick Edit Fields"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === problem.id}
                      onClick={() => handleDelete(problem.id, problem.title)}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] hover:border-[var(--danger)]/30 disabled:opacity-50 transition-colors"
                      title="Delete Problem"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsed Approach Preview */}
                {problem.approach_notes && !isCodeExpanded && (
                  <p
                    onClick={() =>
                      onOpenStudyNotes ? onOpenStudyNotes(problem) : onEdit(problem)
                    }
                    className="text-xs text-[var(--text-muted)] line-clamp-2 pl-6 italic cursor-pointer hover:text-[var(--primary)] transition-colors"
                    title="Click to open full-page study notes"
                  >
                    {problem.approach_notes.replace(/[#*`_~>-]/g, "").trim()}
                  </p>
                )}

                {/* Expanded Engineering Notebook View */}
                {isCodeExpanded && (
                  <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-4 space-y-4 animate-in fade-in duration-150">
                    {problem.approach_notes && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                            <span>Engineering Notes & Intuition</span>
                          </h5>
                          <button
                            type="button"
                            onClick={() => onEdit(problem)}
                            className="text-[11px] text-[var(--primary)] hover:underline"
                          >
                            Edit notes
                          </button>
                        </div>
                        <div className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface)] p-3.5 text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed font-sans">
                          {problem.approach_notes}
                        </div>
                      </div>
                    )}

                    {problem.code_snippet ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                            <Code2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                            <span>Solution Code ({problem.language || "java"})</span>
                          </h5>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyCode(problem.id, problem.code_snippet || "")
                              }
                              className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                            >
                              {copiedId === problem.id ? (
                                <Check className="h-3 w-3 text-[var(--success)]" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>{copiedId === problem.id ? "Copied" : "Copy Code"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onEdit(problem)}
                              className="text-[11px] text-[var(--primary)] hover:underline"
                            >
                              Edit code
                            </button>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                          <CodeEditor
                            value={problem.code_snippet}
                            readOnly={true}
                            language={problem.language || "java"}
                            minHeight="180px"
                            maxHeight="360px"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] p-3 text-xs text-[var(--text-muted)]">
                        <span>No solution code saved for this problem yet.</span>
                        <button
                          type="button"
                          onClick={() => onEdit(problem)}
                          className="text-[var(--primary)] font-semibold hover:underline"
                        >
                          + Add Code
                        </button>
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
