"use client";

// ============================================================================
// Sahil's Shore: Concepts-Learned Log
// Quick capture for daily engineering breakthroughs and architectural learnings
// with associated topic/area categorization and safe deletion protection.
// ============================================================================

import React, { useState } from "react";
import {
  Lightbulb,
  Plus,
  Calendar,
  Search,
  Trash2,
  Sparkles,
  BookOpen,
  X,
  Layers,
  Filter,
} from "lucide-react";
import type { LearningConcept } from "@/types";
import { todayIST, formatFriendlyISTDate } from "@/lib/date-utils";
import { SafeDeleteModal } from "./SafeDeleteModal";

interface ConceptsLogProps {
  concepts: LearningConcept[];
  trackTitle?: string;
  availableAreas?: string[];
  onAddConcept: (input: { title: string; notes: string; learned_at?: string }) => Promise<void>;
  onDeleteConcept: (conceptId: string) => Promise<void>;
}

export function ConceptsLog({
  concepts,
  trackTitle,
  availableAreas = [],
  onAddConcept,
  onDeleteConcept,
}: ConceptsLogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedArea, setSelectedArea] = useState(
    availableAreas[0] || "General Architecture"
  );
  const [customArea, setCustomArea] = useState("");
  const [notes, setNotes] = useState("");
  const [dateStr, setDateStr] = useState(todayIST());
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conceptToDelete, setConceptToDelete] = useState<LearningConcept | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;

    setIsSubmitting(true);
    const finalArea =
      selectedArea === "__custom__"
        ? customArea.trim() || "General"
        : selectedArea.trim() || "General";

    // Format title with area tag: [Area] Title
    const formattedTitle = `[${finalArea}] ${title.trim()}`;

    try {
      await onAddConcept({
        title: formattedTitle,
        notes: notes.trim(),
        learned_at: new Date(`${dateStr}T12:00:00Z`).toISOString(),
      });
      setTitle("");
      setNotes("");
      setCustomArea("");
      setDateStr(todayIST());
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to parse [Area] Title
  const parseConceptDisplay = (rawTitle: string) => {
    const match = rawTitle.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      return { area: match[1], cleanTitle: match[2] };
    }
    return { area: "General", cleanTitle: rawTitle };
  };

  // Extract distinct areas for filter chips
  const allAreas = Array.from(
    new Set(concepts.map((c) => parseConceptDisplay(c.title).area))
  );

  const filteredConcepts = concepts.filter((c) => {
    const { area, cleanTitle } = parseConceptDisplay(c.title);

    if (areaFilter !== "all" && area !== areaFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cleanTitle.toLowerCase().includes(q) ||
      area.toLowerCase().includes(q) ||
      c.notes.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[var(--accent-warm)]" />
            Concepts-Learned Log {trackTitle ? `(${trackTitle})` : ""}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Capture daily breakthroughs and assign them to specific architecture topics
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-all self-start sm:self-auto"
        >
          {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{isAdding ? "Cancel" : "Log Concept"}</span>
        </button>
      </div>

      {/* Add Concept Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4 space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Conceptual Breakthrough</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Area Selector */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Engineering Area / Topic *
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              >
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
                <option value="General Architecture">General Architecture</option>
                <option value="__custom__">+ Custom Area...</option>
              </select>

              {selectedArea === "__custom__" && (
                <input
                  type="text"
                  required
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder="Enter custom area name (e.g. Memory Profiling)..."
                  className="w-full mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  autoFocus
                />
              )}
            </div>

            {/* Title */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Concept Headline *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ThreadLocal Memory Leaks in Worker Pools..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            {/* Date */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Date Learned (IST)
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Deep-Dive Notes & Engineering Takeaways *
            </label>
            <textarea
              required
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn? How does this design work under the hood? What are the edge cases, invariants, or interview gotchas?"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text)] leading-relaxed focus:border-[var(--primary)] focus:outline-none resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !notes.trim()}
              className="rounded-xl bg-[var(--primary)] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Concept Log"}
            </button>
          </div>
        </form>
      )}

      {/* Search & Area Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, headlines, and notes..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 pl-9 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        {/* Area Filter Chips */}
        {allAreas.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setAreaFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 ${
                areaFilter === "all"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-muted)]/40 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              All Areas ({concepts.length})
            </button>
            {allAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setAreaFilter(area)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 ${
                  areaFilter === area
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-muted)]/40 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Concepts List */}
      {filteredConcepts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <BookOpen className="mx-auto h-7 w-7 text-[var(--text-muted)] mb-2 opacity-50" />
          <h4 className="text-xs font-semibold text-[var(--text)]">
            No concepts logged yet
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Capture daily breakthroughs and link them to topics as you study.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {filteredConcepts.map((concept) => {
            const { area, cleanTitle } = parseConceptDisplay(concept.title);

            return (
              <div key={concept.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2 group">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Area Badge */}
                    <span className="flex items-center gap-1 rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)] border border-[var(--primary)]/20">
                      <Layers className="h-2.5 w-2.5" />
                      <span>{area}</span>
                    </span>

                    <span className="text-sm font-bold text-[var(--text)]">
                      {cleanTitle}
                    </span>

                    <span className="flex items-center gap-1 rounded bg-[var(--surface-muted)]/60 px-2 py-0.5 text-[10px] text-[var(--text-muted)] font-mono">
                      <Calendar className="h-3 w-3" />
                      {formatFriendlyISTDate(concept.learned_at)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConceptToDelete(concept)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete concept"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed pl-3 border-l-2 border-[var(--primary)]/40 font-sans">
                  {concept.notes}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Safe Delete Modal for Concept */}
      {conceptToDelete && (
        <SafeDeleteModal
          isOpen={Boolean(conceptToDelete)}
          onClose={() => setConceptToDelete(null)}
          onConfirm={async () => {
            if (conceptToDelete) {
              await onDeleteConcept(conceptToDelete.id);
              setConceptToDelete(null);
            }
          }}
          title="Delete Concept Log"
          itemName={parseConceptDisplay(conceptToDelete.title).cleanTitle}
          itemType="concept"
          warningText={`This will permanently remove concept "${parseConceptDisplay(conceptToDelete.title).cleanTitle}" from your learning log.`}
        />
      )}
    </div>
  );
}
