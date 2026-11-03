// ============================================================================
// Sahil's Shore: Full Backup Export Engine (Drive & Local)
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import {
  ALL_BACKUP_TABLES,
  KEY_CSV_TABLES,
} from "./types.ts";
import type {
  FullBackupPayload,
  BackupMetadata,
} from "./types.ts";
import { jsonToCsv } from "./csv.ts";
import {
  getStoredDriveCredentials,
  refreshDriveAccessToken,
  findOrCreateDriveFolder,
  uploadSimpleDriveFile,
  listDriveSubfolders,
  trashDriveFolder,
  DRIVE_SUBFOLDERS,
} from "../drive/index.ts";
import { currentISTDateString, formatISTTimestamp } from "../date-utils.ts";
import { writeTimelineEvent } from "../timeline/index.ts";

/**
 * Queries all application tables for the user and bundles them into FullBackupPayload.
 */
export async function collectFullBackupData(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FullBackupPayload> {
  const tablesData: Record<string, Record<string, unknown>[]> = {};
  const tableCounts: Record<string, number> = {};
  let totalRows = 0;

  for (const tableName of ALL_BACKUP_TABLES) {
    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.warn(`[collectFullBackupData] Skipping table ${tableName}:`, error.message);
        tablesData[tableName] = [];
        tableCounts[tableName] = 0;
      } else {
        const rows = (data || []) as Record<string, unknown>[];
        tablesData[tableName] = rows;
        tableCounts[tableName] = rows.length;
        totalRows += rows.length;
      }
    } catch (err) {
      console.warn(`[collectFullBackupData] Error reading table ${tableName}:`, err);
      tablesData[tableName] = [];
      tableCounts[tableName] = 0;
    }
  }

  const now = new Date();
  const metadata: BackupMetadata = {
    appName: "Sahil's Shore",
    version: "1.0.0",
    exportedAt: now.toISOString(),
    exportedAtIST: formatISTTimestamp(now.toISOString()),
    userId,
    tableCounts,
    totalRows,
  };

  return {
    metadata,
    tables: tablesData,
  };
}

/**
 * Exports full backup to Google Drive under Shore/Backups/YYYY-MM-DD/,
 * writes backup.json and key CSVs, keeps the last 12 backups, and logs to database.
 */
export async function exportBackupToDrive(
  supabase: SupabaseClient<Database>,
  userId: string,
  triggerType: "manual" | "cron" = "manual"
): Promise<{
  success: boolean;
  folderName: string;
  driveFolderId?: string;
  totalRows: number;
  tablesCount: number;
  error?: string;
}> {
  // 1. Verify Google Drive credentials
  const driveCreds = await getStoredDriveCredentials(supabase, userId);
  if (!driveCreds) {
    const errMsg = "Google Drive is not connected. Connect Google Drive in Settings to enable cloud backups.";
    await recordBackupLog(supabase, userId, triggerType, "failed", "", null, 0, 0, 0, {}, errMsg);
    return { success: false, folderName: "", totalRows: 0, tablesCount: 0, error: errMsg };
  }

  try {
    // 2. Refresh Drive Access Token
    const { accessToken } = await refreshDriveAccessToken(driveCreds.refreshToken);

    // 3. Locate or create Shore/Backups/ parent folder
    const backupsRootId =
      driveCreds.folderTree?.backups ||
      (await findOrCreateDriveFolder(accessToken, DRIVE_SUBFOLDERS.BACKUPS, driveCreds.folderTree?.root));

    // 4. Determine target backup folder name: YYYY-MM-DD or YYYY-MM-DD_HH-mm
    const dateStr = currentISTDateString();
    const existingSubfolders = await listDriveSubfolders(accessToken, backupsRootId);
    let folderName = dateStr;
    const sameDayCount = existingSubfolders.filter((f) => f.name.startsWith(dateStr)).length;
    if (sameDayCount > 0) {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const mins = String(now.getUTCMinutes()).padStart(2, "0");
      const secs = String(now.getUTCSeconds()).padStart(2, "0");
      folderName = `${dateStr}_${hours}-${mins}-${secs}`;
    }

    const backupFolderId = await findOrCreateDriveFolder(accessToken, folderName, backupsRootId);

    // 5. Collect full backup data
    const backupData = await collectFullBackupData(supabase, userId);
    let totalBytes = 0;

    // 6. Upload backup.json
    const backupJsonString = JSON.stringify(backupData, null, 2);
    totalBytes += Buffer.byteLength(backupJsonString, "utf8");
    await uploadSimpleDriveFile(
      accessToken,
      backupFolderId,
      "backup.json",
      "application/json",
      backupJsonString
    );

    // 7. Upload individual CSVs for key tables
    for (const tableName of KEY_CSV_TABLES) {
      const rows = backupData.tables[tableName] || [];
      if (rows.length > 0) {
        const csvContent = jsonToCsv(rows);
        totalBytes += Buffer.byteLength(csvContent, "utf8");
        await uploadSimpleDriveFile(
          accessToken,
          backupFolderId,
          `${tableName}.csv`,
          "text/csv",
          csvContent
        );
      }
    }

    // 8. Retention check: Keep the last 12 backups
    // Refresh folder list, sort alphabetically (chronological), trash oldest beyond 12
    const allBackups = await listDriveSubfolders(accessToken, backupsRootId);
    if (allBackups.length > 12) {
      // Sort oldest first by name
      const sortedBackups = [...allBackups].sort((a, b) => a.name.localeCompare(b.name));
      const foldersToDelete = sortedBackups.slice(0, sortedBackups.length - 12);
      for (const folder of foldersToDelete) {
        try {
          await trashDriveFolder(accessToken, folder.id);
        } catch (e) {
          console.warn(`[exportBackupToDrive] Failed to prune old backup folder ${folder.name}:`, e);
        }
      }
    }

    // 9. Record success in backup_logs
    await recordBackupLog(
      supabase,
      userId,
      triggerType,
      "success",
      folderName,
      backupFolderId,
      Object.keys(backupData.tables).length,
      backupData.metadata.totalRows,
      totalBytes,
      backupData.metadata.tableCounts,
      null
    );

    // 10. Record in timeline_events
    await writeTimelineEvent(supabase, {
      userId,
      type: "backup",
      summary: `Exported full backup to Google Drive (${folderName}, ${backupData.metadata.totalRows} rows across ${Object.keys(backupData.tables).length} tables)`,
      refTable: "backup_logs",
      meta: {
        trigger_type: triggerType,
        folder_name: folderName,
        total_rows: backupData.metadata.totalRows,
        drive_folder_id: backupFolderId,
      },
    });

    return {
      success: true,
      folderName,
      driveFolderId: backupFolderId,
      totalRows: backupData.metadata.totalRows,
      tablesCount: Object.keys(backupData.tables).length,
    };
  } catch (error: any) {
    const errorMsg = error?.message || "Failed to create Google Drive backup.";
    console.error("[exportBackupToDrive] Error:", error);
    await recordBackupLog(
      supabase,
      userId,
      triggerType,
      "failed",
      "",
      null,
      0,
      0,
      0,
      {},
      errorMsg
    );
    return { success: false, folderName: "", totalRows: 0, tablesCount: 0, error: errorMsg };
  }
}

/**
 * Internal helper to record backup run logs into public.backup_logs.
 */
async function recordBackupLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  triggerType: "manual" | "cron" | "restore",
  status: "in_progress" | "success" | "failed",
  folderName: string,
  driveFolderId: string | null,
  tablesCount: number,
  rowsCount: number,
  fileSizeBytes: number,
  details: Record<string, unknown>,
  errorMessage: string | null
) {
  try {
    await supabase.from("backup_logs").insert({
      user_id: userId,
      trigger_type: triggerType,
      status,
      folder_name: folderName,
      drive_folder_id: driveFolderId,
      tables_count: tablesCount,
      rows_count: rowsCount,
      file_size_bytes: fileSizeBytes,
      details: details as any,
      error_message: errorMessage,
    });
  } catch (err) {
    console.warn("[recordBackupLog] Failed to insert backup log:", err);
  }
}
