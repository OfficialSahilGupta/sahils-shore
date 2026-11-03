// ============================================================================
// Sahil's Shore: Backup Preview and Restore Engine (Merge or Replace)
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import { ALL_BACKUP_TABLES } from "./types.ts";
import type {
  RestorePreview,
  RestoreOptions,
  RestoreResult,
  FullBackupPayload,
} from "./types.ts";
import { writeTimelineEvent } from "../timeline/index.ts";

/**
 * Validates a backup JSON string and returns a preview of row counts per table.
 */
export function previewBackup(jsonString: string): RestorePreview {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = JSON.parse(jsonString);

    let tables: Record<string, unknown[]> = {};
    let version = "1.0.0";
    let exportedAt: string | undefined;
    let exportedAtIST: string | undefined;

    if (parsed && typeof parsed === "object") {
      if (parsed.tables && typeof parsed.tables === "object") {
        tables = parsed.tables;
        version = parsed.metadata?.version || "1.0.0";
        exportedAt = parsed.metadata?.exportedAt;
        exportedAtIST = parsed.metadata?.exportedAtIST;
      } else {
        // Flat tables format
        tables = parsed;
      }
    } else {
      errors.push("Invalid backup format: root must be a JSON object.");
      return {
        valid: false,
        totalTables: 0,
        totalRows: 0,
        tableBreakdown: {},
        errors,
      };
    }

    const tableBreakdown: Record<string, number> = {};
    let totalRows = 0;
    const knownTablesSet = new Set<string>(ALL_BACKUP_TABLES);

    for (const [table, rows] of Object.entries(tables)) {
      if (Array.isArray(rows)) {
        tableBreakdown[table] = rows.length;
        totalRows += rows.length;
        if (!knownTablesSet.has(table)) {
          warnings.push(`Unrecognized table "${table}" found with ${rows.length} rows.`);
        }
      }
    }

    if (totalRows === 0 && Object.keys(tableBreakdown).length === 0) {
      errors.push("Backup file contains no recognizable table data or rows.");
    }

    return {
      valid: errors.length === 0,
      version,
      exportedAt,
      exportedAtIST,
      totalTables: Object.keys(tableBreakdown).length,
      totalRows,
      tableBreakdown,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (err: any) {
    return {
      valid: false,
      totalTables: 0,
      totalRows: 0,
      tableBreakdown: {},
      errors: [`JSON parse failure: ${err?.message || "Invalid JSON syntax"}`],
    };
  }
}

/**
 * Clean dependency order for restoration (foreign keys respected)
 */
export const RESTORE_ORDER: string[] = [
  // Tier 1: System / Preferences
  "profiles",
  "settings",
  // Tier 2: Foundation dictionaries & roots
  "activities",
  "expense_categories",
  "learning_tracks",
  "goals",
  "places",
  "albums",
  // Tier 3: Core tracked records
  "tasks",
  "habits",
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
  "milestones",
  "german_progress",
  "german_listening_logs",
  "german_writing_entries",
  "ai_coach_insights",
  // Tier 4: Leaves with multi-table FK dependencies
  "subtasks",
  "habit_logs",
  "note_links",
  "health_logs",
  "pronunciation_recordings",
  "timeline_events",
];

/**
 * Executes restoration into Supabase database (merge or replace mode).
 */
export async function executeRestore(
  supabase: SupabaseClient<Database>,
  userId: string,
  backupData: FullBackupPayload | Record<string, Record<string, unknown>[]>,
  options: RestoreOptions
): Promise<RestoreResult> {
  const startTime = Date.now();
  const tables = (backupData as any).tables || backupData;
  const tableResults: Record<string, { inserted: number; errors?: string }> = {};
  let totalInserted = 0;
  let totalTables = 0;

  try {
    // 1. If mode === 'replace', cleanly wipe user records in reverse dependency order
    if (options.mode === "replace") {
      const reverseOrder = [...RESTORE_ORDER].reverse();
      for (const table of reverseOrder) {
        // Do not wipe profiles and settings rows directly, they will be updated in-place
        if (table === "profiles" || table === "settings") continue;

        try {
          await (supabase as any).from(table).delete().eq("user_id", userId);
        } catch (delErr: any) {
          console.warn(`[executeRestore] Table wipe notice for ${table}:`, delErr?.message);
        }
      }
    }

    // 2. Insert or Upsert tables in strict dependency order
    for (const table of RESTORE_ORDER) {
      const rows = tables[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      totalTables++;
      // Re-assign user_id to prevent any mismatch with current authenticated user
      const sanitizedRows = rows.map((r) => ({
        ...r,
        user_id: userId,
      }));

      // Split in chunks of 100 to avoid payload size limits
      const chunkSize = 100;
      let insertedCount = 0;
      let tableError: string | undefined;

      for (let i = 0; i < sanitizedRows.length; i += chunkSize) {
        const chunk = sanitizedRows.slice(i, i + chunkSize);
        try {
          const { error } = await (supabase as any)
            .from(table)
            .upsert(chunk, { onConflict: "id", ignoreDuplicates: false });

          if (error) {
            tableError = error.message;
            console.error(`[executeRestore] Error restoring ${table}:`, error.message);
            break;
          } else {
            insertedCount += chunk.length;
          }
        } catch (insertErr: any) {
          tableError = insertErr?.message || "Unknown error";
          break;
        }
      }

      tableResults[table] = {
        inserted: insertedCount,
        errors: tableError,
      };
      totalInserted += insertedCount;
    }

    const durationMs = Date.now() - startTime;

    // 3. Log restore run in backup_logs
    try {
      await supabase.from("backup_logs").insert({
        user_id: userId,
        trigger_type: "restore",
        status: "success",
        folder_name: `restore_${options.mode}_${new Date().toISOString()}`,
        drive_folder_id: null,
        tables_count: totalTables,
        rows_count: totalInserted,
        file_size_bytes: 0,
        details: { mode: options.mode, tableResults, durationMs } as any,
        error_message: null,
      });
    } catch {
      // Non-fatal
    }

    // 4. Log to timeline_events
    await writeTimelineEvent(supabase, {
      userId,
      type: "restore",
      summary: `System restored from backup (${options.mode.toUpperCase()} mode: ${totalInserted} records across ${totalTables} tables in ${durationMs}ms)`,
      refTable: "backup_logs",
      meta: {
        mode: options.mode,
        total_tables: totalTables,
        total_inserted: totalInserted,
        duration_ms: durationMs,
      },
    });

    return {
      success: true,
      mode: options.mode,
      restoredTables: totalTables,
      restoredRows: totalInserted,
      tableResults,
      durationMs,
    };
  } catch (fatalErr: any) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      mode: options.mode,
      restoredTables: totalTables,
      restoredRows: totalInserted,
      tableResults,
      durationMs,
      error: fatalErr?.message || "Fatal restoration error",
    };
  }
}
