// ============================================================================
// Sahil's Shore: Backup Zip Packager (JSON + Key CSVs)
// ============================================================================

import JSZip from "jszip";
import { KEY_CSV_TABLES } from "./types.ts";
import type { FullBackupPayload } from "./types.ts";
import { jsonToCsv } from "./csv.ts";

/**
 * Builds a ZIP file containing backup.json, manifest.json, and key CSV tables.
 */
export async function createBackupZip(
  backupData: FullBackupPayload
): Promise<Blob | Buffer> {
  const zip = new JSZip();

  // 1. Root backup.json
  const backupJsonString = JSON.stringify(backupData, null, 2);
  zip.file("backup.json", backupJsonString);

  // 2. Human-readable manifest.json
  zip.file("manifest.json", JSON.stringify(backupData.metadata, null, 2));

  // 3. CSV folder with key tables
  const csvFolder = zip.folder("csv");
  if (csvFolder) {
    for (const tableName of KEY_CSV_TABLES) {
      const tableRows = backupData.tables[tableName] || [];
      if (tableRows.length > 0) {
        const csvContent = jsonToCsv(tableRows);
        csvFolder.file(`${tableName}.csv`, csvContent);
      }
    }
  }

  // Generate either Buffer (Node/Server environment) or Blob (Browser environment)
  if (typeof window === "undefined") {
    const uint8Array = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    return Buffer.from(uint8Array);
  } else {
    return await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
  }
}
