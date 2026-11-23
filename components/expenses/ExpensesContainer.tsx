"use client";

// ============================================================================
// Sahil's Shore: Expenses Container Component
// Main coordinator for Expense Tracker: Quick Add & Edit, Month Navigator,
// Summary Cards with Trends, 7 Analytics Charts, Category Budgets,
// Inline Recurring & Income Panels, and CSV Export.
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Wallet,
  Plus,
  Download,
  Calendar,
  Repeat,
  TrendingUp,
  Tag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Power,
  Trash2,
  DollarSign,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { QuickAddExpenseSheet } from "./QuickAddExpenseSheet";
import { ExpenseSummaryCards } from "./ExpenseSummaryCards";
import { ExpenseCharts } from "./ExpenseCharts";
import { CategoryBudgets } from "./CategoryBudgets";
import { ExpenseList } from "./ExpenseList";
import { RecurringExpensesDialog } from "./RecurringExpensesDialog";
import { IncomeDialog } from "./IncomeDialog";
import { SpendingInsightsCard } from "./SpendingInsightsCard";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  getExpenseCategories,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getIncomes,
  createIncome,
  deleteIncome,
  getBudgets,
  upsertBudget,
  getRecurringExpenses,
  createRecurringExpense,
  toggleRecurringExpense,
  deleteRecurringExpense,
  processRecurringExpenses,
  calculateSpendInsights,
  generateExpensesCSV,
  formatINR,
  rupeesToPaise,
  type CreateExpenseInput,
  type CreateIncomeInput,
  type CreateRecurringExpenseInput,
} from "@/lib/expenses";
import {
  todayIST,
  yesterdayIST,
  getISTDateString,
  formatFriendlyISTDate,
} from "@/lib/date-utils";
import type {
  Expense,
  ExpenseCategory,
  Income,
  Budget,
  RecurringExpense,
} from "@/types/index.ts";

type ActiveTab = "overview" | "list" | "budgets" | "recurring";

function formatMonthLabel(monthYear: string): string {
  const [y, m] = monthYear.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function getPrevMonth(monthYear: string): string {
  const [y, m] = monthYear.split("-").map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  return `${prevY}-${prevM.toString().padStart(2, "0")}`;
}

function getNextMonth(monthYear: string): string {
  const [y, m] = monthYear.split("-").map(Number);
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  return `${nextY}-${nextM.toString().padStart(2, "0")}`;
}

export function ExpensesContainer() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Month navigation state
  const currentIST = todayIST();
  const currentMonthYear = currentIST.slice(0, 7);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentMonthYear);

  // Data states
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  // Dialog states
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [isProcessingRecurring, setIsProcessingRecurring] = useState(false);

  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const previousMonthYear = useMemo(() => getPrevMonth(currentMonthYear), [currentMonthYear]);

  // Load Initial Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const [cats, exps, incs, bdgs, recs] = await Promise.all([
          getExpenseCategories(supabase, user.id),
          getExpenses(supabase, user.id),
          getIncomes(supabase, user.id),
          getBudgets(supabase, user.id, selectedMonthYear),
          getRecurringExpenses(supabase, user.id),
        ]);

        setCategories(cats);
        setExpenses(exps);
        setIncomes(incs);
        setBudgets(bdgs);
        setRecurringExpenses(recs);
      }
    } catch (err) {
      console.error("Error loading expense data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedMonthYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Re-fetch budgets when selectedMonthYear changes
  useEffect(() => {
    if (!userId) return;
    getBudgets(supabase, userId, selectedMonthYear)
      .then((bdgs) => setBudgets(bdgs))
      .catch((err) => console.error("Error loading budgets for month:", err));
  }, [supabase, userId, selectedMonthYear]);

  // Spending metric calculations
  const {
    todayPaise,
    yesterdayPaise,
    thisWeekPaise,
    lastWeekPaise,
    thisMonthPaise,
    lastMonthPaise,
    totalIncomeThisMonth,
    budgetHealthPct,
    totalBudgetPaise,
  } = useMemo(() => {
    let todayP = 0;
    let yestP = 0;
    let weekP = 0;
    let lastWeekP = 0;
    let monthP = 0;
    let lastMonthP = 0;

    const yestDate = yesterdayIST();
    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now.getTime() - 14 * 24 * 60 * 60 * 1000;
    const prevMonthForSelected = getPrevMonth(selectedMonthYear);

    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      const expTime = new Date(e.spent_at).getTime();

      if (dateStr === currentIST) todayP += e.amount_paise;
      if (dateStr === yestDate) yestP += e.amount_paise;
      if (expTime >= sevenDaysAgo) weekP += e.amount_paise;
      if (expTime >= fourteenDaysAgo && expTime < sevenDaysAgo) lastWeekP += e.amount_paise;
      if (dateStr.startsWith(selectedMonthYear)) monthP += e.amount_paise;
      if (dateStr.startsWith(prevMonthForSelected)) lastMonthP += e.amount_paise;
    });

    let incMonthP = 0;
    incomes.forEach((inc) => {
      const dateStr = getISTDateString(inc.received_at);
      if (dateStr.startsWith(selectedMonthYear)) incMonthP += inc.amount_paise;
    });

    // Budget Health calculation: aggregate utilization across budgeted categories
    let totalBdgP = 0;
    let totalSpentInBudgetsP = 0;
    budgets.forEach((b) => {
      totalBdgP += b.amount_paise;
      const spentForCat = expenses
        .filter(
          (e) =>
            e.category_id === b.category_id &&
            getISTDateString(e.spent_at).startsWith(selectedMonthYear)
        )
        .reduce((sum, e) => sum + e.amount_paise, 0);
      totalSpentInBudgetsP += spentForCat;
    });

    let healthPct: number | undefined;
    if (totalBdgP > 0) {
      const remainingPaise = Math.max(0, totalBdgP - totalSpentInBudgetsP);
      healthPct = Math.round((remainingPaise / totalBdgP) * 100);
    }

    return {
      todayPaise: todayP,
      yesterdayPaise: yestP,
      thisWeekPaise: weekP,
      lastWeekPaise: lastWeekP,
      thisMonthPaise: monthP,
      lastMonthPaise: lastMonthP,
      totalIncomeThisMonth: incMonthP,
      budgetHealthPct: healthPct,
      totalBudgetPaise: totalBdgP,
    };
  }, [expenses, incomes, currentIST, selectedMonthYear, budgets]);

  // Spending insights calculation
  const spendingInsights = useMemo(() => {
    return calculateSpendInsights(expenses, categories, currentIST);
  }, [expenses, categories, currentIST]);

  // Handler: Save Expense (Create or Edit)
  const handleSaveExpense = async (input: CreateExpenseInput, categoryName?: string) => {
    if (!userId) {
      toast({ title: "Authentication required", type: "error" });
      return;
    }

    if (editingExpense) {
      // ── Update Existing Expense ──────────────────────────────────────────
      const previous = editingExpense;
      const updatedOptimistic: Expense = {
        ...previous,
        amount_paise: input.amount_paise,
        category_id: input.category_id || null,
        payment_method: input.payment_method || "UPI",
        place: input.place || null,
        notes: input.notes || null,
        receipt_url: input.receipt_url || null,
        spent_at: input.spent_at || previous.spent_at,
        updated_at: new Date().toISOString(),
      };

      setExpenses((prev) =>
        prev.map((e) => (e.id === previous.id ? updatedOptimistic : e))
      );

      try {
        const updated = await updateExpense(supabase, userId, previous.id, {
          amount_paise: input.amount_paise,
          category_id: input.category_id || null,
          payment_method: input.payment_method || "UPI",
          place: input.place || null,
          notes: input.notes || null,
          receipt_url: input.receipt_url || null,
          spent_at: input.spent_at || previous.spent_at,
        });

        if (updated) {
          setExpenses((prev) =>
            prev.map((e) => (e.id === previous.id ? updated : e))
          );
          toast({ title: "Expense updated", type: "success" });
        }
      } catch (err) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === previous.id ? previous : e))
        );
        toast({ title: "Failed to update expense", type: "error" });
      } finally {
        setEditingExpense(null);
      }
    } else {
      // ── Create Fresh Expense ─────────────────────────────────────────────
      const tempId = `temp-${Date.now()}`;
      const optimisticExp: Expense = {
        id: tempId,
        user_id: userId,
        category_id: input.category_id || null,
        amount_paise: input.amount_paise,
        spent_at: input.spent_at || new Date().toISOString(),
        payment_method: input.payment_method || "UPI",
        place: input.place || null,
        notes: input.notes || null,
        receipt_url: input.receipt_url || null,
        drive_file_id: null,
        is_recurring: false,
        recurrence_rule: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setExpenses((prev) => [optimisticExp, ...prev]);

      try {
        const created = await createExpense(supabase, userId, input, categoryName);
        if (created) {
          setExpenses((prev) => prev.map((e) => (e.id === tempId ? created : e)));
          toast({ title: "Expense saved", type: "success" });
        }
      } catch (err) {
        setExpenses((prev) => prev.filter((e) => e.id !== tempId));
        toast({ title: "Failed to save expense", type: "error" });
      }
    }
  };

  // Handler: Delete Expense with Undo Toast
  const handleDeleteExpense = async (expenseId: string) => {
    if (!userId) return;

    const target = expenses.find((e) => e.id === expenseId);
    if (!target) return;

    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));

    toast({
      title: "Expense deleted",
      onUndo: async () => {
        setExpenses((prev) => [target, ...prev]);
        await createExpense(supabase, userId, {
          amount_paise: target.amount_paise,
          category_id: target.category_id,
          spent_at: target.spent_at,
          payment_method: target.payment_method,
          place: target.place,
          notes: target.notes,
          receipt_url: target.receipt_url,
        });
      },
    });

    try {
      await deleteExpense(supabase, userId, expenseId);
    } catch (err) {
      setExpenses((prev) => [target, ...prev]);
      toast({ title: "Failed to delete expense", type: "error" });
    }
  };

  // Handler: Edit Expense
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setQuickAddOpen(true);
  };

  // Handler: Save Budget
  const handleSaveBudget = async (categoryId: string, amountPaise: number) => {
    if (!userId) return;
    try {
      const saved = await upsertBudget(
        supabase,
        userId,
        categoryId,
        selectedMonthYear,
        amountPaise
      );
      if (saved) {
        setBudgets((prev) => {
          const filtered = prev.filter((b) => b.category_id !== categoryId);
          return [...filtered, saved];
        });
        toast({ title: "Budget updated", type: "success" });
      }
    } catch (err) {
      toast({ title: "Failed to update budget", type: "error" });
    }
  };

  // Handler: Add Income
  const handleAddIncome = async (input: CreateIncomeInput) => {
    if (!userId) return;
    try {
      const created = await createIncome(supabase, userId, input);
      if (created) {
        setIncomes((prev) => [created, ...prev]);
        toast({ title: "Income recorded", type: "success" });
      }
    } catch (err) {
      toast({ title: "Failed to record income", type: "error" });
    }
  };

  // Handler: Delete Income
  const handleDeleteIncome = async (id: string) => {
    if (!userId) return;
    try {
      await deleteIncome(supabase, userId, id);
      setIncomes((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Income entry removed", type: "success" });
    } catch (err) {
      toast({ title: "Failed to delete income", type: "error" });
    }
  };

  // Handler: Recurring Expenses
  const handleAddRecurring = async (input: CreateRecurringExpenseInput) => {
    if (!userId) return;
    try {
      const created = await createRecurringExpense(supabase, userId, input);
      if (created) {
        setRecurringExpenses((prev) => [created, ...prev]);
        toast({ title: "Recurring subscription added", type: "success" });
      }
    } catch (err) {
      toast({ title: "Failed to add subscription", type: "error" });
    }
  };

  const handleToggleRecurringActive = async (id: string, isActive: boolean) => {
    if (!userId) return;
    setRecurringExpenses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r))
    );
    await toggleRecurringExpense(supabase, userId, id, isActive);
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!userId) return;
    setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
    await deleteRecurringExpense(supabase, userId, id);
    toast({ title: "Recurring item removed", type: "success" });
  };

  const handleProcessRecurring = async () => {
    if (!userId) return;
    setIsProcessingRecurring(true);
    try {
      const result = await processRecurringExpenses(supabase, userId, currentMonthYear);
      if (result.createdCount > 0) {
        setExpenses((prev) => [...result.createdExpenses, ...prev]);
        toast({
          title: `Generated ${result.createdCount} recurring ${
            result.createdCount === 1 ? "expense" : "expenses"
          } for this month`,
          type: "success",
        });
      } else {
        toast({ title: "All recurring items are already up to date", type: "info" });
      }
    } catch (err) {
      toast({ title: "Failed to process recurring expenses", type: "error" });
    } finally {
      setIsProcessingRecurring(false);
    }
  };

  // Handler: CSV Export
  const handleExportCSV = () => {
    try {
      const csvContent = generateExpensesCSV(expenses, incomes, categories);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `shore-expenses-${currentIST}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV export downloaded", type: "success" });
    } catch (err) {
      console.error("Export error:", err);
      toast({ title: "Failed to export CSV", type: "error" });
    }
  };

  const isCurrentMonthSelected = selectedMonthYear === currentMonthYear;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24 min-w-0">
      {/* Top Header & Month Navigator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <span>Expense Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Paise-accurate cashflow, category budgets, receipt vault, and spending intelligence.
          </p>
        </div>

        {/* Month Navigator & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Month Navigator */}
          <div className="inline-flex items-center bg-surface border border-border/80 rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedMonthYear(getPrevMonth(selectedMonthYear))}
              aria-label="Previous Month"
              className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-muted transition-colors shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-text select-none min-w-[130px] justify-center">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{formatMonthLabel(selectedMonthYear)}</span>
            </div>

            <button
              type="button"
              disabled={isCurrentMonthSelected}
              onClick={() => setSelectedMonthYear(getNextMonth(selectedMonthYear))}
              aria-label="Next Month"
              className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-muted transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isCurrentMonthSelected && (
            <button
              type="button"
              onClick={() => setSelectedMonthYear(currentMonthYear)}
              className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Current Month
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted transition-colors shadow-2xs shrink-0"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Quick Subscriptions Modal Trigger */}
          <button
            onClick={() => setRecurringDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted transition-colors shadow-2xs shrink-0"
          >
            <Repeat className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Recurring</span>
          </button>

          {/* Quick Income Modal Trigger */}
          <button
            onClick={() => setIncomeDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted transition-colors shadow-2xs shrink-0"
          >
            <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
            <span className="hidden sm:inline">Income</span>
          </button>

          {/* Log Expense Button */}
          <button
            onClick={() => {
              setEditingExpense(null);
              setQuickAddOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-95 shadow-md active:scale-95 transition-all shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5] shrink-0" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards with Trends & Savings Ring */}
      <ExpenseSummaryCards
        todayPaise={todayPaise}
        yesterdayPaise={yesterdayPaise}
        thisWeekPaise={thisWeekPaise}
        lastWeekPaise={lastWeekPaise}
        thisMonthPaise={thisMonthPaise}
        lastMonthPaise={lastMonthPaise}
        totalIncomePaise={totalIncomeThisMonth}
        budgetHealthPct={budgetHealthPct}
        selectedMonthYear={selectedMonthYear}
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-1 overflow-x-auto min-w-0">
        {[
          { key: "overview", label: "Overview & Analytics" },
          { key: "list", label: "Expense List & Bills" },
          { key: "budgets", label: "Category Budgets" },
          { key: "recurring", label: "Recurring & Income" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as ActiveTab)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-surface text-primary shadow-xs border border-border/70"
                : "text-text-muted hover:text-text hover:bg-surface-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Analytics */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <SpendingInsightsCard
            insights={spendingInsights}
            expenses={expenses}
            categories={categories}
            totalBudgetPaise={totalBudgetPaise}
            currentMonthYear={selectedMonthYear}
          />
          <ExpenseCharts
            expenses={expenses}
            categories={categories}
            currentMonthYear={currentMonthYear}
            previousMonthYear={previousMonthYear}
            selectedMonthYear={selectedMonthYear}
          />
        </div>
      )}

      {/* Tab 2: Expense List & Bill Gallery */}
      {activeTab === "list" && (
        <ExpenseList
          expenses={expenses}
          categories={categories}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      )}

      {/* Tab 3: Category Budgets */}
      {activeTab === "budgets" && (
        <CategoryBudgets
          categories={categories}
          budgets={budgets}
          expenses={expenses}
          currentMonthYear={selectedMonthYear}
          onSaveBudget={handleSaveBudget}
        />
      )}

      {/* Tab 4: Recurring & Income Inline Panels */}
      {activeTab === "recurring" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <RecurringExpensesPanel
            recurringExpenses={recurringExpenses}
            categories={categories}
            onAddRecurring={handleAddRecurring}
            onToggleActive={handleToggleRecurringActive}
            onDeleteRecurring={handleDeleteRecurring}
            onProcessRecurring={handleProcessRecurring}
            isProcessing={isProcessingRecurring}
          />

          <IncomePanel
            incomes={incomes}
            onAddIncome={handleAddIncome}
            onDeleteIncome={handleDeleteIncome}
          />
        </div>
      )}

      {/* Floating Quick Add Button */}
      <div className="fixed bottom-20 md:bottom-8 right-6 z-40">
        <button
          onClick={() => {
            setEditingExpense(null);
            setQuickAddOpen(true);
          }}
          aria-label="Quick Add Expense"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="h-7 w-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Quick Add & Edit Sheet */}
      <QuickAddExpenseSheet
        isOpen={quickAddOpen}
        onClose={() => {
          setQuickAddOpen(false);
          setEditingExpense(null);
        }}
        categories={categories}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        defaultCategoryId={editingExpense?.category_id || undefined}
        defaultPlace={editingExpense?.place || undefined}
      />

      {/* Dialog Modals (kept for header actions) */}
      <RecurringExpensesDialog
        isOpen={recurringDialogOpen}
        onClose={() => setRecurringDialogOpen(false)}
        recurringExpenses={recurringExpenses}
        categories={categories}
        onAddRecurring={handleAddRecurring}
        onToggleActive={handleToggleRecurringActive}
        onDeleteRecurring={handleDeleteRecurring}
        onProcessRecurring={handleProcessRecurring}
        isProcessing={isProcessingRecurring}
      />

      <IncomeDialog
        isOpen={incomeDialogOpen}
        onClose={() => setIncomeDialogOpen(false)}
        incomes={incomes}
        onAddIncome={handleAddIncome}
        onDeleteIncome={handleDeleteIncome}
      />
    </div>
  );
}

// ============================================================================
// Inline Sub-Components for Tab 4: Recurring & Income Panels
// ============================================================================

interface RecurringExpensesPanelProps {
  recurringExpenses: RecurringExpense[];
  categories: ExpenseCategory[];
  onAddRecurring: (input: CreateRecurringExpenseInput) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
  onProcessRecurring: () => Promise<void>;
  isProcessing?: boolean;
}

function RecurringExpensesPanel({
  recurringExpenses,
  categories,
  onAddRecurring,
  onToggleActive,
  onDeleteRecurring,
  onProcessRecurring,
  isProcessing = false,
}: RecurringExpensesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [amountRupees, setAmountRupees] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || "");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [frequency, setFrequency] = useState<"monthly" | "weekly" | "yearly">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryMap = useMemo(() => {
    const map = new Map<string, ExpenseCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const handleCreate = async () => {
    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddRecurring({
        amount_paise: paise,
        category_id: selectedCatId || null,
        place: place.trim() || null,
        notes: notes.trim() || null,
        payment_method: paymentMethod,
        frequency,
        day_of_month: dayOfMonth,
      });
      setShowAddForm(false);
      setAmountRupees("");
      setPlace("");
      setNotes("");
    } catch (err) {
      console.error("Error creating recurring expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs space-y-4 min-w-0">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Repeat className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Recurring Subscriptions</h3>
            <p className="text-xs text-text-muted">Rent, WiFi, gym, and recurring bills</p>
          </div>
        </div>

        <button
          onClick={onProcessRecurring}
          disabled={isProcessing || recurringExpenses.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent-warm text-white hover:opacity-95 active:scale-95 transition-all shadow-xs disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isProcessing ? "Processing..." : "Generate Due"}</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {recurringExpenses.length} subscription{recurringExpenses.length !== 1 ? "s" : ""} active
        </span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-muted hover:bg-border/60 text-text transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showAddForm ? "Cancel" : "Add Template"}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="p-4 bg-surface-muted/50 border border-border/80 rounded-2xl space-y-3 animate-in fade-in">
          <h4 className="text-xs font-bold text-text uppercase tracking-wider">
            New Recurring Template
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-text-muted mb-1 block">
                Amount (₹)
              </label>
              <input
                type="number"
                step="10"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface border border-border text-text font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-muted mb-1 block">
                Category
              </label>
              <Select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-muted mb-1 block">
                Place / Subscription
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Netflix, Apartment Rent, Gym"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-muted mb-1 block">
                Day of Month (1 - 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !amountRupees}
              onClick={handleCreate}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-40"
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {recurringExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No recurring templates configured. Add your rent, WiFi, or subscriptions above.
          </div>
        ) : (
          recurringExpenses.map((item) => {
            const cat = item.category_id ? categoryMap.get(item.category_id) : null;
            return (
              <div
                key={item.id}
                className={`p-3 bg-surface border border-border/70 rounded-xl flex items-center justify-between gap-3 shadow-2xs ${
                  !item.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onToggleActive(item.id, !item.is_active)}
                    aria-label={item.is_active ? "Pause" : "Activate"}
                    className={`p-2 rounded-lg transition-colors shrink-0 ${
                      item.is_active
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-muted text-text-muted"
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text truncate">
                        {item.place || item.notes || "Recurring Bill"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-surface-muted text-text-muted capitalize shrink-0">
                        {item.frequency} (Day {item.day_of_month || 1})
                      </span>
                    </div>
                    <span className="text-xs text-text-muted block truncate">
                      {cat?.name || "Uncategorized"} • {item.payment_method}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-text font-mono">
                    {formatINR(item.amount_paise)}
                  </span>
                  <button
                    onClick={() => onDeleteRecurring(item.id)}
                    aria-label="Delete template"
                    className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-surface-muted transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

interface IncomePanelProps {
  incomes: Income[];
  onAddIncome: (input: CreateIncomeInput) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
}

function IncomePanel({ incomes, onAddIncome, onDeleteIncome }: IncomePanelProps) {
  const [source, setSource] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalIncomePaise = useMemo(
    () => incomes.reduce((acc, curr) => acc + curr.amount_paise, 0),
    [incomes]
  );

  const handleSave = async () => {
    const paise = rupeesToPaise(amountRupees);
    if (!source.trim() || paise <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddIncome({
        source: source.trim(),
        amount_paise: paise,
        notes: notes.trim() || null,
        received_at: new Date().toISOString(),
      });
      setSource("");
      setAmountRupees("");
      setNotes("");
    } catch (err) {
      console.error("Error creating income:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs space-y-4 min-w-0">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center text-success shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Income Entries</h3>
            <p className="text-xs text-text-muted">Salary, freelance payouts, and stipends</p>
          </div>
        </div>

        <span className="text-sm font-bold text-success font-mono">
          {formatINR(totalIncomePaise)}
        </span>
      </div>

      {/* Record Form */}
      <div className="p-4 bg-surface-muted/40 border border-border/80 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-text uppercase tracking-wider">
          Record New Income
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-text-muted mb-1 block">
              Source
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Salary, Freelance, Bonus"
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-muted mb-1 block">
              Amount (₹)
            </label>
            <input
              type="number"
              step="100"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface border border-border text-text font-mono focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-text-muted mb-1 block">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. October stipend or project payout"
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={isSubmitting || !source.trim() || !amountRupees}
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-success text-white hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Income</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {incomes.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No income entries logged yet. Add your salary or freelance earnings above.
          </div>
        ) : (
          incomes.map((inc) => (
            <div
              key={inc.id}
              className="p-3 bg-surface border border-border/70 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text truncate">{inc.source}</span>
                  <span className="text-[11px] text-text-muted shrink-0">
                    {formatFriendlyISTDate(inc.received_at)}
                  </span>
                </div>
                {inc.notes && (
                  <span className="text-xs text-text-muted block truncate mt-0.5">
                    {inc.notes}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-success font-mono">
                  + {formatINR(inc.amount_paise)}
                </span>
                <button
                  onClick={() => onDeleteIncome(inc.id)}
                  aria-label="Delete income entry"
                  className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-surface-muted transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
