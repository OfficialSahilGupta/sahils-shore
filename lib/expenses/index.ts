// ============================================================================
// Sahil's Shore: Expense Tracker Data Access & Domain Logic
// Paise-accurate calculations, Indian currency formatting, monthly budgets,
// recurring expense generation, spending insights, and CSV export.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.ts";
import type { Expense, ExpenseCategory, Income, Budget, RecurringExpense } from "../../types/index.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { getISTDateString, todayIST, diffDaysIST, getISTDayOfWeek } from "../date-utils.ts";

// ----------------------------------------------------------------------------
// 1. Currency & Paise Utilities (Strict Integer Calculations)
// ----------------------------------------------------------------------------

/**
 * Formats a non-negative integer using the Indian numbering system grouping:
 * e.g., 1234567 -> "12,34,567"
 */
export function formatIndianNumber(num: number): string {
  const s = Math.floor(Math.abs(num)).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const other = s.slice(0, -3);
  const formattedOther = other.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${formattedOther},${last3}`;
}

/**
 * Converts integer paise to Indian Rupee formatted string.
 * Example: 12345600 -> "₹1,23,456.00", 5025 -> "₹50.25", 1000 -> "₹10.00"
 */
export function formatINR(
  paise: number,
  options?: { showPaise?: boolean; prefix?: string }
): string {
  const prefix = options?.prefix !== undefined ? options.prefix : "₹";
  const showPaise = options?.showPaise !== undefined ? options.showPaise : true;

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const wholeRupees = Math.floor(absPaise / 100);
  const remPaise = absPaise % 100;

  const formattedRupees = formatIndianNumber(wholeRupees);
  const formattedPaise = remPaise.toString().padStart(2, "0");

  const amountStr = showPaise
    ? `${formattedRupees}.${formattedPaise}`
    : formattedRupees;

  return `${isNegative ? "-" : ""}${prefix}${amountStr}`;
}

/**
 * Converts rupee string or number to integer paise, avoiding IEEE-754 float drift.
 * Example: "10.50" -> 1050, 10.5 -> 1050, "500" -> 50000
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === "string") {
    const cleaned = rupees.replace(/[^0-9.-]/g, "").trim();
    if (!cleaned || isNaN(Number(cleaned))) return 0;
    const parts = cleaned.split(".");
    const whole = parseInt(parts[0] || "0", 10);
    const fracStr = (parts[1] || "").slice(0, 2).padEnd(2, "0");
    const frac = parseInt(fracStr, 10);
    const sign = cleaned.startsWith("-") ? -1 : 1;
    return sign * (Math.abs(whole) * 100 + frac);
  }
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to standard rupee float (only for UI input display).
 */
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

// ----------------------------------------------------------------------------
// 2. Budget Math & Status Thresholds
// ----------------------------------------------------------------------------

export type BudgetStatusColor = "normal" | "amber" | "red";

export interface BudgetStatus {
  spentPaise: number;
  budgetPaise: number;
  percentage: number;
  remainingPaise: number;
  overspendPaise: number;
  isOver: boolean;
  statusColor: BudgetStatusColor;
}

/**
 * Calculates budget utilization and status color according to Shore design:
 * - Below 80%: "normal" (calm teal/green)
 * - 80% to 99.9%: "amber" (warning sunset)
 * - 100% and above: "red" (danger)
 */
export function calculateBudgetStatus(
  spentPaise: number,
  budgetPaise: number
): BudgetStatus {
  const safeSpent = Math.max(0, spentPaise);
  const safeBudget = Math.max(0, budgetPaise);

  let percentage = 0;
  if (safeBudget > 0) {
    percentage = Math.round((safeSpent / safeBudget) * 100 * 10) / 10;
  } else if (safeSpent > 0) {
    percentage = 100;
  }

  const remainingPaise = Math.max(0, safeBudget - safeSpent);
  const overspendPaise = Math.max(0, safeSpent - safeBudget);
  const isOver = safeSpent > safeBudget && safeBudget > 0;

  let statusColor: BudgetStatusColor = "normal";
  if (percentage >= 100) {
    statusColor = "red";
  } else if (percentage >= 80) {
    statusColor = "amber";
  }

  return {
    spentPaise: safeSpent,
    budgetPaise: safeBudget,
    percentage,
    remainingPaise,
    overspendPaise,
    isOver,
    statusColor,
  };
}

// ----------------------------------------------------------------------------
// 3. Spending Insights & Analytics
// ----------------------------------------------------------------------------

export interface SpendingInsights {
  weekendSpendPaise: number;
  weekdaySpendPaise: number;
  weekendDaysCount: number;
  weekdayDaysCount: number;
  weekendDailyAvgPaise: number;
  weekdayDailyAvgPaise: number;
  weekendWeekdayComparisonText: string;
  biggestCategory: {
    id: string | null;
    name: string;
    color: string;
    amountPaise: number;
    percentage: number;
  } | null;
  projectedMonthEnd: {
    currentSpentPaise: number;
    dailyAvgPaise: number;
    projectedTotalPaise: number;
    daysPassed: number;
    daysInMonth: number;
    daysRemaining: number;
  };
  topPlaces: Array<{
    place: string;
    amountPaise: number;
    count: number;
  }>;
}

/**
 * Computes core spending insights for the given expenses in the current month:
 * 1. Weekend vs Weekday spend
 * 2. Biggest Category this month
 * 3. Projected Month-End spend
 * 4. Top Places by spend
 */
export function calculateSpendInsights(
  expenses: Expense[],
  categories: ExpenseCategory[],
  referenceISTDate: string = todayIST()
): SpendingInsights {
  const [yearStr, monthStr, dayStr] = referenceISTDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const currentDay = parseInt(dayStr, 10);

  // Total days in current IST month
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const currentMonthPrefix = `${yearStr}-${monthStr}`;

  // Filter expenses strictly to the current IST month
  const monthExpenses = expenses.filter((e) => {
    const expenseDate = getISTDateString(e.spent_at);
    return expenseDate.startsWith(currentMonthPrefix);
  });

  const categoryMap = new Map<string, ExpenseCategory>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  // 1. Weekend vs Weekday Spend
  let weekendSpendPaise = 0;
  let weekdaySpendPaise = 0;
  const weekendDaysSet = new Set<string>();
  const weekdayDaysSet = new Set<string>();

  // Determine weekend days passed in month up to today
  for (let d = 1; d <= currentDay; d++) {
    const dStr = `${yearStr}-${monthStr}-${d.toString().padStart(2, "0")}`;
    const dow = getISTDayOfWeek(dStr);
    if (dow === "sat" || dow === "sun") {
      weekendDaysSet.add(dStr);
    } else {
      weekdayDaysSet.add(dStr);
    }
  }

  monthExpenses.forEach((e) => {
    const dateStr = getISTDateString(e.spent_at);
    const dow = getISTDayOfWeek(dateStr);
    if (dow === "sat" || dow === "sun") {
      weekendSpendPaise += e.amount_paise;
    } else {
      weekdaySpendPaise += e.amount_paise;
    }
  });

  const weekendDaysCount = Math.max(1, weekendDaysSet.size);
  const weekdayDaysCount = Math.max(1, weekdayDaysSet.size);
  const weekendDailyAvgPaise = Math.round(weekendSpendPaise / weekendDaysCount);
  const weekdayDailyAvgPaise = Math.round(weekdaySpendPaise / weekdayDaysCount);

  let weekendWeekdayComparisonText = "Spend pattern is balanced";
  if (weekendDailyAvgPaise > weekdayDailyAvgPaise * 1.25) {
    const diffPct = Math.round(
      ((weekendDailyAvgPaise - weekdayDailyAvgPaise) / Math.max(1, weekdayDailyAvgPaise)) * 100
    );
    weekendWeekdayComparisonText = `You spend ${diffPct}% more per day on weekends`;
  } else if (weekdayDailyAvgPaise > weekendDailyAvgPaise * 1.25) {
    const diffPct = Math.round(
      ((weekdayDailyAvgPaise - weekendDailyAvgPaise) / Math.max(1, weekendDailyAvgPaise)) * 100
    );
    weekendWeekdayComparisonText = `You spend ${diffPct}% more per day on weekdays`;
  }

  // 2. Biggest Category this month
  const categorySpendMap = new Map<string | null, number>();
  let totalMonthSpendPaise = 0;

  monthExpenses.forEach((e) => {
    totalMonthSpendPaise += e.amount_paise;
    const catId = e.category_id || null;
    categorySpendMap.set(catId, (categorySpendMap.get(catId) || 0) + e.amount_paise);
  });

  let biggestCategory: SpendingInsights["biggestCategory"] = null;
  let maxCatSpend = 0;
  categorySpendMap.forEach((amt, catId) => {
    if (amt > maxCatSpend) {
      maxCatSpend = amt;
      const catObj = catId ? categoryMap.get(catId) : null;
      biggestCategory = {
        id: catId,
        name: catObj?.name || "Uncategorized",
        color: catObj?.color || "#5B6B76",
        amountPaise: amt,
        percentage:
          totalMonthSpendPaise > 0
            ? Math.round((amt / totalMonthSpendPaise) * 100)
            : 0,
      };
    }
  });

  // 3. Projected Month-End Spend
  const daysPassed = Math.max(1, currentDay);
  const daysRemaining = Math.max(0, daysInMonth - daysPassed);
  const dailyAvgPaise = Math.round(totalMonthSpendPaise / daysPassed);
  const projectedTotalPaise = Math.round(dailyAvgPaise * daysInMonth);

  // 4. Top Places
  const placeSpendMap = new Map<string, { amountPaise: number; count: number }>();
  monthExpenses.forEach((e) => {
    const place = e.place?.trim();
    if (place) {
      const existing = placeSpendMap.get(place) || { amountPaise: 0, count: 0 };
      placeSpendMap.set(place, {
        amountPaise: existing.amountPaise + e.amount_paise,
        count: existing.count + 1,
      });
    }
  });

  const topPlaces = Array.from(placeSpendMap.entries())
    .map(([place, data]) => ({
      place,
      amountPaise: data.amountPaise,
      count: data.count,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise)
    .slice(0, 5);

  return {
    weekendSpendPaise,
    weekdaySpendPaise,
    weekendDaysCount,
    weekdayDaysCount,
    weekendDailyAvgPaise,
    weekdayDailyAvgPaise,
    weekendWeekdayComparisonText,
    biggestCategory,
    projectedMonthEnd: {
      currentSpentPaise: totalMonthSpendPaise,
      dailyAvgPaise,
      projectedTotalPaise,
      daysPassed,
      daysInMonth,
      daysRemaining,
    },
    topPlaces,
  };
}

// ----------------------------------------------------------------------------
// 4. CSV Export Generator
// ----------------------------------------------------------------------------

export function generateExpensesCSV(
  expenses: Expense[],
  incomes: Income[],
  categories: ExpenseCategory[]
): string {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const headers = [
    "Type",
    "Date (IST)",
    "Amount (INR)",
    "Category / Source",
    "Payment Method",
    "Place",
    "Notes",
    "Recurring",
  ];

  const rows: string[][] = [headers];

  // Expenses
  expenses.forEach((e) => {
    rows.push([
      "Expense",
      getISTDateString(e.spent_at),
      (e.amount_paise / 100).toFixed(2),
      (e.category_id && categoryMap.get(e.category_id)) || "Uncategorized",
      e.payment_method || "UPI",
      e.place || "",
      e.notes || "",
      e.is_recurring ? "Yes" : "No",
    ]);
  });

  // Incomes
  incomes.forEach((inc) => {
    rows.push([
      "Income",
      getISTDateString(inc.received_at),
      (inc.amount_paise / 100).toFixed(2),
      inc.source,
      "Bank Transfer",
      "",
      inc.notes || "",
      "No",
    ]);
  });

  // Sort rows chronologically by Date (descending)
  const sortedDataRows = rows.slice(1).sort((a, b) => b[1].localeCompare(a[1]));

  return [rows[0], ...sortedDataRows]
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\r\n");
}

// ----------------------------------------------------------------------------
// 5. Supabase Data Access Functions
// ----------------------------------------------------------------------------

export interface CreateExpenseInput {
  amount_paise: number;
  category_id?: string | null;
  spent_at?: string;
  payment_method?: string;
  place?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  drive_file_id?: string | null;
  is_recurring?: boolean;
}

export interface UpdateExpenseInput {
  amount_paise?: number;
  category_id?: string | null;
  spent_at?: string;
  payment_method?: string;
  place?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  drive_file_id?: string | null;
  is_recurring?: boolean;
}

export interface CreateIncomeInput {
  source: string;
  amount_paise: number;
  received_at?: string;
  notes?: string | null;
}

export interface CreateRecurringExpenseInput {
  category_id?: string | null;
  amount_paise: number;
  payment_method?: string;
  place?: string | null;
  notes?: string | null;
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  day_of_month?: number | null;
  day_of_week?: string | null;
}

/**
 * Fetches all expense categories for the authenticated user.
 */
export async function getExpenseCategories(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getExpenseCategories] Error:", error);
    return [];
  }
  return (data || []) as ExpenseCategory[];
}

/**
 * Fetches expenses for user, optionally filtered by month or date range.
 */
export async function getExpenses(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: {
    startDateUTC?: string;
    endDateUTC?: string;
    categoryId?: string;
  }
): Promise<Expense[]> {
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("spent_at", { ascending: false });

  if (options?.startDateUTC) {
    query = query.gte("spent_at", options.startDateUTC);
  }
  if (options?.endDateUTC) {
    query = query.lte("spent_at", options.endDateUTC);
  }
  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getExpenses] Error:", error);
    return [];
  }
  return (data || []) as Expense[];
}

/**
 * Creates a new expense record and writes a timeline_events entry.
 */
export async function createExpense(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateExpenseInput,
  categoryName?: string
): Promise<Expense | null> {
  const spentAt = input.spent_at || new Date().toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      category_id: input.category_id || null,
      amount_paise: input.amount_paise,
      spent_at: spentAt,
      payment_method: input.payment_method || "UPI",
      place: input.place || null,
      notes: input.notes || null,
      receipt_url: input.receipt_url || null,
      drive_file_id: input.drive_file_id || null,
      is_recurring: input.is_recurring || false,
    })
    .select()
    .single();

  if (error) {
    console.error("[createExpense] Error creating expense:", error);
    throw error;
  }

  const createdExpense = data as Expense;

  // Write Timeline Event
  const summaryDesc = categoryName || "Expense";
  const placeDesc = createdExpense.place ? ` at ${createdExpense.place}` : "";
  await writeTimelineEvent(supabase, {
    userId,
    type: "expense_logged",
    summary: `Spent ${formatINR(createdExpense.amount_paise)} on ${summaryDesc}${placeDesc}`,
    occurredAt: createdExpense.spent_at,
    refTable: "expenses",
    refId: createdExpense.id,
    meta: {
      amount_paise: createdExpense.amount_paise,
      payment_method: createdExpense.payment_method,
      place: createdExpense.place,
      category_id: createdExpense.category_id,
    },
  });

  return createdExpense;
}

/**
 * Updates an existing expense record.
 */
export async function updateExpense(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  input: UpdateExpenseInput
): Promise<Expense | null> {
  const { data, error } = await supabase
    .from("expenses")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[updateExpense] Error updating expense:", error);
    throw error;
  }

  return data as Expense;
}

/**
 * Deletes an expense record.
 */
export async function deleteExpense(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[deleteExpense] Error deleting expense:", error);
    return false;
  }
  return true;
}

// ----------------------------------------------------------------------------
// 6. Income Operations
// ----------------------------------------------------------------------------

export async function getIncomes(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Income[]> {
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .order("received_at", { ascending: false });

  if (error) {
    console.error("[getIncomes] Error:", error);
    return [];
  }
  return (data || []) as Income[];
}

export async function createIncome(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateIncomeInput
): Promise<Income | null> {
  const receivedAt = input.received_at || new Date().toISOString();

  const { data, error } = await supabase
    .from("incomes")
    .insert({
      user_id: userId,
      source: input.source,
      amount_paise: input.amount_paise,
      received_at: receivedAt,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[createIncome] Error:", error);
    throw error;
  }

  const createdIncome = data as Income;

  // Write Timeline Event
  await writeTimelineEvent(supabase, {
    userId,
    type: "income_logged",
    summary: `Received ${formatINR(createdIncome.amount_paise)} from ${createdIncome.source}`,
    occurredAt: createdIncome.received_at,
    refTable: "incomes",
    refId: createdIncome.id,
    meta: {
      amount_paise: createdIncome.amount_paise,
      source: createdIncome.source,
    },
  });

  return createdIncome;
}

export async function deleteIncome(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[deleteIncome] Error:", error);
    return false;
  }
  return true;
}

// ----------------------------------------------------------------------------
// 7. Monthly Category Budgets
// ----------------------------------------------------------------------------

export async function getBudgets(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthYear: string // Format: 'YYYY-MM'
): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month_year", monthYear);

  if (error) {
    console.error("[getBudgets] Error:", error);
    return [];
  }
  return (data || []) as Budget[];
}

export async function upsertBudget(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryId: string,
  monthYear: string,
  amountPaise: number
): Promise<Budget | null> {
  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: userId,
        category_id: categoryId,
        month_year: monthYear,
        amount_paise: amountPaise,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id, category_id, month_year",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[upsertBudget] Error:", error);
    throw error;
  }
  return data as Budget;
}

// ----------------------------------------------------------------------------
// 8. Recurring Expenses Engine & Auto-Creation
// ----------------------------------------------------------------------------

export async function getRecurringExpenses(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<RecurringExpense[]> {
  try {
    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
        return [];
      }
      console.error("[getRecurringExpenses] Error:", error);
      return [];
    }
    return (data || []) as RecurringExpense[];
  } catch (err) {
    return [];
  }
}

export async function createRecurringExpense(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateRecurringExpenseInput
): Promise<RecurringExpense | null> {
  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert({
      user_id: userId,
      category_id: input.category_id || null,
      amount_paise: input.amount_paise,
      payment_method: input.payment_method || "UPI",
      place: input.place || null,
      notes: input.notes || null,
      frequency: input.frequency || "monthly",
      day_of_month: input.day_of_month || 1,
      day_of_week: input.day_of_week || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
      // Table not yet migrated: create directly as recurring expense in expenses table
      const fallbackExpense = await createExpense(supabase, userId, {
        category_id: input.category_id,
        amount_paise: input.amount_paise,
        payment_method: input.payment_method,
        place: input.place,
        notes: `[Recurring] ${input.notes || input.place || "Subscription"}`,
        is_recurring: true,
      });
      return {
        id: fallbackExpense?.id || `rec-${Date.now()}`,
        user_id: userId,
        category_id: input.category_id || null,
        amount_paise: input.amount_paise,
        payment_method: input.payment_method || "UPI",
        place: input.place || null,
        notes: input.notes || null,
        frequency: input.frequency || "monthly",
        day_of_month: input.day_of_month || 1,
        day_of_week: null,
        is_active: true,
        last_processed_at: new Date().toISOString(),
        next_due_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    console.error("[createRecurringExpense] Error:", error);
    throw error;
  }
  return data as RecurringExpense;
}

export async function toggleRecurringExpense(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  isActive: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from("recurring_expenses")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[toggleRecurringExpense] Error:", error);
    return false;
  }
  return true;
}

export async function deleteRecurringExpense(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[deleteRecurringExpense] Error:", error);
    return false;
  }
  return true;
}

/**
 * Checks active recurring expenses and auto-creates actual expense records
 * for any due items for the specified month (defaulting to current month).
 */
export async function processRecurringExpenses(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthYear: string = todayIST().slice(0, 7)
): Promise<{ createdCount: number; createdExpenses: Expense[] }> {
  const recurringItems = await getRecurringExpenses(supabase, userId);
  const activeItems = recurringItems.filter((item) => item.is_active);

  if (activeItems.length === 0) {
    return { createdCount: 0, createdExpenses: [] };
  }

  // Get all expenses already recorded for this month to prevent duplicates
  const [yearStr, monthStr] = monthYear.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const startUtc = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
  const endUtc = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59)).toISOString();

  const existingExpenses = await getExpenses(supabase, userId, {
    startDateUTC: startUtc,
    endDateUTC: endUtc,
  });

  const createdExpenses: Expense[] = [];

  for (const item of activeItems) {
    // Check if an expense with identical recurring notes/place & amount already exists in this month
    const itemIdentifier = `[Recurring] ${item.notes || item.place || "Expense"}`;
    const alreadyExists = existingExpenses.some((exp) => {
      const matchNote = exp.notes === itemIdentifier || exp.notes?.includes(itemIdentifier);
      const matchAmount = exp.amount_paise === item.amount_paise;
      const matchPlace = (exp.place || "") === (item.place || "");
      return matchNote && matchAmount && matchPlace;
    });

    if (!alreadyExists) {
      // Determine due date in this month
      const targetDay = Math.min(item.day_of_month || 1, daysInMonth);
      const targetDayStr = targetDay.toString().padStart(2, "0");
      const spentAtDateStr = `${monthYear}-${targetDayStr}T10:00:00.000Z`;

      const newExpense = await createExpense(supabase, userId, {
        category_id: item.category_id,
        amount_paise: item.amount_paise,
        payment_method: item.payment_method,
        place: item.place,
        notes: itemIdentifier,
        is_recurring: true,
        spent_at: spentAtDateStr,
      });

      if (newExpense) {
        createdExpenses.push(newExpense);

        // Update recurring_expenses last_processed_at
        await supabase
          .from("recurring_expenses")
          .update({
            last_processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }
    }
  }

  return { createdCount: createdExpenses.length, createdExpenses };
}
