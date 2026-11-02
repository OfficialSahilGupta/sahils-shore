// ============================================================================
// Sahil's Shore: Phase 6 Unit Tests - DSA Tracker & Full-Stack Learning Hub
// Covers: Spaced repetition (1, 3, 7, 14, 30 days), weak topic detection,
// DSA streaks & daily goals, roadmap progress math, and mock interview logic
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNextRevision,
  isDueForRevision,
  detectWeakTopics,
  calculateTopicProgress,
  calculateDifficultySplit,
  calculateDsaStreak,
} from "../lib/dsa/index.ts";
import {
  calculateRoadmapProgress,
  selectMockInterviewQuestions,
} from "../lib/learning/index.ts";
import { todayIST, yesterdayIST } from "../lib/date-utils.ts";
import type { DsaProblem, LearningItem, InterviewQa } from "../types/index.ts";

describe("1. Spaced Repetition (1, 3, 7, 14, 30 days) Ladder", () => {
  const baseDate = new Date("2026-11-02T10:00:00Z");

  test("rating Easy advances through the exact ladder: 1 -> 3 -> 7 -> 14 -> 30", () => {
    // 1 -> 3
    const step1 = calculateNextRevision(1, "Easy", baseDate);
    assert.equal(step1.nextIntervalDays, 3);
    const date1 = new Date(step1.nextRevisionDateUTC);
    assert.equal(date1.getUTCDate(), baseDate.getUTCDate() + 3);

    // 3 -> 7
    const step2 = calculateNextRevision(3, "Easy", baseDate);
    assert.equal(step2.nextIntervalDays, 7);

    // 7 -> 14
    const step3 = calculateNextRevision(7, "Easy", baseDate);
    assert.equal(step3.nextIntervalDays, 14);

    // 14 -> 30
    const step4 = calculateNextRevision(14, "Easy", baseDate);
    assert.equal(step4.nextIntervalDays, 30);

    // 30 -> caps at 30
    const step5 = calculateNextRevision(30, "Easy", baseDate);
    assert.equal(step5.nextIntervalDays, 30);
  });

  test("rating Hard drops interval back to 1 day from any stage", () => {
    const from3 = calculateNextRevision(3, "Hard", baseDate);
    assert.equal(from3.nextIntervalDays, 1);

    const from14 = calculateNextRevision(14, "Hard", baseDate);
    assert.equal(from14.nextIntervalDays, 1);

    const from30 = calculateNextRevision(30, "Hard", baseDate);
    assert.equal(from30.nextIntervalDays, 1);
  });

  test("isDueForRevision accurately flags overdue and needs_revision problems", () => {
    const todayISTStr = "2026-11-02";

    // 1. Due today
    const p1 = {
      id: "p1",
      user_id: "u1",
      title: "Two Sum",
      difficulty: "Easy",
      status: "Solved",
      next_revision_at: "2026-11-02T06:00:00Z",
      revision_interval_days: 1,
    } as unknown as DsaProblem;
    assert.equal(isDueForRevision(p1, todayISTStr), true);

    // 2. Future revision (e.g. 5 days from now)
    const p2 = {
      id: "p2",
      user_id: "u1",
      title: "LRU Cache",
      difficulty: "Medium",
      status: "Solved",
      next_revision_at: "2026-11-08T06:00:00Z",
      revision_interval_days: 7,
    } as unknown as DsaProblem;
    assert.equal(isDueForRevision(p2, todayISTStr), false);

    // 3. Status 'Needs revision' is always due regardless of date
    const p3 = {
      id: "p3",
      user_id: "u1",
      title: "N-Queens",
      difficulty: "Hard",
      status: "Needs revision",
      next_revision_at: "2026-11-20T00:00:00Z",
    } as unknown as DsaProblem;
    assert.equal(isDueForRevision(p3, todayISTStr), true);

    // 4. Status 'Revisit' is always due
    const p4 = {
      id: "p4",
      user_id: "u1",
      title: "Alien Dictionary",
      difficulty: "Hard",
      status: "Revisit",
    } as unknown as DsaProblem;
    assert.equal(isDueForRevision(p4, todayISTStr), true);
  });
});

describe("2. Weak-Topic Detection Algorithm", () => {
  test("identifies topics with problems marked 'Needs revision' or 'Stuck'", () => {
    const problems: DsaProblem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "Course Schedule",
        topic: "Graphs",
        difficulty: "Medium",
        status: "Needs revision",
      } as unknown as DsaProblem,
      {
        id: "2",
        user_id: "u1",
        title: "Clone Graph",
        topic: "Graphs",
        difficulty: "Medium",
        status: "Stuck",
      } as unknown as DsaProblem,
      {
        id: "3",
        user_id: "u1",
        title: "Two Sum",
        topic: "Arrays",
        difficulty: "Easy",
        status: "Solved",
      } as unknown as DsaProblem,
    ];

    const reports = detectWeakTopics(problems);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].topic, "Graphs");
    assert.equal(reports[0].needsRevision, 1);
    assert.equal(reports[0].stuck, 1);
    assert.ok(reports[0].reason.includes("stuck problem"));
  });

  test("identifies topics with low solve rate (< 50%) when multiple attempted", () => {
    const problems: DsaProblem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "Coin Change",
        topic: "DP",
        difficulty: "Medium",
        status: "attempted",
      } as unknown as DsaProblem,
      {
        id: "2",
        user_id: "u1",
        title: "Longest Increasing Subsequence",
        topic: "DP",
        difficulty: "Medium",
        status: "attempted",
      } as unknown as DsaProblem,
      {
        id: "3",
        user_id: "u1",
        title: "Climbing Stairs",
        topic: "DP",
        difficulty: "Easy",
        status: "Solved",
      } as unknown as DsaProblem,
    ];

    const reports = detectWeakTopics(problems);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].topic, "DP");
    assert.equal(reports[0].total, 3);
    assert.equal(reports[0].solved, 1);
    assert.equal(Math.round(reports[0].solveRate * 100), 33);
  });
});

describe("3. Topic Progress & Difficulty Breakdown", () => {
  test("aggregates total, solved, and calculates difficulty split accurately", () => {
    const problems: DsaProblem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "P1",
        topic: "Arrays",
        difficulty: "Easy",
        status: "Solved",
      } as unknown as DsaProblem,
      {
        id: "2",
        user_id: "u1",
        title: "P2",
        topic: "Arrays",
        difficulty: "Medium",
        status: "Solved",
      } as unknown as DsaProblem,
      {
        id: "3",
        user_id: "u1",
        title: "P3",
        topic: "Trees",
        difficulty: "Hard",
        status: "Needs revision",
      } as unknown as DsaProblem,
    ];

    const topicProgress = calculateTopicProgress(problems);
    const arraysStat = topicProgress.find((t) => t.topic === "Arrays");
    assert.ok(arraysStat);
    assert.equal(arraysStat.total, 2);
    assert.equal(arraysStat.solved, 2);

    const treesStat = topicProgress.find((t) => t.topic === "Trees");
    assert.ok(treesStat);
    assert.equal(treesStat.total, 1);
    assert.equal(treesStat.needsRevision, 1);

    const diffSplit = calculateDifficultySplit(problems);
    assert.equal(diffSplit.Easy, 1);
    assert.equal(diffSplit.Medium, 1);
    assert.equal(diffSplit.Hard, 1);
    assert.equal(diffSplit.total, 3);
  });
});

describe("4. DSA Streak & Daily Goal Engine", () => {
  test("calculates today's solved count and active daily goal", () => {
    const today = todayIST();
    const yesterday = yesterdayIST();

    const problems: DsaProblem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "P1",
        status: "Solved",
        updated_at: `${today}T10:00:00Z`,
        created_at: `${today}T10:00:00Z`,
      } as unknown as DsaProblem,
      {
        id: "2",
        user_id: "u1",
        title: "P2",
        status: "Solved",
        updated_at: `${today}T12:00:00Z`,
        created_at: `${today}T12:00:00Z`,
      } as unknown as DsaProblem,
      {
        id: "3",
        user_id: "u1",
        title: "P3",
        status: "Solved",
        updated_at: `${yesterday}T14:00:00Z`,
        created_at: `${yesterday}T14:00:00Z`,
      } as unknown as DsaProblem,
    ];

    const info = calculateDsaStreak(problems, 2);
    assert.equal(info.todaySolvedCount, 2);
    assert.equal(info.isDailyGoalMet, true);
    assert.equal(info.currentStreak, 2);
  });
});

describe("5. Full-Stack Roadmap Progress Calculations", () => {
  test("calculates completed, in_progress, and percentage accurately", () => {
    const items: LearningItem[] = [
      { id: "1", topic: "T1", status: "completed" } as LearningItem,
      { id: "2", topic: "T2", status: "completed" } as LearningItem,
      { id: "3", topic: "T3", status: "in_progress" } as LearningItem,
      { id: "4", topic: "T4", status: "planned" } as LearningItem,
    ];

    const progress = calculateRoadmapProgress(items);
    assert.equal(progress.total, 4);
    assert.equal(progress.completed, 2);
    assert.equal(progress.inProgress, 1);
    assert.equal(progress.planned, 1);
    assert.equal(progress.percentage, 50);
  });

  test("handles empty items gracefully", () => {
    const progress = calculateRoadmapProgress([]);
    assert.equal(progress.total, 0);
    assert.equal(progress.percentage, 0);
  });
});

describe("6. Mock Interview Randomizer & Weighting", () => {
  test("selects mock interview questions and prioritizes lower confidence", () => {
    const questions: InterviewQa[] = [
      { id: "1", question: "Q1", technology: "Java", confidence: 1 } as InterviewQa,
      { id: "2", question: "Q2", technology: "Spring", confidence: 2 } as InterviewQa,
      { id: "3", question: "Q3", technology: "Docker", confidence: 5 } as InterviewQa,
      { id: "4", question: "Q4", technology: "SQL", confidence: 5 } as InterviewQa,
    ];

    const selected = selectMockInterviewQuestions(questions, 2);
    assert.equal(selected.length, 2);
    // Lower confidence questions have significantly higher score weight
    const ids = selected.map((q) => q.id);
    assert.ok(ids.includes("1") || ids.includes("2"));
  });
});
