// ============================================================================
// Sahil's Shore: Habits Data Access & Streak Logic
// Habit definitions, daily checklist, skip-day preserving streaks, and timeline sync
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import type { Habit, HabitLog } from "../../types/index.ts";

export type { Habit, HabitLog };
import { writeTimelineEvent } from "../timeline/index.ts";
import {
  todayIST,
  yesterdayIST,
  addDaysIST,
  diffDaysIST,
  getISTDayOfWeek,
} from "../date-utils.ts";

export interface CreateHabitInput {
  title: string;
  frequency?: "daily" | "weekly" | "custom";
  target_days?: string[]; // e.g. ["mon", "wed", "fri"]
  color?: string | null;
  icon?: string | null;
}

export interface HabitWithLogs extends Habit {
  logs: HabitLog[];
  todayLog?: HabitLog;
  streakInfo: {
    currentStreak: number;
    bestStreak: number;
    isCompletedToday: boolean;
    isSkippedToday: boolean;
  };
}

/**
 * Calculates habit streak with skip-day preservation.
 * A day marked as skipped (completed = false, notes = "skipped") does NOT break the streak.
 */
export function calculateHabitStreak(
  habit: Habit,
  logs: HabitLog[]
): {
  currentStreak: number;
  bestStreak: number;
  isCompletedToday: boolean;
  isSkippedToday: boolean;
} {
  const logMap = new Map<string, HabitLog>();
  logs.forEach((l) => logMap.set(l.logged_date, l));

  const today = todayIST();
  const yesterday = yesterdayIST();

  const todayLog = logMap.get(today);
  const isCompletedToday = todayLog ? todayLog.completed : false;
  const isSkippedToday = todayLog ? !todayLog.completed && (todayLog.notes?.includes("skip") ?? false) : false;

  // Determine scheduled target days
  const targetDays =
    habit.frequency === "daily"
      ? ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
      : (habit.target_days || []).map((d) => d.toLowerCase().slice(0, 3));

  function isScheduledOn(dateStr: string): boolean {
    if (habit.frequency === "daily") return true;
    const dayOfWeek = getISTDayOfWeek(dateStr);
    return targetDays.includes(dayOfWeek);
  }

  // 1. Calculate Current Streak
  let currentStreak = 0;
  // If today is completed or skipped, start check from today; else start from yesterday
  let checkDate =
    isCompletedToday || isSkippedToday
      ? today
      : yesterday;

  let cur = checkDate;
  // Maximum lookback 365 days
  for (let i = 0; i < 365; i++) {
    // Only evaluate days on which the habit was scheduled
    if (isScheduledOn(cur)) {
      const log = logMap.get(cur);
      if (!log) {
        // Missed scheduled day -> breaks current streak
        break;
      }
      if (log.completed) {
        currentStreak++;
      } else if (log.notes?.includes("skip")) {
        // Skip-day: preserves streak without breaking or incrementing
        // Continue lookback
      } else {
        // Explicitly uncompleted without skip -> breaks streak
        break;
      }
    }
    cur = addDaysIST(cur, -1);
  }

  // 2. Calculate Best Streak across full historical log
  let bestStreak = habit.best_streak || 0;
  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  return {
    currentStreak,
    bestStreak,
    isCompletedToday,
    isSkippedToday,
  };
}

// ----------------------------------------------------------------------------
// Supabase Data Access Functions
// ----------------------------------------------------------------------------

export async function getHabits(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<HabitWithLogs[]> {
  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (habitsError) {
    console.error("[getHabits] Error fetching habits:", habitsError);
    return [];
  }

  if (!habits || habits.length === 0) return [];

  const habitIds = habits.map((h) => h.id);
  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .in("habit_id", habitIds)
    .order("logged_date", { ascending: false });

  if (logsError) {
    console.warn("[getHabits] Error fetching habit logs:", logsError);
  }

  const logsByHabitId: Record<string, HabitLog[]> = {};
  (logs || []).forEach((l) => {
    if (!logsByHabitId[l.habit_id]) logsByHabitId[l.habit_id] = [];
    logsByHabitId[l.habit_id].push(l as HabitLog);
  });

  const today = todayIST();

  return habits.map((h) => {
    const habitLogs = logsByHabitId[h.id] || [];
    const todayLog = habitLogs.find((l) => l.logged_date === today);
    const streakInfo = calculateHabitStreak(h as Habit, habitLogs);

    return {
      ...(h as Habit),
      logs: habitLogs,
      todayLog,
      streakInfo,
    };
  });
}

export async function createHabit(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateHabitInput
): Promise<Habit | null> {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: userId,
      title: input.title,
      frequency: input.frequency || "daily",
      target_days: input.target_days || [],
      color: input.color || "#1F7A8C",
      icon: input.icon || "Sparkles",
      is_active: true,
      current_streak: 0,
      best_streak: 0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createHabit] Error creating habit:", error);
    return null;
  }

  return data as Habit;
}

export async function updateHabit(
  supabase: SupabaseClient<Database>,
  userId: string,
  habitId: string,
  updates: Partial<CreateHabitInput & { is_active: boolean; current_streak: number; best_streak: number }>
): Promise<Habit | null> {
  const { data, error } = await supabase
    .from("habits")
    .update(updates)
    .eq("id", habitId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[updateHabit] Error updating habit:", error);
    return null;
  }

  return data as Habit;
}

export async function deleteHabit(
  supabase: SupabaseClient<Database>,
  userId: string,
  habitId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Toggles or logs a habit day (complete, skip, or unlog).
 */
export async function logHabitDay(
  supabase: SupabaseClient<Database>,
  userId: string,
  habit: Habit,
  date: string = todayIST(),
  action: "complete" | "skip" | "clear",
  notes?: string
): Promise<HabitLog | null> {
  if (action === "clear") {
    await supabase
      .from("habit_logs")
      .delete()
      .eq("user_id", userId)
      .eq("habit_id", habit.id)
      .eq("logged_date", date);

    return null;
  }

  const isCompleted = action === "complete";
  const noteText = action === "skip" ? (notes || "skipped") : notes || null;

  const { data: log, error } = await supabase
    .from("habit_logs")
    .upsert(
      {
        user_id: userId,
        habit_id: habit.id,
        logged_date: date,
        completed: isCompleted,
        notes: noteText,
      },
      { onConflict: "user_id,habit_id,logged_date" }
    )
    .select()
    .single();

  if (error || !log) {
    console.error("[logHabitDay] Error saving habit log:", error);
    return null;
  }

  // Write Timeline Event if completed
  if (isCompleted) {
    await writeTimelineEvent(supabase, {
      userId,
      type: "goal_milestone",
      summary: `Completed habit: ${habit.title}`,
      refTable: "habit_logs",
      refId: log.id,
      meta: {
        habit_id: habit.id,
        logged_date: date,
      },
    });
  }

  return log as HabitLog;
}
