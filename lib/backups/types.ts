// ============================================================================
// Sahil's Shore: Backups & Restore Type Definitions
// ============================================================================

export const ALL_BACKUP_TABLES = [
  // 1. Core Profile & Settings
  "profiles",
  "settings",
  // 2. Foundation Entities
  "activities",
  "expense_categories",
  "learning_tracks",
  "goals",
  "places",
  "albums",
  // 3. Primary Data Records
  "tasks",
  "subtasks",
  "habits",
  "habit_logs",
  "activity_logs",
  "dsa_problems",
  "learning_items",
  "learning_concepts",
  "mini_project_ideas",
  "resource_links",
  "projects",
  "interview_qa",
  "vocab_cards",
  "grammar_notes",
  "pronunciation_recordings",
  "resumes",
  "bullet_bank",
  "applications",
  "interview_stories",
  "company_notes",
  "expenses",
  "incomes",
  "budgets",
  "recurring_expenses",
  "meals",
  "media_items",
  "journal_entries",
  "notes",
  "note_links",
  "milestones",
  "health_logs",
  "ai_coach_insights",
  "timeline_events",
] as const;

export type BackupTableName = (typeof ALL_BACKUP_TABLES)[number];

export const KEY_CSV_TABLES: BackupTableName[] = [
  "tasks",
  "expenses",
  "incomes",
  "habits",
  "activity_logs",
  "dsa_problems",
  "vocab_cards",
  "applications",
  "meals",
  "places",
  "notes",
  "journal_entries",
  "health_logs",
];

export interface BackupMetadata {
  appName: "Sahil's Shore";
  version: "1.0.0";
  exportedAt: string; // ISO 8601 UTC
  exportedAtIST: string;
  userId: string;
  tableCounts: Record<string, number>;
  totalRows: number;
}

export interface FullBackupPayload {
  metadata: BackupMetadata;
  tables: Record<string, Record<string, unknown>[]>;
}

export interface TableExportSummary {
  name: string;
  count: number;
}

export interface RestorePreview {
  valid: boolean;
  version?: string;
  exportedAt?: string;
  exportedAtIST?: string;
  totalTables: number;
  totalRows: number;
  tableBreakdown: Record<string, number>;
  errors?: string[];
  warnings?: string[];
}

export interface RestoreOptions {
  mode: "merge" | "replace";
}

export interface RestoreResult {
  success: boolean;
  mode: "merge" | "replace";
  restoredTables: number;
  restoredRows: number;
  tableResults: Record<string, { inserted: number; errors?: string }>;
  durationMs: number;
  error?: string;
}

export interface BackupHistoryItem {
  id: string;
  triggerType: "manual" | "cron" | "restore";
  status: "in_progress" | "success" | "failed";
  folderName: string;
  driveFolderId: string | null;
  tablesCount: number;
  rowsCount: number;
  fileSizeBytes: number;
  details: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
}
