"use client";

// ============================================================================
// Sahil's Shore: Google Drive Integration Settings Panel
// OAuth with drive.file scope, folder tree verification, and connection status
// ============================================================================

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  ExternalLink,
  RefreshCw,
  LogOut,
  Folder,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { DriveConnectionStatus } from "@/lib/drive";
import { formatISTTime } from "@/lib/date-utils";

export function DriveSettings() {
  const searchParams = useSearchParams();
  const urlError = searchParams ? searchParams.get("drive_error") : null;
  const urlSuccess = searchParams ? searchParams.get("drive") === "connected" : false;

  const [status, setStatus] = useState<DriveConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/drive/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to load drive status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? Files on Drive will remain untouched.")) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/drive/disconnect", { method: "POST" });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error("Failed to disconnect:", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center gap-3 text-text-muted text-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Verifying Google Drive connection...</span>
        </div>
      </div>
    );
  }

  const isConnected = status?.connected ?? false;

  return (
    <div className="space-y-6">
      {/* Connection Header Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <HardDrive className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-text">Google Drive Storage</h3>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="h-3 w-3" />
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                {isConnected
                  ? `Authenticated as ${status?.email || "Google Account"} via minimal drive.file scope.`
                  : "Connect your Google Drive to enable resumable media vault sync and automated backups."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-text-muted" />
                  <span>Verify</span>
                </button>
                <button
                  type="button"
                  disabled={isDisconnecting}
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{isDisconnecting ? "Disconnecting..." : "Disconnect"}</span>
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/api/drive/auth"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-98 transition-all"
                >
                  <HardDrive className="h-4 w-4" />
                  <span>Connect Google Drive</span>
                </a>
                <a
                  href="/api/drive/auth?simulate=true"
                  title="Simulates Google Drive connection for offline / local testing without GCP keys"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-xs font-medium text-text-muted hover:text-text transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
                  <span>Dev Demo Connect</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* URL Error Alert */}
        {urlError && (
          <div className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-xs text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Google Connection Failed: {urlError}</p>
              <p className="text-[11px] opacity-90">
                Check that your redirect URI in Google Cloud Console is exactly:
                <code className="ml-1 font-mono font-semibold bg-danger/20 px-1 py-0.5 rounded">
                  http://localhost:3000/api/drive/callback
                </code>
              </p>
            </div>
          </div>
        )}

        {/* URL Success Alert */}
        {urlSuccess && isConnected && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-semibold">Google Drive successfully connected and initialized!</span>
          </div>
        )}

        {/* Token Revoked / Error Alert */}
        {status?.error && (
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{status.error}</p>
              <a
                href="/api/drive/auth"
                className="inline-flex items-center gap-1 font-medium underline hover:opacity-80"
              >
                Re-authenticate now
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Privacy & Scope Guarantee Badge */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-text-muted">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-medium text-text">Privacy-First Architecture (`drive.file` Scope)</p>
            <p>
              Sahil&apos;s Shore requests <strong>only</strong> the per-file authorization scope (
              <code className="text-primary font-mono text-[11px]">https://www.googleapis.com/auth/drive.file</code>
              ). The app can <strong>never</strong> view, read, or modify existing files or folders in your personal
              Google Drive. It only accesses files created directly through your Shore workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Connected Folder Tree View */}
      {isConnected && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-text">Managed Folder Structure in Google Drive</h4>
            </div>
            {status?.lastSyncedAt && (
              <span className="text-[11px] text-text-muted">
                Last verified: {formatISTTime(status.lastSyncedAt)}
              </span>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-surface-muted/50 p-4 font-mono text-xs text-text space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Folder className="h-4 w-4" />
              <span>Shore/</span>
              <span className="text-[10px] text-text-muted font-normal">(Root Container)</span>
            </div>
            <div className="pl-6 space-y-1.5 text-text-muted">
              <div className="flex items-center gap-2">
                <span>├──</span>
                <Folder className="h-3.5 w-3.5 text-accent-warm" />
                <span className="text-text font-medium">Photos/</span>
                <span>── YYYY/MM/ (Chronological Photo Vault)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>├──</span>
                <Folder className="h-3.5 w-3.5 text-accent-warm" />
                <span className="text-text font-medium">Videos/</span>
                <span>── YYYY/MM/ (Resumable Direct Video Uploads)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>├──</span>
                <Folder className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-text font-medium">Receipts/</span>
                <span>(Expense Receipt Attachments)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>├──</span>
                <Folder className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-text font-medium">Voice-Recordings/</span>
                <span>(Pronunciation Lab Audio)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>└──</span>
                <Folder className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-text font-medium">Backups/</span>
                <span>(Weekly Encrypted JSON/CSV Exports)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
