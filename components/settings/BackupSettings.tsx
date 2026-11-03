"use client";

// ============================================================================
// Sahil's Shore: Backups, Restore & Data Export Management Settings
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  Database,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { RestorePreview, RestoreResult } from "@/lib/backups/types";
import { formatISTTimestamp } from "@/lib/date-utils";

export function BackupSettings() {
  const { toast } = useToast();
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [lastBackup, setLastBackup] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [backingUp, setBackingUp] = useState(false);

  // Restore state
  const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackupHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/backup/history");
      if (res.ok) {
        const data = await res.json();
        setLastBackup(data.lastBackup || data.lastAttempt);
        setHistoryLogs(data.logs || []);
      }
    } catch (err) {
      console.warn("Failed to fetch backup history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      const res = await fetch("/api/backup/export", { method: "POST" });
      const data = await res.json();

      if (!res.ok || data.error) {
        toast({ title: "Backup failed", description: data.error, type: "error" });
      } else {
        toast({
          title: "Backup complete",
          description: `${data.totalRows} records exported to Google Drive folder ${data.folderName}.`,
          type: "success",
        });
        fetchBackupHistory();
      }
    } catch (err: any) {
      toast({ title: "Backup error", description: err?.message, type: "error" });
    } finally {
      setBackingUp(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedJsonFile(file);
    setRestoreResult(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setFileContent(text);

      // Generate preview
      setPreviewing(true);
      try {
        const res = await fetch("/api/backup/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previewOnly: true, jsonContent: text }),
        });
        const data = await res.json();
        if (data.preview) {
          setPreview(data.preview);
        }
      } catch (err) {
        console.warn("Error previewing backup:", err);
      } finally {
        setPreviewing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!fileContent) return;

    setRestoring(true);
    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          execute: true,
          mode: restoreMode,
          jsonContent: fileContent,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast({
          title: "Restore failed",
          description: data.error || "Restore encountered errors.",
          type: "error",
        });
      } else {
        setRestoreResult(data.result);
        toast({
          title: "Restore completed",
          description: `${data.result.restoredRows} records restored successfully.`,
          type: "success",
        });
        setConfirmModalOpen(false);
        fetchBackupHistory();
      }
    } catch (err: any) {
      toast({
        title: "Restore error",
        description: err?.message || "Restore execution failed.",
        type: "error",
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Cloud Backup Status Card */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                Google Drive Backups
              </h3>
              <p className="text-xs text-text-muted">
                Weekly automated cron export + on-demand cloud sync to <code className="font-mono text-primary">Shore/Backups/</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={backingUp}
              onClick={handleBackupNow}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${backingUp ? "animate-spin" : ""}`} />
              <span>{backingUp ? "Exporting Backup..." : "Backup Now"}</span>
            </button>

            <a
              href="/api/backup/download-zip"
              download
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text hover:bg-surface-muted transition-all"
              title="Download offline .zip with JSON and key CSVs"
            >
              <Download className="h-4 w-4 text-text-muted" />
              <span>Download (.zip)</span>
            </a>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-surface-muted/30 p-4">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>Last Backup Status</span>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              {lastBackup ? (
                <>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      lastBackup.status === "success"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    }`}
                  >
                    {lastBackup.status === "success" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    <span className="capitalize">{lastBackup.status}</span>
                  </span>
                  <span className="text-xs text-text-muted font-mono truncate">
                    {lastBackup.folder_name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-text-muted italic">No backup yet</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-surface-muted/30 p-4">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>Last Exported At (IST)</span>
              <Clock className="h-4 w-4 text-text-muted" />
            </div>
            <div className="text-sm font-semibold text-text mt-1">
              {lastBackup ? formatISTTimestamp(lastBackup.created_at) : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-surface-muted/30 p-4">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>Retention Policy</span>
              <Database className="h-4 w-4 text-accent-warm" />
            </div>
            <div className="text-sm font-semibold text-text mt-1">
              Retains Last 12 Backups
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Older backups are pruned automatically
            </p>
          </div>
        </div>
      </div>

      {/* 2. Restore Tool Card */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-5 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-warm/15 text-accent-warm">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Database Restore Tool</h3>
            <p className="text-xs text-text-muted">
              Upload a <code className="font-mono text-primary">backup.json</code> file, preview table row counts, and restore safely.
            </p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary transition-all bg-surface-muted/20"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-text-muted mb-2">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-xs font-semibold text-text">
            {selectedJsonFile ? selectedJsonFile.name : "Click or drag backup.json here"}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Accepts JSON backups exported from Sahil&apos;s Shore
          </p>
        </div>

        {/* Preview Section */}
        {previewing && (
          <div className="mt-4 flex items-center justify-center gap-2 py-4 text-xs text-text-muted">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span>Analyzing backup contents...</span>
          </div>
        )}

        {preview && (
          <div className="mt-6 rounded-2xl border border-border bg-surface-muted/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text">Backup Preview</h4>
                <p className="text-[11px] text-text-muted">
                  Version {preview.version} • Exported: {preview.exportedAtIST || preview.exportedAt || "Unknown date"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-primary">
                  {preview.totalRows}
                </span>{" "}
                <span className="text-xs text-text-muted">
                  total records across {preview.totalTables} tables
                </span>
              </div>
            </div>

            {/* Table Count Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
              {Object.entries(preview.tableBreakdown).map(([table, count]) => (
                <span
                  key={table}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px]"
                >
                  <span className="font-mono text-text-muted">{table}:</span>
                  <span className="font-semibold text-text">{count}</span>
                </span>
              ))}
            </div>

            {/* Restore Mode Selection */}
            <div className="border-t border-border pt-4">
              <label className="text-xs font-semibold text-text block mb-2">
                Restoration Strategy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setRestoreMode("merge")}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                    restoreMode === "merge"
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border bg-surface hover:bg-surface-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={restoreMode === "merge"}
                    onChange={() => setRestoreMode("merge")}
                    className="mt-0.5 text-primary"
                  />
                  <div>
                    <div className="text-xs font-semibold text-text">Merge (Upsert)</div>
                    <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                      Inserts new records and updates matching records. Keeps any existing data not present in the backup.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setRestoreMode("replace")}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                    restoreMode === "replace"
                      ? "border-danger bg-danger/5 shadow-xs"
                      : "border-border bg-surface hover:bg-surface-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={restoreMode === "replace"}
                    onChange={() => setRestoreMode("replace")}
                    className="mt-0.5 text-danger"
                  />
                  <div>
                    <div className="text-xs font-semibold text-danger">Replace (Wipe & Restore)</div>
                    <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                      Cleanly wipes existing records for your account and restores the exact state from this backup file.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Trigger Button */}
            <div className="pt-2">
              <button
                onClick={() => setConfirmModalOpen(true)}
                className={`w-full rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm transition-all ${
                  restoreMode === "replace"
                    ? "bg-danger hover:bg-danger/90"
                    : "bg-primary hover:opacity-95"
                }`}
              >
                Proceed to Restore ({restoreMode.toUpperCase()})
              </button>
            </div>
          </div>
        )}

        {/* Restore Result Card */}
        {restoreResult && (
          <div className="mt-4 rounded-2xl border border-success/30 bg-success/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-success mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Restoration Complete!</span>
            </div>
            <p className="text-xs text-text">
              Restored {restoreResult.restoredRows} records across {restoreResult.restoredTables} tables in {restoreResult.durationMs}ms.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-warning mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-text">Confirm Database Restoration</h3>
            </div>

            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              You are about to restore <strong className="text-text">{preview?.totalRows}</strong> records using the{" "}
              <strong className={restoreMode === "replace" ? "text-danger uppercase" : "text-primary uppercase"}>
                {restoreMode}
              </strong>{" "}
              strategy.
              {restoreMode === "replace" && (
                <span className="block mt-2 text-danger font-medium">
                  Warning: Existing records will be deleted before restoring from this backup!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                disabled={restoring}
                onClick={() => setConfirmModalOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                disabled={restoring}
                onClick={handleConfirmRestore}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all ${
                  restoreMode === "replace" ? "bg-danger hover:bg-danger/90" : "bg-primary hover:opacity-95"
                } disabled:opacity-50`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${restoring ? "animate-spin" : ""}`} />
                <span>{restoring ? "Restoring..." : "Yes, Restore Database"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Past Backup History Log */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-text">Backup History Log</h3>
          </div>
          <button
            onClick={fetchBackupHistory}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loadingHistory ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {historyLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted">
            No past backup logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-semibold text-text-muted">
                  <th className="pb-2">Date (IST)</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Rows</th>
                  <th className="pb-2">Tables</th>
                  <th className="pb-2">Folder / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {historyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-muted/20">
                    <td className="py-2.5 font-medium text-text">
                      {formatISTTimestamp(log.created_at)}
                    </td>
                    <td className="py-2.5">
                      <span className="capitalize rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-mono">
                        {log.trigger_type}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          log.status === "success"
                            ? "bg-success/15 text-success"
                            : "bg-danger/15 text-danger"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono">{log.rows_count}</td>
                    <td className="py-2.5 font-mono">{log.tables_count}</td>
                    <td className="py-2.5 font-mono text-[11px] text-text-muted truncate max-w-[200px]">
                      {log.folder_name || log.error_message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
