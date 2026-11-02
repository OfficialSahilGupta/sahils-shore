"use client";

// ============================================================================
// Sahil's Shore: Mini-Project Ideas List
// Hands-on full-stack project prompts with 1-click promotion to active projects
// ============================================================================

import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, Layers } from "lucide-react";
import type { MiniProjectIdea } from "@/types";

interface MiniProjectIdeasProps {
  ideas: MiniProjectIdea[];
  onStartProject: (idea: MiniProjectIdea) => Promise<void>;
}

export function MiniProjectIdeas({
  ideas,
  onStartProject,
}: MiniProjectIdeasProps) {
  const [startingId, setStartingId] = useState<string | null>(null);

  const handleStart = async (idea: MiniProjectIdea) => {
    setStartingId(idea.id);
    try {
      await onStartProject(idea);
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="border-b border-[var(--surface-muted)] pb-4">
        <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--primary)]" />
          Mini-Project Ideas & Practice Prompts
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Curated industry-grade project concepts. Click &ldquo;Start Project&rdquo; to immediately promote any idea to your Project Tracker.
        </p>
      </div>

      {ideas.length === 0 ? (
        <p className="text-center text-xs text-[var(--text-muted)] py-6">
          No mini-project ideas found for this track.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideas.map((idea) => {
            const diffClass =
              idea.difficulty === "Beginner"
                ? "bg-[var(--success)]/15 text-[var(--success)]"
                : idea.difficulty === "Intermediate"
                  ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                  : "bg-[var(--danger)]/15 text-[var(--danger)]";

            return (
              <div
                key={idea.id}
                className="flex flex-col justify-between rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/15 p-4 space-y-3 hover:border-[var(--primary)]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${diffClass}`}
                    >
                      {idea.difficulty}
                    </span>
                    {idea.is_completed && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--success)]">
                        <CheckCircle2 className="h-3 w-3" /> Started / In Projects
                      </span>
                    )}
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-[var(--text)]">
                    {idea.title}
                  </h4>
                  {idea.description && (
                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                      {idea.description}
                    </p>
                  )}

                  {/* Tech stack chips */}
                  {idea.suggested_tech && idea.suggested_tech.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {idea.suggested_tech.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-[var(--surface-muted)]/80 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--surface-muted)] flex justify-end">
                  <button
                    type="button"
                    disabled={startingId === idea.id}
                    onClick={() => handleStart(idea)}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    <span>{startingId === idea.id ? "Promoting..." : "Start Project"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
