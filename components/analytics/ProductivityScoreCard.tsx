"use client";

// ============================================================================
// Sahil's Shore: Productivity Score Component
// Transparent formula visualization (Tasks 40%, Focus 35%, Habits 25%)
// ============================================================================

import React, { useState } from "react";
import type { ProductivityScoreBreakdown } from "@/lib/analytics/types";
import { getProductivityTier } from "@/lib/analytics/productivity";
import {
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  X,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

interface ProductivityScoreCardProps {
  data: ProductivityScoreBreakdown;
}

export function ProductivityScoreCard({ data }: ProductivityScoreBreakdownProps) {
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const tier = getProductivityTier(data.overallScore);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all sm:p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Productivity Engine
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tier.badgeClass}`}
            >
              {tier.label}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl mt-0.5">
            Overall Productivity Score
          </h2>
        </div>

        <button
          onClick={() => setShowFormulaModal(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface-muted/50 px-3 py-1.5 text-xs font-medium text-text-muted hover:border-primary/40 hover:text-text transition-colors"
          title="Inspect the transparent score formula"
        >
          <Info className="h-3.5 w-3.5 text-primary" />
          <span>Formula Breakdown</span>
        </button>
      </div>

      {/* Main Score Ring & Sub-metrics Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
        {/* Score Circle (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-surface-muted/30 border border-border/40 text-center">
          <div className="relative flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface-muted"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - data.overallScore / 100)}`}
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 ease-out"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold tracking-tight text-text">
                {data.overallScore}
              </span>
              <span className="text-[10px] uppercase font-bold text-text-muted">out of 100</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted max-w-[220px]">
            {tier.description}
          </p>
        </div>

        {/* 3 Pillars (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Pillar 1: Tasks (40%) */}
          <div className="rounded-xl border border-border/70 bg-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Tasks (40%)</span>
              </div>
              <span className="text-xs font-bold text-primary">{data.taskScore}%</span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${data.taskScore}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-text-muted">
                <span>Completed</span>
                <span className="font-medium text-text">
                  {data.tasksCompleted} / {data.tasksTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Focus Time (35%) */}
          <div className="rounded-xl border border-border/70 bg-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <Clock className="h-4 w-4 text-accent-warm" />
                <span>Focus (35%)</span>
              </div>
              <span className="text-xs font-bold text-accent-warm">{data.focusScore}%</span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full bg-accent-warm transition-all duration-500 rounded-full"
                  style={{ width: `${data.focusScore}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-text-muted">
                <span>Logged vs Goal</span>
                <span className="font-medium text-text">
                  {Math.round((data.focusMinutes / 60) * 10) / 10}h / {Math.round((data.focusTargetMinutes / 60) * 10) / 10}h
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Habits (25%) */}
          <div className="rounded-xl border border-border/70 bg-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <Flame className="h-4 w-4 text-emerald-500" />
                <span>Habits (25%)</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {data.habitScore}%
              </span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${data.habitScore}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-text-muted">
                <span>Completed</span>
                <span className="font-medium text-text">
                  {data.habitsCompleted} / {data.habitsScheduled}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-text">Productivity Formula</h3>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-text sm:text-sm">
              <p className="text-text-muted">
                Sahil&apos;s Shore calculates your daily and multi-day productivity score with zero hidden weights or opaque heuristics:
              </p>

              <div className="rounded-xl bg-surface-muted/60 p-3 font-mono text-xs text-primary border border-border">
                {data.formulaExplanation.description}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-primary min-w-[3rem]">40%</span>
                  <div>
                    <strong className="text-text">Task Completion:</strong> Ratio of tasks marked completed vs. total tasks due or completed in the window.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-accent-warm min-w-[3rem]">35%</span>
                  <div>
                    <strong className="text-text">Focus Target Adherence:</strong> Deep study and coding minutes logged in Daily Tracker vs. your daily benchmark.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-500 min-w-[3rem]">25%</span>
                  <div>
                    <strong className="text-text">Habit Consistency:</strong> Completed daily habit checks vs. active habit opportunities.
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-text-muted flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Rest days with zero scheduled tasks or habit skips are protected from artificial score penalization.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
type ProductivityScoreBreakdownProps = ProductivityScoreCardProps;
