"use client";

// ============================================================================
// Sahil's Shore: STAR Behavioral Interview Practice Modal
// Live countdown timer, random prompt picker, and checkable STAR guideline
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import type { InterviewStory } from "@/types/career";
import { STAR_PROMPT_QUESTIONS } from "@/lib/career";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Timer,
  CheckCircle2,
  Dice5,
  X,
  Star,
  Eye,
  EyeOff,
  ChevronRight,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StarPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: InterviewStory[];
  initialStory?: InterviewStory | null;
  onSavePracticeSession: (
    title: string,
    durationSeconds: number,
    rating: number,
    notes?: string
  ) => Promise<void>;
}

export function StarPracticeModal({
  isOpen,
  onClose,
  stories,
  initialStory,
  onSavePracticeSession,
}: StarPracticeModalProps) {
  // Timer duration in seconds: default 120s (2 minutes)
  const [targetDuration, setTargetDuration] = useState(120);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Active prompt / Story
  const [activeStory, setActiveStory] = useState<InterviewStory | null>(initialStory || null);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [promptCategory, setPromptCategory] = useState<string>("Behavioral");
  const [showNotes, setShowNotes] = useState(false);

  // STAR Guidelines checklist
  const [starChecklist, setStarChecklist] = useState({
    situation: false,
    task: false,
    action: false,
    result: false,
  });

  // Post-session self review
  const [selfRating, setSelfRating] = useState(4);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize prompt on open
  useEffect(() => {
    if (isOpen) {
      if (initialStory) {
        setActiveStory(initialStory);
        setCurrentPrompt(initialStory.title);
        setPromptCategory(initialStory.tags?.[0] || "STAR Story");
      } else if (stories.length > 0) {
        const randomStory = stories[Math.floor(Math.random() * stories.length)];
        setActiveStory(randomStory);
        setCurrentPrompt(randomStory.title);
        setPromptCategory(randomStory.tags?.[0] || "STAR Story");
      } else {
        const randomQ = STAR_PROMPT_QUESTIONS[Math.floor(Math.random() * STAR_PROMPT_QUESTIONS.length)];
        setActiveStory(null);
        setCurrentPrompt(randomQ.question);
        setPromptCategory(randomQ.category);
      }

      setSecondsRemaining(targetDuration);
      setIsRunning(false);
      setIsFinished(false);
      setStarChecklist({
        situation: false,
        task: false,
        action: false,
        result: false,
      });
      setShowNotes(false);
    }
  }, [isOpen, initialStory, stories, targetDuration]);

  // Timer Tick
  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsRemaining]);

  if (!isOpen) return null;

  const handlePickRandom = () => {
    const randomQ = STAR_PROMPT_QUESTIONS[Math.floor(Math.random() * STAR_PROMPT_QUESTIONS.length)];
    setActiveStory(null);
    setCurrentPrompt(randomQ.question);
    setPromptCategory(randomQ.category);
    handleResetTimer();
  };

  const handleSelectSavedStory = (story: InterviewStory) => {
    setActiveStory(story);
    setCurrentPrompt(story.title);
    setPromptCategory(story.tags?.[0] || "STAR Story");
    handleResetTimer();
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    setSecondsRemaining(targetDuration);
  };

  const handleDurationChange = (secs: number) => {
    setTargetDuration(secs);
    setSecondsRemaining(secs);
    setIsRunning(false);
    setIsFinished(false);
  };

  const handleFinish = () => {
    setIsRunning(false);
    setIsFinished(true);
  };

  const handleSaveSession = async () => {
    try {
      setIsSubmitting(true);
      const timeSpentSeconds = targetDuration - secondsRemaining;
      await onSavePracticeSession(
        currentPrompt,
        timeSpentSeconds > 0 ? timeSpentSeconds : targetDuration,
        selfRating,
        reviewNotes
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  const progressPct = ((targetDuration - secondsRemaining) / targetDuration) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text">STAR Rehearsal & Practice Mode</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Controls: Duration Presets & Randomize Prompt */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-text-muted mr-1">Time Limit:</span>
              {[60, 120, 180, 300].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleDurationChange(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    targetDuration === s
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-surface-muted text-text-muted hover:text-text"
                  }`}
                >
                  {s / 60}m
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePickRandom}
              className="h-8 text-xs inline-flex items-center gap-1.5"
            >
              <Dice5 className="w-3.5 h-3.5 text-primary" />
              <span>Random Behavioral Prompt</span>
            </Button>
          </div>

          {/* Active Question / Prompt Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Category: {promptCategory}
              </span>
              {activeStory && (
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {showNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showNotes ? "Hide My STAR Notes" : "Peek My STAR Notes"}</span>
                </button>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-bold text-text leading-snug">
              &ldquo;{currentPrompt}&rdquo;
            </h4>

            {/* Collapsible Story Notes Drawer */}
            {activeStory && showNotes && (
              <div className="mt-3 pt-3 border-t border-primary/20 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-text animate-in fade-in">
                <div className="p-2 rounded-lg bg-surface/70 border border-border/50">
                  <span className="font-bold text-primary block text-[11px] uppercase">Situation</span>
                  <p className="text-text-muted mt-0.5 line-clamp-3">{activeStory.situation}</p>
                </div>
                <div className="p-2 rounded-lg bg-surface/70 border border-border/50">
                  <span className="font-bold text-primary block text-[11px] uppercase">Task</span>
                  <p className="text-text-muted mt-0.5 line-clamp-3">{activeStory.task}</p>
                </div>
                <div className="p-2 rounded-lg bg-surface/70 border border-border/50">
                  <span className="font-bold text-primary block text-[11px] uppercase">Action</span>
                  <p className="text-text-muted mt-0.5 line-clamp-3">{activeStory.action}</p>
                </div>
                <div className="p-2 rounded-lg bg-surface/70 border border-border/50">
                  <span className="font-bold text-emerald-600 block text-[11px] uppercase">Result</span>
                  <p className="text-text-muted mt-0.5 line-clamp-3">{activeStory.result}</p>
                </div>
              </div>
            )}
          </div>

          {/* Central Countdown Timer Visualization */}
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <div
              className={`text-5xl sm:text-6xl font-mono font-bold tracking-tight transition-colors ${
                secondsRemaining <= 15 && secondsRemaining > 0
                  ? "text-rose-500 animate-pulse"
                  : isFinished
                  ? "text-emerald-500"
                  : isRunning
                  ? "text-primary"
                  : "text-text"
              }`}
            >
              {timeFormatted}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-sm h-2 bg-surface-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  secondsRemaining <= 15 ? "bg-rose-500" : "bg-primary"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Timer Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleToggleTimer}
                className="w-28 inline-flex items-center justify-center gap-1.5"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> {secondsRemaining === targetDuration ? "Start" : "Resume"}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleResetTimer}
                className="inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>

              <Button
                variant="ghost"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 text-text-muted hover:text-text"
              >
                Finish Early
              </Button>
            </div>
          </div>

          {/* Live STAR Checklist during speaking */}
          <div className="rounded-xl border border-border/80 bg-surface-muted/30 p-3.5 space-y-2">
            <span className="text-xs font-bold text-text block">
              Speaking Checklist (Tick as you hit each section):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={starChecklist.situation}
                  onChange={(e) =>
                    setStarChecklist({ ...starChecklist, situation: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <strong className="text-text">S - Situation:</strong> Context, scale, problem
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={starChecklist.task}
                  onChange={(e) =>
                    setStarChecklist({ ...starChecklist, task: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <strong className="text-text">T - Task:</strong> The specific goal you owned
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={starChecklist.action}
                  onChange={(e) =>
                    setStarChecklist({ ...starChecklist, action: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <strong className="text-text">A - Action:</strong> Tech choices & decisions you made
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={starChecklist.result}
                  onChange={(e) =>
                    setStarChecklist({ ...starChecklist, result: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <strong className="text-text">R - Result:</strong> Numbers, impact, lessons
                </div>
              </label>
            </div>
          </div>

          {/* Post-Practice Review Section (Active when finished or paused) */}
          {(isFinished || secondsRemaining < targetDuration) && (
            <div className="rounded-xl border border-border p-4 bg-surface space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Self-Evaluation Rating
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelfRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= selfRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-text-muted/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Rehearsal Notes / Improvements
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remember to mention Kafka partition key hashing; delivery was crisp."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSaveSession} disabled={isSubmitting}>
                  {isSubmitting ? "Logging..." : "Save Practice Session"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
