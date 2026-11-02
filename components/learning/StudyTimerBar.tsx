"use client";

// ============================================================================
// Sahil's Shore: Learning Hub Integrated Study Timer
// Reuses the Daily Tracker activity logger to sync study time
// ============================================================================

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock, Check } from "lucide-react";
import type { LearningTrack } from "@/types";

interface StudyTimerBarProps {
  track: LearningTrack | null;
  onSaveSession: (durationSeconds: number, notes?: string) => Promise<void>;
}

export function StudyTimerBar({ track, onSaveSession }: StudyTimerBarProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setNotes("");
  };

  const handleSave = async () => {
    if (seconds < 10) {
      alert("Session is too short to log (minimum 10 seconds).");
      return;
    }
    setIsSaving(true);
    try {
      await onSaveSession(seconds, notes.trim() || undefined);
      handleReset();
    } finally {
      setIsSaving(false);
    }
  };

  const activityName =
    track?.slug === "spring" || track?.title.toLowerCase().includes("spring")
      ? "Spring Boot"
      : "MERN";

  return (
    <div className="w-full rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-3.5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Timer Display & Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Study Timer
              </span>
              <span className="rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text)]">
                Syncs to Daily Tracker ({activityName})
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[var(--text)]">
                {formatTime(seconds)}
              </span>
              {isRunning && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--success)] animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                  Recording...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Optional Notes */}
        {seconds > 0 && (
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you study? (optional)"
              className="w-full rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
              isRunning
                ? "bg-[var(--warning)] text-white hover:opacity-90"
                : "bg-[var(--primary)] text-white hover:opacity-90"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>{seconds > 0 ? "Resume" : "Start Study"}</span>
              </>
            )}
          </button>

          {seconds > 0 && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-[var(--surface-muted)] p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--success)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                title="Save study session to Daily Tracker & Timeline"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Log to Tracker"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
