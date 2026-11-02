"use client";

// ============================================================================
// Sahil's Shore: Unified Timeline Component
// Vertical, time-ordered activity feed across tasks, study, expenses, meals, etc.
// Tappable items opening source records and metadata
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTimelineEventsForDate, getEventTypeConfig, formatTimelineEventTime } from "@/lib/timeline";
import { TimelineDetailModal } from "./TimelineDetailModal";
import { todayIST, formatFriendlyISTDate } from "@/lib/date-utils";
import { formatINR } from "@/lib/expenses";
import { useQuickCapture } from "@/lib/quick-capture/QuickCaptureContext";
import type { TimelineEvent } from "@/types";
import {
  CheckCircle2,
  BookOpen,
  Wallet,
  Utensils,
  MapPin,
  Image as ImageIcon,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  Clock,
  Compass,
  Plus,
  ArrowRight,
} from "lucide-react";

interface UnifiedTimelineProps {
  date?: string;
  limit?: number;
  compact?: boolean;
  showHeader?: boolean;
}

export function UnifiedTimeline({
  date = todayIST(),
  limit,
  compact = false,
  showHeader = false,
}: UnifiedTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const { open: openQuickCapture } = useQuickCapture();

  const loadEvents = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const fetched = await getTimelineEventsForDate(supabase, authData.user.id, date);
        setEvents(fetched);
      } else {
        // Fallback demo/empty state
        setEvents([]);
      }
    } catch (err) {
      console.warn("[UnifiedTimeline] Error loading events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadEvents();

    const handleUpdate = () => {
      loadEvents();
    };

    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadEvents]);

  const displayedEvents = limit ? events.slice(0, limit) : events;

  const renderIcon = (iconName: string, colorClass: string) => {
    switch (iconName) {
      case "check":
        return <CheckCircle2 className={`w-3.5 h-3.5 ${colorClass}`} />;
      case "book":
        return <BookOpen className={`w-3.5 h-3.5 ${colorClass}`} />;
      case "wallet":
        return <Wallet className={`w-3.5 h-3.5 ${colorClass}`} />;
      case "trending-up":
        return <TrendingUp className={`w-3.5 h-3.5 ${colorClass}`} />;
      case "utensils":
        return <Utensils className={`w-3.5 h-3.5 ${colorClass}`} />;
      case "pin":
        return <MapPin className={`w-3.5 h-3.5 ${colorClass}`} />;
      case "image":
        return <ImageIcon className={`w-3.5 h-3.5 ${colorClass}`} />;
      case "zap":
        return <Zap className={`w-3.5 h-3.5 ${colorClass}`} />;
      case "file-text":
        return <FileText className={`w-3.5 h-3.5 ${colorClass}`} />;
      default:
        return <Sparkles className={`w-3.5 h-3.5 ${colorClass}`} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-text">Timeline Feed</span>
            <span className="text-[11px] text-text-muted">
              ({events.length} {events.length === 1 ? "event" : "events"})
            </span>
          </div>
          <Link
            href={`/day/${date}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            <span>Day View</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 py-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-surface-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-1/3 bg-surface-muted rounded" />
                <div className="h-2.5 w-1/2 bg-surface-muted/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-border bg-surface-muted/20">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
            <Compass className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-semibold text-text">No events logged yet today</h4>
          <p className="text-[11px] text-text-muted mt-1 max-w-[240px]">
            Every task, focus timer, expense, or meal automatically flows into your shore timeline.
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <button
              onClick={() => openQuickCapture("task")}
              className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-text hover:bg-surface-muted transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-primary" />
              <span>Task</span>
            </button>
            <button
              onClick={() => openQuickCapture("expense")}
              className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-text hover:bg-surface-muted transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-primary" />
              <span>Expense</span>
            </button>
            <button
              onClick={() => openQuickCapture("meal")}
              className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-text hover:bg-surface-muted transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-primary" />
              <span>Meal</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 my-1 flex-1 overflow-y-auto">
          {/* Continuous vertical timeline connector bar */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border/80" />

          {displayedEvents.map((ev) => {
            const config = getEventTypeConfig(ev.type);
            const timeStr = formatTimelineEventTime(ev.occurred_at);
            const meta = (ev.meta || {}) as Record<string, unknown>;

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="group relative flex items-start gap-3 cursor-pointer select-none"
              >
                {/* Node Marker */}
                <div
                  className={`relative z-10 -ml-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${config.bgClass} ${config.borderClass} shadow-xs group-hover:scale-110 transition-transform`}
                >
                  {renderIcon(config.iconName, config.colorClass)}
                </div>

                {/* Content Card */}
                <div className="flex-1 min-w-0 p-2.5 rounded-xl border border-border/70 bg-surface hover:bg-surface-muted/40 hover:border-primary/40 transition-all shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.bgClass} ${config.colorClass}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-[11px] font-mono text-text-muted shrink-0">
                      {timeStr}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">
                    {ev.summary}
                  </p>

                  {/* Contextual Badges */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-text-muted">
                    {meta.amount_paise !== undefined && (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatINR(Number(meta.amount_paise))}
                      </span>
                    )}
                    {meta.duration_minutes !== undefined && (
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {String(meta.duration_minutes)} mins
                      </span>
                    )}
                    {meta.slot !== undefined && (
                      <span className="capitalize font-medium text-rose-500">
                        {String(meta.slot)}
                      </span>
                    )}
                    {meta.rating !== undefined && (
                      <span className="text-accent-warm font-semibold">
                        ★ {String(meta.rating)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      <TimelineDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
