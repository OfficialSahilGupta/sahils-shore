"use client";

// ============================================================================
// Sahil's Shore: Weight Tracker Card Component
// Weight in kg, trend indicator, and quick adjustments
// ============================================================================

import React, { useState, useEffect } from "react";
import { Scale, TrendingDown, TrendingUp, Minus, Plus } from "lucide-react";

interface WeightTrackerCardProps {
  weightKg: number | null;
  onUpdateWeight: (kg: number) => Promise<void>;
}

export function WeightTrackerCard({
  weightKg,
  onUpdateWeight,
}: WeightTrackerCardProps) {
  const [weight, setWeight] = useState<number>(weightKg || 68.0);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (weightKg !== null) setWeight(weightKg);
  }, [weightKg]);

  const handleSave = () => {
    onUpdateWeight(weight);
    setHasChanged(false);
  };

  const handleAdjust = (delta: number) => {
    const next = Math.round((weight + delta) * 10) / 10;
    setWeight(next);
    setHasChanged(true);
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-warm/10 text-accent-warm">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">Body Weight</h3>
            <p className="text-[10px] text-text-muted">Morning weigh-in</p>
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

      {/* Main Display & Counter */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-text">{weight}</span>
          <span className="text-xs font-semibold text-text-muted">kg</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAdjust(-0.1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-muted/50 text-text-muted hover:bg-surface-muted hover:text-text active:scale-95 transition-all"
            title="Minus 0.1 kg"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleAdjust(0.1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-muted/50 text-text-muted hover:bg-surface-muted hover:text-text active:scale-95 transition-all"
            title="Plus 0.1 kg"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Manual Input Slider / Presets */}
      <div className="space-y-1.5 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>Fine Adjust</span>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => {
              setWeight(parseFloat(e.target.value) || 0);
              setHasChanged(true);
            }}
            className="w-16 text-right rounded-md border border-border px-1.5 py-0.5 text-xs text-text font-bold"
          />
        </div>
        <input
          type="range"
          min="45"
          max="120"
          step="0.1"
          value={weight}
          onChange={(e) => {
            setWeight(parseFloat(e.target.value));
            setHasChanged(true);
          }}
          className="w-full accent-accent-warm cursor-pointer"
        />
      </div>
    </div>
  );
}
