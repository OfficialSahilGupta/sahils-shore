// ============================================================================
// Sahil's Shore: Daily Tracker Data Access & Domain Logic
// Activities, Timer/Pomodoro, IST streak calculation, Heatmap, and Charts
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import type { Activity, ActivityLog } from "../../types/index.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import {
  todayIST,
  yesterdayIST,
  addDaysIST,
  diffDaysIST,
  getISTDateString,
  getISTWeekDays,
} from "../date-utils.ts";

export interface CreateActivityInput {
  name: string;
  icon?: string | null;
  color?: string | null;
  daily_target_minutes?: number;
}

export interface LogActivityInput {
  activity_id: string;
  duration_seconds: number;
  started_at?: string; // ISO UTC string
  notes?: string | null;
}

export interface ActivityStreakInfo {
  currentStreak: number;
  bestStreak: number;
  todayLoggedMinutes: number;
  totalMinutes: number;
  hasMetTodayTarget: boolean;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  minutes: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // intensity
}

export interface WeeklyChartItem {
  date: string;
  dayShort: string;
  totalMinutes: number;
  targetMinutes: number;
  [activityName: string]: string | number;
}

export interface MonthlyChartItem {
  date: string;
  dayNum: number;
  totalMinutes: number;
  targetMinutes: number;
}

/**
 * Calculates current streak and best streak from activity logs.
 * Strictly respects IST day boundaries (18:30 UTC = 00:00 IST next day).
 */
export function calculateActivityStreaks(
  logs: ActivityLog[],
  targetMinutes: number = 0,
  minThresholdMinutes: number = 15
): ActivityStreakInfo {
  if (!logs || logs.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      todayLoggedMinutes: 0,
      totalMinutes: 0,
      hasMetTodayTarget: false,
    };
  }

  // 1. Group logs by IST calendar date
  const minutesByDate: Record<string, number> = {};
  let totalMinutes = 0;

  logs.forEach((log) => {
    const istDate = getISTDateString(log.started_at);
    const mins = Math.round(log.duration_seconds / 60);
    minutesByDate[istDate] = (minutesByDate[istDate] || 0) + mins;
    totalMinutes += mins;
  });

  // Effective threshold to qualify a day: minimum of target or threshold (or 1 if target is 0)
  const threshold =
    targetMinutes > 0
      ? Math.min(targetMinutes, minThresholdMinutes > 0 ? minThresholdMinutes : targetMinutes)
      : 1;

  const today = todayIST();
  const yesterday = yesterdayIST();
  const todayMinutes = minutesByDate[today] || 0;
  const hasMetTodayTarget = targetMinutes > 0 ? todayMinutes >= targetMinutes : todayMinutes > 0;

  // Filter sorted list of unique qualifying IST dates (ascending)
  const qualifyingDates = Object.keys(minutesByDate)
    .filter((d) => minutesByDate[d] >= threshold)
    .sort();

  if (qualifyingDates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      todayLoggedMinutes: todayMinutes,
      totalMinutes,
      hasMetTodayTarget,
    };
  }

  const qualifyingSet = new Set(qualifyingDates);

  // 2. Calculate Current Streak
  let currentStreak = 0;
  let checkDate = qualifyingSet.has(today) ? today : qualifyingSet.has(yesterday) ? yesterday : null;

  if (checkDate) {
    let cur = checkDate;
    while (qualifyingSet.has(cur)) {
      currentStreak++;
      cur = addDaysIST(cur, -1);
    }
  }

  // 3. Calculate Best Streak (longest consecutive run in history)
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const curDate of qualifyingDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = diffDaysIST(prevDate, curDate);
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    prevDate = curDate;
  }

  return {
    currentStreak,
    bestStreak,
    todayLoggedMinutes: todayMinutes,
    totalMinutes,
    hasMetTodayTarget,
  };
}

/**
 * Generates 365 days of heatmap data for GitHub-style activity grid (IST based).
 */
export function generateYearlyHeatmapData(
  logs: ActivityLog[],
  activityId?: string
): HeatmapDay[] {
  const filteredLogs = activityId
    ? logs.filter((l) => l.activity_id === activityId)
    : logs;

  const minutesByDate: Record<string, { minutes: number; count: number }> = {};
  filteredLogs.forEach((log) => {
    const d = getISTDateString(log.started_at);
    if (!minutesByDate[d]) {
      minutesByDate[d] = { minutes: 0, count: 0 };
    }
    minutesByDate[d].minutes += Math.round(log.duration_seconds / 60);
    minutesByDate[d].count += 1;
  });

  const today = todayIST();
  const days: HeatmapDay[] = [];

  // Generate 52 weeks = 364 days back to today
  for (let i = 363; i >= 0; i--) {
    const dStr = addDaysIST(today, -i);
    const entry = minutesByDate[dStr] || { minutes: 0, count: 0 };
    const mins = entry.minutes;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (mins > 0 && mins < 30) level = 1;
    else if (mins >= 30 && mins < 60) level = 2;
    else if (mins >= 60 && mins < 120) level = 3;
    else if (mins >= 120) level = 4;

    days.push({
      date: dStr,
      minutes: mins,
      count: entry.count,
      level,
    });
  }

  return days;
}

/**
 * Generates Weekly Chart items for Recharts (Monday to Sunday in IST).
 */
export function generateWeeklyChartData(
  logs: ActivityLog[],
  activities: Activity[],
  baseDate: string = todayIST()
): WeeklyChartItem[] {
  const weekDays = getISTWeekDays(baseDate);
  const actMap = new Map(activities.map((a) => [a.id, a]));

  const totalTargetMinutes = activities.reduce(
    (sum, a) => sum + (a.is_active ? a.daily_target_minutes : 0),
    0
  );

  return weekDays.map((day) => {
    const dayLogs = logs.filter((l) => getISTDateString(l.started_at) === day.date);
    let totalMinutes = 0;
    const item: WeeklyChartItem = {
      date: day.date,
      dayShort: day.dayShort,
      totalMinutes: 0,
      targetMinutes: totalTargetMinutes,
    };

    dayLogs.forEach((l) => {
      const mins = Math.round(l.duration_seconds / 60);
      totalMinutes += mins;
      const act = actMap.get(l.activity_id);
      const actName = act ? act.name : "Other";
      item[actName] = ((item[actName] as number) || 0) + mins;
    });

    item.totalMinutes = totalMinutes;
    return item;
  });
}

/**
 * Generates Monthly Chart items for Recharts.
 */
export function generateMonthlyChartData(
  logs: ActivityLog[],
  activities: Activity[],
  yearMonth: string // "YYYY-MM"
): MonthlyChartItem[] {
  const [y, m] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const totalTargetMinutes = activities.reduce(
    (sum, a) => sum + (a.is_active ? a.daily_target_minutes : 0),
    0
  );

  const minutesByDate: Record<string, number> = {};
  logs.forEach((log) => {
    const dStr = getISTDateString(log.started_at);
    if (dStr.startsWith(yearMonth)) {
      minutesByDate[dStr] =
        (minutesByDate[dStr] || 0) + Math.round(log.duration_seconds / 60);
    }
  });

  const result: MonthlyChartItem[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${yearMonth}-${day < 10 ? `0${day}` : `${day}`}`;
    result.push({
      date: dStr,
      dayNum: day,
      totalMinutes: minutesByDate[dStr] || 0,
      targetMinutes: totalTargetMinutes,
    });
  }

  return result;
}

// ----------------------------------------------------------------------------
// Supabase Data Access Functions
// ----------------------------------------------------------------------------

export async function getActivities(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getActivities] Error fetching activities:", error);
    return [];
  }

  return (data || []) as Activity[];
}

export async function createActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateActivityInput
): Promise<Activity | null> {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: userId,
      name: input.name,
      icon: input.icon || "Activity",
      color: input.color || "#1F7A8C",
      daily_target_minutes: input.daily_target_minutes || 0,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createActivity] Error creating activity:", error);
    return null;
  }

  return data as Activity;
}

export async function updateActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  activityId: string,
  updates: Partial<CreateActivityInput & { is_active: boolean }>
): Promise<Activity | null> {
  const { data, error } = await supabase
    .from("activities")
    .update(updates)
    .eq("id", activityId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[updateActivity] Error updating activity:", error);
    return null;
  }

  return data as Activity;
}

export async function deleteActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  activityId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", userId);

  return !error;
}

export async function getActivityLogs(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 500
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getActivityLogs] Error fetching activity logs:", error);
    return [];
  }

  return (data || []) as ActivityLog[];
}

export async function logActivityTime(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: LogActivityInput,
  activityName?: string
): Promise<ActivityLog | null> {
  const startedAt = input.started_at || new Date().toISOString();

  const { data: log, error } = await supabase
    .from("activity_logs")
    .insert({
      user_id: userId,
      activity_id: input.activity_id,
      duration_seconds: input.duration_seconds,
      started_at: startedAt,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error || !log) {
    console.error("[logActivityTime] Error logging activity time:", error);
    return null;
  }

  // Write Timeline Event
  const minutes = Math.round(input.duration_seconds / 60);
  const name = activityName || "Activity";
  await writeTimelineEvent(supabase, {
    userId,
    type: "study_session",
    occurredAt: startedAt,
    summary: `Logged ${minutes}m of ${name}`,
    refTable: "activity_logs",
    refId: log.id,
    meta: {
      activity_id: input.activity_id,
      activity_name: name,
      duration_seconds: input.duration_seconds,
      notes: input.notes || null,
    },
  });

  return log as ActivityLog;
}
