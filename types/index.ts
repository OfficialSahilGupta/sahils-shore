// ============================================================================
// Sahil's Shore: Global TypeScript Type Definitions
// ============================================================================

import type { Database } from "@/types/database";

export * from "@/types/database";

// Currency in paise (Rs 10.50 = 1050). Never use floats for money.
export type CurrencyINR = number;

// ISO 8601 UTC string (timestamptz)
export type TimestampUTC = string;

// Standard base entity with UUID and UTC timestamps
export interface BaseEntity {
  id: string;
  user_id: string;
  created_at: TimestampUTC;
  updated_at: TimestampUTC;
}

// Unified Timeline Events
export type TimelineEventType =
  | "task_completed"
  | "task_created"
  | "study_session"
  | "dsa_solved"
  | "expense_logged"
  | "income_logged"
  | "meal_logged"
  | "place_visited"
  | "media_uploaded"
  | "journal_entry"
  | "vocab_reviewed"
  | "goal_milestone"
  | "health_logged";

export interface TimelineEvent extends BaseEntity {
  type: TimelineEventType;
  occurred_at: TimestampUTC;
  ref_table: string | null;
  ref_id: string | null;
  summary: string;
  meta: Record<string, unknown>;
}

// Table Row Types convenience aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserSettings = Database["public"]["Tables"]["settings"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Subtask = Database["public"]["Tables"]["subtasks"]["Row"];
export type Habit = Database["public"]["Tables"]["habits"]["Row"];
export type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
export type DsaProblem = Database["public"]["Tables"]["dsa_problems"]["Row"];
export type LearningTrack = Database["public"]["Tables"]["learning_tracks"]["Row"];
export type LearningItem = Database["public"]["Tables"]["learning_items"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type InterviewQa = Database["public"]["Tables"]["interview_qa"]["Row"];
export type VocabCard = Database["public"]["Tables"]["vocab_cards"]["Row"];
export type GrammarNote = Database["public"]["Tables"]["grammar_notes"]["Row"];
export type PronunciationRecording = Database["public"]["Tables"]["pronunciation_recordings"]["Row"];
export type Resume = Database["public"]["Tables"]["resumes"]["Row"];
export type BulletBankItem = Database["public"]["Tables"]["bullet_bank"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type InterviewStory = Database["public"]["Tables"]["interview_stories"]["Row"];
export type ExpenseCategory = Database["public"]["Tables"]["expense_categories"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Income = Database["public"]["Tables"]["incomes"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type Meal = Database["public"]["Tables"]["meals"]["Row"];
export type Place = Database["public"]["Tables"]["places"]["Row"];
export type Album = Database["public"]["Tables"]["albums"]["Row"];
export type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];
export type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type NoteLink = Database["public"]["Tables"]["note_links"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
export type HealthLog = Database["public"]["Tables"]["health_logs"]["Row"];
export type DriveCredentials = Database["public"]["Tables"]["drive_credentials"]["Row"];
export type SyncQueueItem = Database["public"]["Tables"]["sync_queue"]["Row"];
