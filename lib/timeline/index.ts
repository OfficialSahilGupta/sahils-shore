// ============================================================================
// Sahil's Shore: Unified Timeline Event Helper
// Used across all modules to log trackable actions to `timeline_events`
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { TimelineEvent, TimelineEventType } from "@/types";

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
