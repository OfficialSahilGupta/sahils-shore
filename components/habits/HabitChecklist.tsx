"use client";

// ============================================================================
// Sahil's Shore: Daily Habits Checklist Widget
// One-tap completion, skip-day preserving streaks, and habit management
// ============================================================================

import React, { useState } from "react";
import {
  Check,
  Flame,
  Plus,
  SkipForward,
  MoreVertical,
  Trash2,
  Edit2,
  Sparkles,
} from "lucide-react";
import type { HabitWithLogs } from "@/lib/habits";
import { formatFriendlyISTDate, todayIST } from "@/lib/date-utils";

interface HabitChecklistProps {
  habits: HabitWithLogs[];
  onToggleComplete: (habit: HabitWithLogs) => void;
  onSkipDay: (habit: HabitWithLogs, reason?: string) => void;
  onEditHabit: (habit: HabitWithLogs) => void;
  onDeleteHabit: (habit: HabitWithLogs) => void;
  onOpenCreate: () => void;
}

export function HabitChecklist({
  habits,
  onToggleComplete,
  onSkipDay,
  onEditHabit,
  onDeleteHabit,
  onOpenCreate,
}: HabitChecklistProps) {
  const [skipPromptHabit, setSkipPromptHabit] = useState<HabitWithLogs | null>(null);
  const [skipReason, setSkipReason] = useState("");

  const activeHabits = habits.filter((h) => h.is_active);
  const completedCount = activeHabits.filter((h) => h.streakInfo.isCompletedToday).length;
  const totalCount = activeHabits.length;

  const handleConfirmSkip = () => {
    if (skipPromptHabit) {
      onSkipDay(skipPromptHabit, skipReason.trim() || "rest day");
      setSkipPromptHabit(null);
      setSkipReason("");
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs space-y-4">
      {/* Header & Stats */}
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]/40">
        <div>
          <h2 className="text-base font-bold text-[var(--text)]">
            Daily Habits
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {completedCount}/{totalCount} completed today • Keep the streak alive
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits Checklist Rows */}
      <div className="space-y-2">
        {activeHabits.map((habit) => {
          const isCompleted = habit.streakInfo.isCompletedToday;
          const isSkipped = habit.streakInfo.isSkippedToday;

          return (
            <div
              key={habit.id}
              className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                isCompleted
                  ? "border-[var(--success)]/40 bg-[var(--success)]/10"
                  : isSkipped
                  ? "border-[var(--warning)]/40 bg-[var(--warning)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40"
              }`}
            >
              {/* Checkbox & Title */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleComplete(habit)}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg border transition-all ${
                    isCompleted
                      ? "border-[var(--success)] bg-[var(--success)] text-white"
                      : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/20"
                  }`}
                  title={isCompleted ? "Mark incomplete" : "Complete habit"}
                >
                  {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1">
                  <span
                    className={`text-sm font-semibold truncate block ${
                      isCompleted
                        ? "line-through text-[var(--text-muted)]"
                        : "text-[var(--text)]"
                    }`}
                  >
                    {habit.title}
                  </span>

                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span className="capitalize">{habit.frequency}</span>
                    {isSkipped && (
                      <span className="text-[var(--warning)] font-semibold">
                        • Skipped today
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Streak Badge & Actions */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold ${
                    habit.streakInfo.currentStreak > 0
                      ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                      : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                  }`}
                  title={`Current: ${habit.streakInfo.currentStreak}d • Best: ${habit.streakInfo.bestStreak}d`}
                >
                  <Flame
                    className={`h-3.5 w-3.5 ${
                      habit.streakInfo.currentStreak > 0
                        ? "fill-[var(--warning)] text-[var(--warning)]"
                        : ""
                    }`}
                  />
                  <span>{habit.streakInfo.currentStreak}d</span>
                </div>

                {/* Skip Day Button */}
                {!isCompleted && !isSkipped && (
                  <button
                    onClick={() => setSkipPromptHabit(habit)}
                    className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--warning)] hover:border-[var(--warning)]/40 transition-colors"
                    title="Skip today (keeps streak intact)"
                  >
                    <SkipForward className="h-3 w-3" />
                    <span className="hidden sm:inline">Skip</span>
                  </button>
                )}

                {/* Edit & Delete Actions */}
                <button
                  onClick={() => onEditHabit(habit)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-opacity"
                  title="Edit habit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteHabit(habit)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-opacity"
                  title="Delete habit"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {activeHabits.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
            <Sparkles className="h-6 w-6 text-[var(--primary)] mb-2" />
            <p className="text-xs font-semibold text-[var(--text)]">
              No habits created yet
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Build your consistency by tracking daily reading, gym, or problem solving.
            </p>
          </div>
        )}
      </div>

      {/* Skip Day Reason Prompt Modal */}
      {skipPromptHabit && (
        <div className="rounded-2xl border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3.5 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 text-xs">
            <p className="font-semibold text-[var(--text)]">
              Skip &quot;{skipPromptHabit.title}&quot; for today?
            </p>
            <p className="text-[var(--text-muted)] mt-0.5">
              Your streak of {skipPromptHabit.streakInfo.currentStreak} days will be preserved.
            </p>
            <input
              type="text"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Optional reason (e.g. rest day, travel)..."
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmSkip}
              className="rounded-xl bg-[var(--warning)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
            >
              Confirm Skip
            </button>
            <button
              onClick={() => setSkipPromptHabit(null)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
