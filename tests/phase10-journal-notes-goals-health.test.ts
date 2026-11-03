// ============================================================================
// Sahil's Shore: Phase 10 Unit Tests
// Tests for Journal, Notes [[backlinks]], Goals progress, Health, and Privacy PIN
// ============================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// 1. Journal Imports
import { generateWeeklyReviewMarkdown } from "../lib/journal/index.ts";
import type { WeeklyReviewStats } from "../lib/journal/index.ts";

// 2. Notes Imports
import {
  extractBacklinks,
  extractContextSnippet,
} from "../lib/notes/index.ts";

// 3. Goals Imports
import {
  calculateGoalProgress,
  getQuarterForDate,
  groupGoalsByQuarter,
} from "../lib/goals/index.ts";
import type { Goal } from "../lib/goals/index.ts";

// 4. Health Imports
import {
  mlToGlasses,
  glassesToMl,
  calculateHealthAverages,
} from "../lib/health/index.ts";
import type { HealthTrendPoint } from "../lib/health/index.ts";

// 5. Privacy PIN Imports
import {
  hashPin,
  verifyPin,
  generateSalt,
} from "../lib/privacy/index.ts";

// ============================================================================
// 1. Journal & Weekly Review Synthesizer
// ============================================================================

describe("1. Journal & Weekly Review Synthesizer", () => {
  it("formats study hours, DSA, paise spend in INR, and task totals", () => {
    const stats: WeeklyReviewStats = {
      weekStartDate: "2026-11-02",
      weekEndDate: "2026-11-08",
      studyMinutes: 150, // 2h 30m
      studyHours: 2.5,
      dsaSolvedCount: 7,
      spentPaise: 450000, // ₹4,500.00
      tasksCompletedCount: 12,
      habitsCompletedCount: 18,
    };

    const md = generateWeeklyReviewMarkdown(stats, "2026-11-02", "2026-11-08");

    assert.ok(md.includes("2h 30m"), "Includes formatted study duration");
    assert.ok(md.includes("DSA Problems Solved:** 7"), "Includes DSA solved count");
    assert.ok(md.includes("₹4,500"), "Includes paise-accurate Indian Rupee total");
    assert.ok(md.includes("Tasks Finished:** 12"), "Includes completed tasks count");
    assert.ok(md.includes("Habits Maintained:** 18"), "Includes habit logs count");
  });

  it("handles 0 minutes and 0 paise expenditure gracefully", () => {
    const stats: WeeklyReviewStats = {
      weekStartDate: "2026-11-02",
      weekEndDate: "2026-11-08",
      studyMinutes: 0,
      studyHours: 0,
      dsaSolvedCount: 0,
      spentPaise: 0,
      tasksCompletedCount: 0,
      habitsCompletedCount: 0,
    };

    const md = generateWeeklyReviewMarkdown(stats, "2026-11-02", "2026-11-08");
    assert.ok(md.includes("0h 0m"));
    assert.ok(md.includes("₹0.00") || md.includes("₹0"));
  });
});

// ============================================================================
// 2. Notes / Second Brain [[Backlinks]] Parser
// ============================================================================

describe("2. Notes [[Backlinks]] Parser & Knowledge Graph", () => {
  it("extracts multiple [[backlinks]] from markdown text", () => {
    const text = `
# Engineering Architecture
Today we discussed building microservices using [[Spring Boot]] and securing endpoints with [[Spring Security]].
Also connecting to [[MongoDB]] database.
    `;

    const links = extractBacklinks(text);
    assert.deepEqual(links, ["Spring Boot", "Spring Security", "MongoDB"]);
  });

  it("deduplicates repeated [[backlinks]] in the same document", () => {
    const text = "We love [[Next.js]] because [[Next.js]] has server actions. Also see [[Next.js]].";
    const links = extractBacklinks(text);
    assert.deepEqual(links, ["Next.js"]);
  });

  it("returns empty array when text contains no backlinks", () => {
    const text = "Just a standard markdown note with no bracket links.";
    const links = extractBacklinks(text);
    assert.deepEqual(links, []);
  });

  it("extracts the exact context snippet containing the backlink", () => {
    const text = [
      "# Day Overview",
      "Woke up at 6am.",
      "Researched microservices using [[Spring Boot]] for the new project.",
      "Cooked lunch afterwards.",
    ].join("\n");

    const snippet = extractContextSnippet(text, "Spring Boot");
    assert.equal(
      snippet,
      "Researched microservices using [[Spring Boot]] for the new project."
    );
  });
});

// ============================================================================
// 3. Goal Progress Engine & Quarterly Grouping
// ============================================================================

describe("3. Goal Progress Engine & Quarterly Grouping", () => {
  it("calculates 100% progress when all milestones are completed", () => {
    const milestones = [
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
    ];
    const progress = calculateGoalProgress(milestones);
    assert.equal(progress, 100);
  });

  it("calculates proportional progress for partial milestones (e.g. 1/3 = 33%)", () => {
    const milestones = [
      { is_completed: true },
      { is_completed: false },
      { is_completed: false },
    ];
    const progress = calculateGoalProgress(milestones);
    assert.equal(progress, 33);
  });

  it("incorporates linked tasks weighting (70% milestones, 30% tasks)", () => {
    // 2/2 milestones (70%) + 1/2 tasks (15%) = 85%
    const milestones = [{ is_completed: true }, { is_completed: true }];
    const progress = calculateGoalProgress(milestones, 2, 1);
    assert.equal(progress, 85);
  });

  it("derives quarters accurately from target dates (Q1, Q2, Q3, Q4)", () => {
    assert.equal(getQuarterForDate("2026-01-15"), "Q1 2026");
    assert.equal(getQuarterForDate("2026-03-31"), "Q1 2026");
    assert.equal(getQuarterForDate("2026-04-01"), "Q2 2026");
    assert.equal(getQuarterForDate("2026-07-20"), "Q3 2026");
    assert.equal(getQuarterForDate("2026-11-04"), "Q4 2026");
  });

  it("groups goals into quarterly horizon buckets", () => {
    const mockGoals: Goal[] = [
      {
        id: "1",
        user_id: "u1",
        title: "Get Job",
        category: "Career",
        target_date: "2026-03-15",
        status: "in_progress",
        progress_percent: 50,
        linked_task_ids: [],
        linked_habit_ids: [],
        linked_activity_ids: [],
        milestones: [],
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        user_id: "u1",
        title: "B1 German",
        category: "Learning",
        target_date: "2026-06-30",
        status: "in_progress",
        progress_percent: 25,
        linked_task_ids: [],
        linked_habit_ids: [],
        linked_activity_ids: [],
        milestones: [],
        created_at: "",
        updated_at: "",
      },
      {
        id: "3",
        user_id: "u1",
        title: "DSA 300",
        category: "Learning",
        target_date: "2026-03-20",
        status: "in_progress",
        progress_percent: 75,
        linked_task_ids: [],
        linked_habit_ids: [],
        linked_activity_ids: [],
        milestones: [],
        created_at: "",
        updated_at: "",
      },
    ];

    const grouped = groupGoalsByQuarter(mockGoals);
    assert.equal(grouped["Q1 2026"]?.length, 2, "Q1 has 2 goals");
    assert.equal(grouped["Q2 2026"]?.length, 1, "Q2 has 1 goal");
  });
});

// ============================================================================
// 4. Health Mini-Trackers Conversion & Averages
// ============================================================================

describe("4. Health Mini-Trackers Conversion & Averages", () => {
  it("converts between glasses and ml accurately (250ml per glass)", () => {
    assert.equal(glassesToMl(1), 250);
    assert.equal(glassesToMl(8), 2000);
    assert.equal(mlToGlasses(2000), 8);
    assert.equal(mlToGlasses(1250), 5);
    assert.equal(mlToGlasses(0), 0);
  });

  it("calculates health averages across water, sleep, and workouts", () => {
    const trendPoints: HealthTrendPoint[] = [
      {
        date: "2026-11-01",
        friendlyDate: "1 Nov",
        waterGlasses: 8,
        waterMl: 2000,
        sleepHours: 8.0,
        sleepQuality: 4,
        workoutMinutes: 45,
        workoutType: "Gym",
        weightKg: 68.8,
      },
      {
        date: "2026-11-02",
        friendlyDate: "2 Nov",
        waterGlasses: 6,
        waterMl: 1500,
        sleepHours: 7.0,
        sleepQuality: 3,
        workoutMinutes: 30,
        workoutType: "Running",
        weightKg: 68.5,
      },
    ];

    const avg = calculateHealthAverages(trendPoints);
    assert.equal(avg.avgWaterGlasses, 7); // (8 + 6) / 2
    assert.equal(avg.avgSleepHours, 7.5); // (8.0 + 7.0) / 2
    assert.equal(avg.totalWorkoutMinutes, 75); // 45 + 30
    assert.equal(avg.latestWeight, 68.5);
    assert.equal(avg.weightChange, -0.3); // 68.5 - 68.8
  });
});

// ============================================================================
// 5. Privacy PIN Hashing & Security Verification
// ============================================================================

describe("5. Privacy PIN Hashing & Security Verification", () => {
  it("generates cryptographic salt of requested length", () => {
    const salt16 = generateSalt(16);
    assert.equal(salt16.length, 16);
    const salt32 = generateSalt(32);
    assert.equal(salt32.length, 32);
  });

  it("hashes PIN using SHA-256 and verifies successfully", async () => {
    const pin = "4826";
    const salt = generateSalt(16);

    const hash = await hashPin(pin, salt);
    assert.ok(hash.length === 64, "SHA-256 produces 64-character hex digest");

    const isMatch = await verifyPin(pin, hash, salt);
    assert.equal(isMatch, true, "Valid PIN verifies to true");
  });

  it("rejects invalid PIN or tampered salt", async () => {
    const pin = "1234";
    const salt = generateSalt(16);
    const hash = await hashPin(pin, salt);

    const wrongPin = await verifyPin("9999", hash, salt);
    assert.equal(wrongPin, false, "Wrong PIN fails verification");

    const tamperedSalt = await verifyPin(pin, hash, "different_salt_123");
    assert.equal(tamperedSalt, false, "Tampered salt fails verification");
  });
});
