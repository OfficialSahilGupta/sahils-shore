"use client";

// ============================================================================
// Sahil's Shore: Weekly Coach Review Modal Component
// Multi-day retrospective analyzing focus rhythm, skill balance, and habits
// ============================================================================

import React, { useState, useEffect } from "react";
import type { CoachWeeklyReview } from "@/lib/coach/types";
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklyReviewModal({ isOpen, onClose }: WeeklyReviewModalProps) {
  const [review, setReview] = useState<CoachWeeklyReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const loadWeekly = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/coach?type=weekly");
        if (res.ok) {
          const data = await res.json();
          if (data.insight) {
            setReview(data.insight);
          }
        }
      } catch (err) {
        console.error("Failed to load weekly coach review:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeekly();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">Weekly Coach Review</h3>
              <p className="text-xs text-text-muted">
                {review ? `${review.periodStart} to ${review.periodEnd}` : "Past 7-day retrospective"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 space-y-4 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-surface-muted" />
            <div className="h-4 w-full rounded bg-surface-muted" />
            <div className="h-4 w-5/6 rounded bg-surface-muted" />
          </div>
        ) : review ? (
          <div className="mt-5 space-y-5 text-xs sm:text-sm">
            {/* Highlights */}
            <div className="space-y-2">
              <h4 className="font-semibold text-text uppercase tracking-wider text-[11px] text-text-muted">
                Weekly Highlights
              </h4>
              <div className="space-y-2">
                {review.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-surface-muted/30 p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-text">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Focus & Habits Pace */}
            <div className="rounded-xl border border-border/80 bg-surface p-4 space-y-1">
              <h4 className="font-semibold text-text uppercase tracking-wider text-[11px] text-primary">
                Focus & Habit Pace
              </h4>
              <p className="text-text-muted leading-relaxed">
                {review.focusAndHabitPace}
              </p>
            </div>

            {/* Skill Balance Notes */}
            <div className="rounded-xl border border-border/80 bg-surface p-4 space-y-1">
              <h4 className="font-semibold text-text uppercase tracking-wider text-[11px] text-accent-warm">
                Skill Balance & Recommendations
              </h4>
              <p className="text-text-muted leading-relaxed">
                {review.skillBalanceNotes}
              </p>
            </div>

            {/* Gentle Nudge */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 italic text-text-muted">
              &ldquo;{review.gentleNudge}&rdquo;
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-opacity"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
}
