"use client";

// ============================================================================
// Sahil's Shore: DSA Problem Add/Edit Modal
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Code2,
  ExternalLink,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import type { DsaProblem } from "@/types";
import {
  DSA_PLATFORMS,
  DSA_TOPICS,
  DSA_DIFFICULTIES,
  DSA_STATUSES,
  SUPPORTED_LANGUAGES,
  canonicalDsaTopic,
  type DsaDifficulty,
  type DsaStatus,
  type SupportedLanguage,
} from "@/lib/dsa/constants";
import type { CreateDsaProblemInput } from "@/lib/dsa";
import { CodeEditor } from "./CodeEditor";
import { Select } from "@/components/ui/select";

interface DsaProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (problemData: CreateDsaProblemInput, problemId?: string) => Promise<void>;
  initialProblem?: DsaProblem | null;
  prefill?: Partial<CreateDsaProblemInput> | null;
}

export function DsaProblemModal({
  isOpen,
  onClose,
  onSave,
  initialProblem,
  prefill,
}: DsaProblemModalProps) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [platform, setPlatform] = useState("LeetCode");
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState<DsaDifficulty>("Medium");
  const [status, setStatus] = useState<DsaStatus>("Solved");
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(30);
  const [timeComplexity, setTimeComplexity] = useState("O(N)");
  const [spaceComplexity, setSpaceComplexity] = useState("O(1)");
  const [approachNotes, setApproachNotes] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("java");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    if (initialProblem) {
      setTitle(initialProblem.title || "");
      setLink(initialProblem.link || "");
      setPlatform(initialProblem.platform || "LeetCode");
      setTopic(canonicalDsaTopic(initialProblem.topic || "Arrays"));
      setDifficulty((initialProblem.difficulty as DsaDifficulty) || "Medium");
      setStatus(
        (initialProblem.status as DsaStatus) ||
          (initialProblem.status === "solved" ? "Solved" : "Needs revision")
      );
      setTimeSpentMinutes(initialProblem.time_spent_minutes || 0);
      setTimeComplexity(initialProblem.time_complexity || "");
      setSpaceComplexity(initialProblem.space_complexity || "");
      setApproachNotes(initialProblem.approach_notes || "");
      setCodeSnippet(initialProblem.code_snippet || "");
      setLanguage((initialProblem.language as SupportedLanguage) || "java");
    } else if (prefill) {
      setTitle(prefill.title || "");
      setLink(prefill.link || "");
      setPlatform(prefill.platform || "LeetCode");
      setTopic(canonicalDsaTopic(prefill.topic || "Arrays"));
      setDifficulty((prefill.difficulty as DsaDifficulty) || "Medium");
      setStatus((prefill.status as DsaStatus) || "Solved");
      setTimeSpentMinutes(prefill.time_spent_minutes || 30);
      setTimeComplexity(prefill.time_complexity || "O(N)");
      setSpaceComplexity(prefill.space_complexity || "O(1)");
      setApproachNotes(prefill.approach_notes || "");
      setCodeSnippet(prefill.code_snippet || "");
      setLanguage((prefill.language as SupportedLanguage) || "java");
    } else {
      setTitle("");
      setLink("");
      setPlatform("LeetCode");
      setTopic("Arrays");
      setDifficulty("Medium");
      setStatus("Solved");
      setTimeSpentMinutes(30);
      setTimeComplexity("O(N)");
      setSpaceComplexity("O(1)");
      setApproachNotes("");
      setCodeSnippet("");
      setLanguage("java");
    }
  }, [initialProblem, prefill, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a problem title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSave(
        {
          title: title.trim(),
          link: link.trim() || null,
          platform,
          topic: canonicalDsaTopic(topic),
          difficulty,
          status,
          time_spent_minutes: Number(timeSpentMinutes) || 0,
          time_complexity: timeComplexity.trim() || null,
          space_complexity: spaceComplexity.trim() || null,
          approach_notes: approachNotes.trim() || null,
          code_snippet: codeSnippet || null,
          language,
        },
        initialProblem?.id
      );
      onClose();
    } catch (err: any) {
      console.error("Error saving DSA problem:", err);
      setErrorMessage(
        err?.message || "Failed to save problem. Please verify fields and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--surface-muted)] pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {initialProblem ? "Edit DSA Problem" : "Log DSA Problem"}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Track algorithm, complexity, CodeMirror snippet, and approach
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Platform */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Problem Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Trapping Rain Water, LRU Cache..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Platform
              </label>
              <Select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                size="md"
                containerClassName="w-full"
              >
                {DSA_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Link & Topic */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Problem URL
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://leetcode.com/problems/..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Topic
              </label>
              <Select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                size="md"
                containerClassName="w-full"
              >
                {DSA_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Difficulty & Status Selectors */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DSA_DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                      difficulty === d
                        ? d === "Easy"
                          ? "bg-[var(--success)] text-white shadow-sm"
                          : d === "Medium"
                            ? "bg-[var(--warning)] text-white shadow-sm"
                            : "bg-[var(--danger)] text-white shadow-sm"
                        : "border border-[var(--surface-muted)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/60"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DSA_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-xl py-2 text-xs font-medium transition-all ${
                      status === s
                        ? "bg-[var(--primary)] text-white shadow-sm font-semibold"
                        : "border border-[var(--surface-muted)] bg-[var(--surface-muted)]/30 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time Taken, Time Complexity, Space Complexity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time Taken (mins)
              </label>
              <input
                type="number"
                min="0"
                value={timeSpentMinutes}
                onChange={(e) => setTimeSpentMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Time Complexity
              </label>
              <input
                type="text"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                placeholder="e.g. O(N log N)"
                className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Space Complexity
              </label>
              <input
                type="text"
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                placeholder="e.g. O(1) or O(N)"
                className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Approach Notes */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Approach Notes (Key insights, edge cases)
            </label>
            <textarea
              rows={3}
              value={approachNotes}
              onChange={(e) => setApproachNotes(e.target.value)}
              placeholder="e.g. Used monotonic stack to track next greater elements. Handled duplicate values and empty array edge case..."
              className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-y"
            />
          </div>

          {/* Code Snippet with Language Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                <Code2 className="h-3 w-3" /> Solution Code
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Language:</span>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  size="sm"
                  containerClassName="w-28"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <CodeEditor
              value={codeSnippet}
              onChange={(val) => setCodeSnippet(val)}
              language={language}
              minHeight="180px"
              maxHeight="320px"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--surface-muted)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--surface-muted)] px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isSubmitting
                ? "Saving..."
                : initialProblem
                  ? "Update Problem"
                  : "Save Problem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
