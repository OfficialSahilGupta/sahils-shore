"use client";

// ============================================================================
// Sahil's Shore: DSA Stats Bar & Quick Actions
// Eye-pleasing, modern dashboard metrics widgets with:
// - Daily Goal Tracker with dynamic progress ring & completion glow
// - Solving Streak with warm sunset sand accent and best streak badge
// - Spaced Repetition queue radar with instant review indicator
// - Luxury CTA button for "DSA Problem & Engineering Notes" workspace
// Strictly adheres to Shore rules: Zero Emojis (Lucide SVGs only),
// CSS tokenized variables, and WCAG AA contrast.
// ============================================================================

import React from "react";
import { Flame, Plus, Target, CheckCircle2, RotateCw, Sparkles, Trophy, Calendar } from "lucide-react";
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
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Daily Goal Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-muted)]/30 p-4 sm:p-5 shadow-xs hover:border-[var(--primary)]/40 hover:shadow-md transition-all group flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Target className="h-4 w-4 text-[var(--primary)]" />
            <span>Daily Target</span>
          </span>
          {streakInfo.isDailyGoalMet ? (
            <span className="flex items-center gap-1 rounded-full bg-[var(--success)]/15 border border-[var(--success)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--success)]">
              <CheckCircle2 className="h-3 w-3" />
              <span>Goal Met!</span>
            </span>
          ) : (
            <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
              {goalProgress}% done
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[var(--text)] font-mono tracking-tight">
                {streakInfo.todaySolvedCount}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)] font-medium">
                / {streakInfo.targetCount} problems
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {streakInfo.isDailyGoalMet
                ? "Excellent consistency today!"
                : `${Math.max(0, streakInfo.targetCount - streakInfo.todaySolvedCount)} more to complete daily goal`}
            </p>
          </div>
        </div>

        {/* Progress Bar with Glow */}
        <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              streakInfo.isDailyGoalMet
                ? "bg-[var(--success)] shadow-xs shadow-[var(--success)]/50"
                : "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-soft)]"
            }`}
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>

      {/* 2. Solving Streak Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--accent-warm)]/5 p-4 sm:p-5 shadow-xs hover:border-[var(--accent-warm)]/50 hover:shadow-md transition-all group flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-[var(--accent-warm)] fill-[var(--accent-warm)]" />
            <span>Active Streak</span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[var(--accent-warm)]/15 border border-[var(--accent-warm)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-warm)]">
            <Trophy className="h-3 w-3" />
            <span>Best: {streakInfo.bestStreak}d</span>
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[var(--text)] font-mono tracking-tight">
                {streakInfo.currentStreak}
              </span>
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                day{streakInfo.currentStreak === 1 ? "" : "s"} in a row
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {streakInfo.currentStreak > 0
                ? "Keep the momentum burning today"
                : "Solve 1 problem today to start a new streak"}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-warm)]/15 text-[var(--accent-warm)] shadow-inner">
            <Flame className="h-6 w-6 fill-[var(--accent-warm)]" />
          </div>
        </div>

        {/* Milestone Indicator */}
        <div className="mt-3.5 flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)]">
          <Calendar className="h-3 w-3 text-[var(--accent-warm)]" />
          <span>Calculated via IST midnight calendar boundary</span>
        </div>
      </div>

      {/* 3. Spaced Revision Queue Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--primary)]/5 p-4 sm:p-5 shadow-xs hover:border-[var(--primary)]/50 hover:shadow-md transition-all group flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <RotateCw className="h-4 w-4 text-[var(--primary)]" />
            <span>Spaced Revision</span>
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              revisionQueueCount > 0
                ? "bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30 animate-pulse"
                : "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30"
            }`}
          >
            {revisionQueueCount > 0 ? `${revisionQueueCount} due` : "Up to date"}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[var(--text)] font-mono tracking-tight">
                {revisionQueueCount}
              </span>
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                problems due today
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Total solutions logged: <strong className="text-[var(--text)] font-mono">{totalSolved}</strong>
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner">
            <RotateCw className="h-6 w-6" />
          </div>
        </div>

        {/* Spaced Interval Hint */}
        <div className="mt-3.5 flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)]">
          <Sparkles className="h-3 w-3 text-[var(--primary)]" />
          <span>SM-2 Spaced Ladder (1d, 3d, 7d, 14d, 30d)</span>
        </div>
      </div>

      {/* 4. Luxury Action Card: DSA Problem & Engineering Notes */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--surface)] via-[var(--primary)]/5 to-[var(--primary)]/15 p-4 sm:p-5 shadow-xs hover:border-[var(--primary)] hover:shadow-lg transition-all group flex flex-col justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>Developer Studio</span>
          </span>
          <h4 className="text-sm font-bold text-[var(--text)] mt-1.5 leading-snug">
            Log Problem & Notes
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
            Record mental models, loop invariants, whiteboard diagrams, test cases, and code.
          </p>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={onOpenLogModal}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-2.5 px-3.5 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all group-hover:shadow-md group-hover:shadow-[var(--primary)]/20"
          >
            <Plus className="h-4 w-4" />
            <span className="truncate">DSA Problem & Engineering Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
