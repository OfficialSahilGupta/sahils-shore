// ============================================================================
// Sahil's Shore: German Learning Hub Data Layer & Domain Operations
// Vocab Cards, SM-2 Reviews, CEFR Progress, Pronunciation & Shadowing,
// Listening Logs, Writing Prompts, and Daily Tracker Study Sync
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import type {
  VocabCard,
  GrammarNote,
  PronunciationRecording,
  GermanProgress,
  GermanListeningLog,
  GermanWritingEntry,
  ActivityLog,
} from "../../types/index.ts";
import {
  calculateSM2,
  isCardDueForReview,
  type SM2Grade,
  type SM2Card,
} from "./sm2.ts";
import {
  CEFR_LEVELS,
  CEFR_COMPETENCIES,
  CURATED_VOCAB_CARDS,
  CURATED_GRAMMAR_NOTES,
  DAILY_GERMAN_BANK,
  TRICKY_SOUNDS,
  type CefrLevel,
  type DailyGermanEntry,
  type TrickySound,
} from "./constants.ts";
import { todayIST, diffDaysIST, getISTDateString } from "../date-utils.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { getActivities, logActivityTime } from "../tracker/index.ts";

export interface CreateVocabCardInput {
  german_text: string;
  english_meaning: string;
  part_of_speech?: string | null;
  gender?: "der" | "die" | "das" | null;
  plural?: string | null;
  example_sentence?: string | null;
  cefr_level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  tags?: string[];
}

export interface CreateGrammarNoteInput {
  title: string;
  cefr_level?: string;
  topic?: string;
  tags?: string[];
  content: string;
  rules?: Array<{ rule: string; example: string }>;
}

export interface SavePronunciationInput {
  phrase: string;
  audio_url: string;
  reference_audio_url?: string | null;
  drive_file_id?: string | null;
  hard_sounds?: string[];
  speech_rate?: number;
  mode?: "standard" | "shadowing";
  attempt_number?: number;
  score?: number | null;
  feedback?: string | null;
}

export interface CreateListeningLogInput {
  title: string;
  media_type?: string;
  duration_minutes: number;
  cefr_level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  notes?: string | null;
  vocabulary_learned?: string[];
}

export interface CreateWritingEntryInput {
  prompt_id?: string | null;
  prompt_title: string;
  cefr_level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  content: string;
  word_count: number;
}

export interface TrickyWordReport {
  phrase: string;
  attemptsCount: number;
  averageScore: number;
  lowestScore: number;
  hardSounds: string[];
  lastPracticedAt: string;
}

export interface PronunciationImprovementStats {
  totalRecordings: number;
  averageScore: number;
  shadowingCount: number;
  trickyWordsCount: number;
  trend: Array<{ date: string; score: number; phrase: string }>;
  soundFrequency: Record<string, number>;
}

// ============================================================================
// 1. VOCABULARY CARDS & SM-2 ENGINE
// ============================================================================

export async function getVocabCards(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<VocabCard[]> {
  const { data, error } = await supabase
    .from("vocab_cards")
    .select("*")
    .eq("user_id", userId)
    .order("next_review_at", { ascending: true });

  if (error) {
    console.error("[getVocabCards] Error fetching cards:", error);
    return [];
  }

  // Auto-seed starter curated vocabulary on first visit
  if (!data || data.length === 0) {
    console.log("[getVocabCards] Seeding default curated German vocab cards...");
    const seeds = CURATED_VOCAB_CARDS.map((c) => ({
      user_id: userId,
      german_text: c.german_text,
      english_meaning: c.english_meaning,
      gender: c.gender,
      plural: c.plural,
      example_sentence: c.example_sentence,
      cefr_level: c.cefr_level,
      tags: c.tags,
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      next_review_at: new Date().toISOString(),
    }));

    const { data: seeded, error: seedError } = await supabase
      .from("vocab_cards")
      .insert(seeds)
      .select();

    if (seedError) {
      console.error("[getVocabCards] Failed to seed cards:", seedError);
      return [];
    }
    return (seeded || []) as VocabCard[];
  }

  return data as VocabCard[];
}

export async function createVocabCard(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateVocabCardInput
): Promise<VocabCard | null> {
  const { data, error } = await supabase
    .from("vocab_cards")
    .insert({
      user_id: userId,
      german_text: input.german_text.trim(),
      english_meaning: input.english_meaning.trim(),
      part_of_speech: input.part_of_speech || null,
      gender: input.gender || null,
      plural: input.plural || null,
      example_sentence: input.example_sentence || null,
      cefr_level: input.cefr_level || "A1",
      tags: input.tags || [],
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      next_review_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createVocabCard] Error creating card:", error);
    return null;
  }

  // Write timeline event
  await writeTimelineEvent(supabase, {
    userId,
    type: "vocab_reviewed",
    occurredAt: new Date().toISOString(),
    summary: `Added German vocab card: "${data.german_text}" (${data.cefr_level})`,
    refTable: "vocab_cards",
    refId: data.id,
    meta: {
      german_text: data.german_text,
      gender: data.gender,
      cefr_level: data.cefr_level,
    },
  });

  return data as VocabCard;
}

export async function updateVocabCard(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  input: Partial<CreateVocabCardInput>
): Promise<VocabCard | null> {
  const { data, error } = await supabase
    .from("vocab_cards")
    .update({
      ...(input.german_text !== undefined ? { german_text: input.german_text } : {}),
      ...(input.english_meaning !== undefined ? { english_meaning: input.english_meaning } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.plural !== undefined ? { plural: input.plural } : {}),
      ...(input.example_sentence !== undefined ? { example_sentence: input.example_sentence } : {}),
      ...(input.cefr_level !== undefined ? { cefr_level: input.cefr_level } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[updateVocabCard] Error updating card:", error);
    return null;
  }
  return data as VocabCard;
}

export async function deleteVocabCard(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("vocab_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

/**
 * Reviews a vocab card with SM-2, records next interval, updates DB, and writes timeline event
 */
export async function reviewVocabCard(
  supabase: SupabaseClient<Database>,
  userId: string,
  card: VocabCard,
  grade: SM2Grade
): Promise<VocabCard | null> {
  const now = new Date();
  const sm2Result = calculateSM2(
    {
      repetition: card.repetition,
      interval: card.interval,
      ease_factor: Number(card.ease_factor),
      last_reviewed_at: card.last_reviewed_at,
    },
    grade,
    now
  );

  const { data, error } = await supabase
    .from("vocab_cards")
    .update({
      repetition: sm2Result.repetition,
      interval: sm2Result.interval,
      ease_factor: sm2Result.ease_factor,
      next_review_at: sm2Result.next_review_at,
      last_reviewed_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", card.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[reviewVocabCard] Error updating card with SM-2:", error);
    return null;
  }

  // Write timeline event
  await writeTimelineEvent(supabase, {
    userId,
    type: "vocab_reviewed",
    occurredAt: now.toISOString(),
    summary: `Reviewed German card "${card.german_text}" (${grade.toUpperCase()}) -> Next in ${sm2Result.interval}d`,
    refTable: "vocab_cards",
    refId: card.id,
    meta: {
      card_id: card.id,
      grade,
      repetition: sm2Result.repetition,
      interval_days: sm2Result.interval,
      ease_factor: sm2Result.ease_factor,
    },
  });

  return data as VocabCard;
}

/**
 * Filters cards due for review today in IST, respecting the daily new-card limit
 */
export function getDueVocabCards(
  cards: VocabCard[],
  newCardLimit: number = 10
): VocabCard[] {
  const now = new Date().toISOString();
  const dueCards: VocabCard[] = [];
  let newCardCount = 0;

  for (const card of cards) {
    const isDue = isCardDueForReview(card, now);
    if (!isDue) continue;

    if (card.repetition === 0) {
      if (newCardCount < newCardLimit) {
        dueCards.push(card);
        newCardCount++;
      }
    } else {
      dueCards.push(card);
    }
  }

  return dueCards;
}

/**
 * Builds review heatmap aggregation from review history
 */
export function getReviewHeatmapData(
  cards: VocabCard[],
  days: number = 60
): Record<string, number> {
  const map: Record<string, number> = {};
  const today = todayIST();

  // Initialize dates
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const istDate = getISTDateString(d.toISOString());
    map[istDate] = 0;
  }

  for (const card of cards) {
    if (card.last_reviewed_at) {
      const dateKey = getISTDateString(card.last_reviewed_at);
      if (map[dateKey] !== undefined) {
        map[dateKey] += 1;
      }
    }
  }

  return map;
}

// ============================================================================
// 2. GRAMMAR NOTES
// ============================================================================

export async function getGrammarNotes(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<GrammarNote[]> {
  const { data, error } = await supabase
    .from("grammar_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getGrammarNotes] Error fetching notes:", error);
    return [];
  }

  // Auto-seed if empty
  if (!data || data.length === 0) {
    console.log("[getGrammarNotes] Seeding curated grammar notes...");
    const seeds = CURATED_GRAMMAR_NOTES.map((n) => ({
      user_id: userId,
      title: n.title,
      cefr_level: n.cefr_level,
      topic: n.topic,
      tags: n.tags,
      content: n.content,
      rules: n.rules,
    }));

    const { data: seeded, error: seedError } = await supabase
      .from("grammar_notes")
      .insert(seeds)
      .select();

    if (seedError) {
      console.error("[getGrammarNotes] Failed to seed grammar notes:", seedError);
      return [];
    }
    return (seeded || []) as GrammarNote[];
  }

  return data as GrammarNote[];
}

export async function createGrammarNote(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateGrammarNoteInput
): Promise<GrammarNote | null> {
  const { data, error } = await supabase
    .from("grammar_notes")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      cefr_level: input.cefr_level || "A1",
      topic: input.topic || "General",
      tags: input.tags || [],
      content: input.content.trim(),
      rules: input.rules || [],
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createGrammarNote] Error creating note:", error);
    return null;
  }

  await writeTimelineEvent(supabase, {
    userId,
    type: "german_study",
    occurredAt: new Date().toISOString(),
    summary: `Created German grammar note: "${data.title}" (${data.cefr_level})`,
    refTable: "grammar_notes",
    refId: data.id,
    meta: { title: data.title, cefr_level: data.cefr_level },
  });

  return data as GrammarNote;
}

// ============================================================================
// 3. CEFR PROGRESS (A1 - B2)
// ============================================================================

export async function getCefrProgress(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<GermanProgress[]> {
  const { data, error } = await supabase
    .from("german_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("[getCefrProgress] Error fetching progress:", error);
    return [];
  }
  return (data || []) as GermanProgress[];
}

export async function toggleCefrCompetency(
  supabase: SupabaseClient<Database>,
  userId: string,
  level: CefrLevel,
  competencyId: string,
  isCompleted: boolean,
  notes?: string
): Promise<GermanProgress | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("german_progress")
    .upsert(
      {
        user_id: userId,
        level,
        competency_id: competencyId,
        is_completed: isCompleted,
        completed_at: isCompleted ? now : null,
        notes: notes || null,
        updated_at: now,
      },
      { onConflict: "user_id, level, competency_id" }
    )
    .select()
    .single();

  if (error || !data) {
    console.error("[toggleCefrCompetency] Error upserting progress:", error);
    return null;
  }

  if (isCompleted) {
    const comp = CEFR_COMPETENCIES.find((c) => c.id === competencyId);
    const title = comp ? comp.title : competencyId;
    await writeTimelineEvent(supabase, {
      userId,
      type: "german_study",
      occurredAt: now,
      summary: `Mastered CEFR ${level} Competency: "${title}"`,
      refTable: "german_progress",
      refId: data.id,
      meta: { level, competency_id: competencyId, title },
    });
  }

  return data as GermanProgress;
}

export function calculateCefrLevelStats(
  progressList: GermanProgress[],
  level: CefrLevel
): { total: number; completed: number; percentage: number } {
  const levelComps = CEFR_COMPETENCIES.filter((c) => c.level === level);
  const total = levelComps.length;
  if (total === 0) return { total: 0, completed: 0, percentage: 0 };

  const completedMap = new Set(
    progressList.filter((p) => p.level === level && p.is_completed).map((p) => p.competency_id)
  );

  const completed = levelComps.filter((c) => completedMap.has(c.id)).length;
  const percentage = Math.round((completed / total) * 100);

  return { total, completed, percentage };
}

// ============================================================================
// 4. PRONUNCIATION LAB & SHADOWING
// ============================================================================

export async function getPronunciationRecordings(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PronunciationRecording[]> {
  const { data, error } = await supabase
    .from("pronunciation_recordings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPronunciationRecordings] Error fetching recordings:", error);
    return [];
  }
  return (data || []) as PronunciationRecording[];
}

export async function savePronunciationRecording(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: SavePronunciationInput
): Promise<PronunciationRecording | null> {
  const { data, error } = await supabase
    .from("pronunciation_recordings")
    .insert({
      user_id: userId,
      phrase: input.phrase.trim(),
      audio_url: input.audio_url,
      reference_audio_url: input.reference_audio_url || null,
      drive_file_id: input.drive_file_id || null,
      hard_sounds: input.hard_sounds || [],
      speech_rate: input.speech_rate || 1.0,
      mode: input.mode || "standard",
      attempt_number: input.attempt_number || 1,
      score: input.score !== undefined ? input.score : null,
      feedback: input.feedback || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[savePronunciationRecording] Error saving recording:", error);
    return null;
  }

  // Write timeline event
  const ratingText = data.score ? ` (Rating: ${data.score}/5)` : "";
  const modeText = data.mode === "shadowing" ? " [Shadowing]" : "";
  await writeTimelineEvent(supabase, {
    userId,
    type: "pronunciation_practiced",
    occurredAt: new Date().toISOString(),
    summary: `Practiced pronunciation${modeText}: "${data.phrase}"${ratingText}`,
    refTable: "pronunciation_recordings",
    refId: data.id,
    meta: {
      phrase: data.phrase,
      score: data.score,
      hard_sounds: data.hard_sounds,
      mode: data.mode,
      drive_file_id: data.drive_file_id,
    },
  });

  return data as PronunciationRecording;
}

export function getTrickyWords(
  recordings: PronunciationRecording[]
): TrickyWordReport[] {
  const map = new Map<string, PronunciationRecording[]>();

  for (const r of recordings) {
    const key = r.phrase.trim().toLowerCase();
    const existing = map.get(key) || [];
    existing.push(r);
    map.set(key, existing);
  }

  const reports: TrickyWordReport[] = [];

  map.forEach((group) => {
    const scores = group
      .map((g: PronunciationRecording) => g.score)
      .filter((s: number | null): s is number => s !== null);
    const avgScore =
      scores.length > 0
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
        : 3;
    const lowest = scores.length > 0 ? Math.min(...scores) : 3;

    // Collect hard sounds across attempts
    const hardSoundSet = new Set<string>();
    for (const item of group) {
      for (const sound of item.hard_sounds || []) {
        hardSoundSet.add(sound);
      }
    }

    reports.push({
      phrase: group[0].phrase,
      attemptsCount: group.length,
      averageScore: Math.round(avgScore * 10) / 10,
      lowestScore: lowest,
      hardSounds: Array.from(hardSoundSet),
      lastPracticedAt: group[0].created_at,
    });
  });

  // Sort by lowest average score first (most tricky), then by attempt count
  return reports.sort((a, b) => {
    if (a.averageScore !== b.averageScore) return a.averageScore - b.averageScore;
    return b.attemptsCount - a.attemptsCount;
  });
}

export function getImprovementStats(
  recordings: PronunciationRecording[]
): PronunciationImprovementStats {
  const total = recordings.length;
  if (total === 0) {
    return {
      totalRecordings: 0,
      averageScore: 0,
      shadowingCount: 0,
      trickyWordsCount: 0,
      trend: [],
      soundFrequency: {},
    };
  }

  const scored = recordings.filter((r) => r.score !== null);
  const avg =
    scored.length > 0
      ? scored.reduce((acc, r) => acc + (r.score || 0), 0) / scored.length
      : 0;

  const shadowing = recordings.filter((r) => r.mode === "shadowing").length;

  // Sound frequencies
  const soundFrequency: Record<string, number> = {};
  for (const r of recordings) {
    for (const s of r.hard_sounds || []) {
      soundFrequency[s] = (soundFrequency[s] || 0) + 1;
    }
  }

  // Trend chronologically
  const chronological = [...recordings]
    .filter((r) => r.score !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const trend = chronological.slice(-20).map((r) => ({
    date: getISTDateString(r.created_at),
    score: r.score || 0,
    phrase: r.phrase,
  }));

  const trickyCount = getTrickyWords(recordings).filter((w) => w.averageScore < 3.5).length;

  return {
    totalRecordings: total,
    averageScore: Math.round(avg * 10) / 10,
    shadowingCount: shadowing,
    trickyWordsCount: trickyCount,
    trend,
    soundFrequency,
  };
}

// ============================================================================
// 5. LISTENING LOGS & WRITING PROMPTS
// ============================================================================

export async function getListeningLogs(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<GermanListeningLog[]> {
  const { data, error } = await supabase
    .from("german_listening_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false });

  if (error) {
    console.error("[getListeningLogs] Error fetching logs:", error);
    return [];
  }
  return (data || []) as GermanListeningLog[];
}

export async function createListeningLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateListeningLogInput,
  syncStudyTime: boolean = true
): Promise<GermanListeningLog | null> {
  const { data, error } = await supabase
    .from("german_listening_logs")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      media_type: input.media_type || "Podcast",
      duration_minutes: input.duration_minutes,
      cefr_level: input.cefr_level || "A1",
      notes: input.notes || null,
      vocabulary_learned: input.vocabulary_learned || [],
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createListeningLog] Error inserting log:", error);
    return null;
  }

  // Write timeline event
  await writeTimelineEvent(supabase, {
    userId,
    type: "german_study",
    occurredAt: new Date().toISOString(),
    summary: `Logged German Listening: "${data.title}" (${data.duration_minutes}m)`,
    refTable: "german_listening_logs",
    refId: data.id,
    meta: {
      title: data.title,
      duration_minutes: data.duration_minutes,
      cefr_level: data.cefr_level,
    },
  });

  // Optionally flow time into Daily Tracker German activity
  if (syncStudyTime && input.duration_minutes > 0) {
    await logGermanStudySession(
      supabase,
      userId,
      input.duration_minutes,
      `Listening practice: ${data.title}`
    );
  }

  return data as GermanListeningLog;
}

export async function getWritingEntries(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<GermanWritingEntry[]> {
  const { data, error } = await supabase
    .from("german_writing_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getWritingEntries] Error fetching entries:", error);
    return [];
  }
  return (data || []) as GermanWritingEntry[];
}

export async function createWritingEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateWritingEntryInput
): Promise<GermanWritingEntry | null> {
  const { data, error } = await supabase
    .from("german_writing_entries")
    .insert({
      user_id: userId,
      prompt_id: input.prompt_id || null,
      prompt_title: input.prompt_title.trim(),
      cefr_level: input.cefr_level || "A1",
      content: input.content.trim(),
      word_count: input.word_count,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createWritingEntry] Error inserting writing entry:", error);
    return null;
  }

  await writeTimelineEvent(supabase, {
    userId,
    type: "german_study",
    occurredAt: new Date().toISOString(),
    summary: `Wrote German text for: "${data.prompt_title}" (${data.word_count} words)`,
    refTable: "german_writing_entries",
    refId: data.id,
    meta: {
      prompt_title: data.prompt_title,
      word_count: data.word_count,
      cefr_level: data.cefr_level,
    },
  });

  return data as GermanWritingEntry;
}

// ============================================================================
// 6. DAILY TRACKER STUDY TIME INTEGRATION
// ============================================================================

/**
 * Finds or creates the "German" activity in Daily Tracker and logs study session
 */
export async function logGermanStudySession(
  supabase: SupabaseClient<Database>,
  userId: string,
  durationMinutes: number,
  notes?: string
): Promise<ActivityLog | null> {
  try {
    const activities = await getActivities(supabase, userId);
    let germanActivity = activities.find(
      (a) => a.name.toLowerCase().trim() === "german"
    );

    if (!germanActivity) {
      // Create German activity if missing
      const { data: newAct } = await supabase
        .from("activities")
        .insert({
          user_id: userId,
          name: "German",
          icon: "Globe",
          color: "#E0A458",
          daily_target_minutes: 30,
          is_active: true,
        })
        .select()
        .single();
      germanActivity = newAct || undefined;
    }

    if (!germanActivity) {
      console.warn("[logGermanStudySession] Could not find or create German activity");
      return null;
    }

    const durationSeconds = Math.max(60, Math.round(durationMinutes * 60));

    return await logActivityTime(
      supabase,
      userId,
      {
        activity_id: germanActivity.id,
        duration_seconds: durationSeconds,
        notes: notes || "German study session",
      },
      "German"
    );
  } catch (err) {
    console.error("[logGermanStudySession] Exception logging time:", err);
    return null;
  }
}

// ============================================================================
// 7. DETERMINISTIC DAILY WORD & SENTENCE ENGINE
// ============================================================================

export function getDailyGerman(
  dateStrIST: string = todayIST()
): DailyGermanEntry {
  // Compute day of year from YYYY-MM-DD
  const [year, month, day] = dateStrIST.split("-").map(Number);
  const now = new Date(Date.UTC(year, month - 1, day));
  const start = new Date(Date.UTC(year, 0, 0));
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const index = Math.abs(dayOfYear) % DAILY_GERMAN_BANK.length;
  return DAILY_GERMAN_BANK[index];
}
