"use client";

// ============================================================================
// Sahil's Shore: Habits Checklist Widget
// Today's active habits, flame streaks, and 1-tap completion logging
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getHabits, logHabitDay, HabitWithLogs } from "@/lib/habits";
import { todayIST } from "@/lib/date-utils";
import { useToast } from "@/components/ui/toast";
import type { WidgetId } from "@/lib/dashboard/types";
import { Zap, Flame, CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface HabitsWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

export function HabitsWidget({ isEditMode, onRemove }: HabitsWidgetProps) {
  const [habits, setHabits] = useState<HabitWithLogs[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadHabits = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      setUserId(data.user.id);

      const res = await getHabits(supabase, data.user.id);
      setHabits(res.filter((h) => h.is_active));
    } catch (e) {
      console.warn("Failed loading habits:", e);
    }
  }, []);

  useEffect(() => {
    loadHabits();

    const handleUpdate = () => loadHabits();
    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadHabits]);

  const handleToggle = async (habit: HabitWithLogs) => {
    if (!userId) return;
    const today = todayIST();
    const existingLog = habit.logs.find((l) => l.logged_date === today);
    const wasCompleted = existingLog?.completed ?? false;
    const nextAction = wasCompleted ? "clear" : "complete";

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habit.id) return h;
        const newLogs = h.logs.filter((l) => l.logged_date !== today);
        if (nextAction === "complete") {
          newLogs.push({
            id: `temp-${Date.now()}`,
            user_id: userId,
            habit_id: habit.id,
            logged_date: today,
            completed: true,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        const curStreak = h.streakInfo?.currentStreak ?? h.current_streak ?? 0;
        return {
          ...h,
          logs: newLogs,
          current_streak: nextAction === "complete" ? curStreak + 1 : Math.max(0, curStreak - 1),
          streakInfo: {
            currentStreak: nextAction === "complete" ? curStreak + 1 : Math.max(0, curStreak - 1),
            bestStreak: h.streakInfo?.bestStreak ?? h.best_streak ?? 0,
            isCompletedToday: nextAction === "complete",
            isSkippedToday: false,
          },
        };
      })
    );

    const supabase = createClient();
    await logHabitDay(supabase, userId, habit, today, nextAction);

    toast({
      title: nextAction === "complete" ? "Habit checked! 🔥" : "Habit unchecked",
      description: habit.title,
      type: "success",
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shore:data-updated"));
    }
  };

  const today = todayIST();
  const completedCount = habits.filter((h) => {
    const l = h.logs.find((log) => log.logged_date === today);
    return l?.completed;
  }).length;

  return (
    <WidgetContainer
      id="habits"
      title="Habit Checklist"
      icon={Zap}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <span className="text-[11px] font-bold text-accent-warm flex items-center gap-0.5">
          <Flame className="w-3 h-3 fill-accent-warm text-accent-warm" />
          {completedCount}/{habits.length}
        </span>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-3">
        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-48 pr-0.5">
          {habits.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted">
              No active habits set up yet.
            </div>
          ) : (
            habits.map((habit) => {
              const log = habit.logs.find((l) => l.logged_date === today);
              const isDone = !!log?.completed;
              const streak = habit.streakInfo?.currentStreak ?? habit.current_streak ?? 0;

              return (
                <div
                  key={habit.id}
                  onClick={() => handleToggle(habit)}
                  className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer select-none transition-all ${
                    isDone
                      ? "border-emerald-500/30 bg-emerald-500/5 text-text"
                      : "border-border/70 hover:border-primary/40 bg-surface text-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className="text-text-muted hover:text-emerald-500 transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                    <span className={`text-xs font-semibold truncate ${isDone ? "line-through text-text-muted" : "text-text"}`}>
                      {habit.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-orange-500 shrink-0">
                    <Flame className="w-3.5 h-3.5 fill-orange-500/20" />
                    <span>{streak}d</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">
            {completedCount === habits.length && habits.length > 0
              ? "All habits crushed! 🎉"
              : `${habits.length - completedCount} habits left`}
          </span>
          <Link href="/tracker" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Daily Tracker</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
