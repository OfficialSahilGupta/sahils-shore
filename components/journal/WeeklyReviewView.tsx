"use client";

// ============================================================================
// Sahil's Shore: Weekly Review View
// Auto-aggregated weekly metrics (study, DSA, spend, habits) and editable review template
// ============================================================================

import React, { useState, useEffect } from "react";
import type { WeeklyReviewStats } from "@/lib/journal";
import { generateWeeklyReviewMarkdown } from "@/lib/journal";
import { formatFriendlyISTDate, addDaysIST, todayIST, getISTWeekDays } from "@/lib/date-utils";
import { formatINR } from "@/lib/expenses";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Code2,
  Wallet,
  CheckCircle,
  Sparkles,
  Save,
  CheckCircle2,
  Calendar,
  RotateCcw,
} from "lucide-react";

interface WeeklyReviewViewProps {
  onFetchStats: (startDate: string, endDate: string) => Promise<WeeklyReviewStats>;
  onSaveReview: (date: string, content: string) => Promise<boolean>;
}

export function WeeklyReviewView({
  onFetchStats,
  onSaveReview,
}: WeeklyReviewViewProps) {
  // Current week's Monday as base
  const [baseDate, setBaseDate] = useState<string>(todayIST());
  const [stats, setStats] = useState<WeeklyReviewStats | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Compute Monday and Sunday for the baseDate week
  const weekDays = getISTWeekDays(baseDate);
  const mondayDate = weekDays[0]?.date || baseDate;
  const sundayDate = weekDays[6]?.date || baseDate;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    onFetchStats(mondayDate, sundayDate).then((fetchedStats) => {
      if (!isMounted) return;
      setStats(fetchedStats);
      const generated = generateWeeklyReviewMarkdown(fetchedStats, mondayDate, sundayDate);
      setMarkdown(generated);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [mondayDate, sundayDate, onFetchStats]);

  const handlePrevWeek = () => {
    setBaseDate((prev) => addDaysIST(prev, -7));
  };

  const handleNextWeek = () => {
    setBaseDate((prev) => addDaysIST(prev, 7));
  };

  const handleThisWeek = () => {
    setBaseDate(todayIST());
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Save to Sunday's journal entry as end-of-week reflection
    const ok = await onSaveReview(sundayDate, markdown);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleRegenerateTemplate = () => {
    if (stats) {
      setMarkdown(generateWeeklyReviewMarkdown(stats, mondayDate, sundayDate));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Week Switcher */}
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Calendar className="h-3.5 w-3.5" />
            <span>Weekly Review & Synthesis</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            {formatFriendlyISTDate(mondayDate)} — {formatFriendlyISTDate(sundayDate)}
          </h2>
          <p className="text-xs text-text-muted">
            Auto-aggregated metrics from your shore. Review, reflect, and calibrate for next week.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-surface-muted/50 p-1">
            <button
              onClick={handlePrevWeek}
              className="rounded-lg p-1 text-text-muted hover:bg-surface hover:text-text transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleThisWeek}
              className="px-2.5 py-1 text-xs font-medium text-text hover:text-primary transition-colors"
            >
              This Week
            </button>
            <button
              onClick={handleNextWeek}
              className="rounded-lg p-1 text-text-muted hover:bg-surface hover:text-text transition-colors"
              title="Next Week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save Review"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Weekly Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Study Time */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1">
          <div className="flex items-center justify-between text-primary">
            <span className="text-[11px] font-semibold">Focus & Study</span>
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-text">
            {isLoading ? "..." : `${stats?.studyHours || 0} hrs`}
          </div>
          <div className="text-[10px] text-text-muted">
            {stats?.studyMinutes ? `${stats.studyMinutes} total minutes` : "0 minutes logged"}
          </div>
        </div>

        {/* DSA Solved */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[11px] font-semibold">DSA Problems</span>
            <Code2 className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-text">
            {isLoading ? "..." : stats?.dsaSolvedCount || 0}
          </div>
          <div className="text-[10px] text-text-muted">Problems solved this week</div>
        </div>

        {/* Spend */}
        <div className="rounded-2xl border border-accent-warm/20 bg-accent-warm/5 p-4 space-y-1">
          <div className="flex items-center justify-between text-accent-warm">
            <span className="text-[11px] font-semibold">Total Spend</span>
            <Wallet className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-text truncate">
            {isLoading ? "..." : formatINR(stats?.spentPaise || 0)}
          </div>
          <div className="text-[10px] text-text-muted">Paise-accurate integer total</div>
        </div>

        {/* Tasks & Habits */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[11px] font-semibold">Tasks & Habits</span>
            <CheckCircle className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-text">
            {isLoading ? "..." : `${stats?.tasksCompletedCount || 0} / ${stats?.habitsCompletedCount || 0}`}
          </div>
          <div className="text-[10px] text-text-muted">Tasks done / habits checked</div>
        </div>
      </div>

      {/* Editable Markdown Area */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-text">
              Weekly Review Template (Pre-filled & Editable)
            </h3>
          </div>
          <button
            onClick={handleRegenerateTemplate}
            className="flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-primary transition-colors"
            title="Reset to fresh template with current stats"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Template</span>
          </button>
        </div>

        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={15}
          className="w-full rounded-2xl border border-border bg-surface-muted/20 p-4 text-xs font-mono text-text placeholder:text-text-muted/60 outline-none focus:border-primary focus:bg-surface leading-relaxed resize-y transition-all"
        />

        <p className="text-[11px] text-text-muted">
          Tip: Fill in your wins, lessons, and top 3 priorities for next week. Clicking &quot;Save Review&quot; binds this to Sunday ({formatFriendlyISTDate(sundayDate)}).
        </p>
      </div>
    </div>
  );
}
