// ============================================================================
// Sahil's Shore: Unit Tests for Todos, Tracker & Habits
// Recurrence generation, IST day-boundary handling, and streak calculations
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  getISTDateString,
  addDaysIST,
  diffDaysIST,
  formatISTTime,
  getISTDayOfWeek,
  isTodayIST,
} from "../lib/date-utils.ts";

import {
  parseNaturalLanguageTask,
  calculateNextRecurrenceDate,
} from "../lib/todos/index.ts";

import {
  calculateActivityStreaks,
  type ActivityStreakInfo,
} from "../lib/tracker/index.ts";

import {
  calculateHabitStreak,
} from "../lib/habits/index.ts";

import type { ActivityLog, Habit, HabitLog } from "../types/index.ts";

describe("1. IST Day-Boundary & Date Handling", () => {
  test("correctly converts UTC to IST across midnight boundary", () => {
    // 2026-11-02 18:29:59 UTC -> 2026-11-02 23:59:59 IST (same day)
    const beforeMidnightUTC = new Date("2026-11-02T18:29:59Z");
    assert.strictEqual(getISTDateString(beforeMidnightUTC), "2026-11-02");

    // 2026-11-02 18:30:00 UTC -> 2026-11-03 00:00:00 IST (next calendar day in IST)
    const midnightUTC = new Date("2026-11-02T18:30:00Z");
    assert.strictEqual(getISTDateString(midnightUTC), "2026-11-03");

    // 2026-11-02 18:31:00 UTC -> 2026-11-03 00:01:00 IST (next calendar day in IST)
    const afterMidnightUTC = new Date("2026-11-02T18:31:00Z");
    assert.strictEqual(getISTDateString(afterMidnightUTC), "2026-11-03");
  });

  test("accurately formats time in 12-hour IST", () => {
    assert.strictEqual(formatISTTime("19:00:00"), "7:00 PM");
    assert.strictEqual(formatISTTime("09:30"), "9:30 AM");
    assert.strictEqual(formatISTTime("00:15:00"), "12:15 AM");
    assert.strictEqual(formatISTTime("12:00:00"), "12:00 PM");
  });

  test("accurately identifies IST day of week", () => {
    // 2026-11-02 was a Monday
    assert.strictEqual(getISTDayOfWeek("2026-11-02"), "mon");
    // 2026-11-03 is Tuesday
    assert.strictEqual(getISTDayOfWeek("2026-11-03"), "tue");
    // 2026-11-08 is Sunday
    assert.strictEqual(getISTDayOfWeek("2026-11-08"), "sun");
  });

  test("handles adding days and calculating date diffs", () => {
    assert.strictEqual(addDaysIST("2026-11-02", 1), "2026-11-03");
    assert.strictEqual(addDaysIST("2026-11-02", -1), "2026-11-01");
    // Month transition
    assert.strictEqual(addDaysIST("2026-10-31", 1), "2026-11-01");
    // Diff
    assert.strictEqual(diffDaysIST("2026-11-01", "2026-11-05"), 4);
    assert.strictEqual(diffDaysIST("2026-11-05", "2026-11-01"), -4);
  });
});

describe("2. Recurrence Generation", () => {
  test("daily recurrence produces next consecutive day", () => {
    const nextDate = calculateNextRecurrenceDate(
      { frequency: "daily" },
      "2026-11-02"
    );
    assert.strictEqual(nextDate, "2026-11-03");
  });

  test("weekly recurrence produces date exactly 7 days later", () => {
    const nextDate = calculateNextRecurrenceDate(
      { frequency: "weekly" },
      "2026-11-02"
    );
    assert.strictEqual(nextDate, "2026-11-09");
  });

  test("monthly recurrence handles standard and month-end dates", () => {
    // Standard: 15th of month
    const nextStandard = calculateNextRecurrenceDate(
      { frequency: "monthly" },
      "2026-11-15"
    );
    assert.strictEqual(nextStandard, "2026-12-15");

    // Month end edge case: Jan 31 -> Feb 28 in non-leap year (e.g. 2026 is non-leap)
    const nextClamped = calculateNextRecurrenceDate(
      { frequency: "monthly" },
      "2026-01-31"
    );
    assert.strictEqual(nextClamped, "2026-02-28");
  });

  test("custom days recurrence picks next scheduled day of week", () => {
    // 2026-11-02 is Monday. Target days: Monday, Wednesday, Friday
    const nextDateFromMon = calculateNextRecurrenceDate(
      { frequency: "custom", targetDays: ["mon", "wed", "fri"] },
      "2026-11-02"
    );
    // Next should be Wednesday (2026-11-04)
    assert.strictEqual(nextDateFromMon, "2026-11-04");

    // From Friday (2026-11-06), next should be next Monday (2026-11-09)
    const nextDateFromFri = calculateNextRecurrenceDate(
      { frequency: "custom", targetDays: ["mon", "wed", "fri"] },
      "2026-11-06"
    );
    assert.strictEqual(nextDateFromFri, "2026-11-09");
  });
});

describe("3. Natural Language Task Parsing", () => {
  test("parses priority, tags, time, and relative date", () => {
    const parsed = parseNaturalLanguageTask(
      "revise graphs tomorrow 7pm !high #dsa",
      "2026-11-02"
    );

    assert.strictEqual(parsed.title, "revise graphs");
    assert.strictEqual(parsed.dueDate, "2026-11-03");
    assert.strictEqual(parsed.dueTime, "19:00:00");
    assert.strictEqual(parsed.priority, "high");
    assert.deepStrictEqual(parsed.tags, ["dsa"]);
  });

  test("parses urgent priority, multiple tags, and 12-hour AM time", () => {
    const parsed = parseNaturalLanguageTask(
      "mock interview practice today 10:30am !urgent #career #interview",
      "2026-11-02"
    );

    assert.strictEqual(parsed.title, "mock interview practice");
    assert.strictEqual(parsed.dueDate, "2026-11-02");
    assert.strictEqual(parsed.dueTime, "10:30:00");
    assert.strictEqual(parsed.priority, "urgent");
    assert.deepStrictEqual(parsed.tags, ["career", "interview"]);
  });

  test("parses day of week scheduling", () => {
    // Base is Monday 2026-11-02
    const parsed = parseNaturalLanguageTask(
      "submit weekly report on friday !low #admin",
      "2026-11-02"
    );

    assert.strictEqual(parsed.title, "submit weekly report");
    // Friday of that week is 2026-11-06
    assert.strictEqual(parsed.dueDate, "2026-11-06");
    assert.strictEqual(parsed.priority, "low");
  });
});

describe("4. Activity Streak Calculation & Thresholds", () => {
  const dummyActivityId = "act-123";

  function createLog(istDate: string, minutes: number): ActivityLog {
    // Create UTC timestamp corresponding to 10:00 AM IST on that date (04:30 UTC)
    return {
      id: `log-${istDate}`,
      user_id: "user-1",
      activity_id: dummyActivityId,
      started_at: `${istDate}T04:30:00.000Z`,
      duration_seconds: minutes * 60,
      notes: null,
      created_at: `${istDate}T04:30:00.000Z`,
      updated_at: `${istDate}T04:30:00.000Z`,
    };
  }

  test("calculates streaks when days meet threshold", () => {
    // 3 consecutive days meeting 30 min target
    const logs = [
      createLog("2026-10-31", 45),
      createLog("2026-11-01", 35),
      createLog("2026-11-02", 60),
    ];

    const result = calculateActivityStreaks(logs, 30, 30);
    // Best streak is 3
    assert.strictEqual(result.bestStreak, 3);
  });

  test("resets streak if a day fails minimum threshold", () => {
    const logs = [
      createLog("2026-10-28", 45),
      createLog("2026-10-29", 50),
      createLog("2026-10-30", 5), // Only 5 min (< 30 min threshold) -> breaks streak!
      createLog("2026-10-31", 60),
      createLog("2026-11-01", 45),
    ];

    const result = calculateActivityStreaks(logs, 30, 30);
    assert.strictEqual(result.bestStreak, 2);
  });
});

describe("5. Habit Streaks with Skip-Day Support", () => {
  const habit: Habit = {
    id: "habit-1",
    user_id: "user-1",
    title: "Morning Meditation",
    frequency: "daily",
    target_days: [],
    color: "#1F7A8C",
    icon: "Sparkles",
    current_streak: 0,
    best_streak: 0,
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  };

  test("skip day does not break active streak", () => {
    // Oct 30 completed, Oct 31 skipped, Nov 1 completed, Nov 2 completed
    const logs: HabitLog[] = [
      {
        id: "l1",
        user_id: "user-1",
        habit_id: "habit-1",
        logged_date: "2026-10-30",
        completed: true,
        notes: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "l2",
        user_id: "user-1",
        habit_id: "habit-1",
        logged_date: "2026-10-31",
        completed: false,
        notes: "skipped - travel day",
        created_at: "",
        updated_at: "",
      },
      {
        id: "l3",
        user_id: "user-1",
        habit_id: "habit-1",
        logged_date: "2026-11-01",
        completed: true,
        notes: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "l4",
        user_id: "user-1",
        habit_id: "habit-1",
        logged_date: "2026-11-02",
        completed: true,
        notes: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const streak = calculateHabitStreak(habit, logs);
    // 3 completed days + 1 skipped day: current streak should be 3 completed without breaking!
    assert.strictEqual(streak.currentStreak, 3);
    assert.strictEqual(streak.isCompletedToday, true);
  });

  test("missing day without skip breaks habit streak", () => {
    const logs: HabitLog[] = [
      {
        id: "l1",
        user_id: "user-1",
        habit_id: "habit-1",
        logged_date: "2026-10-29",
        completed: true,
        notes: null,
        created_at: "",
        updated_at: "",
      },
      // Oct 30 is missing completely
      {
        id: "l3",
        user_id: "user-1",
        habit_id: "habit-1",
        logged_date: "2026-11-01",
        completed: true,
        notes: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "l4",
        user_id: "user-1",
        habit_id: "habit-1",
        logged_date: "2026-11-02",
        completed: true,
        notes: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const streak = calculateHabitStreak(habit, logs);
    // Streak only counts Nov 2 and Nov 1 (streak = 2) because Oct 30 was missing
    assert.strictEqual(streak.currentStreak, 2);
  });
});
