// ============================================================================
// Sahil's Shore: Workout & Fitness Hub Unit Tests
// Tests volume math, 1RM formulas, routine templates, streaks, and motivation
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSetVolume,
  calculateSessionVolume,
  calculateEstimated1RM,
  calculateWorkoutStreak,
  getDailyMotivationQuote,
  ROUTINE_TEMPLATES,
  EXERCISE_BANK,
} from "../lib/workout/index.ts";
import type { WorkoutSession, WorkoutExercise } from "../lib/workout/index.ts";

describe("1. Workout Volume Calculations", () => {
  test("calculates set volume accurately", () => {
    assert.equal(calculateSetVolume(60, 10), 600);
    assert.equal(calculateSetVolume(82.5, 8), 660);
    assert.equal(calculateSetVolume(100, 1), 100);
  });

  test("returns zero volume for non-positive values", () => {
    assert.equal(calculateSetVolume(0, 10), 0);
    assert.equal(calculateSetVolume(60, 0), 0);
    assert.equal(calculateSetVolume(-50, 10), 0);
  });

  test("calculates session volume only for completed sets", () => {
    const exercises: WorkoutExercise[] = [
      {
        exerciseName: "Bench Press",
        muscleGroup: "Chest",
        orderIndex: 0,
        sets: [
          { setNumber: 1, weightKg: 60, reps: 10, completed: true },
          { setNumber: 2, weightKg: 70, reps: 8, completed: true },
          { setNumber: 3, weightKg: 80, reps: 6, completed: false }, // uncompleted
        ],
      },
      {
        exerciseName: "Incline DB Press",
        muscleGroup: "Chest",
        orderIndex: 1,
        sets: [
          { setNumber: 1, weightKg: 24, reps: 10, completed: true },
        ],
      },
    ];

    const stats = calculateSessionVolume(exercises);
    // (60*10) + (70*8) + (24*10) = 600 + 560 + 240 = 1400 kg
    assert.equal(stats.totalVolumeKg, 1400);
    assert.equal(stats.totalSets, 3);
  });
});

describe("2. 1-Rep Max (1RM) Formulas", () => {
  test("returns exact weight when 1 rep is performed", () => {
    assert.equal(calculateEstimated1RM(100, 1), 100);
    assert.equal(calculateEstimated1RM(142.5, 1), 142.5);
  });

  test("estimates 1RM accurately for typical rep ranges", () => {
    // 80kg for 5 reps:
    // Brzycki: 80 * (36 / 32) = 90
    // Epley: 80 * (1 + 5/30) = 93.33
    // Avg = (90 + 93.33) / 2 = 91.66 -> 91.7
    const est = calculateEstimated1RM(80, 5);
    assert.ok(est >= 90 && est <= 94, `Expected 1RM between 90-94, got ${est}`);
  });

  test("handles zero and negative inputs gracefully", () => {
    assert.equal(calculateEstimated1RM(0, 5), 0);
    assert.equal(calculateEstimated1RM(80, 0), 0);
    assert.equal(calculateEstimated1RM(-50, 5), 0);
  });
});

describe("3. Workout Streak Calculation (IST)", () => {
  const createMockSession = (dateStr: string): WorkoutSession => ({
    id: `sess-${dateStr}`,
    userId: "test-user",
    workoutDate: dateStr,
    routineName: "Push Day",
    splitType: "push",
    muscleGroups: ["Chest"],
    durationMinutes: 60,
    totalVolumeKg: 5000,
    totalSets: 15,
    intensityRating: 4,
    exercises: [],
    createdAt: `${dateStr}T10:00:00Z`,
    updatedAt: `${dateStr}T10:00:00Z`,
  });

  test("calculates active streak when workouts logged consecutively", () => {
    const sessions = [
      createMockSession("2026-11-14"), // today
      createMockSession("2026-11-13"), // yesterday
      createMockSession("2026-11-12"), // 2 days ago
    ];

    const streak = calculateWorkoutStreak(sessions, "2026-11-14");
    assert.equal(streak, 3);
  });

  test("preserves streak if today is not yet logged but yesterday was logged", () => {
    const sessions = [
      createMockSession("2026-11-13"), // yesterday
      createMockSession("2026-11-12"), // 2 days ago
    ];

    const streak = calculateWorkoutStreak(sessions, "2026-11-14");
    assert.equal(streak, 2);
  });

  test("returns 0 if neither today nor yesterday was logged", () => {
    const sessions = [
      createMockSession("2026-11-11"), // 3 days ago
    ];

    const streak = calculateWorkoutStreak(sessions, "2026-11-14");
    assert.equal(streak, 0);
  });
});

describe("4. Routine Templates & Exercise Bank Integrity", () => {
  test("provides all core routine splits with required metadata", () => {
    const requiredSplits = ["push", "pull", "legs", "upper", "lower", "full_body"];
    const foundSplits = ROUTINE_TEMPLATES.map((t) => t.splitType);

    for (const split of requiredSplits) {
      assert.ok(foundSplits.includes(split as any), `Missing routine template for split ${split}`);
    }
  });

  test("exercise bank contains comprehensive compound & isolation lifts", () => {
    assert.ok(EXERCISE_BANK.length >= 30, "Exercise bank should have at least 30 exercises");
    const hasBench = EXERCISE_BANK.some((e) => e.name.includes("Bench Press"));
    const hasSquat = EXERCISE_BANK.some((e) => e.name.includes("Squat"));
    const hasDeadlift = EXERCISE_BANK.some((e) => e.name.includes("Deadlift"));

    assert.ok(hasBench, "Exercise bank must contain Bench Press");
    assert.ok(hasSquat, "Exercise bank must contain Squat");
    assert.ok(hasDeadlift, "Exercise bank must contain Deadlift");
  });
});

describe("5. Motivational Quote Engine", () => {
  test("returns deterministic quote for a given IST date", () => {
    const q1 = getDailyMotivationQuote("2026-11-14");
    const q2 = getDailyMotivationQuote("2026-11-14");

    assert.equal(q1.quote, q2.quote);
    assert.equal(q1.author, q2.author);
    assert.ok(q1.quote.length > 0);
    assert.ok(q1.author.length > 0);
  });
});
