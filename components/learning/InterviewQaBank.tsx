"use client";

// ============================================================================
// Sahil's Shore: Interview Q&A Bank
// Technical interview questions with confidence scoring (1-5), tags, and mock mode
// ============================================================================

import React, { useState } from "react";
import {
  HelpCircle,
  Plus,
  Search,
  Star,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import type { InterviewQa } from "@/types";
import type { CreateInterviewQaInput } from "@/lib/learning";
import { MockInterviewModal } from "./MockInterviewModal";
import { Select } from "@/components/ui/select";

interface InterviewQaBankProps {
  questions: InterviewQa[];
  activeTrackId: string | null;
  onAddQuestion: (input: CreateInterviewQaInput) => Promise<void>;
  onUpdateConfidence: (qaId: string, confidence: number) => Promise<void>;
  onDeleteQuestion: (qaId: string) => Promise<void>;
}

export function InterviewQaBank({
  questions,
  activeTrackId,
  onAddQuestion,
  onUpdateConfidence,
  onDeleteQuestion,
}: InterviewQaBankProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);

  // Form state
  const [technology, setTechnology] = useState("General");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [tagsInput, setTagsInput] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(questions.flatMap((q) => q.tags || []))
  ).sort();

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onAddQuestion({
        track_id: activeTrackId,
        technology: technology.trim() || "General",
        question: question.trim(),
        answer: answer.trim(),
        difficulty,
        tags,
        confidence,
      });
      setQuestion("");
      setAnswer("");
      setTagsInput("");
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, qText: string) => {
    if (!window.confirm(`Delete question "${qText.slice(0, 40)}..."?`)) return;
    setDeletingId(id);
    try {
      await onDeleteQuestion(id);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesQ = q.question.toLowerCase().includes(query);
      const matchesA = q.answer.toLowerCase().includes(query);
      const matchesTech = q.technology.toLowerCase().includes(query);
      if (!matchesQ && !matchesA && !matchesTech) return false;
    }

    // Confidence filter
    if (confidenceFilter === "low" && (q.confidence || 3) > 2) return false;
    if (confidenceFilter === "medium" && (q.confidence || 3) !== 3) return false;
    if (confidenceFilter === "high" && (q.confidence || 3) < 4) return false;

    // Tag filter
    if (selectedTag && !(q.tags || []).includes(selectedTag)) return false;

    return true;
  });

  return (
    <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--surface-muted)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[var(--primary)]" />
            Interview Q&A Bank
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Technical interview questions, answers, and 1-5 star confidence ratings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMockModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--accent-warm)]/40 bg-[var(--accent-warm)]/10 px-3.5 py-2 text-xs font-semibold text-[var(--accent-warm)] hover:bg-[var(--accent-warm)]/20 transition-all shadow-sm"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Mock Interview Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Search & Confidence Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between min-w-0 max-w-full">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, technologies, answers..."
            className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 pl-10 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          {(["all", "low", "medium", "high"] as const).map((cf) => (
            <button
              key={cf}
              type="button"
              onClick={() => setConfidenceFilter(cf)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                confidenceFilter === cf
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "border border-[var(--surface-muted)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/60"
              }`}
            >
              {cf === "all"
                ? `All (${questions.length})`
                : cf === "low"
                  ? "Needs Practice (1-2 Stars)"
                  : cf === "medium"
                    ? "Medium (3 Stars)"
                    : "Confident (4-5 Stars)"}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-[var(--text-muted)] mr-1">
            Tags:
          </span>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                  isSelected
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "bg-[var(--surface-muted)]/60 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {tag}
              </button>
            );
          })}
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="text-[10px] text-[var(--primary)] hover:underline ml-1"
            >
              Clear tag
            </button>
          )}
        </div>
      )}

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--surface-muted)] p-8 text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
          <h4 className="text-sm font-semibold text-[var(--text)]">
            No interview questions found
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add custom interview questions or reset your filters.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--surface-muted)]">
          {filteredQuestions.map((q) => {
            const isExpanded = expandedId === q.id;
            const currentConf = q.confidence || 3;

            return (
              <div key={q.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                        {q.technology}
                      </span>
                      {q.difficulty && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            q.difficulty === "Easy"
                              ? "bg-[var(--success)]/15 text-[var(--success)]"
                              : q.difficulty === "Hard"
                                ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                                : "bg-[var(--warning)]/15 text-[var(--warning)]"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      )}
                      {q.tags &&
                        q.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-[var(--surface-muted)]/60 px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                          >
                            {t}
                          </span>
                        ))}
                    </div>

                    <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
                      {q.question}
                    </h4>
                  </div>

                  {/* Actions: Confidence Stars & Accordion toggle */}
                  <div className="flex items-center gap-3 self-end sm:self-start shrink-0">
                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5" title="Confidence rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => onUpdateConfidence(q.id, star)}
                          className="p-0.5 hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              star <= currentConf
                                ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]"
                                : "text-[var(--surface-muted)]"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Toggle Answer */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="flex items-center gap-1 rounded-lg border border-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
                    >
                      <span>{isExpanded ? "Hide" : "Answer"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === q.id}
                      onClick={() => handleDelete(q.id, q.question)}
                      className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Answer Drawer */}
                {isExpanded && (
                  <div className="mt-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4 text-xs text-[var(--text)] leading-relaxed whitespace-pre-wrap animate-in fade-in duration-150">
                    <strong className="block text-[11px] font-bold uppercase tracking-wider text-[var(--primary)] mb-1">
                      Model Answer:
                    </strong>
                    {q.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Question Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--surface-muted)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--text)]">
                Add Interview Question
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Technology *
                  </label>
                  <input
                    type="text"
                    required
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                    placeholder="e.g. Spring Boot, React, Kafka..."
                    className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Difficulty
                  </label>
                  <Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    size="md"
                    containerClassName="w-full"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Question *
                </label>
                <textarea
                  required
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. How does the Spring Security filter chain handle stateless JWT authentication?"
                  className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-2.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Model Answer *
                </label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Detailed breakdown, architectural explanation, trade-offs, and examples..."
                  className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-2.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Security, JWT, Architecture..."
                    className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Initial Confidence (1-5)
                  </label>
                  <div className="flex items-center gap-1 pt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setConfidence(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= confidence
                              ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]"
                              : "text-[var(--surface-muted)]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--surface-muted)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-[var(--surface-muted)] px-3.5 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !question.trim() || !answer.trim()}
                  className="rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mock Interview Modal */}
      <MockInterviewModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        questions={questions}
        onUpdateConfidence={onUpdateConfidence}
      />
    </div>
  );
}
