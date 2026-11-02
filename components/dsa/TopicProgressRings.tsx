"use client";

// ============================================================================
// Sahil's Shore: Topic-wise Progress Rings & Difficulty Split
// ============================================================================

import React from "react";
import { PieChart, Layers } from "lucide-react";
import type { TopicProgressStat } from "@/lib/dsa";

interface TopicProgressRingsProps {
  stats: TopicProgressStat[];
  difficultySplit: { Easy: number; Medium: number; Hard: number; total: number };
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
}

export function TopicProgressRings({
  stats,
  difficultySplit,
  selectedTopic,
  onSelectTopic,
}: TopicProgressRingsProps) {
  const easyPct =
    difficultySplit.total > 0
      ? Math.round((difficultySplit.Easy / difficultySplit.total) * 100)
      : 0;
  const medPct =
    difficultySplit.total > 0
      ? Math.round((difficultySplit.Medium / difficultySplit.total) * 100)
      : 0;
  const hardPct =
    difficultySplit.total > 0
      ? Math.round((difficultySplit.Hard / difficultySplit.total) * 100)
      : 0;

  return (
    <div className="w-full grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* Topic Progress Rings (3 columns on large screens) */}
      <div className="rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm lg:col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Topic Mastery Progress (Click to filter)
            </h3>
          </div>
          {selectedTopic && (
            <button
              onClick={() => onSelectTopic(null)}
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Clear filter ({selectedTopic})
            </button>
          )}
        </div>

        {/* Scrollable / Grid of Topic Chips with mini progress */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
          {stats.map((stat) => {
            const isSelected = selectedTopic === stat.topic;
            const progress = Math.min(
              100,
              Math.round((stat.solved / Math.max(stat.target, 1)) * 100)
            );

            return (
              <button
                key={stat.topic}
                type="button"
                onClick={() =>
                  onSelectTopic(isSelected ? null : stat.topic)
                }
                className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 hover:border-[var(--primary)]/50 hover:bg-[var(--surface-muted)]/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-[var(--text)] truncate">
                    {stat.topic}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {stat.solved}/{stat.target}
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="mt-2 w-full">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        progress >= 100
                          ? "bg-[var(--success)]"
                          : progress > 50
                            ? "bg-[var(--primary)]"
                            : "bg-[var(--accent-warm)]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px] text-[var(--text-muted)]">
                    <span>{progress}%</span>
                    {stat.needsRevision > 0 && (
                      <span className="text-[var(--warning)] font-semibold">
                        {stat.needsRevision} rev
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Split (1 column on large screens) */}
      <div className="rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-5 shadow-sm flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Difficulty Split
            </h3>
          </div>

          <div className="space-y-3">
            {/* Easy */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[var(--success)]">Easy</span>
                <span className="font-semibold text-[var(--text)]">
                  {difficultySplit.Easy} ({easyPct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full bg-[var(--success)] rounded-full transition-all duration-500"
                  style={{ width: `${easyPct}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[var(--warning)]">Medium</span>
                <span className="font-semibold text-[var(--text)]">
                  {difficultySplit.Medium} ({medPct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full bg-[var(--warning)] rounded-full transition-all duration-500"
                  style={{ width: `${medPct}%` }}
                />
              </div>
            </div>

            {/* Hard */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[var(--danger)]">Hard</span>
                <span className="font-semibold text-[var(--text)]">
                  {difficultySplit.Hard} ({hardPct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full bg-[var(--danger)] rounded-full transition-all duration-500"
                  style={{ width: `${hardPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--surface-muted)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Total Logged</span>
          <strong className="text-sm font-bold text-[var(--text)] font-mono">
            {difficultySplit.total}
          </strong>
        </div>
      </div>
    </div>
  );
}
