"use client";

// ============================================================================
// Sahil's Shore: German Writing Prompts & Scratchpad
// Curated CEFR prompts with guidance, live word count, and submission history
// ============================================================================

import React, { useState } from "react";
import { PenTool, CheckCircle2, Sparkles, BookOpen, Clock } from "lucide-react";
import type { GermanWritingEntry } from "@/types";
import {
  WRITING_PROMPTS,
  type WritingPrompt,
  CEFR_LEVELS,
  type CefrLevel,
} from "@/lib/german/constants";
import { type CreateWritingEntryInput } from "@/lib/german";
import { getISTDateString } from "@/lib/date-utils";

interface WritingPromptsSectionProps {
  entries: GermanWritingEntry[];
  onCreateEntry: (input: CreateWritingEntryInput) => Promise<void>;
}

export function WritingPromptsSection({
  entries,
  onCreateEntry,
}: WritingPromptsSectionProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt>(
    WRITING_PROMPTS[0]
  );
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Compute live word count
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const handleSelectPrompt = (prompt: WritingPrompt) => {
    setSelectedPrompt(prompt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || wordCount === 0) return;

    setIsSaving(true);
    try {
      await onCreateEntry({
        prompt_id: selectedPrompt.id,
        prompt_title: selectedPrompt.title,
        cefr_level: selectedPrompt.cefr_level,
        content: content.trim(),
        word_count: wordCount,
      });
      setContent("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Prompt Selector & Writing Workspace (7 columns) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Prompt Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {WRITING_PROMPTS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPrompt(p)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedPrompt.id === p.id
                  ? "bg-primary text-white font-semibold"
                  : "bg-surface border border-surface-muted text-text-muted hover:text-text"
              }`}
            >
              [{p.cefr_level}] {p.title}
            </button>
          ))}
        </div>

        {/* Selected Prompt Guidance Card */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-primary/10 text-primary">
              Level {selectedPrompt.cefr_level} Prompt
            </span>
            <span className="text-xs text-text-muted">{selectedPrompt.topic}</span>
          </div>

          <h3 className="text-lg font-bold text-text">
            {selectedPrompt.title}
          </h3>

          <p className="text-xs text-text-muted leading-relaxed">
            {selectedPrompt.guidance}
          </p>

          <div className="pt-2 border-t border-surface-muted flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-text-muted font-medium">Suggested vocabulary:</span>
            {selectedPrompt.suggestedWords.map((word) => (
              <span
                key={word}
                className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-surface-muted text-primary"
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* German Writing Workspace Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <PenTool className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-text">
                German Writing Workspace
              </span>
            </div>

            <div className="text-xs font-mono font-semibold text-text-muted">
              <strong className="text-text">{wordCount}</strong> words
            </div>
          </div>

          <textarea
            rows={8}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Schreibe deinen deutschen Text hier... (z.B. Mein Name ist Sahil und ich lerne fleißig Deutsch...)"
            className="w-full p-3.5 text-sm rounded-xl bg-surface-muted/60 border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-text-muted">
              Auto-saves to timeline & writing entries
            </span>

            <button
              type="submit"
              disabled={isSaving || wordCount === 0}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary hover:opacity-90 text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Writing Entry"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right: Past Submissions History (5 columns) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-4 rounded-2xl bg-surface border border-surface-muted flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Writing Bank
            </span>
            <div className="text-xl font-bold text-text">
              {entries.length} Completed Entr{entries.length === 1 ? "y" : "ies"}
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-2xl bg-surface border border-surface-muted space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                  {entry.cefr_level}
                </span>
                <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getISTDateString(entry.created_at)}
                </span>
              </div>

              <h4 className="text-sm font-bold text-text">
                {entry.prompt_title}
              </h4>

              <p className="text-xs text-text leading-relaxed whitespace-pre-line p-3 rounded-xl bg-surface-muted/40 border border-surface-muted font-serif italic">
                &ldquo;{entry.content}&rdquo;
              </p>

              <div className="text-[11px] text-text-muted text-right font-mono">
                {entry.word_count} words
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="p-8 text-center text-xs text-text-muted bg-surface rounded-2xl border border-surface-muted">
              No saved writing entries yet. Pick a prompt on the left and write your first German paragraph!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
