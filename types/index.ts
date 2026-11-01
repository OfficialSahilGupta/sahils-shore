// Global Types for Sahil's Shore

export type CurrencyINR = number; // Stored as integer paise (Rs 10.50 = 1050)

export type TimestampUTC = string; // ISO 8601 UTC string (timestamptz)

export interface BaseEntity {
  id: string;
  user_id: string;
  created_at: TimestampUTC;
  updated_at: TimestampUTC;
}

export type TimelineEventType =
  | "task_completed"
  | "study_session"
  | "expense_logged"
  | "meal_logged"
  | "place_visited"
  | "media_uploaded"
  | "journal_entry";

export interface TimelineEvent extends BaseEntity {
  type: TimelineEventType;
  timestamp: TimestampUTC;
  ref_id: string;
  summary: string;
  metadata?: Record<string, unknown>;
}
