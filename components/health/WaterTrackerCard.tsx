"use client";

// ============================================================================
// Sahil's Shore: Water Hydration Tracker Card
// Quick +/- glass logging, ml conversion, and daily goal progress bar
// ============================================================================

import React from "react";
import { mlToGlasses, glassesToMl, DEFAULT_WATER_GOAL_GLASSES } from "@/lib/health";
import { Droplet, Plus, Minus, CheckCircle2 } from "lucide-react";

interface WaterTrackerCardProps {
  waterMl: number | null;
  onUpdateWater: (newMl: number) => Promise<void>;
}

export function WaterTrackerCard({
  waterMl,
  onUpdateWater,
}: WaterTrackerCardProps) {
  const currentMl = waterMl || 0;
  const currentGlasses = mlToGlasses(currentMl);
  const goalGlasses = DEFAULT_WATER_GOAL_GLASSES;
  const progressPercent = Math.min(100, Math.round((currentGlasses / goalGlasses) * 100));
  const isGoalMet = currentGlasses >= goalGlasses;

  const handleAdjustGlasses = (delta: number) => {
    const nextGlasses = Math.max(0, currentGlasses + delta);
    onUpdateWater(glassesToMl(nextGlasses));
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Droplet className="h-4 w-4 fill-blue-500/20" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">Water Hydration</h3>
            <p className="text-[10px] text-text-muted">Target: {goalGlasses} glasses ({glassesToMl(goalGlasses)} ml)</p>
          </div>
        </div>

        {isGoalMet && (
          <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
            <CheckCircle2 className="h-3 w-3" />
            <span>Goal Met</span>
          </span>
        )}
      </div>

      {/* Main Counter & Visual Glasses */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-text">{currentGlasses}</span>
          <span className="text-xs font-semibold text-text-muted">glasses</span>
          <span className="text-[11px] text-text-muted/80">({currentMl} ml)</span>
        </div>

        {/* Counter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAdjustGlasses(-1)}
            disabled={currentGlasses <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-muted/50 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-40 transition-all active:scale-95"
            title="Remove 1 glass (-250ml)"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleAdjustGlasses(1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
            title="Add 1 glass (+250ml)"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Daily Target Progress</span>
          <span className="font-bold text-blue-500">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGoalMet ? "bg-emerald-500" : "bg-blue-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Add Presets */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/60 text-xs">
        <span className="text-[10px] text-text-muted font-medium mr-1">Quick:</span>
        <button
          onClick={() => handleAdjustGlasses(1)}
          className="rounded-lg border border-border/70 bg-surface-muted/30 px-2 py-0.5 text-[10px] font-medium text-text hover:bg-surface-muted"
        >
          +1 Glass
        </button>
        <button
          onClick={() => handleAdjustGlasses(2)}
          className="rounded-lg border border-border/70 bg-surface-muted/30 px-2 py-0.5 text-[10px] font-medium text-text hover:bg-surface-muted"
        >
          +2 Glasses (500ml)
        </button>
        <button
          onClick={() => handleAdjustGlasses(3)}
          className="rounded-lg border border-border/70 bg-surface-muted/30 px-2 py-0.5 text-[10px] font-medium text-text hover:bg-surface-muted"
        >
          +Bottle (750ml)
        </button>
      </div>
    </div>
  );
}
