// ============================================================================
// Sahil's Shore: Unified Timeline Event Helper
// Used across all modules to log and query trackable actions on `timeline_events`
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.ts";
import type { TimelineEvent, TimelineEventType } from "../../types/index.ts";
import { getISTDateRangeUTC, formatISTTime, todayIST } from "../date-utils.ts";

export interface WriteTimelineEventParams {
  /** The UUID of the authenticated user performing the action */
  userId: string;
  /** High-level activity type (task_completed, expense_logged, study_session, etc.) */
  type: TimelineEventType | string;
  /** Human-readable event summary for display on the timeline */
  summary: string;
  /** Timestamp when event occurred in reality (defaults to current UTC time) */
  occurredAt?: Date | string;
  /** Database table of the referenced entity (e.g., 'tasks', 'expenses') */
  refTable?: string | null;
  /** Primary key UUID of the referenced entity */
  refId?: string | null;
  /** Additional structured metadata for filtering and rich previews */
  meta?: Record<string, unknown> | Json;
}

/**
 * Persists an event to the shared timeline_events table.
 * Standardizes timestamp to UTC ISO 8601 string.
 */
export async function writeTimelineEvent(
  supabase: SupabaseClient<Database>,
  params: WriteTimelineEventParams
): Promise<TimelineEvent | null> {
  const {
    userId,
    type,
    summary,
    occurredAt = new Date(),
    refTable = null,
    refId = null,
    meta = {},
  } = params;

  const occurredAtUtc =
    typeof occurredAt === "string"
      ? occurredAt
      : occurredAt.toISOString();

  try {
    const { data, error } = await supabase
      .from("timeline_events")
      .insert({
        user_id: userId,
        type,
        summary,
        occurred_at: occurredAtUtc,
        ref_table: refTable,
        ref_id: refId,
        meta: (meta as Json) || {},
      })
      .select()
      .single();

    if (error) {
      console.error("[writeTimelineEvent] Failed to write event:", error.message, {
        type,
        refTable,
        refId,
      });
      return null;
    }

    return data as unknown as TimelineEvent;
  } catch (err) {
    console.error("[writeTimelineEvent] Unexpected error occurred:", err);
    return null;
  }
}

/**
 * Fetches all timeline events for a given IST date "YYYY-MM-DD"
 * Query uses UTC ISO boundary [startUTC, endUTC] to accurately isolate the IST day.
 */
export async function getTimelineEventsForDate(
  supabase: SupabaseClient<Database>,
  userId: string,
  dateStr: string = todayIST()
): Promise<TimelineEvent[]> {
  try {
    const { startUTC, endUTC } = getISTDateRangeUTC(dateStr);

    const { data, error } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", startUTC)
      .lte("occurred_at", endUTC)
      .order("occurred_at", { ascending: true });

    if (error) {
      console.error("[getTimelineEventsForDate] Query failed:", error.message, { dateStr });
      return [];
    }

    return (data || []) as unknown as TimelineEvent[];
  } catch (err) {
    console.error("[getTimelineEventsForDate] Unexpected error:", err);
    return [];
  }
}

export interface DayTotals {
  minutesStudied: number;
  totalSpentPaise: number;
  mealsCount: number;
  tasksCompleted: number;
}

/**
 * Computes summary totals from a day's timeline events:
 * - Total time studied (in minutes)
 * - Total money spent (paise integer)
 * - Total meals logged
 * - Total tasks completed
 */
export function calculateDayTotals(events: TimelineEvent[]): DayTotals {
  let minutesStudied = 0;
  let totalSpentPaise = 0;
  let mealsCount = 0;
  let tasksCompleted = 0;

  for (const ev of events) {
    const type = ev.type?.toLowerCase() || "";
    const meta = (ev.meta || {}) as Record<string, unknown>;

    // 1. Study sessions & activities
    if (type === "study_session" || type === "activity_logged" || type === "dsa_solved") {
      const duration = Number(meta.duration_minutes ?? meta.duration ?? 0);
      if (!isNaN(duration) && duration > 0) {
        minutesStudied += duration;
      }
    }

    // 2. Expenses logged
    if (type === "expense_logged" || type === "expense") {
      const paise = Number(meta.amount_paise ?? meta.amount ?? 0);
      if (!isNaN(paise) && paise > 0) {
        totalSpentPaise += paise;
      }
    }

    // 3. Meals logged
    if (type === "meal_logged" || type === "meal") {
      mealsCount += 1;
    }

    // 4. Tasks completed
    if (type === "task_completed") {
      tasksCompleted += 1;
    }
  }

  return {
    minutesStudied,
    totalSpentPaise,
    mealsCount,
    tasksCompleted,
  };
}

export interface EventTypeConfig {
  label: string;
  iconName: "check" | "book" | "wallet" | "utensils" | "pin" | "image" | "sparkles" | "zap" | "trending-up" | "file-text";
  colorClass: string;
  bgClass: string;
  borderClass: string;
  route: string;
}

/**
 * Returns type-specific presentation metadata (icon, colors, module route)
 * for a timeline event type.
 */
export function getEventTypeConfig(type: string): EventTypeConfig {
  const norm = type?.toLowerCase() || "";

  if (norm.includes("task_completed")) {
    return {
      label: "Task Done",
      iconName: "check",
      colorClass: "text-emerald-500 dark:text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/20",
      route: "/todos",
    };
  }

  if (norm.includes("task")) {
    return {
      label: "Task",
      iconName: "check",
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
      borderClass: "border-primary/20",
      route: "/todos",
    };
  }

  if (norm.includes("study") || norm.includes("activity") || norm.includes("dsa")) {
    return {
      label: "Focus & Study",
      iconName: "book",
      colorClass: "text-blue-500 dark:text-blue-400",
      bgClass: "bg-blue-500/10",
      borderClass: "border-blue-500/20",
      route: "/tracker",
    };
  }

  if (norm.includes("expense")) {
    return {
      label: "Expense",
      iconName: "wallet",
      colorClass: "text-amber-500 dark:text-amber-400",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/20",
      route: "/expenses",
    };
  }

  if (norm.includes("income")) {
    return {
      label: "Income",
      iconName: "trending-up",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/20",
      route: "/expenses",
    };
  }

  if (norm.includes("meal")) {
    return {
      label: "Meal",
      iconName: "utensils",
      colorClass: "text-rose-500 dark:text-rose-400",
      bgClass: "bg-rose-500/10",
      borderClass: "border-rose-500/20",
      route: "/food",
    };
  }

  if (norm.includes("place")) {
    return {
      label: "Place",
      iconName: "pin",
      colorClass: "text-cyan-500 dark:text-cyan-400",
      bgClass: "bg-cyan-500/10",
      borderClass: "border-cyan-500/20",
      route: "/places",
    };
  }

  if (norm.includes("photo") || norm.includes("media")) {
    return {
      label: "Photo & Media",
      iconName: "image",
      colorClass: "text-purple-500 dark:text-purple-400",
      bgClass: "bg-purple-500/10",
      borderClass: "border-purple-500/20",
      route: "/media",
    };
  }

  if (norm.includes("habit")) {
    return {
      label: "Habit",
      iconName: "zap",
      colorClass: "text-orange-500 dark:text-orange-400",
      bgClass: "bg-orange-500/10",
      borderClass: "border-orange-500/20",
      route: "/tracker",
    };
  }

  if (norm.includes("note")) {
    return {
      label: "Note",
      iconName: "file-text",
      colorClass: "text-teal-600 dark:text-teal-400",
      bgClass: "bg-teal-500/10",
      borderClass: "border-teal-500/20",
      route: "/notes",
    };
  }

  if (norm.includes("journal")) {
    return {
      label: "Journal",
      iconName: "sparkles",
      colorClass: "text-accent-warm",
      bgClass: "bg-accent-warm/10",
      borderClass: "border-accent-warm/20",
      route: "/journal",
    };
  }

  return {
    label: "Event",
    iconName: "sparkles",
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/20",
    route: "/",
  };
}

/**
 * Formats a timeline event's UTC occurred_at timestamp into human-readable IST time (e.g., "09:30 AM")
 */
export function formatTimelineEventTime(occurredAt: string | Date): string {
  return formatISTTime(occurredAt);
}
