"use client";

// ============================================================================
// Sahil's Shore: DSA Problem Add/Edit Modal (Engineering Notebook Workspace)
// Spacious, multi-section developer notebook with dedicated intuition notes,
// edge cases, dry-run templates, CodeMirror editor, complexity, and favorites.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Code2,
  ExternalLink,
  Clock,
  Sparkles,
  BookOpen,
  Star,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  FileText,
  Sliders,
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
import { ModalPortal } from "@/components/ui/modal-portal";

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"notes" | "code" | "details">("notes");
  const [copiedCode, setCopiedCode] = useState(false);
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
      setIsFavorite(Boolean(initialProblem.is_favorite));
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
      setIsFavorite(Boolean(prefill.is_favorite));
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
      setIsFavorite(false);
    }
  }, [initialProblem, prefill, isOpen]);

  if (!isOpen) return null;

  const insertNoteTemplate = (template: string) => {
    setApproachNotes((prev) => (prev ? `${prev.trim()}\n\n${template}` : template));
  };

  const handleCopyCode = async () => {
    if (!codeSnippet) return;
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn("Failed to copy code:", e);
    }
  };

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
          is_favorite: isFavorite,
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
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className={`relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl transition-all flex flex-col ${
            isFullscreen
              ? "max-w-[98vw] h-[95vh] overflow-y-auto"
              : "max-w-5xl max-h-[92vh] overflow-y-auto"
          }`}
        >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4 gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
              <Code2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">
                {initialProblem ? `Edit: ${initialProblem.title}` : "DSA Problem & Engineering Notes"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] truncate">
                Intuition notes, invariants, edge cases, complexity proofs, and solution code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Star Favorite Button */}
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                isFavorite
                  ? "border-[var(--accent-warm)] bg-[var(--accent-warm)]/15 text-[var(--accent-warm)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
              }`}
              title={isFavorite ? "Favorited" : "Mark as Favorite"}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isFavorite ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]" : ""
                }`}
              />
              <span className="hidden sm:inline">{isFavorite ? "Starred" : "Star"}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-xl border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors hidden sm:flex"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)] shrink-0">
            {errorMessage}
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden items-center border border-[var(--border)] rounded-xl bg-[var(--surface-muted)]/30 p-1 mb-4 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveMobileTab("notes")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all ${
              activeMobileTab === "notes"
                ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                : "text-[var(--text-muted)]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("code")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all ${
              activeMobileTab === "code"
                ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                : "text-[var(--text-muted)]"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("details")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium transition-all ${
              activeMobileTab === "details"
                ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                : "text-[var(--text-muted)]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Details</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
          {/* Top Metadata Row: Title, Link, Topic, Difficulty */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 shrink-0">
            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Problem Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Trapping Rain Water, Course Schedule..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Problem URL / LeetCode Link
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://leetcode.com/problems/..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Topic
              </label>
              <Select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                size="sm"
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

          {/* Quick Metrics Bar: Status, Difficulty, Complexity, Time */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-2.5 shrink-0">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Difficulty
              </label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DsaDifficulty)}
                size="sm"
                containerClassName="w-full"
              >
                {DSA_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Status
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as DsaStatus)}
                size="sm"
                containerClassName="w-full"
              >
                {DSA_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Time Complexity
              </label>
              <input
                type="text"
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                placeholder="e.g. O(N log N)"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Space Complexity
              </label>
              <input
                type="text"
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                placeholder="e.g. O(1)"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time (Mins)
              </label>
              <input
                type="number"
                min="0"
                value={timeSpentMinutes}
                onChange={(e) => setTimeSpentMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Main Workspace Body: 2-Column Split (Notes & Code) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[360px]">
            {/* Column 1: Engineering Notes & Intuition */}
            <div
              className={`flex flex-col space-y-2 ${
                activeMobileTab === "notes" ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Engineering Notes & Intuition</span>
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">Markdown supported</span>
              </div>

              {/* Quick Template Insert Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    insertNoteTemplate(
                      "### Key Intuition & Invariant\n- Maintain the invariant that...\n- Why this works: "
                    )
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  + Invariant
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertNoteTemplate(
                      "### Edge Cases Considered\n- Empty input or length < 2\n- Duplicate values\n- Negative numbers\n- Extreme bounds / Integer overflow"
                    )
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  + Edge Cases
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertNoteTemplate(
                      "### Dry Run Test Case\n- Input: `nums = [2, 7, 11, 15], target = 9`\n- Trace:\n  1. i=0, num=2: complement=7 (not in map)\n  2. i=1, num=7: complement=2 (found at index 0) -> Return [0, 1]"
                    )
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  + Dry Run
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertNoteTemplate(
                      "### Complexity Analysis\n- **Time Complexity:** O(N) because each element is visited once.\n- **Space Complexity:** O(N) to store frequencies in the hash table."
                    )
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  + Proof
                </button>
              </div>

              {/* Spacious Textarea */}
              <textarea
                rows={12}
                value={approachNotes}
                onChange={(e) => setApproachNotes(e.target.value)}
                placeholder="Write your mental model, core algorithm pattern, invariant rules, and dry-run steps here..."
                className="w-full flex-1 min-h-[260px] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3.5 text-xs text-[var(--text)] font-sans leading-relaxed placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-none"
              />
            </div>

            {/* Column 2: Code Editor */}
            <div
              className={`flex flex-col space-y-2 ${
                activeMobileTab === "code" ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Solution Code</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={!codeSnippet}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-40"
                  >
                    {copiedCode ? (
                      <Check className="h-3 w-3 text-[var(--success)]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>

                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    size="sm"
                    containerClassName="w-auto min-w-[90px]"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex-1 min-h-[260px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <CodeEditor
                  value={codeSnippet}
                  onChange={(val) => setCodeSnippet(val)}
                  language={language}
                  minHeight="260px"
                  maxHeight={isFullscreen ? "60vh" : "360px"}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 shrink-0">
            <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
              Saved automatically to Shore sync & timeline
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Code2 className="h-4 w-4" />
                <span>{isSubmitting ? "Saving..." : initialProblem ? "Update Solution" : "Save Solution"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}
