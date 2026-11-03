// ============================================================================
// Sahil's Shore: Phase 11 Analytics & AI Coach Unit Tests
// Tests productivity score formula, skill heatmaps, Pearson correlation,
// privacy sanitization, and offline heuristic coach generation
// ============================================================================

import test, { describe } from "node:test";
import assert from "node:assert/strict";

import {
  calculateProductivityScore,
  getProductivityTier,
} from "../lib/analytics/productivity.ts";
import {
  normalizeSkillName,
  computeSkillBreakdown,
  computeFocusHoursHeatmap,
  computeSkillStreaks,
} from "../lib/analytics/skills.ts";
import { computeMoneyAnalytics } from "../lib/analytics/money.ts";
import {
  calculatePearsonCorrelation,
  interpretCorrelation,
  computePlacesSummary,
  computeMealsSummary,
} from "../lib/analytics/life.ts";
import { sanitizeContextForCoach } from "../lib/coach/sanitizer.ts";
import { generateOfflineHeuristicInsight } from "../lib/coach/providers.ts";
import {
  generateMonthlyMarkdownReport,
  generateDailyAnalyticsCsv,
} from "../lib/analytics/export.ts";
import type { AnalyticsBundle } from "../lib/analytics/types.ts";

describe("1. Transparent Productivity Score Formula", () => {
  test("calculates exact weighted score (40% tasks, 35% focus, 25% habits)", () => {
    // 100% on all 3
    const perfect = calculateProductivityScore({
      tasksCompleted: 5,
      tasksTotal: 5,
      focusMinutes: 120,
      focusTargetMinutes: 120,
      habitsCompleted: 4,
      habitsScheduled: 4,
    });
    assert.equal(perfect.taskScore, 100);
    assert.equal(perfect.focusScore, 100);
    assert.equal(perfect.habitScore, 100);
    assert.equal(perfect.overallScore, 100);

    // 50% tasks (40 * 0.5 = 20), 100% focus (35), 0% habits (0) -> 55
    const mixed = calculateProductivityScore({
      tasksCompleted: 2,
      tasksTotal: 4,
      focusMinutes: 120,
      focusTargetMinutes: 120,
      habitsCompleted: 0,
      habitsScheduled: 5,
    });
    assert.equal(mixed.taskScore, 50);
    assert.equal(mixed.focusScore, 100);
    assert.equal(mixed.habitScore, 0);
    assert.equal(mixed.overallScore, 55); // 20 + 35 + 0 = 55
  });

  test("handles zero targets gracefully without division by zero", () => {
    const zeroScheduled = calculateProductivityScore({
      tasksCompleted: 0,
      tasksTotal: 0,
      focusMinutes: 120,
      focusTargetMinutes: 0,
      habitsCompleted: 0,
      habitsScheduled: 0,
    });
    assert.equal(zeroScheduled.overallScore, 100);
  });

  test("clamps scores exceeding targets at 100%", () => {
    const overAchieved = calculateProductivityScore({
      tasksCompleted: 8,
      tasksTotal: 5,
      focusMinutes: 240,
      focusTargetMinutes: 120,
      habitsCompleted: 5,
      habitsScheduled: 3,
    });
    assert.equal(overAchieved.overallScore, 100);
    assert.equal(overAchieved.taskScore, 100);
    assert.equal(overAchieved.focusScore, 100);
  });

  test("maps scores to accurate productivity tier badges", () => {
    assert.equal(getProductivityTier(95).label, "Flow State");
    assert.equal(getProductivityTier(80).label, "Productive Tide");
    assert.equal(getProductivityTier(60).label, "Steady Current");
    assert.equal(getProductivityTier(40).label, "Gentle Shore");
  });
});

describe("2. Skill Normalization & 24x7 Focus Heatmap", () => {
  test("normalizes diverse skill activity names into core tracks", () => {
    assert.equal(normalizeSkillName("LeetCode Practice"), "DSA");
    assert.equal(normalizeSkillName("DSA Graph Algorithms"), "DSA");
    assert.equal(normalizeSkillName("Spring Boot JPA Microservices"), "SpringBoot");
    assert.equal(normalizeSkillName("Java Core"), "SpringBoot");
    assert.equal(normalizeSkillName("MERN Stack Frontend"), "MERN");
    assert.equal(normalizeSkillName("Next.js App Router"), "MERN");
    assert.equal(normalizeSkillName("German Pronunciation Lab"), "German");
    assert.equal(normalizeSkillName("Deutsch Vocab Flashcards"), "German");
    assert.equal(normalizeSkillName("Gym Workout"), "Other");
  });

  test("computes skill breakdown hours and percentages accurately", () => {
    const logs = [
      { id: "1", activity_id: "a1", duration_minutes: 120, started_at: "2026-11-04T05:00:00Z", activity_name: "DSA" },
      { id: "2", activity_id: "a2", duration_minutes: 60, started_at: "2026-11-04T07:00:00Z", activity_name: "Spring Boot" },
      { id: "3", activity_id: "a3", duration_minutes: 60, started_at: "2026-11-04T09:00:00Z", activity_name: "German" },
    ];

    const { breakdown, totalFocusMinutes } = computeSkillBreakdown(logs);
    assert.equal(totalFocusMinutes, 240);

    const dsa = breakdown.find((b) => b.skill.includes("DSA"));
    assert.ok(dsa);
    assert.equal(dsa.minutes, 120);
    assert.equal(dsa.hours, 2);
    assert.equal(dsa.percentage, 50);
  });

  test("generates 24x7 focus hours heatmap grid in IST", () => {
    // 04:30 UTC on 2026-11-04 corresponds to 10:00 AM IST on Wednesday (weekdayIndex 3)
    const logs = [
      { id: "1", activity_id: "a1", duration_minutes: 45, started_at: "2026-11-04T04:30:00.000Z" },
    ];
    const heatmap = computeFocusHoursHeatmap(logs);
    assert.equal(heatmap.length, 7 * 24); // 168 cells

    const targetCell = heatmap.find((c) => c.weekdayName === "Wed" && c.hour === 10);
    assert.ok(targetCell, "Target Wednesday 10 AM IST cell must exist");
    assert.equal(targetCell.minutes, 45);
    assert.ok(targetCell.intensity >= 2);
  });
});

describe("3. Money Analytics & Budget Adherence (Paise)", () => {
  test("aggregates total spend, daily average, and projected month in paise", () => {
    const expenses = [
      { id: "1", amount_paise: 50000, category_id: "cat_food", place: "Blinkit", spent_at: "2026-11-01T10:00:00Z" },
      { id: "2", amount_paise: 150000, category_id: "cat_tech", place: "Amazon", spent_at: "2026-11-02T12:00:00Z" },
    ];
    const budgets = [
      { category_id: "cat_food", category_name: "Food", monthly_budget_paise: 100000 },
    ];

    const res = computeMoneyAnalytics(expenses, budgets, 10);
    assert.equal(res.totalPaise, 200000);
    assert.equal(res.totalRupees, 2000);
    assert.equal(res.dailyAveragePaise, 20000);
    assert.equal(res.dailyAverageRupees, 200);
    assert.equal(res.projectedMonthPaise, 600000);

    // Budget check: 50,000 / 100,000 = 50% -> 'normal'
    assert.equal(res.budgetAdherence[0].percentage, 50);
    assert.equal(res.budgetAdherence[0].status, "normal");
  });

  test("triggers amber status at 80% and danger at 100% budget spend", () => {
    const expensesAmber = [
      { id: "1", amount_paise: 85000, category_id: "c1", spent_at: "2026-11-01T10:00:00Z" },
    ];
    const budgets = [
      { category_id: "c1", category_name: "Food", monthly_budget_paise: 100000 },
    ];
    const amberRes = computeMoneyAnalytics(expensesAmber, budgets, 5);
    assert.equal(amberRes.budgetAdherence[0].status, "amber");

    const expensesDanger = [
      { id: "1", amount_paise: 120000, category_id: "c1", spent_at: "2026-11-01T10:00:00Z" },
    ];
    const dangerRes = computeMoneyAnalytics(expensesDanger, budgets, 5);
    assert.equal(dangerRes.budgetAdherence[0].status, "danger");
  });
});

describe("4. Pearson Correlation Engine & Non-Causation Disclaimers", () => {
  test("computes perfect positive and negative Pearson correlations", () => {
    const x = [1, 2, 3, 4, 5];
    const yPerfPos = [10, 20, 30, 40, 50];
    const yPerfNeg = [50, 40, 30, 20, 10];

    assert.equal(calculatePearsonCorrelation(x, yPerfPos), 1);
    assert.equal(calculatePearsonCorrelation(x, yPerfNeg), -1);
  });

  test("handles zero-variance or insufficient data without NaN", () => {
    assert.equal(calculatePearsonCorrelation([1, 1, 1], [1, 2, 3]), 0);
    assert.equal(calculatePearsonCorrelation([1], [2]), 0);
  });

  test("interprets correlation with human-friendly descriptions", () => {
    const metric = interpretCorrelation(0.72, "mood_prod");
    assert.equal(metric.direction, "positive");
    assert.equal(metric.strength, "strong");
    assert.ok(metric.label.includes("Positive"));
  });

  test("places and meals summaries group dining and explorations", () => {
    const places = [
      { id: "1", name: "Marina Beach", category: "beach" },
      { id: "2", name: "Marina Beach", category: "beach" },
      { id: "3", name: "Third Wave Coffee", category: "cafe" },
    ];
    const pSum = computePlacesSummary(places);
    assert.equal(pSum.totalVisits, 3);
    assert.equal(pSum.uniquePlacesCount, 2);
    assert.equal(pSum.topPlaces[0].name, "Marina Beach");
    assert.equal(pSum.topPlaces[0].visits, 2);

    const meals = [
      { id: "1", slot: "breakfast", restaurant: "Home Kitchen", cost_paise: 0 },
      { id: "2", slot: "dinner", restaurant: "Dosa Corner", cost_paise: 25000 },
    ];
    const mSum = computeMealsSummary(meals);
    assert.equal(mSum.homeMeals, 1);
    assert.equal(mSum.restaurantMeals, 1);
    assert.equal(mSum.outsideFoodPaise, 25000);
    assert.equal(mSum.outsideFoodRupees, 250);
  });
});

describe("5. AI Coach Privacy Sanitizer", () => {
  test("scrubs GPS coordinates, media URLs, and credentials before LLM prompt", () => {
    const sanitized = sanitizeContextForCoach({
      targetDate: "2026-11-04",
      isToday: true,
      timelineRows: [
        {
          type: "place_visited",
          summary: "Visited cafe at 12.9716, 77.5946 with secret key password=secret123",
          occurred_at: "2026-11-04T05:00:00Z",
        },
        {
          type: "media_uploaded",
          summary: "Uploaded receipt receipt_november_01.jpg via https://storage.supabase.co/xyz",
          occurred_at: "2026-11-04T06:00:00Z",
        },
      ],
      stats: {
        periodStart: "2026-10-22",
        periodEnd: "2026-11-04",
        averageProductivityScore: 82,
        totalFocusHours: 24,
        skillHours: { dsa: 10, springBoot: 8, mern: 4, german: 2, other: 0 },
        habitsCompletionRate: 90,
        tasksCompletedCount: 15,
        tasksPendingCount: 2,
        totalSpendRupees: 5000,
        averageDailySpendRupees: 357,
        averageMood: 4.5,
      },
      optInJournal: false,
    });

    const event1 = sanitized.timelineEvents[0].summary;
    const event2 = sanitized.timelineEvents[1].summary;

    assert.ok(!event1.includes("12.9716, 77.5946"), "GPS coordinates must be stripped");
    assert.ok(event1.includes("[location]"), "Replaced with [location]");
    assert.ok(!event2.includes("receipt_november_01.jpg"), "Media filenames must be stripped");
    assert.ok(!event2.includes("https://storage.supabase.co"), "Raw URLs must be stripped");
    assert.equal(sanitized.stats14Days.optInJournalIncluded, false);
    assert.equal(sanitized.stats14Days.journalHighlights, undefined);
  });

  test("includes sanitized journal highlights only when optInJournal is true", () => {
    const withOptIn = sanitizeContextForCoach({
      targetDate: "2026-11-04",
      isToday: true,
      timelineRows: [],
      stats: {
        periodStart: "2026-10-22",
        periodEnd: "2026-11-04",
        averageProductivityScore: 80,
        totalFocusHours: 10,
        skillHours: { dsa: 5, springBoot: 5, mern: 0, german: 0, other: 0 },
        habitsCompletionRate: 80,
        tasksCompletedCount: 5,
        tasksPendingCount: 1,
        totalSpendRupees: 1000,
        averageDailySpendRupees: 100,
        averageMood: 4,
      },
      journalRows: [
        {
          date: "2026-11-04",
          wins: "Solved binary tree traversal and contact me at sahil@example.com",
          lessons: "Review edge cases with zero input",
        },
      ],
      optInJournal: true,
    });

    assert.equal(withOptIn.stats14Days.optInJournalIncluded, true);
    assert.ok(withOptIn.stats14Days.journalHighlights);
    assert.ok(!withOptIn.stats14Days.journalHighlights[0].includes("sahil@example.com"));
    assert.ok(withOptIn.stats14Days.journalHighlights[0].includes("[email]"));
  });
});

describe("6. Offline Heuristic AI Coach Synthesizer", () => {
  test("generates coherent 3-line summary, pattern, 3 priorities, and gentle nudge without external API", () => {
    const context = {
      targetDate: "2026-11-04",
      isToday: true,
      timelineEvents: [
        { type: "task_completed", summary: "Solved 2 DSA Graph problems", timeIST: "10:30 AM" },
        { type: "study_session", summary: "Spring Boot Security tutorial", timeIST: "2:00 PM" },
      ],
      stats14Days: {
        periodStart: "2026-10-22",
        periodEnd: "2026-11-04",
        daysAnalyzed: 14,
        averageProductivityScore: 85,
        totalFocusHours: 26,
        skillHours: { dsa: 14, springBoot: 8, mern: 2, german: 2, other: 0 },
        habitsCompletionRate: 92,
        tasksCompletedCount: 22,
        tasksPendingCount: 3,
        totalSpendRupees: 4200,
        averageDailySpendRupees: 300,
        averageMood: 4.3,
        optInJournalIncluded: false,
      },
    };

    const insight = generateOfflineHeuristicInsight(context);

    // 1. Exactly 3 non-empty lines
    const lines = insight.summary.split("\n").filter((l) => l.trim().length > 0);
    assert.equal(lines.length, 3, "Summary must be exactly 3 lines");

    // 2. Pattern noticed
    assert.ok(insight.pattern.length > 10, "Pattern noticed must be non-empty");

    // 3. Exactly 3 suggested priorities for tomorrow
    assert.equal(insight.suggestedPriorities.length, 3, "Must return 3 priorities");

    // 4. Gentle nudge
    assert.ok(insight.gentleNudge.length > 5, "Gentle nudge must be non-empty");
    assert.equal(insight.provider, "heuristic");
  });
});

describe("7. Exportable Monthly Report Engine", () => {
  test("generates valid markdown report with required sections", () => {
    const dummyBundle: AnalyticsBundle = {
      dateRange: { startDate: "2026-10-01", endDate: "2026-10-31", label: "October 2026", preset: "month" },
      productivity: {
        overallScore: 88,
        taskScore: 90,
        focusScore: 85,
        habitScore: 88,
        tasksCompleted: 45,
        tasksTotal: 50,
        focusMinutes: 3600,
        focusTargetMinutes: 4000,
        habitsCompleted: 90,
        habitsScheduled: 100,
        formulaExplanation: {
          taskWeight: 0.4,
          focusWeight: 0.35,
          habitWeight: 0.25,
          description: "40% Tasks + 35% Focus + 25% Habits",
        },
      },
      skills: {
        breakdown: [
          { skill: "DSA", hours: 25, minutes: 1500, percentage: 42, color: "#1F7A8C", sessionsCount: 20 },
          { skill: "Spring Boot", hours: 20, minutes: 1200, percentage: 33, color: "#E0A458", sessionsCount: 15 },
        ],
        trends: [],
        heatmap: [],
        streaks: [{ name: "DSA", currentStreak: 12, longestStreak: 18, totalMinutes: 1500, lastActiveDate: "2026-10-31" }],
        totalFocusMinutes: 3600,
      },
      money: {
        totalPaise: 2500000,
        totalRupees: 25000,
        dailyAveragePaise: 80645,
        dailyAverageRupees: 806.45,
        projectedMonthPaise: 2500000,
        projectedMonthRupees: 25000,
        byCategory: [{ categoryId: "c1", name: "Food", paise: 1200000, rupees: 12000, percentage: 48 }],
        byPlace: [{ place: "Zepto", paise: 500000, rupees: 5000, count: 8 }],
        byWeekday: [],
        budgetAdherence: [{ categoryId: "c1", categoryName: "Food", spentPaise: 1200000, budgetPaise: 1500000, percentage: 80, status: "amber" }],
        monthOverMonth: { currentMonthLabel: "Oct", currentPaise: 2500000, previousMonthLabel: "Sep", previousPaise: 2200000, differencePaise: 300000, percentageChange: 14 },
      },
      life: {
        dailyPoints: [
          { date: "2026-10-01", mood: 4, energy: 4, productivityScore: 85, spendPaise: 50000, spendRupees: 500, focusMinutes: 120 },
        ],
        moodVsProductivity: { r: 0.65, direction: "positive", strength: "strong", label: "Positive (+0.65)", interpretation: "High mood aligns with output" },
        moodVsSpending: { r: 0.05, direction: "none", strength: "none", label: "Neutral (+0.05)", interpretation: "Independent" },
        productivityVsSpending: { r: -0.12, direction: "none", strength: "none", label: "Neutral (-0.12)", interpretation: "Independent" },
        places: { totalVisits: 8, uniquePlacesCount: 4, topPlaces: [{ name: "City Library", visits: 5, category: "library" }] },
        meals: { totalLogged: 60, homeMeals: 48, restaurantMeals: 12, otherMeals: 0, outsideFoodPaise: 600000, outsideFoodRupees: 6000, topEateries: [] },
      },
    };

    const md = generateMonthlyMarkdownReport(dummyBundle);
    assert.ok(md.includes("# Sahil's Shore: Monthly Executive Report"));
    assert.ok(md.includes("Overall Productivity Score:** 88 / 100"));
    assert.ok(md.includes("Correlation is not causation"));
    assert.ok(md.includes("Total Expenditure:** ₹25,000.00"));

    const csv = generateDailyAnalyticsCsv(dummyBundle);
    assert.ok(csv.startsWith("Date (IST),Productivity Score,Focus Minutes"));
    assert.ok(csv.includes("2026-10-01,85,120"));
  });
});
