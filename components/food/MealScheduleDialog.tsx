"use client";

// ============================================================================
// Sahil's Shore: Meal Schedule Settings Modal
// Allows customizing Sahil's regular meal timings:
// - Breakfast: 07:30 – 08:30 (typical 08:00)
// - Lunch: 12:00 – 13:15 (typical 12:45)
// - Snacks: 16:30 – 17:15 (typical 17:00)
// - Dinner: 19:00 – 20:00 (typical 19:30)
// Provides instant preview, 1-tap reset to defaults, and zero emojis.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Coffee,
  Sun,
  Cookie,
  Moon,
  RotateCcw,
  Check,
  Sparkles,
  Info,
} from "lucide-react";
import {
  type MealSchedule,
  type MealType,
  DEFAULT_MEAL_SCHEDULE,
  getMealSchedule,
  saveMealSchedule,
  resetMealSchedule,
  format24To12,
  formatRangeDisplay,
} from "@/lib/food/schedule";
import { useScrollLock } from "@/hooks/useScrollLock";

interface MealScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (schedule: MealSchedule) => void;
}

const SLOT_ICONS: Record<MealType, React.ElementType> = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Cookie,
  dinner: Moon,
};

export function MealScheduleDialog({
  isOpen,
  onClose,
  onSaved,
}: MealScheduleDialogProps) {
  useScrollLock(isOpen);

  const [schedule, setSchedule] = useState<MealSchedule>(DEFAULT_MEAL_SCHEDULE);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSchedule(getMealSchedule());
      setHasChanges(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    type: MealType,
    field: "startTime" | "endTime" | "typicalTime",
    value: string
  ) => {
    setSchedule((prev) => {
      const updatedSlot = {
        ...prev[type],
        [field]: value,
      };
      // Recompute display range
      updatedSlot.displayRange = formatRangeDisplay(
        field === "startTime" ? value : updatedSlot.startTime,
        field === "endTime" ? value : updatedSlot.endTime
      );
      updatedSlot.quickTimes = [
        updatedSlot.startTime,
        updatedSlot.typicalTime,
        updatedSlot.endTime,
      ];

      return {
        ...prev,
        [type]: updatedSlot,
      };
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMealSchedule(schedule);
    setHasChanges(false);
    onSaved?.(schedule);
    onClose();
  };

  const handleReset = () => {
    const defaultSched = resetMealSchedule();
    setSchedule(defaultSched);
    setHasChanges(true);
  };

  const slots: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="schedule-modal-title"
                className="text-base sm:text-lg font-bold text-text tracking-tight"
              >
                Regular Meal Timings
              </h2>
              <p className="text-xs text-text-muted">
                Define your default windows and typical hours for smart pre-filling
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="p-3 rounded-xl bg-surface-muted border border-border/60 text-xs text-text-muted flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              These timings guide smart slot suggestions and quick time chips. On irregular days, you can always edit the exact time directly in the meal logger.
            </p>
          </div>

          <div className="space-y-3.5">
            {slots.map((type) => {
              const slot = schedule[type];
              const Icon = SLOT_ICONS[type];

              return (
                <div
                  key={type}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-background/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-text">
                        {slot.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-surface border border-border text-primary">
                      {slot.displayRange}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Window Start */}
                    <div>
                      <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
                        Starts At
                      </label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleChange(type, "startTime", e.target.value)
                        }
                        className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Typical / Midpoint */}
                    <div>
                      <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
                        Typical (Default)
                      </label>
                      <input
                        type="time"
                        value={slot.typicalTime}
                        onChange={(e) =>
                          handleChange(type, "typicalTime", e.target.value)
                        }
                        className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-primary/40 bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                      />
                    </div>

                    {/* Window End */}
                    <div>
                      <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
                        Ends At
                      </label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleChange(type, "endTime", e.target.value)
                        }
                        className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border/70 flex items-center justify-between gap-3 bg-surface">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 shadow-sm active:scale-95 transition-all"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Save Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
