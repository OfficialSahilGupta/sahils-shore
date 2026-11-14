"use client";

// ============================================================================
// Sahil's Shore: Workout Routines & Templates Component
// Structured splits (Push, Pull, Legs, Upper, Lower, Full Body) with 1-tap start.
// ============================================================================

import React from "react";
import {
  Layers,
  Play,
  Dumbbell,
  Clock,
  Flame,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ROUTINE_TEMPLATES, RoutineTemplate } from "@/lib/workout";

interface WorkoutRoutinesViewProps {
  onStartRoutine: (template: RoutineTemplate) => void;
}

export function WorkoutRoutinesView({ onStartRoutine }: WorkoutRoutinesViewProps) {
  return (
    <div className="space-y-6 min-w-0 w-full max-w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Routine Splits & Programs</h2>
            <p className="text-xs text-text-muted">
              Scientifically engineered hypertrophy and strength splits with progressive overload
            </p>
          </div>
        </div>
      </div>

      {/* 2. Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROUTINE_TEMPLATES.map((tmpl) => (
          <Card
            key={tmpl.id}
            className="p-5 rounded-2xl border border-border bg-surface shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {tmpl.splitType.replace("_", " ")}
                  </span>
                  <h3 className="text-base font-bold text-text mt-0.5">{tmpl.name}</h3>
                </div>
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Dumbbell className="h-4 w-4" />
                </div>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">{tmpl.description}</p>

              {/* Muscle Groups */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {tmpl.muscleGroups.map((mg) => (
                  <span
                    key={mg}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-muted border border-border/60 text-text"
                  >
                    {mg}
                  </span>
                ))}
              </div>

              {/* Exercises Preview */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <span className="text-[11px] font-bold text-text-muted block">
                  Includes {tmpl.defaultExercises.length} Movements:
                </span>
                <div className="space-y-1">
                  {tmpl.defaultExercises.slice(0, 4).map((ex, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-text"
                    >
                      <span className="truncate">{ex.exerciseName}</span>
                      <span className="text-[10px] font-mono text-text-muted shrink-0 ml-1">
                        {ex.suggestedSets} × {ex.suggestedReps}
                      </span>
                    </div>
                  ))}
                  {tmpl.defaultExercises.length > 4 && (
                    <span className="text-[10px] text-text-muted italic block">
                      +{tmpl.defaultExercises.length - 4} more exercises...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => onStartRoutine(tmpl)}
              className="w-full py-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-2"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start this Workout</span>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
