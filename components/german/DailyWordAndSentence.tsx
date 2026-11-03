"use client";

// ============================================================================
// Sahil's Shore: German Daily Word & Sentence of the Day
// Deterministic daily rotation with de-DE audio and 1-click card creation
// ============================================================================

import React, { useState } from "react";
import { Volume2, Plus, Mic, Sparkles, Check, Bookmark } from "lucide-react";
import { type DailyGermanEntry } from "@/lib/german/constants";
import { playGermanSpeech } from "@/lib/german/speech";
import type { VocabCard } from "@/types";

interface DailyWordAndSentenceProps {
  daily: DailyGermanEntry;
  existingCards: VocabCard[];
  onAddWordToCards: (daily: DailyGermanEntry) => Promise<void>;
  onPracticeSentence: (sentence: string) => void;
}

export function DailyWordAndSentence({
  daily,
  existingCards,
  onAddWordToCards,
  onPracticeSentence,
}: DailyWordAndSentenceProps) {
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Check if this word is already saved in cards
  const isAlreadySaved = existingCards.some(
    (c) => c.german_text.toLowerCase().trim() === daily.word.toLowerCase().trim()
  );

  const handlePlayWord = async () => {
    setIsPlayingWord(true);
    try {
      await playGermanSpeech(daily.word, { rate: 0.9 });
    } finally {
      setIsPlayingWord(false);
    }
  };

  const handlePlaySentence = async () => {
    setIsPlayingSentence(true);
    try {
      await playGermanSpeech(daily.sentenceGerman, { rate: 0.9 });
    } finally {
      setIsPlayingSentence(false);
    }
  };

  const handleAddCard = async () => {
    if (isAlreadySaved || isAdding) return;
    setIsAdding(true);
    try {
      await onAddWordToCards(daily);
    } finally {
      setIsAdding(false);
    }
  };

  const getGenderBadge = (gender: string | null) => {
    if (gender === "der") {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-500/15 text-blue-500 border border-blue-500/30">
          der (m)
        </span>
      );
    }
    if (gender === "die") {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/30">
          die (f)
        </span>
      );
    }
    if (gender === "das") {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          das (n)
        </span>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Daily Word Card */}
      <div className="p-5 rounded-2xl bg-surface border border-surface-muted shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none font-serif text-7xl text-primary font-bold">
          Wort
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Word of the Day
              </span>
              <span className="text-xs text-text-muted font-medium">
                Level {daily.cefr_level}
              </span>
            </div>

            <button
              onClick={handlePlayWord}
              disabled={isPlayingWord}
              className={`p-2 rounded-xl transition-all ${
                isPlayingWord
                  ? "bg-primary text-white scale-105"
                  : "bg-surface-muted hover:bg-primary/10 text-primary"
              }`}
              title="Listen to native de-DE pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-baseline gap-2.5 flex-wrap">
            {getGenderBadge(daily.gender)}
            <h3 className="text-2xl font-bold tracking-tight text-text">
              {daily.word}
            </h3>
            {daily.plural && daily.plural !== "-" && (
              <span className="text-xs text-text-muted italic">
                (Plural: {daily.plural})
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-primary mt-1">
            {daily.meaning}
          </p>

          <div className="mt-4 p-3 rounded-xl bg-surface-muted/50 border border-surface-muted text-xs space-y-1">
            <div className="text-text font-medium">{daily.exampleGerman}</div>
            <div className="text-text-muted italic">{daily.exampleEnglish}</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-surface-muted flex items-center justify-between">
          <span className="text-[11px] text-text-muted">
            {daily.grammarNote}
          </span>

          <button
            onClick={handleAddCard}
            disabled={isAlreadySaved || isAdding}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all ${
              isAlreadySaved
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default"
                : "bg-primary hover:opacity-90 text-white shadow-sm"
            }`}
          >
            {isAlreadySaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>In Flashcards</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{isAdding ? "Adding..." : "Add to Cards"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. German Sentence of the Day */}
      <div className="p-5 rounded-2xl bg-surface border border-surface-muted shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none font-serif text-7xl text-primary font-bold">
          Satz
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/20 flex items-center gap-1">
                <Bookmark className="w-3 h-3" />
                Sentence of the Day
              </span>
            </div>

            <button
              onClick={handlePlaySentence}
              disabled={isPlayingSentence}
              className={`p-2 rounded-xl transition-all ${
                isPlayingSentence
                  ? "bg-primary text-white scale-105"
                  : "bg-surface-muted hover:bg-primary/10 text-primary"
              }`}
              title="Listen to full German sentence"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <blockquote className="text-base sm:text-lg font-serif italic text-text leading-snug">
            &ldquo;{daily.sentenceGerman}&rdquo;
          </blockquote>

          <p className="text-xs sm:text-sm text-text-muted mt-2">
            {daily.sentenceEnglish}
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-surface-muted flex items-center justify-end gap-2">
          <button
            onClick={() => onPracticeSentence(daily.sentenceGerman)}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-surface-muted hover:bg-primary/10 text-primary border border-surface-muted flex items-center gap-1.5 transition-all"
            title="Open sentence in Pronunciation Lab"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Practice Pronunciation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
