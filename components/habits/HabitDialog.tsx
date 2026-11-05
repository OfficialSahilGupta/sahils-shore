"use client";

// ============================================================================
// Sahil's Shore: Habit Create/Edit Modal Dialog
// Define daily, weekly, or specific-day habits with custom accent colors
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Habit } from "@/types";
import type { HabitWithLogs, CreateHabitInput } from "@/lib/habits";
import { Check } from "lucide-react";
import { Select } from "@/components/ui/select";

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: HabitWithLogs | null;
  onSave: (data: CreateHabitInput) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const PRESET_COLORS = [
  "#1F7A8C", // Shore teal
  "#E0A458", // Warm sand
  "#2E9E6B", // Green
  "#D1495B", // Coral
  "#8E44AD", // Purple
  "#3498DB", // Blue
];

export function HabitDialog({
  open,
  onOpenChange,
  habit,
  onSave,
}: HabitDialogProps) {
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("daily");
  const [targetDays, setTargetDays] = useState<string[]>([]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setFrequency(habit.frequency);
      setTargetDays(habit.target_days || []);
      setColor(habit.color || PRESET_COLORS[0]);
    } else {
      setTitle("");
      setFrequency("daily");
      setTargetDays([]);
      setColor(PRESET_COLORS[0]);
    }
  }, [habit, open]);

  const toggleDay = (dayKey: string) => {
    if (targetDays.includes(dayKey)) {
      setTargetDays(targetDays.filter((d) => d !== dayKey));
    } else {
      setTargetDays([...targetDays, dayKey]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        frequency,
        target_days: frequency === "custom" ? targetDays : [],
        color,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit Habit" : "New Habit"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Habit Title <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read German 15 mins"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Frequency
            </label>
            <Select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as "daily" | "weekly" | "custom")
              }
              options={[
                { value: "daily", label: "Every day" },
                { value: "weekly", label: "Once a week" },
                { value: "custom", label: "Specific days of the week" },
              ]}
            />
          </div>

          {/* Target Days selector if custom */}
          {frequency === "custom" && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                Target Days
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = targetDays.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Badge Color
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : habit ? "Save Habit" : "Create Habit"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
