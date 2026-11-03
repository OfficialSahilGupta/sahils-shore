"use client";

// ============================================================================
// Sahil's Shore: Offline Queue Status Badge & Sync Trigger
// ============================================================================

import React, { useState } from "react";
import { useOfflineQueue } from "@/lib/offline/OfflineContext";
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle, Database } from "lucide-react";

export function OfflineBadge() {
  const { isOnline, queuedCount, isSyncing, queuedItems, syncNow } = useOfflineQueue();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // If online and zero queued items, remain hidden for a minimal UI
  if (isOnline && queuedCount === 0) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
          !isOnline
            ? "bg-warning/15 text-warning border border-warning/30 hover:bg-warning/20"
            : queuedCount > 0
            ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20"
            : "bg-surface-muted text-text-muted"
        }`}
        title={!isOnline ? "Offline: Changes queued locally" : `${queuedCount} offline items queued`}
      >
        {!isOnline ? (
          <WifiOff className="h-3.5 w-3.5 text-warning" />
        ) : isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        )}

        <span>
          {!isOnline
            ? queuedCount > 0
              ? `Offline (${queuedCount})`
              : "Offline"
            : isSyncing
            ? "Syncing..."
            : `Queued (${queuedCount})`}
        </span>
      </button>

      {/* Queue Details Dropdown */}
      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-border bg-surface p-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <Database className="h-3.5 w-3.5 text-primary" />
                <span>Offline Queue ({queuedCount})</span>
              </div>
              {isOnline && queuedCount > 0 && (
                <button
                  disabled={isSyncing}
                  onClick={() => syncNow()}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sync Now</span>
                </button>
              )}
            </div>

            {!isOnline && (
              <p className="text-[11px] text-text-muted mb-2">
                You are currently disconnected. Items created now are stored in IndexedDB and will sync automatically when your connection returns.
              </p>
            )}

            {queuedItems.length === 0 ? (
              <div className="py-3 text-center text-xs text-text-muted">
                No items pending sync.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {queuedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-surface-muted/60 p-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="capitalize font-medium text-text">
                        {item.entityType}
                      </span>
                      <span className="truncate text-text-muted text-[11px]">
                        {item.payload.title || item.payload.description || item.payload.place_name || "New entry"}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        item.status === "syncing"
                          ? "bg-primary/20 text-primary"
                          : item.status === "failed"
                          ? "bg-danger/20 text-danger"
                          : "bg-surface text-text-muted border border-border"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
