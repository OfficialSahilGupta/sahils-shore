"use client";

// ============================================================================
// Sahil's Shore: German Learning Hub Header & Study Session Stopwatch
// Live timer that syncs directly to Daily Tracker (German) & Timeline Events
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Globe,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Mic,
  Award,
  FileText,
  Headphones,
} from "lucide-react";

export type GermanTab =
  | "vocab"
  | "pronunciation"
  | "cefr"
  | "grammar"
  | "practice";

interface GermanHubHeaderProps {
  activeTab: GermanTab;
  onTabChange: (tab: GermanTab) => void;
  dueCardsCount: number;
  totalCardsCount: number;
  cefrMasteredCount: number;
  totalCompetenciesCount: number;
  pronunciationCount: number;
  onLogStudyTime: (minutes: number) => Promise<void>;
}

export function GermanHubHeader({
  activeTab,
  onTabChange,
  dueCardsCount,
  totalCardsCount,
  cefrMasteredCount,
  totalCompetenciesCount,
  pronunciationCount,
  onLogStudyTime,
}: GermanHubHeaderProps) {
  // Study session stopwatch state (persists in localStorage during active session)
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    // Check if there was an active study session start timestamp
    const savedStart = localStorage.getItem("shore_german_timer_start");
    if (savedStart) {
      const elapsed = Math.floor((Date.now() - parseInt(savedStart, 10)) / 1000);
      setTimerSeconds(elapsed);
      setIsRunning(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleToggleTimer = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      localStorage.removeItem("shore_german_timer_start");
    } else {
      // Start
      setIsRunning(true);
      const startMs = Date.now() - timerSeconds * 1000;
      localStorage.setItem("shore_german_timer_start", startMs.toString());
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimerSeconds(0);
    localStorage.removeItem("shore_german_timer_start");
  };

  const handleSaveStudySession = async () => {
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    setIsSaving(true);
    try {
      await onLogStudyTime(minutes);
      handleResetTimer();
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-surface-muted shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <Globe className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              Sprachlabor & Lernzentrum
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            German Learning Hub
          </h1>
          <p className="text-sm text-text-muted mt-1 max-w-xl">
            Vocab flashcards with SM-2 spaced repetition, pronunciation lab with live waveform & shadowing, and CEFR progress.
          </p>
        </div>

        {/* Study Session Stopwatch Widget */}
        <div className="flex items-center gap-3 bg-surface-muted/60 p-3 rounded-xl border border-surface-muted self-start lg:self-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
              Study Stopwatch
            </span>
            <span className="text-xl font-mono font-bold text-text">
              {formatTimer(timerSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={handleToggleTimer}
              className={`p-2 rounded-lg text-white transition-all shadow-sm ${
                isRunning
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-primary hover:opacity-90"
              }`}
              title={isRunning ? "Pause Stopwatch" : "Start Stopwatch"}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {timerSeconds > 0 && (
              <>
                <button
                  onClick={handleResetTimer}
                  className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSaveStudySession}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all disabled:opacity-50"
                  title="Log time to Daily Tracker (German) & Timeline"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Log Time"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mini Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-surface-muted flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-text">{dueCardsCount}</div>
            <div className="text-xs text-text-muted">Due for Review</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-surface-muted flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-text">{totalCardsCount}</div>
            <div className="text-xs text-text-muted">Vocab Cards</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-surface-muted flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-text">{pronunciationCount}</div>
            <div className="text-xs text-text-muted">Recordings</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-surface-muted flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-text">
              {cefrMasteredCount} / {totalCompetenciesCount}
            </div>
            <div className="text-xs text-text-muted">CEFR Mastered</div>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-surface-muted">
        <button
          onClick={() => onTabChange("vocab")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "vocab"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Vocab & SM-2</span>
          {dueCardsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-primary text-white font-bold">
              {dueCardsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange("pronunciation")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "pronunciation"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50"
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Pronunciation Lab</span>
        </button>

        <button
          onClick={() => onTabChange("cefr")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "cefr"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>CEFR Progress</span>
        </button>

        <button
          onClick={() => onTabChange("grammar")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "grammar"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Grammar Notes</span>
        </button>

        <button
          onClick={() => onTabChange("practice")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "practice"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50"
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Listening & Writing</span>
        </button>
      </div>
    </div>
  );
}
