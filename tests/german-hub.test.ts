// ============================================================================
// Sahil's Shore: Phase 8 Unit Tests - German Hub & Pronunciation Lab
// Covers: Pure SM-2 algorithm scheduler, interval previews, CEFR competencies,
// tricky words ranking, improvement trend analytics, and deterministic daily engine
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSM2,
  getSM2IntervalPreviews,
  isCardDueForReview,
  formatIntervalLabel,
  MIN_EASE_FACTOR,
  DEFAULT_EASE_FACTOR,
  type SM2Card,
} from "../lib/german/sm2.ts";
import {
  calculateCefrLevelStats,
  getTrickyWords,
  getImprovementStats,
  getDailyGerman,
  getDueVocabCards,
  getReviewHeatmapData,
} from "../lib/german/index.ts";
import type {
  VocabCard,
  GermanProgress,
  PronunciationRecording,
} from "../types/index.ts";

describe("1. Pure SM-2 Spaced Repetition Algorithm", () => {
  const baseDate = new Date("2026-11-03T10:00:00Z");

  test("New card (rep 0) with 'again' resets repetition to 0 and schedules for 1 day", () => {
    const card: SM2Card = {
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
    };

    const res = calculateSM2(card, "again", baseDate);
    assert.equal(res.repetition, 0);
    assert.equal(res.interval, 1);
    assert.equal(res.ease_factor, 2.3); // 2.5 - 0.2
    const nextDate = new Date(res.next_review_at);
    assert.equal(nextDate.getUTCDate(), baseDate.getUTCDate() + 1);
  });

  test("New card (rep 0) with 'good' sets interval to 1 day and advances rep to 1", () => {
    const card: SM2Card = {
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
    };

    const res = calculateSM2(card, "good", baseDate);
    assert.equal(res.repetition, 1);
    assert.equal(res.interval, 1);
    assert.equal(res.ease_factor, 2.5); // delta for q=4 is 0.0
  });

  test("New card (rep 0) with 'easy' gives 3 days interval and increases ease factor", () => {
    const card: SM2Card = {
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
    };

    const res = calculateSM2(card, "easy", baseDate);
    assert.equal(res.repetition, 1);
    assert.equal(res.interval, 3);
    assert.equal(res.ease_factor, 2.6); // 2.5 + 0.1
  });

  test("Second review (rep 1) with 'good' sets interval to 6 days", () => {
    const card: SM2Card = {
      repetition: 1,
      interval: 1,
      ease_factor: 2.5,
    };

    const res = calculateSM2(card, "good", baseDate);
    assert.equal(res.repetition, 2);
    assert.equal(res.interval, 6);
  });

  test("Second review (rep 1) with 'hard' gives 3 days interval and decreases ease factor", () => {
    const card: SM2Card = {
      repetition: 1,
      interval: 1,
      ease_factor: 2.5,
    };

    const res = calculateSM2(card, "hard", baseDate);
    assert.equal(res.repetition, 2);
    assert.equal(res.interval, 3);
    assert.equal(res.ease_factor, 2.36); // 2.5 - 0.14
  });

  test("Third review (rep 2) scales interval by ease factor", () => {
    const card: SM2Card = {
      repetition: 2,
      interval: 6,
      ease_factor: 2.5,
    };

    const res = calculateSM2(card, "good", baseDate);
    assert.equal(res.repetition, 3);
    assert.equal(res.interval, 15); // Math.round(6 * 2.5) = 15
  });

  test("Ease factor never drops below minimum threshold of 1.3 even after multiple failures", () => {
    let card: SM2Card = {
      repetition: 3,
      interval: 20,
      ease_factor: 1.4,
    };

    // First failure
    let res = calculateSM2(card, "again", baseDate);
    assert.equal(res.ease_factor, 1.3);

    // Second failure
    card = { ...card, ease_factor: res.ease_factor };
    res = calculateSM2(card, "again", baseDate);
    assert.equal(res.ease_factor, MIN_EASE_FACTOR);
    assert.equal(res.repetition, 0);
    assert.equal(res.interval, 1);
  });

  test("getSM2IntervalPreviews returns previews for all 4 rating buttons", () => {
    const card: SM2Card = {
      repetition: 2,
      interval: 6,
      ease_factor: 2.5,
    };

    const previews = getSM2IntervalPreviews(card, baseDate);
    assert.equal(previews.again.interval, 1);
    assert.equal(previews.again.label, "<1d");
    assert.equal(previews.hard.interval, 7);
    assert.equal(previews.good.interval, 15);
    assert.equal(previews.easy.interval, 20);
  });

  test("isCardDueForReview correctly flags past vs future cards", () => {
    const pastCard = { next_review_at: "2026-11-01T00:00:00Z" };
    const futureCard = { next_review_at: "2026-11-10T00:00:00Z" };
    const nowISO = "2026-11-03T10:00:00Z";

    assert.equal(isCardDueForReview(pastCard, nowISO), true);
    assert.equal(isCardDueForReview(futureCard, nowISO), false);
  });
});

describe("2. CEFR Competency & Progress Calculations", () => {
  test("calculates completed, total, and percentage accurately for a level", () => {
    const mockProgress: GermanProgress[] = [
      {
        id: "p1",
        user_id: "user-1",
        level: "A1",
        competency_id: "a1-greetings",
        is_completed: true,
        completed_at: "2026-11-01T10:00:00Z",
        notes: null,
        created_at: "2026-11-01T10:00:00Z",
        updated_at: "2026-11-01T10:00:00Z",
      },
      {
        id: "p2",
        user_id: "user-1",
        level: "A1",
        competency_id: "a1-articles",
        is_completed: true,
        completed_at: "2026-11-02T10:00:00Z",
        notes: null,
        created_at: "2026-11-02T10:00:00Z",
        updated_at: "2026-11-02T10:00:00Z",
      },
      {
        id: "p3",
        user_id: "user-1",
        level: "A1",
        competency_id: "a1-numbers",
        is_completed: false, // uncompleted
        completed_at: null,
        notes: null,
        created_at: "2026-11-02T10:00:00Z",
        updated_at: "2026-11-02T10:00:00Z",
      },
    ];

    const stats = calculateCefrLevelStats(mockProgress, "A1");
    assert.equal(stats.completed, 2);
    assert.equal(stats.total, 5); // 5 competencies in A1
    assert.equal(stats.percentage, 40); // 2 / 5 * 100 = 40%
  });

  test("handles empty progress gracefully", () => {
    const stats = calculateCefrLevelStats([], "B1");
    assert.equal(stats.completed, 0);
    assert.equal(stats.total, 4); // 4 competencies in B1
    assert.equal(stats.percentage, 0);
  });
});

describe("3. Tricky Words Ranking & Pronunciation Analytics", () => {
  const mockRecordings: PronunciationRecording[] = [
    {
      id: "r1",
      user_id: "u1",
      phrase: "Ausgezeichnet",
      audio_url: "blob:http://localhost/1",
      reference_audio_url: null,
      drive_file_id: "drive-1",
      hard_sounds: ["ch"],
      speech_rate: 1.0,
      mode: "standard",
      attempt_number: 1,
      score: 2,
      feedback: "stumbled on ch",
      created_at: "2026-11-01T10:00:00Z",
      updated_at: "2026-11-01T10:00:00Z",
    },
    {
      id: "r2",
      user_id: "u1",
      phrase: "Ausgezeichnet",
      audio_url: "blob:http://localhost/2",
      reference_audio_url: null,
      drive_file_id: "drive-2",
      hard_sounds: ["ch", "z"],
      speech_rate: 1.0,
      mode: "standard",
      attempt_number: 2,
      score: 3,
      feedback: "better",
      created_at: "2026-11-02T10:00:00Z",
      updated_at: "2026-11-02T10:00:00Z",
    },
    {
      id: "r3",
      user_id: "u1",
      phrase: "Gemütlichkeit",
      audio_url: "blob:http://localhost/3",
      reference_audio_url: null,
      drive_file_id: "drive-3",
      hard_sounds: ["ü", "ch"],
      speech_rate: 1.0,
      mode: "shadowing",
      attempt_number: 1,
      score: 5,
      feedback: "clear",
      created_at: "2026-11-03T10:00:00Z",
      updated_at: "2026-11-03T10:00:00Z",
    },
  ];

  test("getTrickyWords aggregates attempts and ranks lowest average score first", () => {
    const tricky = getTrickyWords(mockRecordings);
    assert.equal(tricky.length, 2);

    // Ausgezeichnet had scores 2 and 3 -> avg 2.5
    // Gemütlichkeit had score 5 -> avg 5.0
    assert.equal(tricky[0].phrase, "Ausgezeichnet");
    assert.equal(tricky[0].averageScore, 2.5);
    assert.equal(tricky[0].lowestScore, 2);
    assert.equal(tricky[0].attemptsCount, 2);
    assert.ok(tricky[0].hardSounds.includes("ch"));

    assert.equal(tricky[1].phrase, "Gemütlichkeit");
    assert.equal(tricky[1].averageScore, 5.0);
  });

  test("getImprovementStats calculates average score, trend, and hard sound distribution", () => {
    const stats = getImprovementStats(mockRecordings);
    assert.equal(stats.totalRecordings, 3);
    // (2 + 3 + 5) / 3 = 3.33 -> rounded to 3.3
    assert.equal(stats.averageScore, 3.3);
    assert.equal(stats.shadowingCount, 1);
    assert.equal(stats.soundFrequency["ch"], 3); // appeared in all 3 attempts
    assert.equal(stats.soundFrequency["ü"], 1);
    assert.equal(stats.trend.length, 3);
  });
});

describe("4. Deterministic Daily German Rotation", () => {
  test("returns the exact same daily word and sentence for identical IST date", () => {
    const date1 = "2026-11-03";
    const res1 = getDailyGerman(date1);
    const res2 = getDailyGerman(date1);

    assert.equal(res1.word, res2.word);
    assert.equal(res1.gender, res2.gender);
    assert.equal(res1.sentenceGerman, res2.sentenceGerman);
  });

  test("daily German bank entries are valid with meanings and levels", () => {
    const daily = getDailyGerman("2026-11-04");
    assert.ok(daily.word.length > 0);
    assert.ok(daily.meaning.length > 0);
    assert.ok(daily.sentenceGerman.length > 0);
    assert.ok(["A1", "A2", "B1", "B2"].includes(daily.cefr_level));
  });
});

describe("5. Vocab Due Filtering & Heatmap Aggregation", () => {
  test("getDueVocabCards respects daily new-card limit", () => {
    const mockCards: VocabCard[] = Array.from({ length: 15 }, (_, i) => ({
      id: `card-${i}`,
      user_id: "u1",
      german_text: `Wort ${i}`,
      english_meaning: `Word ${i}`,
      part_of_speech: "noun",
      gender: "der",
      plural: null,
      example_sentence: null,
      cefr_level: "A1",
      tags: [],
      repetition: 0, // new card
      interval: 0,
      ease_factor: 2.5,
      next_review_at: "2026-11-01T00:00:00Z", // overdue
      last_reviewed_at: null,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    }));

    const dueLimit5 = getDueVocabCards(mockCards, 5);
    assert.equal(dueLimit5.length, 5);

    const dueLimit10 = getDueVocabCards(mockCards, 10);
    assert.equal(dueLimit10.length, 10);
  });

  test("getReviewHeatmapData populates date counts based on last_reviewed_at", () => {
    const mockCards: VocabCard[] = [
      {
        id: "c1",
        user_id: "u1",
        german_text: "Hallo",
        english_meaning: "Hello",
        part_of_speech: null,
        gender: null,
        plural: null,
        example_sentence: null,
        cefr_level: "A1",
        tags: [],
        repetition: 1,
        interval: 1,
        ease_factor: 2.5,
        next_review_at: "2026-11-04T00:00:00Z",
        last_reviewed_at: "2026-11-02T15:30:00Z", // maps to 2026-11-02 in IST
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-02T15:30:00Z",
      },
    ];

    const heatmap = getReviewHeatmapData(mockCards, 30);
    assert.ok(heatmap["2026-11-02"] >= 1);
  });
});
