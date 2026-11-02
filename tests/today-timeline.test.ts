// ============================================================================
// Sahil's Shore: Phase 5 Unit Tests (Today Dashboard + Unified Timeline)
// Tests IST day-boundary ranges, event parsing, daily totals, and layout logic
// ============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  getISTDateRangeUTC,
  getISTDateString,
  todayIST,
  formatFriendlyISTDate,
} from "../lib/date-utils.ts";
import {
  calculateDayTotals,
  getEventTypeConfig,
  formatTimelineEventTime,
} from "../lib/timeline/index.ts";
import { getQuoteOfTheDay, DAILY_QUOTES } from "../lib/dashboard/quotes.ts";
import {
  getDefaultLayouts,
  ALL_WIDGET_IDS,
  ALL_WIDGET_METAS,
} from "../lib/dashboard/layout-service.ts";
import type { TimelineEvent } from "../types/index.ts";

describe("1. IST Date Range & Day-Boundary Bounds", () => {
  test("generates exact UTC ISO bounds for IST calendar day", () => {
    const range = getISTDateRangeUTC("2026-11-02");

    // 00:00:00 IST on 2 Nov 2026 = 18:30:00 UTC on 1 Nov 2026
    assert.equal(range.startUTC, "2026-11-01T18:30:00.000Z");
    // 23:59:59.999 IST on 2 Nov 2026 = 18:29:59.999 UTC on 2 Nov 2026
    assert.equal(range.endUTC, "2026-11-02T18:29:59.999Z");
  });

  test("boundary timestamps map to the exact IST calendar date", () => {
    const range = getISTDateRangeUTC("2026-11-02");

    // Start instant is Nov 2 in IST
    const startDateIST = getISTDateString(range.startUTC);
    assert.equal(startDateIST, "2026-11-02");

    // End instant is Nov 2 in IST
    const endDateIST = getISTDateString(range.endUTC);
    assert.equal(endDateIST, "2026-11-02");

    // 1 millisecond before start is previous day in IST
    const oneMsBefore = new Date(new Date(range.startUTC).getTime() - 1);
    assert.equal(getISTDateString(oneMsBefore), "2026-11-01");

    // 1 millisecond after end is next day in IST
    const oneMsAfter = new Date(new Date(range.endUTC).getTime() + 1);
    assert.equal(getISTDateString(oneMsAfter), "2026-11-03");
  });
});

describe("2. Timeline Event Classification & Visual Metadata", () => {
  test("maps task events to check icon and /todos route", () => {
    const configCompleted = getEventTypeConfig("task_completed");
    assert.equal(configCompleted.iconName, "check");
    assert.equal(configCompleted.route, "/todos");

    const configTask = getEventTypeConfig("task_created");
    assert.equal(configTask.iconName, "check");
    assert.equal(configTask.route, "/todos");
  });

  test("maps study session to book icon and /tracker route", () => {
    const config = getEventTypeConfig("study_session");
    assert.equal(config.iconName, "book");
    assert.equal(config.route, "/tracker");
  });

  test("maps expense to wallet icon and /expenses route", () => {
    const config = getEventTypeConfig("expense_logged");
    assert.equal(config.iconName, "wallet");
    assert.equal(config.route, "/expenses");
  });

  test("maps meal to utensils icon and /food route", () => {
    const config = getEventTypeConfig("meal_logged");
    assert.equal(config.iconName, "utensils");
    assert.equal(config.route, "/food");
  });

  test("maps place, photo, note, and habit correctly", () => {
    assert.equal(getEventTypeConfig("place_visited").route, "/places");
    assert.equal(getEventTypeConfig("media_uploaded").route, "/media");
    assert.equal(getEventTypeConfig("note_created").route, "/notes");
    assert.equal(getEventTypeConfig("habit_completed").route, "/tracker");
  });
});

describe("3. Day Totals Aggregation Algorithm", () => {
  test("aggregates study time, paise spend, meals, and tasks correctly", () => {
    const mockEvents: TimelineEvent[] = [
      {
        id: "1",
        user_id: "user-1",
        type: "study_session",
        occurred_at: "2026-11-02T04:00:00Z",
        summary: "DSA: Graphs and BFS",
        ref_table: "activity_logs",
        ref_id: "act-1",
        meta: { duration_minutes: 45 },
        created_at: "2026-11-02T04:00:00Z",
        updated_at: "2026-11-02T04:00:00Z",
      },
      {
        id: "2",
        user_id: "user-1",
        type: "study_session",
        occurred_at: "2026-11-02T06:00:00Z",
        summary: "Spring Boot: JPA Relations",
        ref_table: "activity_logs",
        ref_id: "act-2",
        meta: { duration_minutes: 60 },
        created_at: "2026-11-02T06:00:00Z",
        updated_at: "2026-11-02T06:00:00Z",
      },
      {
        id: "3",
        user_id: "user-1",
        type: "expense_logged",
        occurred_at: "2026-11-02T07:30:00Z",
        summary: "Metro smartcard recharge",
        ref_table: "expenses",
        ref_id: "exp-1",
        meta: { amount_paise: 20000 }, // ₹200.00
        created_at: "2026-11-02T07:30:00Z",
        updated_at: "2026-11-02T07:30:00Z",
      },
      {
        id: "4",
        user_id: "user-1",
        type: "expense_logged",
        occurred_at: "2026-11-02T08:00:00Z",
        summary: "Coffee and sandwich",
        ref_table: "expenses",
        ref_id: "exp-2",
        meta: { amount_paise: 15000 }, // ₹150.00
        created_at: "2026-11-02T08:00:00Z",
        updated_at: "2026-11-02T08:00:00Z",
      },
      {
        id: "5",
        user_id: "user-1",
        type: "meal_logged",
        occurred_at: "2026-11-02T08:00:00Z",
        summary: "Breakfast at Cafe",
        ref_table: "meals",
        ref_id: "meal-1",
        meta: { slot: "breakfast" },
        created_at: "2026-11-02T08:00:00Z",
        updated_at: "2026-11-02T08:00:00Z",
      },
      {
        id: "6",
        user_id: "user-1",
        type: "meal_logged",
        occurred_at: "2026-11-02T13:00:00Z",
        summary: "Lunch: Rice, Dal and Paneer",
        ref_table: "meals",
        ref_id: "meal-2",
        meta: { slot: "lunch" },
        created_at: "2026-11-02T13:00:00Z",
        updated_at: "2026-11-02T13:00:00Z",
      },
      {
        id: "7",
        user_id: "user-1",
        type: "task_completed",
        occurred_at: "2026-11-02T14:00:00Z",
        summary: "Submit resume to recruiter",
        ref_table: "tasks",
        ref_id: "task-1",
        meta: {},
        created_at: "2026-11-02T14:00:00Z",
        updated_at: "2026-11-02T14:00:00Z",
      },
      {
        id: "8",
        user_id: "user-1",
        type: "task_completed",
        occurred_at: "2026-11-02T15:30:00Z",
        summary: "Review German flashcards",
        ref_table: "tasks",
        ref_id: "task-2",
        meta: {},
        created_at: "2026-11-02T15:30:00Z",
        updated_at: "2026-11-02T15:30:00Z",
      },
    ];

    const totals = calculateDayTotals(mockEvents);

    assert.equal(totals.minutesStudied, 105); // 45 + 60
    assert.equal(totals.totalSpentPaise, 35000); // 20000 + 15000 (₹350.00)
    assert.equal(totals.mealsCount, 2);
    assert.equal(totals.tasksCompleted, 2);
  });

  test("handles empty events without errors", () => {
    const totals = calculateDayTotals([]);
    assert.equal(totals.minutesStudied, 0);
    assert.equal(totals.totalSpentPaise, 0);
    assert.equal(totals.mealsCount, 0);
    assert.equal(totals.tasksCompleted, 0);
  });
});

describe("4. Quote of the Day Deterministic Engine", () => {
  test("returns the exact same quote for identical date input", () => {
    const q1 = getQuoteOfTheDay("2026-11-02");
    const q2 = getQuoteOfTheDay("2026-11-02");

    assert.equal(q1.text, q2.text);
    assert.equal(q1.author, q2.author);
  });

  test("contains non-empty author and thoughtful text", () => {
    const q = getQuoteOfTheDay("2026-11-02");
    assert.ok(q.text.length > 10);
    assert.ok(q.author.length > 2);
  });
});

describe("5. Dashboard Layouts & Breakpoint Grid Config", () => {
  test("defines all 11 core widgets in metadata", () => {
    assert.equal(ALL_WIDGET_IDS.length, 11);
    assert.equal(ALL_WIDGET_METAS.length, 11);

    const ids = ALL_WIDGET_METAS.map((m) => m.id);
    for (const expectedId of [
      "greeting",
      "priorities",
      "spending",
      "meals",
      "tasks",
      "habits",
      "timer",
      "timeline",
      "streaks",
      "activity_chart",
      "quick_note",
    ]) {
      assert.ok(ids.includes(expectedId as any), `Missing widget: ${expectedId}`);
    }
  });

  test("default layouts contain all 11 widgets within column limits", () => {
    const layouts = getDefaultLayouts();
    const breakpoints = [
      { name: "lg", maxCols: 12 },
      { name: "md", maxCols: 10 },
      { name: "sm", maxCols: 6 },
      { name: "xs", maxCols: 4 },
      { name: "xxs", maxCols: 2 },
    ] as const;

    for (const { name, maxCols } of breakpoints) {
      const items = layouts[name] || [];
      assert.equal(items.length, 11, `Breakpoint ${name} does not have all 11 widgets`);

      for (const item of items) {
        assert.ok(item.w > 0, `Widget ${item.i} in ${name} has width <= 0`);
        assert.ok(item.h > 0, `Widget ${item.i} in ${name} has height <= 0`);
        assert.ok(
          item.x + item.w <= maxCols,
          `Widget ${item.i} in ${name} exceeds max columns (${item.x + item.w} > ${maxCols})`
        );
      }
    }
  });
});
