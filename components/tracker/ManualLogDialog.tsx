"use client";

// ============================================================================
// Sahil's Shore: Manual Activity Log Dialog
// Quick-add past sessions directly into activity_logs + timeline_events
// ============================================================================

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Activity } from "@/types";
import { todayIST } from "@/lib/date-utils";
import { Select } from "@/components/ui/select";

interface ManualLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  defaultActivityId?: string;
  onLog: (activityId: string, durationSeconds: number, date: string, notes?: string) => Promise<void>;
}

export function ManualLogDialog({
  open,
  onOpenChange,
  activities,
  defaultActivityId,
  onLog,
}: ManualLogDialogProps) {
  const [activityId, setActivityId] = useState(defaultActivityId || activities[0]?.id || "");
  const [date, setDate] = useState(todayIST());
  const [minutes, setMinutes] = useState(45);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId || minutes <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onLog(activityId, minutes * 60, date, notes.trim() || undefined);
      onOpenChange(false);
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Activity Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Activity Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Activity
            </label>
            <Select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              options={activities.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.daily_target_minutes}m target)`,
              }))}
            />
          </div>

          {/* Date & Duration Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Date (IST)
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                required
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Notes / What did you study/build?
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Practiced 3 LeetCode graph problems..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || minutes <= 0}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? "Logging..." : "Save Session"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
