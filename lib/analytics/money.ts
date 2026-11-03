// ============================================================================
// Sahil's Shore: Money Analytics Engine
// Paise-accurate calculations, category/place/weekday breakdown, budget adherence
// ============================================================================

import type {
  MoneyAnalyticsSummary,
  SpendCategoryItem,
  SpendPlaceItem,
  SpendWeekdayItem,
  BudgetAdherenceItem,
  MonthOverMonthSpend,
} from "./types";
import { paiseToRupees } from "../expenses/index.ts";
import { utcToZonedDate } from "../date-utils.ts";

export interface RawExpense {
  id: string;
  amount_paise: number;
  category_id?: string | null;
  category_name?: string | null;
  place?: string | null;
  spent_at: string; // UTC ISO
}

export interface RawBudget {
  category_id: string;
  category_name?: string;
  monthly_budget_paise: number;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Computes money analytics summary from raw expenses and budgets.
 */
export function computeMoneyAnalytics(
  expenses: RawExpense[],
  budgets: RawBudget[],
  daysCount: number,
  previousMonthExpenses: RawExpense[] = []
): MoneyAnalyticsSummary {
  let totalPaise = 0;
  const categoryMap: Record<string, { name: string; paise: number }> = {};
  const placeMap: Record<string, { paise: number; count: number }> = {};
  const weekdayMap: Record<number, { paise: number; count: number }> = {
    0: { paise: 0, count: 0 },
    1: { paise: 0, count: 0 },
    2: { paise: 0, count: 0 },
    3: { paise: 0, count: 0 },
    4: { paise: 0, count: 0 },
    5: { paise: 0, count: 0 },
    6: { paise: 0, count: 0 },
  };

  for (const exp of expenses) {
    const amt = Number(exp.amount_paise) || 0;
    totalPaise += amt;

    // Category
    const catId = exp.category_id || "uncategorized";
    const catName = exp.category_name || "General";
    if (!categoryMap[catId]) {
      categoryMap[catId] = { name: catName, paise: 0 };
    }
    categoryMap[catId].paise += amt;

    // Place
    const place = (exp.place || "").trim();
    if (place) {
      if (!placeMap[place]) {
        placeMap[place] = { paise: 0, count: 0 };
      }
      placeMap[place].paise += amt;
      placeMap[place].count += 1;
    }

    // Weekday in IST
    if (exp.spent_at) {
      const istDate = utcToZonedDate(exp.spent_at);
      const dayIndex = istDate.getUTCDay();
      weekdayMap[dayIndex].paise += amt;
      weekdayMap[dayIndex].count += 1;
    }
  }

  // Category items
  const byCategory: SpendCategoryItem[] = Object.entries(categoryMap)
    .map(([id, val]) => ({
      categoryId: id,
      name: val.name,
      paise: val.paise,
      rupees: paiseToRupees(val.paise),
      percentage: totalPaise > 0 ? Math.round((val.paise / totalPaise) * 100) : 0,
    }))
    .sort((a, b) => b.paise - a.paise);

  // Place items (top 8)
  const byPlace: SpendPlaceItem[] = Object.entries(placeMap)
    .map(([place, val]) => ({
      place,
      paise: val.paise,
      rupees: paiseToRupees(val.paise),
      count: val.count,
    }))
    .sort((a, b) => b.paise - a.paise)
    .slice(0, 8);

  // Weekday items: Mon to Sun
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
  const byWeekday: SpendWeekdayItem[] = weekdayOrder.map((w) => ({
    weekday: WEEKDAY_NAMES[w],
    paise: weekdayMap[w].paise,
    rupees: paiseToRupees(weekdayMap[w].paise),
    count: weekdayMap[w].count,
  }));

  // Budget Adherence
  const budgetAdherence: BudgetAdherenceItem[] = budgets.map((b) => {
    const spent = categoryMap[b.category_id]?.paise || 0;
    const bPaise = Number(b.monthly_budget_paise) || 0;
    const pct = bPaise > 0 ? Math.round((spent / bPaise) * 100) : 0;
    let status: "normal" | "amber" | "danger" = "normal";
    if (pct >= 100) status = "danger";
    else if (pct >= 80) status = "amber";

    return {
      categoryId: b.category_id,
      categoryName: b.category_name || "Category",
      spentPaise: spent,
      budgetPaise: bPaise,
      percentage: pct,
      status,
    };
  });

  // Daily average and projected month spend
  const validDays = Math.max(1, daysCount);
  const dailyAveragePaise = Math.round(totalPaise / validDays);
  const projectedMonthPaise = dailyAveragePaise * 30;

  // Month-over-month calculation
  let prevTotalPaise = 0;
  for (const prev of previousMonthExpenses) {
    prevTotalPaise += Number(prev.amount_paise) || 0;
  }

  const diffPaise = totalPaise - prevTotalPaise;
  const pctChange =
    prevTotalPaise > 0
      ? Math.round(((totalPaise - prevTotalPaise) / prevTotalPaise) * 100)
      : totalPaise > 0
      ? 100
      : 0;

  const monthOverMonth: MonthOverMonthSpend = {
    currentMonthLabel: "Current Period",
    currentPaise: totalPaise,
    previousMonthLabel: "Previous Period",
    previousPaise: prevTotalPaise,
    differencePaise: diffPaise,
    percentageChange: pctChange,
  };

  return {
    totalPaise,
    totalRupees: paiseToRupees(totalPaise),
    dailyAveragePaise,
    dailyAverageRupees: paiseToRupees(dailyAveragePaise),
    projectedMonthPaise,
    projectedMonthRupees: paiseToRupees(projectedMonthPaise),
    byCategory,
    byPlace,
    byWeekday,
    budgetAdherence,
    monthOverMonth,
  };
}
