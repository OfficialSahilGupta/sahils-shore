"use client";

// ============================================================================
// Sahil's Shore: Concepts-Learned Log
// Quick capture for daily engineering breakthroughs and architectural learnings
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
} from "lucide-react";
import type { LearningConcept } from "@/types";
import { todayIST, formatFriendlyISTDate } from "@/lib/date-utils";

interface ConceptsLogProps {
  concepts: LearningConcept[];
  trackTitle?: string;
  onAddConcept: (input: { title: string; notes: string; learned_at?: string }) => Promise<void>;
  onDeleteConcept: (conceptId: string) => Promise<void>;
}

export function ConceptsLog({
  concepts,
  trackTitle,
  onAddConcept,
  onDeleteConcept,
}: ConceptsLogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dateStr, setDateStr] = useState(todayIST());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddConcept({
        title: title.trim(),
        notes: notes.trim(),
        learned_at: new Date(`${dateStr}T12:00:00Z`).toISOString(),
      });
      setTitle("");
      setNotes("");
      setDateStr(todayIST());
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, conceptTitle: string) => {
    if (!window.confirm(`Delete concept "${conceptTitle}"?`)) return;
    setDeletingId(id);
    try {
      await onDeleteConcept(id);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredConcepts = concepts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--surface-muted)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[var(--accent-warm)]" />
            Concepts-Learned Log {trackTitle ? `(${trackTitle})` : ""}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Capture daily breakthroughs, deep-dive learnings, and debugging insights
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all self-start sm:self-auto"
        >
          {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{isAdding ? "Cancel" : "Log Concept"}</span>
        </button>
      </div>

      {/* Add Concept Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4 space-y-3 animate-in fade-in duration-150"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Concept Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Database Index B-Trees, Java Record Immutability, React Server Actions..."
                className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Date Learned (IST)
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Detailed Notes & Learnings *
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn? How does it work? What are the key pitfalls or interview takeaways?"
              className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface)] p-3 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl border border-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !notes.trim()}
              className="rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Concept"}
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search learned concepts..."
          className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 pl-9 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      {/* Concepts List */}
      {filteredConcepts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--surface-muted)] p-8 text-center">
          <BookOpen className="mx-auto h-7 w-7 text-[var(--text-muted)] mb-2" />
          <h4 className="text-xs font-semibold text-[var(--text)]">
            No concepts logged yet
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Log concepts as you study to build your personal knowledge base.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--surface-muted)]">
          {filteredConcepts.map((concept) => (
            <div key={concept.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text)]">
                    {concept.title}
                  </span>
                  <span className="flex items-center gap-1 rounded bg-[var(--surface-muted)]/60 px-2 py-0.5 text-[10px] text-[var(--text-muted)] font-mono">
                    <Calendar className="h-3 w-3" />
                    {formatFriendlyISTDate(concept.learned_at)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={deletingId === concept.id}
                  onClick={() => handleDelete(concept.id, concept.title)}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed pl-1 border-l-2 border-[var(--primary)]/30">
                {concept.notes}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
