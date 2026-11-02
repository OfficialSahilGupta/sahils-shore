"use client";

// ============================================================================
// Sahil's Shore: Focus Timer Widget
// Refresh-surviving Pomodoro & Stopwatch with activity logging to timeline_events
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getActivities, logActivityTime } from "@/lib/tracker";
import { useToast } from "@/components/ui/toast";
import type { Activity } from "@/types";
import type { WidgetId } from "@/lib/dashboard/types";
import { Clock, Play, Pause, RotateCcw, Check, ArrowRight } from "lucide-react";

interface FocusTimerWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

const TIMER_STORAGE_KEY = "shore_dashboard_timer_state_v1";

export function FocusTimerWidget({ isEditMode, onRemove }: FocusTimerWidgetProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load activities
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUserId(data.user.id);
          getActivities(supabase, data.user.id).then((acts) => {
            setActivities(acts);
            if (acts.length > 0 && !selectedActivityId) {
              setSelectedActivityId(acts[0].id);
            }
          });
        }
      });
    } catch {}
  }, [selectedActivityId]);

  // Load timer state from localStorage to survive refreshes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.isRunning && parsed.startTimestamp) {
          const elapsed = Math.floor((Date.now() - parsed.startTimestamp) / 1000);
          if (parsed.mode === "pomodoro") {
            const rem = Math.max(0, parsed.initialSeconds - elapsed);
            setSecondsLeft(rem);
            setIsRunning(rem > 0);
          } else {
            setStopwatchSeconds(parsed.initialSeconds + elapsed);
            setIsRunning(true);
          }
          setMode(parsed.mode);
          if (parsed.activityId) setSelectedActivityId(parsed.activityId);
        }
      }
    } catch {}
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === "pomodoro") {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              toast({ title: "Pomodoro session complete! ☕", type: "success" });
              return 0;
            }
            return prev - 1;
          });
        } else {
          setStopwatchSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, toast]);

  const toggleRunning = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);

    if (typeof window !== "undefined") {
      try {
        if (nextRunning) {
          localStorage.setItem(
            TIMER_STORAGE_KEY,
            JSON.stringify({
              isRunning: true,
              startTimestamp: Date.now(),
              mode,
              initialSeconds: mode === "pomodoro" ? secondsLeft : stopwatchSeconds,
              activityId: selectedActivityId,
            })
          );
        } else {
          localStorage.removeItem(TIMER_STORAGE_KEY);
        }
      } catch {}
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(25 * 60);
    setStopwatchSeconds(0);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      } catch {}
    }
  };

  const handleLogSession = async () => {
    const totalSecs = mode === "pomodoro" ? 25 * 60 - secondsLeft : stopwatchSeconds;
    const minutes = Math.max(1, Math.round(totalSecs / 60));

    try {
      const supabase = createClient();
      const res = await logActivityTime(supabase, userId || "anonymous", {
        activity_id: selectedActivityId,
        duration_seconds: minutes * 60,
        notes: `Dashboard focus session (${minutes}m)`,
      });

      if (res) {
        toast({
          title: "Focus session saved",
          description: `${minutes} minutes logged to your activity streak.`,
          type: "success",
        });
        handleReset();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("shore:data-updated"));
        }
      }
    } catch {
      toast({ title: "Failed to log session", type: "error" });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentSecs = mode === "pomodoro" ? secondsLeft : stopwatchSeconds;

  return (
    <WidgetContainer
      id="timer"
      title="Focus Timer"
      icon={Clock}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <div className="flex items-center gap-1 bg-surface-muted/60 p-0.5 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => {
              setMode("pomodoro");
              handleReset();
            }}
            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
              mode === "pomodoro" ? "bg-primary text-primary-foreground" : "text-text-muted"
            }`}
          >
            Pomo
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("stopwatch");
              handleReset();
            }}
            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
              mode === "stopwatch" ? "bg-primary text-primary-foreground" : "text-text-muted"
            }`}
          >
            Stopwatch
          </button>
        </div>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-3">
        {/* Activity Selector */}
        <div>
          <select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="w-full px-2.5 py-1 text-xs rounded-xl border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary font-medium"
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
            {activities.length === 0 && <option value="">General Focus</option>}
          </select>
        </div>

        {/* Large Time Display */}
        <div className="text-center py-2">
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-text tracking-wider">
            {formatTime(currentSecs)}
          </div>
          <span className="text-[11px] text-text-muted uppercase tracking-widest mt-0.5 block">
            {isRunning ? "Focusing..." : "Ready"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={toggleRunning}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isRunning
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-primary text-primary-foreground hover:opacity-95"
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? "Pause" : "Start"}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border border-border text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {currentSecs !== (mode === "pomodoro" ? 25 * 60 : 0) && (
            <button
              type="button"
              onClick={handleLogSession}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              title="Save time to activity streak"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          )}
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Survives refresh</span>
          <Link href="/tracker" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Timer Hub</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
