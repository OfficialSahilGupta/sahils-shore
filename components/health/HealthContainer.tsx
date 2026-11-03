"use client";

// ============================================================================
// Sahil's Shore: Health Mini-Trackers Top-Level Container
// Toggleable trackers (water, sleep, workouts, weight), averages, and charts
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { HealthLog, HealthTrendPoint } from "@/lib/health";
import {
  getHealthLog,
  saveHealthLog,
  getHealthTrendData,
  calculateHealthAverages,
} from "@/lib/health";
import { todayIST, addDaysIST, formatFriendlyISTDate } from "@/lib/date-utils";
import { WaterTrackerCard } from "./WaterTrackerCard";
import { SleepTrackerCard } from "./SleepTrackerCard";
import { WorkoutTrackerCard } from "./WorkoutTrackerCard";
import { WeightTrackerCard } from "./WeightTrackerCard";
import { HealthChartsPanel } from "./HealthChartsPanel";
import {
  HeartPulse,
  Droplet,
  Moon,
  Dumbbell,
  Scale,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

interface TrackerVisibility {
  water: boolean;
  sleep: boolean;
  workout: boolean;
  weight: boolean;
}

const DEFAULT_VISIBILITY: TrackerVisibility = {
  water: true,
  sleep: true,
  workout: true,
  weight: true,
};

export function HealthContainer() {
  const [currentDate, setCurrentDate] = useState<string>(todayIST());
  const [healthLog, setHealthLog] = useState<HealthLog | null>(null);
  const [trendData, setTrendData] = useState<HealthTrendPoint[]>([]);
  const [daysCount, setDaysCount] = useState<number>(7);
  const [visibility, setVisibility] = useState<TrackerVisibility>(DEFAULT_VISIBILITY);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and cached tracker toggles
  useEffect(() => {
    try {
      const cached = localStorage.getItem("shore_health_visibility");
      if (cached) setVisibility(JSON.parse(cached));
    } catch {}

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const supabase = createClient();
    const [log, trends] = await Promise.all([
      getHealthLog(supabase, userId, currentDate),
      getHealthTrendData(supabase, userId, daysCount),
    ]);
    setHealthLog(log);
    setTrendData(trends);
    setIsLoading(false);
  }, [userId, currentDate, daysCount]);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, currentDate, daysCount, loadData]);

  const toggleTracker = (key: keyof TrackerVisibility) => {
    setVisibility((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("shore_health_visibility", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Metric update handlers
  const handleUpdateWater = async (waterMl: number) => {
    if (!userId) return;
    const supabase = createClient();
    const saved = await saveHealthLog(
      supabase,
      userId,
      { logged_date: currentDate, water_ml: waterMl },
      "water"
    );
    if (saved) {
      setHealthLog(saved);
      getHealthTrendData(supabase, userId, daysCount).then(setTrendData);
    }
  };

  const handleUpdateSleep = async (sleepHours: number, sleepQuality: number) => {
    if (!userId) return;
    const supabase = createClient();
    const saved = await saveHealthLog(
      supabase,
      userId,
      { logged_date: currentDate, sleep_hours: sleepHours, sleep_quality: sleepQuality },
      "sleep"
    );
    if (saved) {
      setHealthLog(saved);
      getHealthTrendData(supabase, userId, daysCount).then(setTrendData);
    }
  };

  const handleUpdateWorkout = async (
    workoutMinutes: number,
    workoutType: string,
    workoutNotes: string
  ) => {
    if (!userId) return;
    const supabase = createClient();
    const saved = await saveHealthLog(
      supabase,
      userId,
      {
        logged_date: currentDate,
        workout_minutes: workoutMinutes,
        workout_type: workoutType,
        workout_notes: workoutNotes,
      },
      "workout"
    );
    if (saved) {
      setHealthLog(saved);
      getHealthTrendData(supabase, userId, daysCount).then(setTrendData);
    }
  };

  const handleUpdateWeight = async (weightKg: number) => {
    if (!userId) return;
    const supabase = createClient();
    const saved = await saveHealthLog(
      supabase,
      userId,
      { logged_date: currentDate, weight_kg: weightKg },
      "weight"
    );
    if (saved) {
      setHealthLog(saved);
      getHealthTrendData(supabase, userId, daysCount).then(setTrendData);
    }
  };

  const averages = calculateHealthAverages(trendData);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 md:px-6">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HeartPulse className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Body & Mind Vitality
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Health Mini-Trackers
          </h1>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-1.5 shadow-sm">
          <button
            onClick={() => setCurrentDate(addDaysIST(currentDate, -1))}
            className="rounded-xl p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text outline-none cursor-pointer"
            />
            <span className="text-[11px] text-text-muted">
              ({formatFriendlyISTDate(currentDate)})
            </span>
          </div>

          <button
            onClick={() => setCurrentDate(todayIST())}
            className="rounded-xl bg-surface-muted px-2.5 py-1 text-xs font-medium text-text hover:bg-primary/10 hover:text-primary transition-colors"
          >
            Today
          </button>

          <button
            onClick={() => setCurrentDate(addDaysIST(currentDate, 1))}
            className="rounded-xl p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toggleable Trackers Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-text">
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          <span>Active Trackers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { key: "water", label: "Water Hydration", icon: Droplet },
            { key: "sleep", label: "Sleep Recovery", icon: Moon },
            { key: "workout", label: "Workout Duration", icon: Dumbbell },
            { key: "weight", label: "Weight Check-in", icon: Scale },
          ].map((tracker) => {
            const key = tracker.key as keyof TrackerVisibility;
            const isVisible = visibility[key];
            const Icon = tracker.icon;
            return (
              <button
                key={key}
                onClick={() => toggleTracker(key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all ${
                  isVisible
                    ? "bg-primary/10 border border-primary/30 text-primary font-semibold"
                    : "bg-surface-muted text-text-muted border border-border hover:text-text opacity-75"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tracker.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aggregate Averages Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1">
          <div className="text-[11px] font-semibold text-blue-500">Avg Daily Water</div>
          <div className="text-xl font-bold text-text">
            {averages.avgWaterGlasses} <span className="text-xs font-normal text-text-muted">glasses</span>
          </div>
          <div className="text-[10px] text-text-muted">~{averages.avgWaterGlasses * 250} ml / day</div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-1">
          <div className="text-[11px] font-semibold text-purple-500">Avg Nightly Sleep</div>
          <div className="text-xl font-bold text-text">
            {averages.avgSleepHours} <span className="text-xs font-normal text-text-muted">hours</span>
          </div>
          <div className="text-[10px] text-text-muted">Recovery index</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
          <div className="text-[11px] font-semibold text-emerald-500">Total Exercise</div>
          <div className="text-xl font-bold text-text">
            {averages.totalWorkoutMinutes} <span className="text-xs font-normal text-text-muted">mins</span>
          </div>
          <div className="text-[10px] text-text-muted">{averages.workoutSessionsCount} sessions completed</div>
        </div>

        <div className="rounded-2xl border border-accent-warm/20 bg-accent-warm/5 p-4 space-y-1">
          <div className="text-[11px] font-semibold text-accent-warm">Latest Weight</div>
          <div className="text-xl font-bold text-text">
            {averages.latestWeight !== null ? `${averages.latestWeight} kg` : "--"}
          </div>
          <div className="text-[10px] text-text-muted">
            {averages.weightChange !== null
              ? `${averages.weightChange > 0 ? "+" : ""}${averages.weightChange} kg change`
              : "No weigh-in trend yet"}
          </div>
        </div>
      </div>

      {/* Active Mini-Tracker Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibility.water && (
          <WaterTrackerCard
            waterMl={healthLog?.water_ml ?? null}
            onUpdateWater={handleUpdateWater}
          />
        )}
        {visibility.sleep && (
          <SleepTrackerCard
            sleepHours={healthLog?.sleep_hours ? Number(healthLog.sleep_hours) : null}
            sleepQuality={healthLog?.sleep_quality ?? null}
            onUpdateSleep={handleUpdateSleep}
          />
        )}
        {visibility.workout && (
          <WorkoutTrackerCard
            workoutMinutes={healthLog?.workout_minutes ?? null}
            workoutType={healthLog?.workout_type ?? null}
            workoutNotes={healthLog?.workout_notes ?? null}
            onUpdateWorkout={handleUpdateWorkout}
          />
        )}
        {visibility.weight && (
          <WeightTrackerCard
            weightKg={healthLog?.weight_kg ? Number(healthLog.weight_kg) : null}
            onUpdateWeight={handleUpdateWeight}
          />
        )}
      </div>

      {/* Charts Panel */}
      <HealthChartsPanel
        trendData={trendData}
        daysCount={daysCount}
        onDaysCountChange={setDaysCount}
      />
    </div>
  );
}
