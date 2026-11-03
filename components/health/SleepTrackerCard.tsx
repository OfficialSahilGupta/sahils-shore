"use client";

// ============================================================================
// Sahil's Shore: Sleep Tracker Card Component
// Sleep hours, 1-5 quality selector, and notes
// ============================================================================

import React, { useState, useEffect } from "react";
import { Moon, Star, CheckCircle2 } from "lucide-react";

interface SleepTrackerCardProps {
  sleepHours: number | null;
  sleepQuality: number | null;
  onUpdateSleep: (hours: number, quality: number) => Promise<void>;
}

const QUALITY_LABELS: Record<number, string> = {
  1: "Rough",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
};

export function SleepTrackerCard({
  sleepHours,
  sleepQuality,
  onUpdateSleep,
}: SleepTrackerCardProps) {
  const [hours, setHours] = useState<number>(sleepHours || 7.5);
  const [quality, setQuality] = useState<number>(sleepQuality || 4);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (sleepHours !== null) setHours(sleepHours);
    if (sleepQuality !== null) setQuality(sleepQuality);
  }, [sleepHours, sleepQuality]);

  const handleSave = () => {
    onUpdateSleep(hours, quality);
    setHasChanged(false);
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <Moon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">Sleep & Recovery</h3>
            <p className="text-[10px] text-text-muted">Target: 7.5 - 8.5 hours</p>
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

      {/* Main Hours Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted font-medium">Duration:</span>
          <span className="text-2xl font-extrabold text-text">
            {hours} <span className="text-xs font-semibold text-text-muted">hrs</span>
          </span>
        </div>

        <input
          type="range"
          min="4"
          max="12"
          step="0.5"
          value={hours}
          onChange={(e) => {
            setHours(parseFloat(e.target.value));
            setHasChanged(true);
          }}
          className="w-full accent-purple-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-text-muted">
          <span>4h</span>
          <span>7.5h</span>
          <span>8.0h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Quality Rating */}
      <div className="space-y-1.5 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted font-medium">Sleep Quality:</span>
          <span className="font-semibold text-purple-500">
            {QUALITY_LABELS[quality] || "Good"} ({quality}/5)
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((q) => {
            const isSelected = quality === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuality(q);
                  setHasChanged(true);
                  onUpdateSleep(hours, q);
                }}
                className={`flex flex-col items-center justify-center rounded-xl border py-1.5 transition-all ${
                  isSelected
                    ? "border-purple-500 bg-purple-500/15 shadow-xs font-bold text-purple-600 scale-105"
                    : "border-border bg-surface-muted/30 text-text-muted hover:bg-surface-muted"
                }`}
              >
                <Star
                  className={`h-3 w-3 ${
                    isSelected ? "fill-purple-500 text-purple-500" : "text-text-muted"
                  }`}
                />
                <span className="text-[9px] mt-0.5">{q}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
