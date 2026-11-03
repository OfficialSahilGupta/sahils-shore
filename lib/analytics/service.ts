// ============================================================================
// Sahil's Shore: Analytics Service Data Aggregator
// Fetches real data across modules and calculates unified metrics for any date range
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  AnalyticsBundle,
  DateRange,
  DateRangePreset,
  DailyCorrelationPoint,
} from "./types";
import {
  todayIST,
  addDaysIST,
  getISTDateRangeUTC,
  diffDaysIST,
  utcToZonedDate,
} from "@/lib/date-utils";
import { calculateProductivityScore } from "./productivity";
import {
  computeSkillBreakdown,
  computeDailySkillTrends,
  computeFocusHoursHeatmap,
  computeSkillStreaks,
  RawActivityLog,
  RawActivity,
} from "./skills";
import { computeMoneyAnalytics, RawExpense, RawBudget } from "./money";
import {
  calculatePearsonCorrelation,
  interpretCorrelation,
  computePlacesSummary,
  computeMealsSummary,
} from "./life";
import { paiseToRupees } from "@/lib/expenses";

/**
 * Resolves a date range preset into concrete IST start and end date strings.
 */
export function resolveDateRange(preset: DateRangePreset, customRange?: { start: string; end: string }): DateRange {
  const today = todayIST();

  if (preset === "custom" && customRange) {
    return {
      startDate: customRange.start,
      endDate: customRange.end,
      label: `${customRange.start} to ${customRange.end}`,
      preset: "custom",
    };
  }

  switch (preset) {
    case "7d":
      return {
        startDate: addDaysIST(today, -6),
        endDate: today,
        label: "Last 7 Days",
        preset: "7d",
      };
    case "30d":
      return {
        startDate: addDaysIST(today, -29),
        endDate: today,
        label: "Last 30 Days",
        preset: "30d",
      };
    case "90d":
      return {
        startDate: addDaysIST(today, -89),
        endDate: today,
        label: "Last 90 Days",
        preset: "90d",
      };
    case "month": {
      const startOfMonth = `${today.slice(0, 7)}-01`;
      return {
        startDate: startOfMonth,
        endDate: today,
        label: "This Month (MTD)",
        preset: "month",
      };
    }
    case "year": {
      const startOfYear = `${today.slice(0, 4)}-01-01`;
      return {
        startDate: startOfYear,
        endDate: today,
        label: "Year to Date (YTD)",
        preset: "year",
      };
    }
    default:
      return {
        startDate: addDaysIST(today, -29),
        endDate: today,
        label: "Last 30 Days",
        preset: "30d",
      };
  }
}

/**
 * Builds an array of sequential YYYY-MM-DD date strings between start and end inclusive.
 */
export function getDateListBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cur = startDate;
  while (cur <= endDate) {
    dates.push(cur);
    cur = addDaysIST(cur, 1);
  }
  return dates;
}

/**
 * Aggregates all live data from Supabase across all modules to build the AnalyticsBundle.
 */
export async function fetchAnalyticsBundle(
  supabase: SupabaseClient<Database>,
  userId: string,
  range: DateRange
): Promise<AnalyticsBundle> {
  const { startDate, endDate } = range;
  const startUTC = getISTDateRangeUTC(startDate).startUTC;
  const endUTC = getISTDateRangeUTC(endDate).endUTC;
  const dateList = getDateListBetween(startDate, endDate);
  const daysCount = Math.max(1, dateList.length);

  // 1. Fetch Tasks
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select("id, status, due_date, completed_at, priority")
    .eq("user_id", userId)
    .or(`due_date.gte.${startDate},completed_at.gte.${startUTC}`);

  // 2. Fetch Activities & Activity Logs
  const { data: rawActivities } = await supabase
    .from("activities")
    .select("id, name, daily_target_minutes, color, is_active")
    .eq("user_id", userId);

  const { data: rawActivityLogs } = await supabase
    .from("activity_logs")
    .select("id, activity_id, duration_seconds, started_at, notes")
    .eq("user_id", userId)
    .gte("started_at", startUTC)
    .lte("started_at", endUTC);

  // 3. Fetch Habits & Habit Logs
  const { data: rawHabits } = await supabase
    .from("habits")
    .select("id, title, frequency, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  const { data: rawHabitLogs } = await supabase
    .from("habit_logs")
    .select("id, habit_id, logged_date, completed")
    .eq("user_id", userId)
    .gte("logged_date", startDate)
    .lte("logged_date", endDate);

  // 4. Fetch Expenses & Categories
  const { data: rawCategories } = await supabase
    .from("expense_categories")
    .select("id, name, color")
    .eq("user_id", userId);

  const { data: rawExpenses } = await supabase
    .from("expenses")
    .select("id, amount_paise, category_id, place, spent_at")
    .eq("user_id", userId)
    .gte("spent_at", startUTC)
    .lte("spent_at", endUTC);

  // Previous period expenses for MoM comparison
  const prevPeriodStart = addDaysIST(startDate, -daysCount);
  const prevPeriodEnd = addDaysIST(startDate, -1);
  const prevStartUTC = getISTDateRangeUTC(prevPeriodStart).startUTC;
  const prevEndUTC = getISTDateRangeUTC(prevPeriodEnd).endUTC;

  const { data: prevExpenses } = await supabase
    .from("expenses")
    .select("id, amount_paise, spent_at")
    .eq("user_id", userId)
    .gte("spent_at", prevStartUTC)
    .lte("spent_at", prevEndUTC);

  // 5. Fetch Budgets
  const { data: rawBudgets } = await supabase
    .from("budgets")
    .select("id, category_id, amount_paise")
    .eq("user_id", userId);

  // 6. Fetch Meals
  const { data: rawMeals } = await supabase
    .from("meals")
    .select("id, meal_type, restaurant_name, location_type, expense_id, eaten_at")
    .eq("user_id", userId)
    .gte("eaten_at", startUTC)
    .lte("eaten_at", endUTC);

  // 7. Fetch Places
  const { data: rawPlaces } = await supabase
    .from("places")
    .select("id, name, category, visited_at")
    .eq("user_id", userId)
    .gte("visited_at", startUTC)
    .lte("visited_at", endUTC);

  // 8. Fetch Journal Entries
  const { data: rawJournal } = await supabase
    .from("journal_entries")
    .select("id, entry_date, mood, energy")
    .eq("user_id", userId)
    .gte("entry_date", startDate)
    .lte("entry_date", endDate);

  // ==========================================================================
  // Process & Combine Data
  // ==========================================================================

  // Map category names to expenses
  const categoryMap = new Map<string, string>();
  for (const c of rawCategories || []) {
    categoryMap.set(c.id, c.name);
  }

  const expenses: RawExpense[] = (rawExpenses || []).map((e) => ({
    id: e.id,
    amount_paise: Number(e.amount_paise) || 0,
    category_id: e.category_id,
    category_name: e.category_id ? categoryMap.get(e.category_id) || "General" : "General",
    place: e.place,
    spent_at: e.spent_at,
  }));

  const budgets: RawBudget[] = (rawBudgets || []).map((b) => ({
    category_id: b.category_id,
    category_name: categoryMap.get(b.category_id) || "Category",
    monthly_budget_paise: Number(b.amount_paise) || 0,
  }));

  // Activity mapping
  const activityMap = new Map<string, string>();
  for (const a of rawActivities || []) {
    activityMap.set(a.id, a.name);
  }

  const activityLogs: RawActivityLog[] = (rawActivityLogs || []).map((l) => ({
    id: l.id,
    activity_id: l.activity_id,
    duration_minutes: Math.round((Number(l.duration_seconds) || 0) / 60),
    started_at: l.started_at,
    notes: l.notes,
    activity_name: activityMap.get(l.activity_id) || "Focus Session",
  }));

  // Productivity Score Calculation
  const tasksDueOrCompleted = (rawTasks || []).filter((t) => {
    if (t.due_date && t.due_date >= startDate && t.due_date <= endDate) return true;
    if (t.completed_at && t.completed_at >= startUTC && t.completed_at <= endUTC) return true;
    return false;
  });
  const tasksCompleted = tasksDueOrCompleted.filter((t) => t.status === "completed").length;
  const tasksTotal = Math.max(tasksCompleted, tasksDueOrCompleted.length);

  let focusMinutes = 0;
  for (const l of activityLogs) {
    focusMinutes += Math.max(0, l.duration_minutes || 0);
  }
  // Benchmark target: e.g. 120 mins per day
  const focusTargetMinutes = daysCount * 120;

  const activeHabitsCount = (rawHabits || []).length;
  const habitsScheduled = daysCount * Math.max(1, activeHabitsCount);
  const habitsCompleted = (rawHabitLogs || []).filter((h) => h.completed === true).length;

  const productivity = calculateProductivityScore({
    tasksCompleted,
    tasksTotal,
    focusMinutes,
    focusTargetMinutes,
    habitsCompleted,
    habitsScheduled,
  });

  // Skills Breakdown & Heatmap
  const { breakdown, totalFocusMinutes } = computeSkillBreakdown(activityLogs);
  const trends = computeDailySkillTrends(activityLogs, dateList);
  const heatmap = computeFocusHoursHeatmap(activityLogs);
  const streaks = computeSkillStreaks(
    (rawActivities || []).map((a) => ({
      id: a.id,
      name: a.name,
      target_minutes: a.daily_target_minutes,
      color: a.color,
    })),
    activityLogs,
    todayIST()
  );

  // Money Analytics
  const money = computeMoneyAnalytics(
    expenses,
    budgets,
    daysCount,
    (prevExpenses || []).map((p) => ({
      id: p.id,
      amount_paise: Number(p.amount_paise) || 0,
      spent_at: p.spent_at,
    }))
  );

  // Life Correlations
  const journalMap = new Map<string, { mood: number | null; energy: number | null }>();
  for (const j of rawJournal || []) {
    journalMap.set(j.entry_date, { mood: j.mood, energy: j.energy });
  }

  // Daily spend map
  const dailySpendMap = new Map<string, number>();
  for (const e of expenses) {
    if (e.spent_at) {
      const dStr = utcToZonedDate(e.spent_at).toISOString().slice(0, 10);
      dailySpendMap.set(dStr, (dailySpendMap.get(dStr) || 0) + e.amount_paise);
    }
  }

  // Daily focus map
  const dailyFocusMap = new Map<string, number>();
  for (const l of activityLogs) {
    if (l.started_at) {
      const dStr = utcToZonedDate(l.started_at).toISOString().slice(0, 10);
      dailyFocusMap.set(dStr, (dailyFocusMap.get(dStr) || 0) + l.duration_minutes);
    }
  }

  // Daily correlation points
  const dailyPoints: DailyCorrelationPoint[] = dateList.map((d) => {
    const j = journalMap.get(d);
    const sPaise = dailySpendMap.get(d) || 0;
    const fMins = dailyFocusMap.get(d) || 0;

    // Approximate daily productivity score
    const dayScore = Math.min(
      100,
      Math.round((Math.min(120, fMins) / 120) * 70 + (j?.mood ? (j.mood / 5) * 30 : 20))
    );

    return {
      date: d,
      mood: j?.mood ?? null,
      energy: j?.energy ?? null,
      productivityScore: dayScore,
      spendPaise: sPaise,
      spendRupees: paiseToRupees(sPaise),
      focusMinutes: fMins,
    };
  });

  // Calculate Pearson correlations across valid days where mood is provided
  const validMoodDays = dailyPoints.filter((p) => p.mood !== null);
  const moods = validMoodDays.map((p) => p.mood!);
  const prods = validMoodDays.map((p) => p.productivityScore);
  const spends = validMoodDays.map((p) => p.spendRupees);
  const allProds = dailyPoints.map((p) => p.productivityScore);
  const allSpends = dailyPoints.map((p) => p.spendRupees);

  const rMoodProd = calculatePearsonCorrelation(moods, prods);
  const rMoodSpend = calculatePearsonCorrelation(moods, spends);
  const rProdSpend = calculatePearsonCorrelation(allProds, allSpends);

  const placesSummary = computePlacesSummary(rawPlaces || []);
  const mealsSummary = computeMealsSummary(
    (rawMeals || []).map((m) => ({
      id: m.id,
      slot: m.meal_type,
      restaurant: m.restaurant_name,
      cost_paise: 0,
      eaten_at: m.eaten_at,
    }))
  );

  return {
    dateRange: range,
    productivity,
    skills: {
      breakdown,
      trends,
      heatmap,
      streaks,
      totalFocusMinutes,
    },
    money,
    life: {
      dailyPoints,
      moodVsProductivity: interpretCorrelation(rMoodProd, "mood_prod"),
      moodVsSpending: interpretCorrelation(rMoodSpend, "mood_spend"),
      productivityVsSpending: interpretCorrelation(rProdSpend, "prod_spend"),
      places: placesSummary,
      meals: mealsSummary,
    },
  };
}
