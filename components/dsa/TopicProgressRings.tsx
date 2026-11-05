"use client";

// ============================================================================
// Sahil's Shore: Topic-wise Progress Rings & Adaptive Mastery Milestones
// ============================================================================

import React from "react";
import { PieChart, Layers, ShieldCheck, Sparkles, Filter } from "lucide-react";
import type { TopicProgressStat } from "@/lib/dsa";

interface TopicProgressRingsProps {
  stats: TopicProgressStat[];
  difficultySplit: { Easy: number; Medium: number; Hard: number; total: number };
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  targetBenchmark?: number | "adaptive";
  onTargetBenchmarkChange?: (benchmark: number | "adaptive") => void;
}

export function TopicProgressRings({
  stats,
  difficultySplit,
  selectedTopic,
  onSelectTopic,
  targetBenchmark = "adaptive",
  onTargetBenchmarkChange,
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
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs lg:col-span-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Topic Mastery Progress
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Target Benchmark Switcher */}
            {onTargetBenchmarkChange && (
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => onTargetBenchmarkChange("adaptive")}
                  className={`rounded-lg px-2 py-0.5 font-medium transition-all ${
                    targetBenchmark === "adaptive"
                      ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  title="Adapts dynamically (10 → 25 → 50 → 100+)"
                >
                  Adaptive
                </button>
                <button
                  type="button"
                  onClick={() => onTargetBenchmarkChange(25)}
                  className={`rounded-lg px-2 py-0.5 font-medium transition-all ${
                    targetBenchmark === 25
                      ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  25
                </button>
                <button
                  type="button"
                  onClick={() => onTargetBenchmarkChange(50)}
                  className={`rounded-lg px-2 py-0.5 font-medium transition-all ${
                    targetBenchmark === 50
                      ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  50
                </button>
                <button
                  type="button"
                  onClick={() => onTargetBenchmarkChange(100)}
                  className={`rounded-lg px-2 py-0.5 font-medium transition-all ${
                    targetBenchmark === 100
                      ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  100
                </button>
              </div>
            )}

            {selectedTopic && (
              <button
                onClick={() => onSelectTopic(null)}
                className="flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
              >
                <Filter className="h-3 w-3" />
                <span>Clear: {selectedTopic}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable / Grid of Topic Chips with mini progress */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
          {stats.map((stat) => {
            const isSelected = selectedTopic === stat.topic;
            const target = Math.max(stat.target, 1);
            const progress = Math.min(100, Math.round((stat.solved / target) * 100));

            return (
              <button
                key={stat.topic}
                type="button"
                onClick={() => onSelectTopic(isSelected ? null : stat.topic)}
                className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] bg-[var(--surface-muted)]/20 hover:border-[var(--primary)]/50 hover:bg-[var(--surface-muted)]/40"
                }`}
              >
                <div className="flex items-center justify-between w-full gap-1">
                  <span className="text-xs font-semibold text-[var(--text)] truncate">
                    {stat.topic}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                    {stat.solved}/{stat.target}
                  </span>
                </div>

                {/* Mini progress bar & Tier indicator */}
                <div className="mt-2 w-full">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        progress >= 100
                          ? "bg-[var(--success)]"
                          : progress >= 50
                            ? "bg-[var(--primary)]"
                            : "bg-[var(--accent-warm)]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-0.5">
                      {progress >= 100 ? (
                        <ShieldCheck className="h-2.5 w-2.5 text-[var(--success)] inline" />
                      ) : null}
                      <span>{progress}%</span>
                      {stat.tier && (
                        <span className="opacity-70 ml-0.5">({stat.tier})</span>
                      )}
                    </span>
                    {stat.needsRevision > 0 ? (
                      <span className="text-[var(--warning)] font-semibold">
                        {stat.needsRevision} rev
                      </span>
                    ) : stat.total > 0 ? (
                      <span className="opacity-60">{stat.total} logged</span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Split (1 column on large screens) */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs flex flex-col justify-between space-y-4">
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

        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Total Solved/Logged</span>
          <strong className="text-sm font-bold text-[var(--text)] font-mono">
            {difficultySplit.total}
          </strong>
        </div>
      </div>
    </div>
  );
}
