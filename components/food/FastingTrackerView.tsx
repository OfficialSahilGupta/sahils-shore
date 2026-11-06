"use client";

// ============================================================================
// Sahil's Shore: Fasting Tracker Component
// Live fasting timer, protocol intervals (16:8, 18:6, 20:4, OMAD),
// physiological stages (Ketosis, Autophagy), last-meal bridge, and history.
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Play,
  Square,
  Sparkles,
  Flame,
  CheckCircle2,
  Calendar,
  Utensils,
  TrendingUp,
  RotateCcw,
  Plus,
  Trash2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  type FastingLog,
  type FastingProtocol,
  PROTOCOL_TARGETS,
  FASTING_STAGES,
  getFastingStage,
  calculateFastingState,
  formatFastingDuration,
  startFast,
  endFast,
  deleteFast,
} from "@/lib/food/fasting";
import type { MealWithExpense } from "@/lib/food";
import { formatTime12IST, formatFriendlyISTDate } from "@/lib/date-utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface FastingTrackerViewProps {
  supabase: SupabaseClient<Database>;
  userId: string;
  activeFast: FastingLog | null;
  history: FastingLog[];
  recentMeals: MealWithExpense[];
  onRefresh: () => Promise<void>;
  onBreakFastWithMeal: (dateIST?: string) => void;
}

export function FastingTrackerView({
  supabase,
  userId,
  activeFast,
  history,
  recentMeals,
  onRefresh,
  onBreakFastWithMeal,
}: FastingTrackerViewProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<FastingProtocol>(
    activeFast?.protocol || "16:8"
  );
  const [customHours, setCustomHours] = useState<number>(16);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [fastNotes, setFastNotes] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  // Real-time ticking every second for the countdown/elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live fasting state
  const state = useMemo(() => {
    return calculateFastingState(activeFast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFast, nowTick]);

  // Find the most recent logged meal to suggest retroactive fast start
  const lastMeal = useMemo(() => {
    if (!recentMeals || recentMeals.length === 0) return null;
    const sorted = [...recentMeals]
      .filter((m) => !m.is_skipped)
      .sort((a, b) => new Date(b.eaten_at).getTime() - new Date(a.eaten_at).getTime());
    return sorted[0] || null;
  }, [recentMeals]);

  const lastMealElapsedHours = useMemo(() => {
    if (!lastMeal) return 0;
    const diffMs = Math.max(0, Date.now() - new Date(lastMeal.eaten_at).getTime());
    return Math.floor(diffMs / (1000 * 3600));
  }, [lastMeal]);

  const handleStartFast = async (fromLastMeal = false) => {
    if (!userId) return;
    setIsStarting(true);
    try {
      const targetHours =
        selectedProtocol === "custom"
          ? customHours
          : PROTOCOL_TARGETS[selectedProtocol] || 16;

      const startTime =
        fromLastMeal && lastMeal
          ? lastMeal.eaten_at
          : new Date().toISOString();

      await startFast(
        supabase,
        userId,
        selectedProtocol,
        targetHours,
        startTime,
        fastNotes.trim() || undefined
      );
      setFastNotes("");
      await onRefresh();
    } catch (err) {
      console.error("Failed to start fast:", err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndFast = async () => {
    if (!activeFast || !userId) return;
    setIsEnding(true);
    try {
      await endFast(supabase, userId, activeFast.id, new Date().toISOString());
      await onRefresh();
    } catch (err) {
      console.error("Failed to end fast:", err);
    } finally {
      setIsEnding(false);
    }
  };

  const handleDeleteFast = async (fastId: string) => {
    if (!userId) return;
    await deleteFast(supabase, userId, fastId);
    await onRefresh();
  };

  // Lifetime Stats
  const stats = useMemo(() => {
    const completed = history.filter((f) => !f.is_active && f.ended_at);
    if (completed.length === 0) {
      return { totalCompleted: 0, longestHours: 0, avgHours: 0 };
    }

    let maxDuration = 0;
    let sumDuration = 0;

    for (const f of completed) {
      const dur =
        (new Date(f.ended_at!).getTime() - new Date(f.started_at).getTime()) /
        (1000 * 3600);
      if (dur > maxDuration) maxDuration = dur;
      sumDuration += dur;
    }

    return {
      totalCompleted: completed.length,
      longestHours: Math.round(maxDuration * 10) / 10,
      avgHours: Math.round((sumDuration / completed.length) * 10) / 10,
    };
  }, [history]);

  return (
    <div className="space-y-6">
      {/* 1. Protocol Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Intermittent Fasting Protocol</span>
          </div>
          <h2 className="text-lg font-bold text-text">Choose Fasting Interval</h2>
        </div>

        {/* Protocol Selector Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["16:8", "18:6", "20:4", "14:10", "24:0", "custom"] as FastingProtocol[]).map(
            (p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedProtocol(p)}
                disabled={Boolean(activeFast)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedProtocol === p
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-surface hover:bg-surface-muted text-text"
                } ${activeFast ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {p === "custom" ? "Custom" : p}
              </button>
            )
          )}
        </div>
      </div>

      {/* 2. Hero Live Fasting Card */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {activeFast ? (
          /* Active Fasting State */
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left: Timer & Details */}
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary">
                <Flame className="h-3.5 w-3.5" />
                <span>Active Fast: {activeFast.protocol} Protocol</span>
              </div>

              <div>
                <span className="text-xs text-text-muted font-medium">Elapsed Fasting Time</span>
                <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-text mt-1">
                  {formatFastingDuration(state.elapsedSeconds)}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Target: {activeFast.target_hours}h • Started at{" "}
                  {formatTime12IST(activeFast.started_at)} (
                  {formatFriendlyISTDate(activeFast.started_at.slice(0, 10))})
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-text-muted">Target Progress</span>
                  <span className="text-primary font-bold">{state.progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${state.progressPercent}%` }}
                  />
                </div>
                {state.targetEndTime && (
                  <p className="text-[11px] text-text-muted flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>
                      Goal reached at {formatTime12IST(state.targetEndTime)} (
                      {formatFriendlyISTDate(state.targetEndTime.slice(0, 10))})
                    </span>
                  </p>
                )}
              </div>

              {/* Stage Card */}
              <div className="rounded-2xl border border-primary/25 bg-surface p-3.5 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    Physiological Stage
                  </span>
                  <span className="text-xs font-bold text-text">
                    {state.currentStage.label}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {state.currentStage.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isEnding}
                  onClick={handleEndFast}
                  className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-2 text-xs font-semibold text-danger hover:bg-danger/20 transition-all flex items-center gap-1.5"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>End Fast</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleEndFast().then(() => onBreakFastWithMeal());
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Utensils className="h-3.5 w-3.5" />
                  <span>Break Fast & Log Meal</span>
                </button>
              </div>
            </div>

            {/* Right: Stages Overview */}
            <div className="w-full lg:max-w-xs space-y-2 rounded-2xl border border-border bg-surface p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Fasting Stages
              </h4>
              <div className="space-y-2 text-xs">
                {FASTING_STAGES.map((stg) => {
                  const isCurrent = state.currentStage.key === stg.key;
                  return (
                    <div
                      key={stg.key}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                          : "border-border/60 bg-surface-muted/30 text-text-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span>{stg.label}</span>
                        <span className="text-[10px] font-mono">
                          {stg.minHours}h+
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Idle / Start Fasting State */
          <div className="max-w-xl space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary mb-2">
                <Clock className="h-3.5 w-3.5" />
                <span>Ready for Next Fast</span>
              </div>
              <h3 className="text-2xl font-bold text-text">
                Start {selectedProtocol} Fasting Session
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Intermittent fasting allows blood glucose to normalize, accelerates fat oxidation,
                and triggers natural cellular autophagy.
              </p>
            </div>

            {selectedProtocol === "custom" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Custom Target Duration (Hours)
                </label>
                <input
                  type="number"
                  min="4"
                  max="48"
                  value={customHours}
                  onChange={(e) => setCustomHours(Number(e.target.value))}
                  className="w-32 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text font-mono focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {/* Last Meal Fast Detection */}
            {lastMeal && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <div className="flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5" />
                    <span>Last Meal Detected</span>
                  </div>
                  <span className="font-mono">{lastMealElapsedHours}h ago</span>
                </div>
                <p className="text-xs text-text leading-relaxed">
                  You logged <strong>{lastMeal.description}</strong> ({lastMeal.meal_type}) at{" "}
                  {formatTime12IST(lastMeal.eaten_at)}. You can start your fast retroactively from
                  then!
                </p>
                <button
                  type="button"
                  disabled={isStarting}
                  onClick={() => handleStartFast(true)}
                  className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all flex items-center gap-1"
                >
                  <Play className="h-3 w-3 fill-primary" />
                  <span>Start Fast from Last Meal ({lastMealElapsedHours}h ago)</span>
                </button>
              </div>
            )}

            {/* Start Now Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isStarting}
                onClick={() => handleStartFast(false)}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-primary-foreground" />
                <span>Start Fast Now ({PROTOCOL_TARGETS[selectedProtocol] || 16}h)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Fasting Lifetime Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Completed Fasts</span>
          </div>
          <div className="text-2xl font-bold text-text mt-1">{stats.totalCompleted}</div>
          <p className="text-[11px] text-text-muted mt-0.5">Sessions logged</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Flame className="h-4 w-4 text-accent-warm" />
            <span>Longest Fast</span>
          </div>
          <div className="text-2xl font-bold text-text mt-1">{stats.longestHours}h</div>
          <p className="text-[11px] text-text-muted mt-0.5">Personal record</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Average Duration</span>
          </div>
          <div className="text-2xl font-bold text-text mt-1">{stats.avgHours}h</div>
          <p className="text-[11px] text-text-muted mt-0.5">Across all completed fasts</p>
        </div>
      </div>

      {/* 4. Fasting History Log */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text">Recent Fasting Sessions</h3>
          <span className="text-xs text-text-muted">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No fasting sessions recorded yet. Start your first session above!
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((f) => {
              const startIST = formatFriendlyISTDate(f.started_at.slice(0, 10));
              const startT = formatTime12IST(f.started_at);
              const endT = f.ended_at ? formatTime12IST(f.ended_at) : "Active";
              const durSec = f.ended_at
                ? (new Date(f.ended_at).getTime() - new Date(f.started_at).getTime()) / 1000
                : (Date.now() - new Date(f.started_at).getTime()) / 1000;
              const durHours = Math.round((durSec / 3600) * 10) / 10;
              const completedTarget = durHours >= f.target_hours;

              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3 text-xs hover:bg-surface-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                        completedTarget
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-muted text-text-muted"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text">{f.protocol} Fast</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                            completedTarget
                              ? "bg-primary/15 text-primary"
                              : "bg-surface-muted text-text-muted"
                          }`}
                        >
                          {durHours}h / {f.target_hours}h goal
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {startIST} • {startT} → {endT}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFast(f.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-surface transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
