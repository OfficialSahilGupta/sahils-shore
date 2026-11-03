// ============================================================================
// Sahil's Shore: Health Mini-Trackers Data Layer
// Water hydration, sleep duration/quality, workouts, weight & timeline logging
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { todayIST, addDaysIST, formatFriendlyISTDate } from "../date-utils.ts";

export const GLASS_ML = 250; // Standard 250ml glass
export const DEFAULT_WATER_GOAL_GLASSES = 8; // 2000 ml
export const DEFAULT_SLEEP_GOAL_HOURS = 8;

export interface HealthLog {
  id: string;
  user_id: string;
  logged_date: string;
  water_ml: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  workout_minutes: number | null;
  workout_type: string | null;
  workout_notes: string | null;
  weight_kg: number | null;
  created_at: string;
  updated_at: string;
}

export interface SaveHealthInput {
  logged_date: string;
  water_ml?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  workout_minutes?: number | null;
  workout_type?: string | null;
  workout_notes?: string | null;
  weight_kg?: number | null;
}

export interface HealthTrendPoint {
  date: string;
  friendlyDate: string;
  waterGlasses: number;
  waterMl: number;
  sleepHours: number;
  sleepQuality: number;
  workoutMinutes: number;
  workoutType: string;
  weightKg: number | null;
}

export function mlToGlasses(ml: number | null | undefined): number {
  if (!ml || ml <= 0) return 0;
  return Math.round(ml / GLASS_ML);
}

export function glassesToMl(glasses: number | null | undefined): number {
  if (!glasses || glasses <= 0) return 0;
  return glasses * GLASS_ML;
}

/**
 * Fetches the health log for a specific IST date.
 */
export async function getHealthLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  loggedDate: string = todayIST()
): Promise<HealthLog | null> {
  try {
    const { data, error } = await supabase
      .from("health_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("logged_date", loggedDate)
      .maybeSingle();

    if (error) {
      console.error("[getHealthLog] Error:", error.message);
      return null;
    }

    return (data as any) || null;
  } catch (err) {
    console.error("[getHealthLog] Unexpected error:", err);
    return null;
  }
}

/**
 * Saves (inserts or updates) a health log and writes specific timeline_events
 * according to the metric updated.
 */
export async function saveHealthLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: SaveHealthInput,
  categoryChanged?: "water" | "sleep" | "workout" | "weight"
): Promise<HealthLog | null> {
  try {
    const loggedDate = input.logged_date || todayIST();

    const payload: any = {
      user_id: userId,
      logged_date: loggedDate,
      updated_at: new Date().toISOString(),
    };
    if (input.water_ml !== undefined) payload.water_ml = input.water_ml;
    if (input.sleep_hours !== undefined) payload.sleep_hours = input.sleep_hours;
    if (input.sleep_quality !== undefined) payload.sleep_quality = input.sleep_quality;
    if (input.workout_minutes !== undefined) payload.workout_minutes = input.workout_minutes;
    if (input.workout_type !== undefined) payload.workout_type = input.workout_type;
    if (input.workout_notes !== undefined) payload.workout_notes = input.workout_notes;
    if (input.weight_kg !== undefined) payload.weight_kg = input.weight_kg;

    const { data, error } = await supabase
      .from("health_logs")
      .upsert(payload, { onConflict: "user_id,logged_date" })
      .select()
      .single();

    if (error || !data) {
      console.error("[saveHealthLog] Upsert error:", error?.message);
      return null;
    }

    const saved = data as any;

    // Write specific timeline event based on what was updated
    if (categoryChanged === "water" && saved.water_ml !== null) {
      const glasses = mlToGlasses(saved.water_ml);
      await writeTimelineEvent(supabase, {
        userId,
        type: "health_water",
        summary: `Hydration: Drank ${glasses} glasses (${saved.water_ml} ml)`,
        refTable: "health_logs",
        refId: saved.id,
        meta: { water_ml: saved.water_ml, glasses, logged_date: loggedDate },
      });
    } else if (categoryChanged === "sleep" && saved.sleep_hours !== null) {
      const qualStr = saved.sleep_quality ? ` (Quality ${saved.sleep_quality}/5)` : "";
      await writeTimelineEvent(supabase, {
        userId,
        type: "health_sleep",
        summary: `Sleep: Logged ${saved.sleep_hours} hrs of rest${qualStr}`,
        refTable: "health_logs",
        refId: saved.id,
        meta: {
          sleep_hours: saved.sleep_hours,
          sleep_quality: saved.sleep_quality,
          logged_date: loggedDate,
        },
      });
    } else if (categoryChanged === "workout" && saved.workout_minutes !== null) {
      const typeStr = saved.workout_type ? ` [${saved.workout_type}]` : "";
      await writeTimelineEvent(supabase, {
        userId,
        type: "health_workout",
        summary: `Workout: Completed ${saved.workout_minutes} mins${typeStr}`,
        refTable: "health_logs",
        refId: saved.id,
        meta: {
          workout_minutes: saved.workout_minutes,
          workout_type: saved.workout_type,
          logged_date: loggedDate,
        },
      });
    } else if (categoryChanged === "weight" && saved.weight_kg !== null) {
      await writeTimelineEvent(supabase, {
        userId,
        type: "health_weight",
        summary: `Weight: Logged ${saved.weight_kg} kg`,
        refTable: "health_logs",
        refId: saved.id,
        meta: { weight_kg: saved.weight_kg, logged_date: loggedDate },
      });
    }

    return saved as HealthLog;
  } catch (err) {
    console.error("[saveHealthLog] Unexpected error:", err);
    return null;
  }
}

/**
 * Fetches health trend points for the past N days.
 */
export async function getHealthTrendData(
  supabase: SupabaseClient<Database>,
  userId: string,
  daysCount: number = 7
): Promise<HealthTrendPoint[]> {
  try {
    const today = todayIST();
    const startDate = addDaysIST(today, -daysCount + 1);

    const { data: logs, error } = await supabase
      .from("health_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_date", startDate)
      .lte("logged_date", today)
      .order("logged_date", { ascending: true });

    if (error) {
      console.error("[getHealthTrendData] Error:", error.message);
      return [];
    }

    const map = new Map<string, any>();
    (logs || []).forEach((row) => map.set(row.logged_date, row));

    const points: HealthTrendPoint[] = [];

    for (let i = 0; i < daysCount; i++) {
      const d = addDaysIST(startDate, i);
      const row = map.get(d);

      points.push({
        date: d,
        friendlyDate: formatFriendlyISTDate(d),
        waterGlasses: mlToGlasses(row?.water_ml || 0),
        waterMl: row?.water_ml || 0,
        sleepHours: row?.sleep_hours ? Number(row.sleep_hours) : 0,
        sleepQuality: row?.sleep_quality || 0,
        workoutMinutes: row?.workout_minutes || 0,
        workoutType: row?.workout_type || "",
        weightKg: row?.weight_kg ? Number(row.weight_kg) : null,
      });
    }

    return points;
  } catch (err) {
    console.error("[getHealthTrendData] Unexpected error:", err);
    return [];
  }
}

/**
 * Calculates aggregate stats across recent health trend points.
 */
export function calculateHealthAverages(points: HealthTrendPoint[]) {
  const validWater = points.filter((p) => p.waterGlasses > 0);
  const validSleep = points.filter((p) => p.sleepHours > 0);
  const validWorkouts = points.filter((p) => p.workoutMinutes > 0);
  const validWeights = points.filter((p) => p.weightKg !== null);

  const avgWaterGlasses = validWater.length > 0
    ? Math.round((validWater.reduce((s, p) => s + p.waterGlasses, 0) / validWater.length) * 10) / 10
    : 0;

  const avgSleepHours = validSleep.length > 0
    ? Math.round((validSleep.reduce((s, p) => s + p.sleepHours, 0) / validSleep.length) * 10) / 10
    : 0;

  const totalWorkoutMinutes = validWorkouts.reduce((s, p) => s + p.workoutMinutes, 0);

  const latestWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1].weightKg : null;
  const firstWeight = validWeights.length > 1 ? validWeights[0].weightKg : null;
  const weightChange = latestWeight && firstWeight
    ? Math.round((latestWeight - firstWeight) * 10) / 10
    : null;

  return {
    avgWaterGlasses,
    avgSleepHours,
    totalWorkoutMinutes,
    workoutSessionsCount: validWorkouts.length,
    latestWeight,
    weightChange,
  };
}
