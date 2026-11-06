// ============================================================================
// Sahil's Shore: Intermittent Fasting Engine
// Protocols (16:8, 18:6, 20:4, 24:0), live stages (Ketosis, Autophagy),
// last-meal bridging, timeline event integration, and offline persistence.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import { writeTimelineEvent } from "../timeline/index.ts";

export type FastingProtocol = "16:8" | "18:6" | "20:4" | "14:10" | "24:0" | "custom";

export interface FastingStageInfo {
  key: "digestion" | "fat_burning" | "ketosis" | "autophagy" | "deep_ketosis";
  label: string;
  minHours: number;
  maxHours: number | null;
  description: string;
}

export const FASTING_STAGES: FastingStageInfo[] = [
  {
    key: "digestion",
    label: "Digestion & Anabolic",
    minHours: 0,
    maxHours: 4,
    description: "Blood glucose and insulin peak, digesting last nutrients.",
  },
  {
    key: "fat_burning",
    label: "Fat Burning Transition",
    minHours: 4,
    maxHours: 12,
    description: "Insulin normalizes; liver begins glycogen depletion and fat oxidation.",
  },
  {
    key: "ketosis",
    label: "Ketosis & Mental Focus",
    minHours: 12,
    maxHours: 16,
    description: "Ketone generation accelerates, offering sharp focus and metabolic rest.",
  },
  {
    key: "autophagy",
    label: "Autophagy & Cell Cleanup",
    minHours: 16,
    maxHours: 20,
    description: "Cellular renewal kicks in; clearing damaged proteins and cellular components.",
  },
  {
    key: "deep_ketosis",
    label: "Deep Cellular Regeneration",
    minHours: 20,
    maxHours: null,
    description: "Maximum autophagy and sustained ketone availability.",
  },
];

export const PROTOCOL_TARGETS: Record<FastingProtocol, number> = {
  "14:10": 14,
  "16:8": 16,
  "18:6": 18,
  "20:4": 20,
  "24:0": 24,
  custom: 16,
};

export interface FastingLog {
  id: string;
  user_id: string;
  protocol: FastingProtocol;
  target_hours: number;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FastingCalculatedState {
  activeFast: FastingLog | null;
  elapsedSeconds: number;
  targetSeconds: number;
  progressPercent: number;
  isTargetReached: boolean;
  currentStage: FastingStageInfo;
  targetEndTime: string | null;
}

const STORAGE_ACTIVE_FAST_KEY = "shore_fasting_active_fast";
const STORAGE_FASTS_HISTORY_KEY = "shore_fasting_history";

/**
 * Returns the current physiological fasting stage based on elapsed hours.
 */
export function getFastingStage(elapsedHours: number): FastingStageInfo {
  if (elapsedHours < 4) return FASTING_STAGES[0];
  if (elapsedHours < 12) return FASTING_STAGES[1];
  if (elapsedHours < 16) return FASTING_STAGES[2];
  if (elapsedHours < 20) return FASTING_STAGES[3];
  return FASTING_STAGES[4];
}

/**
 * Calculates real-time fasting progress given a start time and target hours.
 */
export function calculateFastingState(fast: FastingLog | null): FastingCalculatedState {
  if (!fast || !fast.is_active) {
    return {
      activeFast: null,
      elapsedSeconds: 0,
      targetSeconds: 16 * 3600,
      progressPercent: 0,
      isTargetReached: false,
      currentStage: FASTING_STAGES[0],
      targetEndTime: null,
    };
  }

  const startTime = new Date(fast.started_at).getTime();
  const endTime = fast.ended_at ? new Date(fast.ended_at).getTime() : Date.now();
  const elapsedMs = Math.max(0, endTime - startTime);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const targetSeconds = Math.round((fast.target_hours || 16) * 3600);
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));
  const isTargetReached = elapsedSeconds >= targetSeconds;
  const elapsedHours = elapsedSeconds / 3600;
  const currentStage = getFastingStage(elapsedHours);

  const targetEndDate = new Date(startTime + targetSeconds * 1000);

  return {
    activeFast: fast,
    elapsedSeconds,
    targetSeconds,
    progressPercent,
    isTargetReached,
    currentStage,
    targetEndTime: targetEndDate.toISOString(),
  };
}

/**
 * Fetches user's fasting logs from Supabase, falling back gracefully to local storage.
 */
export async function getFastingLogs(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FastingLog[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("fasting_logs")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_FASTS_HISTORY_KEY, JSON.stringify(data));
      }
      return data as FastingLog[];
    }
  } catch (err) {
    console.warn("[getFastingLogs] Supabase query failed, checking localStorage fallback:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STORAGE_FASTS_HISTORY_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
  }
  return [];
}

/**
 * Gets the current active fast session if one exists.
 */
export async function getActiveFast(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FastingLog | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("fasting_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ACTIVE_FAST_KEY, JSON.stringify(data));
      }
      return data as FastingLog;
    }
  } catch (err) {
    console.warn("[getActiveFast] query fallback:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STORAGE_ACTIVE_FAST_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.is_active) return parsed;
      }
    } catch {}
  }
  return null;
}

/**
 * Starts a new fasting session.
 */
export async function startFast(
  supabase: SupabaseClient<Database>,
  userId: string,
  protocol: FastingProtocol,
  targetHours?: number,
  startedAt?: string,
  notes?: string
): Promise<FastingLog> {
  const effectiveTarget = targetHours || PROTOCOL_TARGETS[protocol] || 16;
  const effectiveStart = startedAt || new Date().toISOString();

  const newLog: FastingLog = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `fast_${Date.now()}`,
    user_id: userId,
    protocol,
    target_hours: effectiveTarget,
    started_at: effectiveStart,
    ended_at: null,
    is_active: true,
    notes: notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await (supabase as any)
      .from("fasting_logs")
      .insert({
        id: newLog.id,
        user_id: userId,
        protocol,
        target_hours: effectiveTarget,
        started_at: effectiveStart,
        is_active: true,
        notes: newLog.notes,
      })
      .select()
      .single();

    if (!error && data) {
      Object.assign(newLog, data);
    }
  } catch (err) {
    console.warn("[startFast] Saved locally due to fallback:", err);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_ACTIVE_FAST_KEY, JSON.stringify(newLog));
  }

  // Log timeline event
  try {
    await writeTimelineEvent(supabase, {
      userId,
      type: "habit_completed",
      summary: `Started Fasting (${protocol} protocol • Target ${effectiveTarget}h)`,
      occurredAt: effectiveStart,
      refTable: "fasting_logs",
      refId: newLog.id,
      meta: {
        protocol,
        target_hours: effectiveTarget,
      },
    });
  } catch (timelineErr) {
    console.warn("[startFast] timeline logging non-blocking error:", timelineErr);
  }

  return newLog;
}

/**
 * Concludes an active fast.
 */
export async function endFast(
  supabase: SupabaseClient<Database>,
  userId: string,
  fastId: string,
  endedAt?: string,
  notes?: string
): Promise<FastingLog | null> {
  const effectiveEnd = endedAt || new Date().toISOString();

  let updatedLog: FastingLog | null = null;

  try {
    const { data, error } = await (supabase as any)
      .from("fasting_logs")
      .update({
        is_active: false,
        ended_at: effectiveEnd,
        notes: notes || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fastId)
      .eq("user_id", userId)
      .select()
      .single();

    if (!error && data) {
      updatedLog = data as FastingLog;
    }
  } catch (err) {
    console.warn("[endFast] Supabase update fallback:", err);
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_ACTIVE_FAST_KEY);
    // Update local history
    try {
      const historyStr = localStorage.getItem(STORAGE_FASTS_HISTORY_KEY);
      const history: FastingLog[] = historyStr ? JSON.parse(historyStr) : [];
      const updatedHistory = history.map((item) =>
        item.id === fastId ? { ...item, is_active: false, ended_at: effectiveEnd, notes: notes || item.notes } : item
      );
      if (!updatedHistory.find((i) => i.id === fastId) && updatedLog) {
        updatedHistory.unshift(updatedLog);
      }
      localStorage.setItem(STORAGE_FASTS_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch {}
  }

  return updatedLog;
}

/**
 * Deletes a fast log.
 */
export async function deleteFast(
  supabase: SupabaseClient<Database>,
  userId: string,
  fastId: string
): Promise<boolean> {
  try {
    await (supabase as any).from("fasting_logs").delete().eq("id", fastId).eq("user_id", userId);
  } catch {}

  if (typeof window !== "undefined") {
    try {
      const cachedActive = localStorage.getItem(STORAGE_ACTIVE_FAST_KEY);
      if (cachedActive && JSON.parse(cachedActive).id === fastId) {
        localStorage.removeItem(STORAGE_ACTIVE_FAST_KEY);
      }
      const historyStr = localStorage.getItem(STORAGE_FASTS_HISTORY_KEY);
      if (historyStr) {
        const history: FastingLog[] = JSON.parse(historyStr);
        localStorage.setItem(
          STORAGE_FASTS_HISTORY_KEY,
          JSON.stringify(history.filter((f) => f.id !== fastId))
        );
      }
    } catch {}
  }

  return true;
}

/**
 * Formats seconds into human-readable hours and minutes (e.g. "14h 32m").
 */
export function formatFastingDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}
