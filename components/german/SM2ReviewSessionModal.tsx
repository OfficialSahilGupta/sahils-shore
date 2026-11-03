"use client";

// ============================================================================
// Sahil's Shore: SM-2 Spaced Repetition Review Session Modal
// Interactive flashcard review with audio, interval previews & keyboard shortcuts
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Volume2,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import type { VocabCard } from "@/types";
import {
  getSM2IntervalPreviews,
  type SM2Grade,
  type SM2IntervalPreviews,
} from "@/lib/german/sm2";
import { playGermanSpeech } from "@/lib/german/speech";

interface SM2ReviewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: VocabCard[];
  onReviewCard: (card: VocabCard, grade: SM2Grade) => Promise<void>;
}

export function SM2ReviewSessionModal({
  isOpen,
  onClose,
  cards,
  onReviewCard,
}: SM2ReviewSessionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  // Reset session when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsAnswerRevealed(false);
      setCompletedCount(0);
    }
  }, [isOpen, cards]);

  // Automatically play audio when card is shown (optional/smooth)
  useEffect(() => {
    if (isOpen && currentCard && !isAnswerRevealed) {
      // Don't auto-blast audio if user doesn't want, but allow instant click
    }
  }, [currentIndex, isOpen, currentCard, isAnswerRevealed]);

  // Compute interval previews for current card
  let previews: SM2IntervalPreviews | null = null;
  if (currentCard) {
    previews = getSM2IntervalPreviews({
      repetition: currentCard.repetition,
      interval: currentCard.interval,
      ease_factor: Number(currentCard.ease_factor),
      last_reviewed_at: currentCard.last_reviewed_at,
    });
  }

  // Keyboard shortcut listener: Space to reveal, 1-4 for ratings
  useEffect(() => {
    if (!isOpen || isFinished || isSubmitting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (!isAnswerRevealed) {
          setIsAnswerRevealed(true);
        }
      } else if (isAnswerRevealed) {
        if (e.key === "1") handleSelectGrade("again");
        if (e.key === "2") handleSelectGrade("hard");
        if (e.key === "3") handleSelectGrade("good");
        if (e.key === "4") handleSelectGrade("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isFinished, isAnswerRevealed, isSubmitting, currentIndex]);

  const handlePlayAudio = async () => {
    if (!currentCard || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      await playGermanSpeech(currentCard.german_text, { rate: 0.9 });
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleSelectGrade = async (grade: SM2Grade) => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onReviewCard(currentCard, grade);
      setCompletedCount((prev) => prev + 1);
      setIsAnswerRevealed(false);
      setCurrentIndex((prev) => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const progressPercent =
    cards.length > 0 ? Math.round((currentIndex / cards.length) * 100) : 0;

  const getGenderBadge = (gender: string | null) => {
    if (gender === "der") {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/15 text-blue-500 border border-blue-500/30">
          der (maskulin)
        </span>
      );
    }
    if (gender === "die") {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30">
          die (feminin)
        </span>
      );
    }
    if (gender === "das") {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          das (neutral)
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface border border-surface-muted rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text">SM-2 Spaced Repetition Session</span>
          </div>

          <div className="flex items-center gap-3">
            {!isFinished && (
              <span className="text-xs text-text-muted font-medium">
                {currentIndex + 1} / {cards.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Progress Bar */}
        {!isFinished && (
          <div className="w-full h-1.5 bg-surface-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col justify-center">
          {isFinished ? (
            /* Session Completed Screen */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-text">Ausgezeichnet!</h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                You reviewed all {completedCount} cards scheduled for today. Your spaced repetition intervals have been updated.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 shadow-md transition-all"
                >
                  Return to Hub
                </button>
              </div>
            </div>
          ) : (
            /* Active Card Flashcard Area */
            <div className="space-y-6">
              {/* Card Front */}
              <div className="p-6 sm:p-8 rounded-2xl bg-surface-muted/40 border border-surface-muted text-center relative group min-h-[160px] flex flex-col justify-center items-center">
                <div className="flex items-center gap-2 mb-3">
                  {getGenderBadge(currentCard.gender)}
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-surface border border-surface-muted text-text-muted">
                    {currentCard.cefr_level}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-3xl sm:text-4xl font-bold text-text tracking-tight">
                    {currentCard.german_text}
                  </h2>
                  <button
                    onClick={handlePlayAudio}
                    disabled={isPlayingAudio}
                    className={`p-2.5 rounded-full transition-all shadow-sm ${
                      isPlayingAudio
                        ? "bg-primary text-white scale-110"
                        : "bg-surface hover:bg-primary/10 text-primary border border-surface-muted"
                    }`}
                    title="Pronounce word (de-DE)"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {currentCard.plural && currentCard.plural !== "-" && (
                  <p className="text-xs text-text-muted mt-2 italic">
                    Plural: {currentCard.plural}
                  </p>
                )}
              </div>

              {/* Reveal Answer Button or Answer Back */}
              {!isAnswerRevealed ? (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setIsAnswerRevealed(true)}
                    className="w-full py-3.5 rounded-xl bg-primary hover:opacity-90 text-white font-semibold shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <span>Show Answer</span>
                    <span className="text-xs opacity-75 font-mono">(Space)</span>
                  </button>
                </div>
              ) : (
                /* Card Back (Revealed) */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-surface border border-surface-muted space-y-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-text-muted font-bold">
                        Meaning
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {currentCard.english_meaning}
                      </div>
                    </div>

                    {currentCard.example_sentence && (
                      <div className="pt-2 border-t border-surface-muted">
                        <div className="text-xs uppercase tracking-wider text-text-muted font-bold mb-1">
                          Example Sentence
                        </div>
                        <div className="text-sm font-medium text-text">
                          {currentCard.example_sentence}
                        </div>
                      </div>
                    )}

                    {currentCard.tags && currentCard.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {currentCard.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-surface-muted text-text-muted font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4 SM-2 Grade Response Buttons with Live Interval Previews */}
                  {previews && (
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {/* Again */}
                      <button
                        onClick={() => handleSelectGrade("again")}
                        disabled={isSubmitting}
                        className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex flex-col items-center justify-center transition-all disabled:opacity-50"
                      >
                        <span className="text-xs font-bold uppercase">Again</span>
                        <span className="text-xs font-mono font-bold mt-1">
                          {previews.again.label}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono mt-0.5">
                          (1)
                        </span>
                      </button>

                      {/* Hard */}
                      <button
                        onClick={() => handleSelectGrade("hard")}
                        disabled={isSubmitting}
                        className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex flex-col items-center justify-center transition-all disabled:opacity-50"
                      >
                        <span className="text-xs font-bold uppercase">Hard</span>
                        <span className="text-xs font-mono font-bold mt-1">
                          {previews.hard.label}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono mt-0.5">
                          (2)
                        </span>
                      </button>

                      {/* Good */}
                      <button
                        onClick={() => handleSelectGrade("good")}
                        disabled={isSubmitting}
                        className="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex flex-col items-center justify-center transition-all disabled:opacity-50"
                      >
                        <span className="text-xs font-bold uppercase">Good</span>
                        <span className="text-xs font-mono font-bold mt-1">
                          {previews.good.label}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono mt-0.5">
                          (3)
                        </span>
                      </button>

                      {/* Easy */}
                      <button
                        onClick={() => handleSelectGrade("easy")}
                        disabled={isSubmitting}
                        className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex flex-col items-center justify-center transition-all disabled:opacity-50"
                      >
                        <span className="text-xs font-bold uppercase">Easy</span>
                        <span className="text-xs font-mono font-bold mt-1">
                          {previews.easy.label}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono mt-0.5">
                          (4)
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
