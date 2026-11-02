"use client";

// ============================================================================
// Sahil's Shore: Weak Topic Detection Alert
// ============================================================================

import React from "react";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import type { WeakTopicReport } from "@/lib/dsa";

interface WeakTopicAlertProps {
  reports: WeakTopicReport[];
  onSelectTopic: (topic: string) => void;
}

export function WeakTopicAlert({
  reports,
  onSelectTopic,
}: WeakTopicAlertProps) {
  if (reports.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--warning)]/20 text-[var(--warning)]">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--warning)] flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Weak Topic Detection ({reports.length} topic{reports.length > 1 ? "s" : ""} need focus)
            </h4>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Shore analyzed your solve rates and repeated revision requests to highlight topics needing reinforcement:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {reports.map((report) => (
              <button
                key={report.topic}
                type="button"
                onClick={() => onSelectTopic(report.topic)}
                className="group flex items-center gap-1.5 rounded-xl border border-[var(--warning)]/30 bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] hover:border-[var(--warning)] hover:bg-[var(--warning)]/15 transition-all"
              >
                <span className="font-semibold">{report.topic}</span>
                <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text)]">
                  ({report.reason})
                </span>
                <ArrowRight className="h-3 w-3 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
