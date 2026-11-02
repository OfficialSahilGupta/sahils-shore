"use client";

// ============================================================================
// Sahil's Shore: DSA Stats Bar & Quick Actions
// ============================================================================

import React from "react";
import { Flame, Plus, Target, CheckCircle2, RotateCw } from "lucide-react";
import type { DsaStreakInfo } from "@/lib/dsa";

interface DsaStatsBarProps {
  streakInfo: DsaStreakInfo;
  totalSolved: number;
  revisionQueueCount: number;
  onOpenLogModal: () => void;
}

export function DsaStatsBar({
  streakInfo,
  totalSolved,
  revisionQueueCount,
  onOpenLogModal,
}: DsaStatsBarProps) {
  const goalProgress = Math.min(
    100,
    Math.round((streakInfo.todaySolvedCount / streakInfo.targetCount) * 100)
  );

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Daily Goal Card */}
      <div className="w-full h-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-[var(--primary)]" /> Daily Goal
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[var(--text)] font-mono">
              {streakInfo.todaySolvedCount}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              / {streakInfo.targetCount} problems
            </span>
          </div>
          <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                streakInfo.isDailyGoalMet ? "bg-[var(--success)]" : "bg-[var(--primary)]"
              }`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
        {streakInfo.isDailyGoalMet && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--success)]/10 text-[var(--success)]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Solving Streak Card */}
      <div className="w-full h-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-[var(--accent-warm)] fill-[var(--accent-warm)]" /> Current Streak
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[var(--text)] font-mono">
              {streakInfo.currentStreak}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              day{streakInfo.currentStreak === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Best streak: <strong className="text-[var(--text)]">{streakInfo.bestStreak}d</strong>
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-warm)]/15 text-[var(--accent-warm)]">
          <Flame className="h-5 w-5 fill-[var(--accent-warm)]" />
        </div>
      </div>

      {/* Revision Queue Card */}
      <div className="w-full h-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
            <RotateCw className="h-3.5 w-3.5 text-[var(--primary)]" /> Spaced Revision
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[var(--text)] font-mono">
              {revisionQueueCount}
            </span>
            <span className="text-xs text-[var(--text-muted)]">due today</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Total solved: <strong className="text-[var(--text)]">{totalSolved}</strong>
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-soft)]/20 text-[var(--primary)]">
          <RotateCw className="h-5 w-5" />
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="w-full h-full rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--surface)] to-[var(--primary)]/5 p-4 shadow-sm flex flex-col justify-center">
        <button
          type="button"
          onClick={onOpenLogModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 px-4 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Log DSA Problem</span>
        </button>
      </div>
    </div>
  );
}
