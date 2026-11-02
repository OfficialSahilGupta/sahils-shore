"use client";

// ============================================================================
// Sahil's Shore: Mock Interview Simulation Modal
// Serves random questions with countdown timer, reveal answer, and instant rating
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Star,
  ArrowRight,
  Trophy,
  Clock,
  Sparkles,
} from "lucide-react";
import type { InterviewQa } from "@/types";
import { selectMockInterviewQuestions } from "@/lib/learning";

interface MockInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: InterviewQa[];
  onUpdateConfidence: (qaId: string, confidence: number) => Promise<void>;
}

export function MockInterviewModal({
  isOpen,
  onClose,
  questions,
  onUpdateConfidence,
}: MockInterviewModalProps) {
  const [mockSet, setMockSet] = useState<InterviewQa[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120); // 2 minutes per question
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [userRatings, setUserRatings] = useState<{ [id: string]: number }>({});

  // Initialize random mock questions
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      const selected = selectMockInterviewQuestions(questions, 5);
      setMockSet(selected);
      setCurrentIndex(0);
      setIsAnswerRevealed(false);
      setTimerSeconds(120);
      setIsTimerRunning(true);
      setIsFinished(false);
      setUserRatings({});
    }
  }, [isOpen, questions]);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0 && !isFinished) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, isFinished]);

  if (!isOpen) return null;

  const currentQ = mockSet[currentIndex];

  const handleNext = () => {
    if (currentIndex + 1 < mockSet.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswerRevealed(false);
      setTimerSeconds(120);
      setIsTimerRunning(true);
    } else {
      setIsFinished(true);
      setIsTimerRunning(false);
    }
  };

  const handleRate = async (stars: number) => {
    if (!currentQ) return;
    setUserRatings({ ...userRatings, [currentQ.id]: stars });
    await onUpdateConfidence(currentQ.id, stars);
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--surface-muted)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--surface-muted)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">
                Mock Technical Interview
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Simulated 2-minute whiteboard / conceptual question round
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isFinished ? (
          /* Finished Screen */
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success)]/15 text-[var(--success)]">
              <Trophy className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text)]">
              Mock Interview Completed!
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Great practice session! Your confidence ratings have been updated in your Interview Q&A bank.
            </p>
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[var(--primary)] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
              >
                Return to Q&A Bank
              </button>
            </div>
          </div>
        ) : currentQ ? (
          /* Active Question View */
          <div className="space-y-4">
            {/* Progress & Timer Bar */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[var(--text-muted)]">
                Question <span className="text-[var(--text)]">{currentIndex + 1}</span> of {mockSet.length}
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-mono font-bold ${
                    timerSeconds < 30
                      ? "bg-[var(--danger)]/15 text-[var(--danger)] animate-pulse"
                      : "bg-[var(--surface-muted)] text-[var(--text)]"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatTimer(timerSeconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="rounded-lg border border-[var(--surface-muted)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                  title={isTimerRunning ? "Pause timer" : "Resume timer"}
                >
                  {isTimerRunning ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Question Card */}
            <div className="rounded-xl border border-[var(--surface-muted)] bg-[var(--surface-muted)]/20 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                  {currentQ.technology}
                </span>
                {currentQ.tags &&
                  currentQ.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                    >
                      {t}
                    </span>
                  ))}
              </div>

              <h4 className="text-base font-bold text-[var(--text)] leading-relaxed">
                {currentQ.question}
              </h4>
            </div>

            {/* Reveal Answer Toggle */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--surface-muted)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)]/40 transition-colors shadow-sm"
              >
                {isAnswerRevealed ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Answer</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Reveal Model Answer</span>
                  </>
                )}
              </button>
            </div>

            {/* Revealed Answer Box */}
            {isAnswerRevealed && (
              <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4 text-xs text-[var(--text)] leading-relaxed whitespace-pre-wrap animate-in fade-in duration-150">
                <strong className="block text-[11px] font-bold uppercase tracking-wider text-[var(--primary)] mb-1">
                  Model Solution & Key Talking Points:
                </strong>
                {currentQ.answer}
              </div>
            )}

            {/* Confidence Rating & Next Button */}
            <div className="pt-3 border-t border-[var(--surface-muted)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Rate your response:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating =
                      userRatings[currentQ.id] !== undefined
                        ? userRatings[currentQ.id]
                        : currentQ.confidence || 3;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRate(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= currentRating
                              ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]"
                              : "text-[var(--surface-muted)]"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all"
              >
                <span>{currentIndex + 1 === mockSet.length ? "Finish Round" : "Next Question"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-[var(--text-muted)] py-8">
            No questions available for this track yet.
          </p>
        )}
      </div>
    </div>
  );
}
