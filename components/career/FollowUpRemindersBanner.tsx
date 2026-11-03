"use client";

// ============================================================================
// Sahil's Shore: Follow-Up Reminders Banner Component
// Surfaces overdue, due today, and upcoming follow-ups with 1-click resolution.
// ============================================================================

import React, { useState } from "react";
import type { Application } from "@/types/career";
import { categorizeFollowUps } from "@/lib/career";
import { toISTDateString, todayIST, addDaysIST } from "@/lib/date-utils";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FollowUpRemindersBannerProps {
  applications: Application[];
  onMarkFollowedUp: (
    application: Application,
    nextDate: string | null,
    note: string
  ) => Promise<void>;
}

export function FollowUpRemindersBanner({
  applications,
  onMarkFollowedUp,
}: FollowUpRemindersBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [nextDate, setNextDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { overdue, today, upcoming } = categorizeFollowUps(applications);
  const totalAlerts = overdue.length + today.length;

  if (totalAlerts === 0 && upcoming.length === 0) {
    return null;
  }

  const handleOpenActionModal = (app: Application) => {
    setActiveApp(app);
    setFollowUpNote("Sent follow-up message on LinkedIn / Email");
    setNextDate(addDaysIST(todayIST(), 7));
  };

  const handleConfirmFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp) return;

    try {
      setIsSubmitting(true);
      const nextDateIso = nextDate ? new Date(`${nextDate}T09:00:00Z`).toISOString() : null;
      await onMarkFollowedUp(activeApp, nextDateIso, followUpNote);
      setActiveApp(null);
    } catch (err) {
      console.error("Error submitting follow-up:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-2xl border transition-all overflow-hidden ${
          overdue.length > 0
            ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20"
            : today.length > 0
            ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20"
            : "border-primary/20 bg-primary/5"
        }`}
      >
        {/* Banner Top Strip */}
        <div className="flex items-center justify-between p-3.5 sm:px-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                overdue.length > 0
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : today.length > 0
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {overdue.length > 0 ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text">Follow-up Reminders</span>
                {overdue.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    {overdue.length} Overdue
                  </span>
                )}
                {today.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    {today.length} Due Today
                  </span>
                )}
                {upcoming.length > 0 && totalAlerts === 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary">
                    {upcoming.length} Upcoming
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {overdue.length > 0
                  ? "You have applications waiting for follow-ups. A quick gentle ping dramatically boosts reply rates!"
                  : today.length > 0
                  ? "Time to follow up on your active conversations today."
                  : `${upcoming.length} follow-up${upcoming.length > 1 ? "s" : ""} scheduled in the coming week.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text px-2 py-1 rounded-lg hover:bg-surface-muted transition-colors"
            >
              <span>{isExpanded ? "Hide" : "Review"}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible List of Pending Follow-ups */}
        {isExpanded && (
          <div className="border-t border-border/50 p-4 space-y-3 bg-surface/40">
            {/* Overdue Items */}
            {overdue.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                  Overdue
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {overdue.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-rose-500/20 bg-surface shadow-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-text truncate">{app.role}</p>
                        <p className="text-[11px] text-text-muted truncate">
                          {app.company} · Due: {toISTDateString(app.next_follow_up!)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActionModal(app)}
                        className="h-7 text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Send className="w-3 h-3 mr-1" /> Follow Up
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Items */}
            {today.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                  Due Today
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {today.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-surface shadow-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-text truncate">{app.role}</p>
                        <p className="text-[11px] text-text-muted truncate">
                          {app.company} · Due today
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActionModal(app)}
                        className="h-7 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                      >
                        <Send className="w-3 h-3 mr-1" /> Follow Up
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Items */}
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Upcoming (Next 7 Days)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {upcoming.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-surface shadow-2xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-text truncate">{app.role}</p>
                        <p className="text-[11px] text-text-muted truncate">
                          {app.company} · Scheduled: {toISTDateString(app.next_follow_up!)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenActionModal(app)}
                        className="h-7 text-xs text-text-muted hover:text-text"
                      >
                        Update
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Follow-Up Resolution Modal */}
      {activeApp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-text">Record Follow-up Sent</h3>
              </div>
              <button
                onClick={() => setActiveApp(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Logging follow-up for <strong className="text-text">{activeApp.role}</strong> at{" "}
              <strong className="text-text">{activeApp.company}</strong>.
            </p>

            <form onSubmit={handleConfirmFollowUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Follow-up Note / Channel
                </label>
                <input
                  type="text"
                  required
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Sent polite inquiry to Recruiter Jane on LinkedIn"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Schedule Next Follow-Up (or leave blank if done)
                </label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveApp(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Mark Followed Up"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
