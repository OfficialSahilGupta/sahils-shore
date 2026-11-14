"use client";

// ============================================================================
// Sahil's Shore: Workout Activity Tracker Card
// Workout type selection, duration in minutes, notes, and timeline logging
// ============================================================================

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Dumbbell, Plus, Clock, CheckCircle2, ArrowRight } from "lucide-react";

interface WorkoutTrackerCardProps {
  workoutMinutes: number | null;
  workoutType: string | null;
  workoutNotes: string | null;
  onUpdateWorkout: (minutes: number, type: string, notes: string) => Promise<void>;
}

const WORKOUT_TYPES = ["Gym", "Running", "Yoga", "Cycling", "Calisthenics", "Walking"];

export function WorkoutTrackerCard({
  workoutMinutes,
  workoutType,
  workoutNotes,
  onUpdateWorkout,
}: WorkoutTrackerCardProps) {
  const [minutes, setMinutes] = useState<number>(workoutMinutes || 0);
  const [type, setType] = useState<string>(workoutType || "Gym");
  const [notes, setNotes] = useState<string>(workoutNotes || "");
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (workoutMinutes !== null) setMinutes(workoutMinutes);
    if (workoutType !== null) setType(workoutType);
    if (workoutNotes !== null) setNotes(workoutNotes);
  }, [workoutMinutes, workoutType, workoutNotes]);

  const handleSave = () => {
    onUpdateWorkout(minutes, type, notes);
    setHasChanged(false);
  };

  const handleAdjustMinutes = (delta: number) => {
    const next = Math.max(0, minutes + delta);
    setMinutes(next);
    setHasChanged(true);
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Dumbbell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">Daily Workout</h3>
            <p className="text-[10px] text-text-muted">Target: 30-45 minutes</p>
          </div>
        </div>

        {hasChanged && (
          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
          >
            Save
          </button>
        )}
      </div>

      {/* Main Duration Display */}
      <div className="flex items-baseline justify-between py-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-text">{minutes}</span>
          <span className="text-xs font-semibold text-text-muted">minutes</span>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5">
          {[15, 30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMinutes(m);
                setHasChanged(true);
              }}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
                minutes === m
                  ? "bg-emerald-500 text-white font-bold"
                  : "border border-border bg-surface-muted/40 text-text-muted hover:text-text"
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Workout Type Chips */}
      <div className="space-y-1.5 pt-2 border-t border-border/60">
        <span className="text-[10px] text-text-muted font-medium">Activity Type:</span>
        <div className="flex flex-wrap gap-1.5">
          {WORKOUT_TYPES.map((t) => {
            const isSelected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setHasChanged(true);
                }}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all ${
                  isSelected
                    ? "bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/40"
                    : "bg-surface-muted/50 text-text-muted hover:bg-surface-muted hover:text-text border border-border/60"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes & Full Hub Link */}
      <div className="pt-1 space-y-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setHasChanged(true);
          }}
          placeholder="Notes (e.g. Chest/Triceps, 5km outdoor run)..."
          className="w-full rounded-xl border border-border bg-surface-muted/20 px-3 py-1.5 text-xs text-text placeholder:text-text-muted/60 outline-none focus:border-emerald-500 focus:bg-surface"
        />

        <Link
          href="/workout"
          className="w-full py-1.5 px-3 rounded-xl border border-border bg-surface-muted/30 hover:bg-surface-muted text-xs font-semibold text-primary transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Open Full Workout Hub (Exercises, Sets & Photos)</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
