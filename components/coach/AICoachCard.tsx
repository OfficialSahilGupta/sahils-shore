"use client";

// ============================================================================
// Sahil's Shore: AI Coach Card Component
// 3-line summary, pattern noticed, 3 suggested priorities with "+ Add to Tasks", and nudge
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import type { CoachDailyInsight } from "@/lib/coach/types";
import { createClient } from "@/lib/supabase/client";
import { tomorrowIST, todayIST } from "@/lib/date-utils";
import { useToast } from "@/components/ui/toast";
import {
  Sparkles,
  RefreshCw,
  Compass,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";
import { WeeklyReviewModal } from "./WeeklyReviewModal";

interface AICoachCardProps {
  initialDate?: string;
  className?: string;
}

export function AICoachCard({ initialDate, className = "" }: AICoachCardProps) {
  const [insight, setInsight] = useState<CoachDailyInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [addedPriorities, setAddedPriorities] = useState<Record<string, boolean>>({});
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  const { toast } = useToast();
  const dateToQuery = initialDate || todayIST();

  const fetchInsight = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetch("/api/coach", {
        method: forceRefresh ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: forceRefresh ? JSON.stringify({ date: dateToQuery, forceRefresh: true }) : undefined,
      });

      if (!res.ok) {
        throw new Error("Failed to fetch AI coach insight");
      }

      const data = await res.json();
      setEnabled(data.enabled !== false);
      if (data.insight) {
        setInsight(data.insight);
      }
    } catch (err: any) {
      console.error("AI Coach load error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateToQuery]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  const handleAddPriorityToTasks = async (priorityText: string) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({ title: "Please log in to add tasks", type: "error" });
        return;
      }

      const tomorrow = tomorrowIST();

      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: priorityText,
        priority: "medium",
        status: "todo",
        due_date: tomorrow,
        description: "Suggested by AI Coach",
        tags: ["coach", "priority"],
      });

      if (error) throw error;

      setAddedPriorities((prev) => ({ ...prev, [priorityText]: true }));
      toast({
        title: "Added to Tomorrow's Tasks",
        description: `"${priorityText}" scheduled for ${tomorrow}.`,
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Error adding task",
        description: err.message,
        type: "error",
      });
    }
  };

  if (!enabled) {
    return null; // Gracefully hidden if disabled in Settings
  }

  return (
    <div
      className={`rounded-2xl border border-primary/20 bg-gradient-to-b from-surface to-surface-muted/20 p-5 shadow-sm sm:p-6 transition-all ${className}`}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text">AI Coach Horizon</h3>
              {insight?.provider && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {insight.provider}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted">
              Nightly reflection & morning alignment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeeklyModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Weekly Review</span>
          </button>

          <button
            onClick={() => fetchInsight(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-muted transition-colors disabled:opacity-50"
            title="Re-generate coach insights from latest stats"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>{isRefreshing ? "Thinking..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-surface-muted" />
          <div className="h-4 w-full rounded bg-surface-muted" />
          <div className="h-4 w-5/6 rounded bg-surface-muted" />
        </div>
      ) : insight ? (
        <div className="mt-5 space-y-5">
          {/* 3-Line Summary */}
          <div className="rounded-xl border border-border/70 bg-surface/80 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <span>Today&apos;s Calibration</span>
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-text leading-relaxed">
              {insight.summary.split("\n").map((line, idx) => (
                <p key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{line}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Pattern Noticed */}
          <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-muted/40 p-4">
            <Compass className="h-5 w-5 text-accent-warm shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-text">Pattern Noticed: </span>
              <span className="text-text-muted">{insight.pattern}</span>
            </div>
          </div>

          {/* 3 Suggested Priorities for Tomorrow */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-text">
              <span className="uppercase tracking-wider text-text-muted">
                Suggested Priorities For Tomorrow
              </span>
              <span className="text-text-muted text-[11px]">1-click add to planner</span>
            </div>

            <div className="space-y-2">
              {insight.suggestedPriorities.map((priority, idx) => {
                const isAdded = addedPriorities[priority];
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-text-muted">
                        {idx + 1}
                      </span>
                      <span className="truncate text-xs font-medium text-text sm:text-sm">
                        {priority}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddPriorityToTasks(priority)}
                      disabled={isAdded}
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        isAdded
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gentle Nudge */}
          <div className="rounded-xl border border-accent-warm/20 bg-accent-warm/5 p-4 flex items-center justify-between">
            <p className="italic text-xs sm:text-sm text-text-muted">
              &ldquo;{insight.gentleNudge}&rdquo;
            </p>
          </div>
        </div>
      ) : null}

      {/* Weekly Review Drawer / Modal */}
      {showWeeklyModal && (
        <WeeklyReviewModal
          isOpen={showWeeklyModal}
          onClose={() => setShowWeeklyModal(false)}
        />
      )}
    </div>
  );
}
