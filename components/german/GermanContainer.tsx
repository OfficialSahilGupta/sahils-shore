"use client";

// ============================================================================
// Sahil's Shore: German Container (Main Interactive Hub)
// Vocab, SM-2 Spaced Repetition, Pronunciation Lab, Shadowing, CEFR, Grammar
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  VocabCard,
  GrammarNote,
  PronunciationRecording,
  GermanProgress,
  GermanListeningLog,
  GermanWritingEntry,
} from "@/types";
import {
  getVocabCards,
  createVocabCard,
  updateVocabCard,
  deleteVocabCard,
  reviewVocabCard,
  getDueVocabCards,
  getReviewHeatmapData,
  getGrammarNotes,
  createGrammarNote,
  getCefrProgress,
  toggleCefrCompetency,
  getPronunciationRecordings,
  savePronunciationRecording,
  getListeningLogs,
  createListeningLog,
  getWritingEntries,
  createWritingEntry,
  logGermanStudySession,
  getDailyGerman,
  type CreateVocabCardInput,
  type CreateGrammarNoteInput,
  type SavePronunciationInput,
  type CreateListeningLogInput,
  type CreateWritingEntryInput,
} from "@/lib/german";
import { type SM2Grade } from "@/lib/german/sm2";
import { CEFR_COMPETENCIES, type CefrLevel, type DailyGermanEntry } from "@/lib/german/constants";
import { GermanHubHeader, type GermanTab } from "./GermanHubHeader";
import { DailyWordAndSentence } from "./DailyWordAndSentence";
import { ReviewHeatmap } from "./ReviewHeatmap";
import { VocabCardManager } from "./VocabCardManager";
import { SM2ReviewSessionModal } from "./SM2ReviewSessionModal";
import { PronunciationLab } from "./PronunciationLab";
import { CefrProgressTracker } from "./CefrProgressTracker";
import { GrammarNotesHub } from "./GrammarNotesHub";
import { ListeningLogSection } from "./ListeningLogSection";
import { WritingPromptsSection } from "./WritingPromptsSection";

export function GermanContainer() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GermanTab>("vocab");
  const [practicePhrase, setPracticePhrase] = useState<string | undefined>(undefined);

  // Data states
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [grammarNotes, setGrammarNotes] = useState<GrammarNote[]>([]);
  const [cefrProgress, setCefrProgress] = useState<GermanProgress[]>([]);
  const [recordings, setRecordings] = useState<PronunciationRecording[]>([]);
  const [listeningLogs, setListeningLogs] = useState<GermanListeningLog[]>([]);
  const [writingEntries, setWritingEntries] = useState<GermanWritingEntry[]>([]);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize user and load data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const currentUserId = user?.id || "mock-user-id";
        setUserId(currentUserId);

        const [
          fetchedCards,
          fetchedGrammar,
          fetchedCefr,
          fetchedRecordings,
          fetchedListening,
          fetchedWriting,
        ] = await Promise.all([
          getVocabCards(supabase, currentUserId),
          getGrammarNotes(supabase, currentUserId),
          getCefrProgress(supabase, currentUserId),
          getPronunciationRecordings(supabase, currentUserId),
          getListeningLogs(supabase, currentUserId),
          getWritingEntries(supabase, currentUserId),
        ]);

        setCards(fetchedCards);
        setGrammarNotes(fetchedGrammar);
        setCefrProgress(fetchedCefr);
        setRecordings(fetchedRecordings);
        setListeningLogs(fetchedListening);
        setWritingEntries(fetchedWriting);
      } catch (err) {
        console.error("[GermanContainer] Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Daily German word & sentence
  const dailyGerman = useMemo(() => getDailyGerman(), []);

  // Due vocab cards & review heatmap
  const dueCards = useMemo(() => getDueVocabCards(cards, 15), [cards]);
  const heatmapData = useMemo(() => getReviewHeatmapData(cards, 60), [cards]);

  // Mastered CEFR competencies count
  const cefrMasteredCount = useMemo(
    () => cefrProgress.filter((p) => p.is_completed).length,
    [cefrProgress]
  );

  // 2. Vocab Handlers
  const handleCreateCard = async (input: CreateVocabCardInput) => {
    if (!userId) return;
    const newCard = await createVocabCard(supabase, userId, input);
    if (newCard) {
      setCards((prev) => [newCard, ...prev]);
      showToast(`Added card: "${newCard.german_text}"`);
    }
  };

  const handleUpdateCard = async (
    id: string,
    input: Partial<CreateVocabCardInput>
  ) => {
    if (!userId) return;
    const updated = await updateVocabCard(supabase, userId, id, input);
    if (updated) {
      setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast("Card updated successfully");
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!userId) return;
    const ok = await deleteVocabCard(supabase, userId, id);
    if (ok) {
      setCards((prev) => prev.filter((c) => c.id !== id));
      showToast("Card deleted");
    }
  };

  const handleReviewCard = async (card: VocabCard, grade: SM2Grade) => {
    if (!userId) return;
    const updated = await reviewVocabCard(supabase, userId, card, grade);
    if (updated) {
      setCards((prev) => prev.map((c) => (c.id === card.id ? updated : c)));
    }
  };

  const handleAddDailyWordToCards = async (daily: DailyGermanEntry) => {
    if (!userId) return;
    const input: CreateVocabCardInput = {
      german_text: daily.word,
      gender: daily.gender,
      plural: daily.plural,
      english_meaning: daily.meaning,
      example_sentence: daily.exampleGerman,
      cefr_level: daily.cefr_level,
      tags: ["daily-word", "vocabulary"],
    };
    const newCard = await createVocabCard(supabase, userId, input);
    if (newCard) {
      setCards((prev) => [newCard, ...prev]);
      showToast(`Added "${daily.word}" to flashcards!`);
    }
  };

  // 3. Pronunciation Handlers & Drive Sync
  const handleSaveRecording = async (
    input: SavePronunciationInput,
    audioBlob: Blob
  ) => {
    if (!userId) return;

    let driveFileId: string | null = null;

    // Initiate Google Drive direct upload session to Shore/Voice-Recordings/
    try {
      const ext = audioBlob.type.includes("mp4")
        ? "mp4"
        : audioBlob.type.includes("wav")
        ? "wav"
        : "webm";
      const fileName = `voice_${Date.now()}_${input.phrase.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;

      const sessionRes = await fetch("/api/drive/upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          mimeType: audioBlob.type || "audio/webm",
          size: audioBlob.size,
          folderType: "voice",
        }),
      });

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.uploadUrl) {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", sessionData.uploadUrl, true);
          xhr.setRequestHeader("Content-Type", audioBlob.type || "audio/webm");
          xhr.send(audioBlob);
        }
        driveFileId = sessionData.fileId || null;
      }
    } catch (driveErr) {
      console.warn("[GermanContainer] Google Drive upload session warning:", driveErr);
    }

    const saved = await savePronunciationRecording(supabase, userId, {
      ...input,
      drive_file_id: driveFileId,
    });

    if (saved) {
      setRecordings((prev) => [saved, ...prev]);
      showToast(`Saved pronunciation attempt for "${input.phrase}"`);
    }
  };

  const handleSaveShadowingAttempts = async (
    phrase: string,
    attempts: any[]
  ) => {
    if (!userId || attempts.length === 0) return;

    for (const attempt of attempts) {
      await handleSaveRecording(
        {
          phrase,
          audio_url: attempt.audioResult.url,
          score: attempt.score,
          hard_sounds: attempt.hardSounds,
          mode: "shadowing",
          attempt_number: attempt.attemptNumber,
        },
        attempt.audioResult.blob
      );
    }
    showToast(`Saved ${attempts.length} shadowing attempts to Drive!`);
  };

  // 4. CEFR Competency Handler
  const handleToggleCompetency = async (
    level: CefrLevel,
    competencyId: string,
    isCompleted: boolean
  ) => {
    if (!userId) return;
    const updated = await toggleCefrCompetency(
      supabase,
      userId,
      level,
      competencyId,
      isCompleted
    );
    if (updated) {
      setCefrProgress((prev) => {
        const filtered = prev.filter(
          (p) => !(p.level === level && p.competency_id === competencyId)
        );
        return [...filtered, updated];
      });
      showToast(
        isCompleted
          ? `Competency marked mastered!`
          : `Competency unmarked`
      );
    }
  };

  // 5. Grammar Note Handler
  const handleCreateGrammarNote = async (input: CreateGrammarNoteInput) => {
    if (!userId) return;
    const note = await createGrammarNote(supabase, userId, input);
    if (note) {
      setGrammarNotes((prev) => [note, ...prev]);
      showToast(`Created grammar note: "${note.title}"`);
    }
  };

  // 6. Listening & Writing Handlers
  const handleCreateListeningLog = async (
    input: CreateListeningLogInput,
    syncStudyTime: boolean
  ) => {
    if (!userId) return;
    const log = await createListeningLog(supabase, userId, input, syncStudyTime);
    if (log) {
      setListeningLogs((prev) => [log, ...prev]);
      showToast(`Logged listening session (${log.duration_minutes}m)`);
    }
  };

  const handleCreateWritingEntry = async (input: CreateWritingEntryInput) => {
    if (!userId) return;
    const entry = await createWritingEntry(supabase, userId, input);
    if (entry) {
      setWritingEntries((prev) => [entry, ...prev]);
      showToast(`Saved writing entry: "${entry.prompt_title}"`);
    }
  };

  // 7. Study Session Stopwatch Time Logger
  const handleLogStudyTime = async (minutes: number) => {
    if (!userId) return;
    await logGermanStudySession(
      supabase,
      userId,
      minutes,
      "German hub study session"
    );
    showToast(`Logged ${minutes}m of German study to Daily Tracker!`);
  };

  const handlePracticeSentenceInLab = (sentence: string) => {
    setPracticePhrase(sentence);
    setActiveTab("pronunciation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-surface border border-primary/40 text-text shadow-lg flex items-center gap-2 text-sm animate-in slide-in-from-bottom duration-200">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Stopwatch & Tabs */}
      <GermanHubHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dueCardsCount={dueCards.length}
        totalCardsCount={cards.length}
        cefrMasteredCount={cefrMasteredCount}
        totalCompetenciesCount={CEFR_COMPETENCIES.length}
        pronunciationCount={recordings.length}
        onLogStudyTime={handleLogStudyTime}
      />

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="p-12 text-center text-text-muted space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Loading your German learning sanctuary...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Vocab & SM-2 */}
          {activeTab === "vocab" && (
            <div className="space-y-6">
              {/* Daily Word & Sentence Banner */}
              <DailyWordAndSentence
                daily={dailyGerman}
                existingCards={cards}
                onAddWordToCards={handleAddDailyWordToCards}
                onPracticeSentence={handlePracticeSentenceInLab}
              />

              {/* Review Heatmap */}
              <ReviewHeatmap heatmapData={heatmapData} />

              {/* Vocab Cards Grid & Filter Bar */}
              <VocabCardManager
                cards={cards}
                dueCards={dueCards}
                onStartReview={() => setIsReviewOpen(true)}
                onCreateCard={handleCreateCard}
                onUpdateCard={handleUpdateCard}
                onDeleteCard={handleDeleteCard}
                onOpenPronunciation={handlePracticeSentenceInLab}
              />
            </div>
          )}

          {/* TAB 2: Pronunciation Lab */}
          {activeTab === "pronunciation" && (
            <PronunciationLab
              recordings={recordings}
              initialPhrase={practicePhrase}
              onSaveRecording={handleSaveRecording}
              onSaveShadowingAttempts={handleSaveShadowingAttempts}
            />
          )}

          {/* TAB 3: CEFR Progress */}
          {activeTab === "cefr" && (
            <CefrProgressTracker
              progressList={cefrProgress}
              onToggleCompetency={handleToggleCompetency}
            />
          )}

          {/* TAB 4: Grammar Notes */}
          {activeTab === "grammar" && (
            <GrammarNotesHub
              notes={grammarNotes}
              onCreateNote={handleCreateGrammarNote}
            />
          )}

          {/* TAB 5: Listening & Writing Practice */}
          {activeTab === "practice" && (
            <div className="space-y-8">
              <ListeningLogSection
                logs={listeningLogs}
                onCreateLog={handleCreateListeningLog}
              />
              <WritingPromptsSection
                entries={writingEntries}
                onCreateEntry={handleCreateWritingEntry}
              />
            </div>
          )}
        </>
      )}

      {/* SM-2 Review Session Modal */}
      <SM2ReviewSessionModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        cards={dueCards.length > 0 ? dueCards : cards.slice(0, 10)}
        onReviewCard={handleReviewCard}
      />
    </div>
  );
}
