"use client";

// ============================================================================
// Sahil's Shore: Day View Container (/day/[date])
// Date navigation with prev/next arrows, date picker, daily totals,
// full chronological timeline feed, and day reflection notes editor.
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getTimelineEventsForDate, calculateDayTotals, DayTotals } from "@/lib/timeline";
import { UnifiedTimeline } from "@/components/timeline/UnifiedTimeline";
import { getDailyNote, upsertDailyNote } from "@/lib/notes";
import {
  todayIST,
  addDaysIST,
  formatFriendlyISTDate,
  formatISTTime,
} from "@/lib/date-utils";
import { formatINR } from "@/lib/expenses";
import { useToast } from "@/components/ui/toast";
import { useQuickCapture } from "@/lib/quick-capture/QuickCaptureContext";
import type { TimelineEvent } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Wallet,
  Utensils,
  CheckCircle2,
  FileText,
  Save,
  Check,
  Compass,
  ArrowLeft,
  Plus,
} from "lucide-react";

interface DayViewContainerProps {
  date: string;
}

export function DayViewContainer({ date }: DayViewContainerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { open: openQuickCapture } = useQuickCapture();

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [totals, setTotals] = useState<DayTotals>({
    minutesStudied: 0,
    totalSpentPaise: 0,
    mealsCount: 0,
    tasksCompleted: 0,
  });
  const [noteContent, setNoteContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadDayData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      const uid = data.user.id;
      setUserId(uid);

      // 1. Fetch timeline events for date
      const fetched = await getTimelineEventsForDate(supabase, uid, date);
      setEvents(fetched);
      setTotals(calculateDayTotals(fetched));

      // 2. Fetch daily note
      const note = await getDailyNote(supabase, uid, date);
      if (note) {
        setNoteContent(note.content || "");
      } else {
        setNoteContent("");
      }
      setSaveStatus("saved");
    } catch (err) {
      console.warn("[DayViewContainer] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadDayData();

    const handleUpdate = () => loadDayData();
    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadDayData]);

  const prevDate = addDaysIST(date, -1);
  const nextDate = addDaysIST(date, 1);
  const isToday = date === todayIST();

  const handleSaveNote = async (text: string) => {
    if (!userId) return;
    setSaveStatus("saving");
    try {
      const supabase = createClient();
      const res = await upsertDailyNote(supabase, userId, date, text);
      if (res) {
        setSaveStatus("saved");
        toast({ title: "Reflection saved", type: "success" });
      }
    } catch {
      setSaveStatus("unsaved");
      toast({ title: "Failed to save reflection", type: "error" });
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteContent(val);
    setSaveStatus("unsaved");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSaveNote(val);
    }, 1500);
  };

  const formattedDayTitle = () => {
    const [y, m, d] = date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj);
  };

  const hoursStudied = Math.floor(totals.minutesStudied / 60);
  const minsRemaining = totals.minutesStudied % 60;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-16">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border p-4 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text-muted hover:text-text transition-colors shadow-2xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                {formatFriendlyISTDate(date)}
              </span>
              {isToday && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                  Today
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-text">
              {formattedDayTitle()}
            </h1>
          </div>
        </div>

        {/* Date Picker & Prev/Next Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/day/${prevDate}`}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text transition-colors shadow-2xs"
            title={`Previous day (${prevDate})`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          {/* Native HTML Date Picker styled nicely */}
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                if (e.target.value) {
                  router.push(`/day/${e.target.value}`);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-surface text-text hover:bg-surface-muted transition-colors cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
            />
          </div>

          <Link
            href={`/day/${nextDate}`}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text transition-colors shadow-2xs"
            title={`Next day (${nextDate})`}
          >
            <ChevronRight className="w-4 h-4" />
          </Link>

          {!isToday && (
            <Link
              href={`/day/${todayIST()}`}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 shadow-2xs transition-opacity"
            >
              Today
            </Link>
          )}
        </div>
      </div>

      {/* Daily Totals Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Time Studied */}
        <div className="p-4 rounded-2xl border border-border bg-surface shadow-2xs">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span className="font-semibold">Time Studied</span>
            <span className="p-1 rounded bg-blue-500/10 text-blue-500">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text">
            {hoursStudied > 0 ? `${hoursStudied}h ${minsRemaining}m` : `${totals.minutesStudied}m`}
          </div>
          <p className="mt-1 text-[11px] text-text-muted">Focus sessions logged</p>
        </div>

        {/* 2. Money Spent */}
        <div className="p-4 rounded-2xl border border-border bg-surface shadow-2xs">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span className="font-semibold">Money Spent</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-500">
              <Wallet className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text">
            {formatINR(totals.totalSpentPaise)}
          </div>
          <p className="mt-1 text-[11px] text-text-muted">Paise-accurate integer</p>
        </div>

        {/* 3. Meals Logged */}
        <div className="p-4 rounded-2xl border border-border bg-surface shadow-2xs">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span className="font-semibold">Meals Logged</span>
            <span className="p-1 rounded bg-rose-500/10 text-rose-500">
              <Utensils className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text">
            {totals.mealsCount} <span className="text-sm font-normal text-text-muted">/ 4 slots</span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">Nutrition & diary</p>
        </div>

        {/* 4. Tasks Completed */}
        <div className="p-4 rounded-2xl border border-border bg-surface shadow-2xs">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span className="font-semibold">Tasks Completed</span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text">
            {totals.tasksCompleted}
          </div>
          <p className="mt-1 text-[11px] text-text-muted">Checked off today</p>
        </div>
      </div>

      {/* Main Grid: Full Chronological Timeline + Day Notes / Reflections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Full Unified Timeline (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text">Timeline Feed</h2>
                <p className="text-[11px] text-text-muted">
                  Chronological record of every event on {date}
                </p>
              </div>
            </div>

            <button
              onClick={() => openQuickCapture()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 shadow-2xs transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Event</span>
            </button>
          </div>

          <div className="min-h-[350px]">
            <UnifiedTimeline date={date} />
          </div>
        </div>

        {/* Right Column: Day Notes & Reflections (1 col) */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-accent-warm/10 text-accent-warm">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text">Day Notes & Reflection</h3>
                <span className="text-[10px] text-text-muted">Saved to your notes</span>
              </div>
            </div>

            <div className="text-[10px] font-semibold text-text-muted flex items-center gap-1">
              {saveStatus === "saved" && (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === "saving" && (
                <span className="text-primary animate-pulse">Saving...</span>
              )}
              {saveStatus === "unsaved" && (
                <button
                  type="button"
                  onClick={() => handleSaveNote(noteContent)}
                  className="text-primary font-bold hover:underline"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={12}
              value={noteContent}
              onChange={handleNoteChange}
              placeholder="What went well today? What did you learn? Any thoughts, code snippets, or memories..."
              className="w-full p-3 text-xs rounded-xl border border-border/80 bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60 resize-none font-sans leading-relaxed"
            />
            <p className="text-[11px] text-text-muted italic">
              Auto-saves 1.5s after typing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
