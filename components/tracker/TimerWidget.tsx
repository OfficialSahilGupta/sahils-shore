"use client";

// ============================================================================
// Sahil's Shore: Timer & Pomodoro Widget
// Survives page refresh by storing start timestamps in localStorage
// Auto-logs sessions to activity_logs and writes timeline_events
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import type { Activity } from "@/types";

interface TimerWidgetProps {
  activities: Activity[];
  selectedActivityId: string;
  onSelectActivity: (id: string) => void;
  onLogSession: (
    activityId: string,
    durationSeconds: number,
    notes?: string
  ) => Promise<void>;
}

type TimerMode = "stopwatch" | "pomodoro";
type PomodoroPhase = "work" | "break";

interface PersistedTimerState {
  activityId: string;
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  isRunning: boolean;
  startedAt: string | null; // ISO UTC string when currently running interval started
  accumulatedSeconds: number; // Seconds logged prior to current start
  workDurationMinutes: number;
  breakDurationMinutes: number;
}

const STORAGE_KEY = "shore_active_timer_state";

export function TimerWidget({
  activities,
  selectedActivityId,
  onSelectActivity,
  onLogSession,
}: TimerWidgetProps) {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("work");
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const [sessionNotes, setSessionNotes] = useState("");
  const [showNotesPrompt, setShowNotesPrompt] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeActivity = activities.find((a) => a.id === selectedActivityId) || activities[0];

  // Helper to compute exact total elapsed seconds from start timestamp
  const calculateElapsed = useCallback(() => {
    let elapsed = accumulatedSeconds;
    if (isRunning && startedAt) {
      const startMs = new Date(startedAt).getTime();
      const nowMs = Date.now();
      const currentChunk = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      elapsed += currentChunk;
    }
    return elapsed;
  }, [isRunning, startedAt, accumulatedSeconds]);

  // Load timer state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PersistedTimerState = JSON.parse(stored);
        if (parsed.activityId) onSelectActivity(parsed.activityId);
        setMode(parsed.mode || "pomodoro");
        setPomodoroPhase(parsed.pomodoroPhase || "work");
        setWorkMinutes(parsed.workDurationMinutes || 25);
        setBreakMinutes(parsed.breakDurationMinutes || 5);
        setAccumulatedSeconds(parsed.accumulatedSeconds || 0);

        if (parsed.isRunning && parsed.startedAt) {
          setIsRunning(true);
          setStartedAt(parsed.startedAt);
          // Calculate elapsed immediately
          const startMs = new Date(parsed.startedAt).getTime();
          const currentChunk = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
          setDisplaySeconds((parsed.accumulatedSeconds || 0) + currentChunk);
        } else {
          setIsRunning(false);
          setStartedAt(null);
          setDisplaySeconds(parsed.accumulatedSeconds || 0);
        }
      }
    } catch (e) {
      console.warn("Failed to load persisted timer state:", e);
    }
  }, [onSelectActivity]);

  // Persist timer state to localStorage whenever key fields change
  useEffect(() => {
    if (!selectedActivityId) return;

    const stateToSave: PersistedTimerState = {
      activityId: selectedActivityId,
      mode,
      pomodoroPhase,
      isRunning,
      startedAt,
      accumulatedSeconds,
      workDurationMinutes: workMinutes,
      breakDurationMinutes: breakMinutes,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    selectedActivityId,
    mode,
    pomodoroPhase,
    isRunning,
    startedAt,
    accumulatedSeconds,
    workMinutes,
    breakMinutes,
  ]);

  // Play audio chime when timer ends
  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (err) {
      // AudioContext may be blocked before first user gesture
    }
  }, [soundEnabled]);

  // Tick interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const elapsed = calculateElapsed();
      setDisplaySeconds(elapsed);

      // Pomodoro target threshold detection
      if (mode === "pomodoro") {
        const targetSeconds =
          pomodoroPhase === "work" ? workMinutes * 60 : breakMinutes * 60;

        if (elapsed >= targetSeconds) {
          playChime();
          // Pause and trigger completion
          setIsRunning(false);
          setStartedAt(null);
          setAccumulatedSeconds(targetSeconds);

          if (pomodoroPhase === "work" && activeActivity) {
            // Auto-log work session
            onLogSession(
              activeActivity.id,
              targetSeconds,
              `Pomodoro ${workMinutes}m session`
            );
            // Switch to break phase
            setPomodoroPhase("break");
            setAccumulatedSeconds(0);
            setDisplaySeconds(0);
          } else {
            // Break finished, switch back to work phase
            setPomodoroPhase("work");
            setAccumulatedSeconds(0);
            setDisplaySeconds(0);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isRunning,
    calculateElapsed,
    mode,
    pomodoroPhase,
    workMinutes,
    breakMinutes,
    activeActivity,
    onLogSession,
    playChime,
  ]);

  // Start / Resume
  const handleStart = () => {
    const nowIso = new Date().toISOString();
    setStartedAt(nowIso);
    setIsRunning(true);
  };

  // Pause
  const handlePause = () => {
    const elapsed = calculateElapsed();
    setAccumulatedSeconds(elapsed);
    setDisplaySeconds(elapsed);
    setStartedAt(null);
    setIsRunning(false);
  };

  // Stop / Finish Session (Prompt to save if > 10 seconds)
  const handleStop = () => {
    const totalElapsed = calculateElapsed();
    handlePause();

    if (totalElapsed >= 10 && activeActivity) {
      setShowNotesPrompt(true);
    } else {
      handleReset();
    }
  };

  const handleConfirmLog = async () => {
    if (!activeActivity) return;
    const totalElapsed = calculateElapsed();
    await onLogSession(
      activeActivity.id,
      totalElapsed,
      sessionNotes.trim() || undefined
    );
    setShowNotesPrompt(false);
    setSessionNotes("");
    handleReset();
  };

  // Reset
  const handleReset = () => {
    setIsRunning(false);
    setStartedAt(null);
    setAccumulatedSeconds(0);
    setDisplaySeconds(0);
    setShowNotesPrompt(false);
    setSessionNotes("");
    localStorage.removeItem(STORAGE_KEY);
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTimeDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;

    if (hrs > 0) {
      const hStr = hrs < 10 ? `0${hrs}` : `${hrs}`;
      return `${hStr}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  };

  // Pomodoro countdown display
  const pomodoroTargetSeconds =
    pomodoroPhase === "work" ? workMinutes * 60 : breakMinutes * 60;
  const pomodoroRemainingSeconds = Math.max(
    0,
    pomodoroTargetSeconds - displaySeconds
  );
  const pomodoroProgressPercent =
    mode === "pomodoro"
      ? Math.min(100, (displaySeconds / pomodoroTargetSeconds) * 100)
      : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Mode Toggles & Activity Selector */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          {/* Stopwatch vs Pomodoro Toggle */}
          <div className="flex rounded-xl bg-[var(--surface-muted)] p-1 text-xs max-w-xs">
            <button
              onClick={() => {
                if (!isRunning) {
                  setMode("pomodoro");
                  handleReset();
                }
              }}
              className={`flex-1 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                mode === "pomodoro"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => {
                if (!isRunning) {
                  setMode("stopwatch");
                  handleReset();
                }
              }}
              className={`flex-1 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                mode === "stopwatch"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Stopwatch
            </button>
          </div>

          {/* Activity Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
              Focus Activity
            </label>
            <select
              value={selectedActivityId}
              onChange={(e) => onSelectActivity(e.target.value)}
              disabled={isRunning}
              className="w-full md:w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text)] focus:border-[var(--primary)] focus:outline-none disabled:opacity-60"
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.daily_target_minutes}m target)
                </option>
              ))}
            </select>
          </div>

          {/* Pomodoro Configuration (25/5 or customizable) */}
          {mode === "pomodoro" && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[var(--text-muted)] font-medium">Presets:</span>
              {[
                { w: 25, b: 5, label: "25 / 5" },
                { w: 50, b: 10, label: "50 / 10" },
                { w: 90, b: 15, label: "90 / 15" },
              ].map((p) => (
                <button
                  key={p.label}
                  disabled={isRunning}
                  onClick={() => {
                    setWorkMinutes(p.w);
                    setBreakMinutes(p.b);
                    handleReset();
                  }}
                  className={`rounded-lg px-2.5 py-1 font-mono transition-colors ${
                    workMinutes === p.w && breakMinutes === p.b
                      ? "bg-[var(--primary)] text-white font-bold"
                      : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Timer Display & Visual Ring */}
        <div className="flex flex-col items-center justify-center">
          {mode === "pomodoro" ? (
            <CircularProgress
              value={pomodoroProgressPercent}
              size={180}
              strokeWidth={10}
              strokeColor={
                pomodoroPhase === "work" ? "var(--primary)" : "var(--success)"
              }
            >
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold font-mono tracking-tight text-[var(--text)]">
                  {formatTimeDisplay(pomodoroRemainingSeconds)}
                </span>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${
                    pomodoroPhase === "work"
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "bg-[var(--success)]/15 text-[var(--success)]"
                  }`}
                >
                  {pomodoroPhase === "work" ? "Focus" : "Break"}
                </span>
              </div>
            </CircularProgress>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px]">
              <span className="text-5xl font-extrabold font-mono tracking-tight text-[var(--text)]">
                {formatTimeDisplay(displaySeconds)}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium mt-2">
                Stopwatch Mode
              </span>
            </div>
          )}
        </div>

        {/* Right: Timer Controls */}
        <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 rounded-2xl bg-[var(--warning)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95"
              >
                <Pause className="h-4 w-4 fill-white" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={handleStop}
              disabled={displaySeconds === 0}
              className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] disabled:opacity-40 transition-colors"
              title="Stop and save session"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Done</span>
            </button>

            <button
              onClick={handleReset}
              className="p-3 rounded-2xl text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
              title="Reset timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 rounded-2xl text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
              title={soundEnabled ? "Mute audio chime" : "Enable audio chime"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
          </div>

          <span className="text-[11px] text-[var(--text-muted)]">
            {isRunning
              ? "Timer active • Survives browser refresh"
              : "Timer idle"}
          </span>
        </div>
      </div>

      {/* Session Notes Confirmation Popup */}
      {showNotesPrompt && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Add quick notes on what you accomplished..."
            className="flex-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmLog}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Log {Math.round(calculateElapsed() / 60)}m</span>
            </button>
            <button
              onClick={() => {
                setShowNotesPrompt(false);
                handleReset();
              }}
              className="rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
