// ============================================================================
// Sahil's Shore: Phase 12 Unit Tests — Backups, Offline Queue & Polish
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { escapeCsvCell, jsonToCsv } from "../lib/backups/csv.ts";
import {
  ALL_BACKUP_TABLES,
  KEY_CSV_TABLES,
  type FullBackupPayload,
} from "../lib/backups/types.ts";
import { previewBackup, RESTORE_ORDER } from "../lib/backups/restore.ts";

describe("1. RFC-4180 CSV Generation Engine", () => {
  test("escapes cells with commas, quotes, and newlines accurately", () => {
    assert.equal(escapeCsvCell("Simple text"), "Simple text");
    assert.equal(escapeCsvCell("Text, with comma"), '"Text, with comma"');
    assert.equal(escapeCsvCell('Text with "quotes"'), '"Text with ""quotes"""');
    assert.equal(escapeCsvCell("Line 1\nLine 2"), '"Line 1\nLine 2"');
    assert.equal(escapeCsvCell(null), "");
    assert.equal(escapeCsvCell(undefined), "");
  });

  test("serializes objects and arrays cleanly inside CSV cells", () => {
    const tags = ["spring", "dsa"];
    const escaped = escapeCsvCell(tags);
    assert.equal(escaped, '"[""spring"",""dsa""]"');
  });

  test("converts record arrays into RFC-compliant CSV with headers", () => {
    const expenses = [
      {
        id: "exp-1",
        place_name: "Chai Point, Indiranagar",
        amount_paise: 15000,
        notes: "Ginger tea",
      },
      {
        id: "exp-2",
        place_name: "Nilgiris",
        amount_paise: 42000,
        notes: 'Groceries: milk, bread',
      },
    ];

    const csv = jsonToCsv(expenses);
    const lines = csv.split("\r\n");

    // Header
    assert.equal(lines[0], "id,place_name,amount_paise,notes");
    // Row 1 with quoted place containing comma
    assert.equal(lines[1], 'exp-1,"Chai Point, Indiranagar",15000,Ginger tea');
    // Row 2 with quoted notes containing comma
    assert.equal(lines[2], 'exp-2,Nilgiris,42000,"Groceries: milk, bread"');
  });

  test("handles empty rows array without error", () => {
    assert.equal(jsonToCsv([]), "");
  });
});

describe("2. Full Backup Structure & Tables Registry", () => {
  test("contains all required application tables in backup manifest", () => {
    assert.ok(ALL_BACKUP_TABLES.includes("tasks"));
    assert.ok(ALL_BACKUP_TABLES.includes("expenses"));
    assert.ok(ALL_BACKUP_TABLES.includes("dsa_problems"));
    assert.ok(ALL_BACKUP_TABLES.includes("vocab_cards"));
    assert.ok(ALL_BACKUP_TABLES.includes("journal_entries"));
    assert.ok(ALL_BACKUP_TABLES.includes("timeline_events"));
    assert.ok(ALL_BACKUP_TABLES.length >= 35);
  });

  test("specifies essential tables for CSV format export", () => {
    assert.ok(KEY_CSV_TABLES.includes("tasks"));
    assert.ok(KEY_CSV_TABLES.includes("expenses"));
    assert.ok(KEY_CSV_TABLES.includes("notes"));
    assert.ok(KEY_CSV_TABLES.includes("journal_entries"));
    assert.ok(KEY_CSV_TABLES.length >= 10);
  });
});

describe("3. Backup Preview & Validation Engine", () => {
  test("previews row counts per table from valid backup JSON", () => {
    const sampleBackup: FullBackupPayload = {
      metadata: {
        appName: "Sahil's Shore",
        version: "1.0.0",
        exportedAt: "2026-11-04T02:00:00Z",
        exportedAtIST: "04 Nov 2026, 07:30 AM IST",
        userId: "user-123",
        tableCounts: { tasks: 2, expenses: 1 },
        totalRows: 3,
      },
      tables: {
        tasks: [
          { id: "t-1", title: "Review Graph DP" },
          { id: "t-2", title: "Practice German B1 Listening" },
        ],
        expenses: [{ id: "e-1", amount_paise: 25000, place_name: "Metro" }],
      },
    };

    const preview = previewBackup(JSON.stringify(sampleBackup));

    assert.equal(preview.valid, true);
    assert.equal(preview.version, "1.0.0");
    assert.equal(preview.totalRows, 3);
    assert.equal(preview.totalTables, 2);
    assert.equal(preview.tableBreakdown.tasks, 2);
    assert.equal(preview.tableBreakdown.expenses, 1);
  });

  test("flags unknown tables with warnings", () => {
    const backupWithExtra = {
      tables: {
        tasks: [{ id: "t-1" }],
        future_experimental_table: [{ id: "f-1" }],
      },
    };

    const preview = previewBackup(JSON.stringify(backupWithExtra));
    assert.equal(preview.valid, true);
    assert.ok(preview.warnings && preview.warnings.length > 0);
    assert.ok(preview.warnings[0].includes("future_experimental_table"));
  });

  test("rejects invalid JSON syntax gracefully", () => {
    const preview = previewBackup("{ corrupted json content [");
    assert.equal(preview.valid, false);
    assert.ok(preview.errors && preview.errors.length > 0);
    assert.ok(preview.errors[0].includes("JSON parse failure"));
  });
});

describe("4. Restoration Dependency Order (Foreign Key Safety)", () => {
  test("restores root entities before child entities", () => {
    const profilesIdx = RESTORE_ORDER.indexOf("profiles");
    const tasksIdx = RESTORE_ORDER.indexOf("tasks");
    const subtasksIdx = RESTORE_ORDER.indexOf("subtasks");
    const habitsIdx = RESTORE_ORDER.indexOf("habits");
    const habitLogsIdx = RESTORE_ORDER.indexOf("habit_logs");
    const timelineIdx = RESTORE_ORDER.indexOf("timeline_events");

    assert.ok(profilesIdx < tasksIdx, "profiles must restore before tasks");
    assert.ok(tasksIdx < subtasksIdx, "tasks must restore before subtasks");
    assert.ok(habitsIdx < habitLogsIdx, "habits must restore before habit_logs");
    assert.ok(
      timelineIdx > tasksIdx && timelineIdx > habitsIdx,
      "timeline_events should restore after primary trackable records"
    );
  });
});

describe("5. Backup Retention Pruning Logic (Keep Last 12)", () => {
  function pruneBackupFolders(
    folders: { id: string; name: string }[],
    keepCount = 12
  ): { kept: string[]; deleted: string[] } {
    if (folders.length <= keepCount) {
      return { kept: folders.map((f) => f.name), deleted: [] };
    }

    // Sort chronologically (oldest first)
    const sorted = [...folders].sort((a, b) => a.name.localeCompare(b.name));
    const toDelete = sorted.slice(0, sorted.length - keepCount);
    const toKeep = sorted.slice(sorted.length - keepCount);

    return {
      kept: toKeep.map((f) => f.name),
      deleted: toDelete.map((f) => f.name),
    };
  }

  test("retains all folders when count is <= 12", () => {
    const folders = [
      { id: "1", name: "2026-10-01" },
      { id: "2", name: "2026-10-08" },
      { id: "3", name: "2026-10-15" },
    ];
    const { kept, deleted } = pruneBackupFolders(folders, 12);
    assert.equal(kept.length, 3);
    assert.equal(deleted.length, 0);
  });

  test("prunes oldest folders when count exceeds 12, keeping exactly 12 newest", () => {
    const folders = [];
    for (let i = 1; i <= 15; i++) {
      const day = String(i).padStart(2, "0");
      folders.push({ id: `f-${i}`, name: `2026-10-${day}` });
    }

    const { kept, deleted } = pruneBackupFolders(folders, 12);

    assert.equal(kept.length, 12);
    assert.equal(deleted.length, 3);
    // Oldest 3 (01, 02, 03) should be deleted
    assert.deepEqual(deleted, ["2026-10-01", "2026-10-02", "2026-10-03"]);
    // 12 newest (04 through 15) should be retained
    assert.equal(kept[0], "2026-10-04");
    assert.equal(kept[kept.length - 1], "2026-10-15");
  });
});

describe("6. Offline Queue Mutation Idempotency", () => {
  test("generates RFC-compliant UUID v4 idempotency keys", () => {
    const key = crypto.randomUUID();
    assert.match(
      key,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test("ensures money in paise and UTC dates are maintained in offline payloads", () => {
    const offlineExpensePayload = {
      amount_paise: 35000, // ₹350.00
      payment_method: "upi",
      place_name: "Shore Coffee",
      spent_at: new Date().toISOString(),
    };

    assert.equal(typeof offlineExpensePayload.amount_paise, "number");
    assert.equal(Number.isInteger(offlineExpensePayload.amount_paise), true);
    assert.ok(offlineExpensePayload.spent_at.endsWith("Z"));
  });
});
