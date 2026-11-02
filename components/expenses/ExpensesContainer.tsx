"use client";

// ============================================================================
// Sahil's Shore: Expenses Container Component
// Main coordinator for Expense Tracker: Quick Add, Summary Cards, Charts,
// Category Budgets, Recurring Expenses, Income, and CSV Export.
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Wallet,
  Plus,
  Download,
  Calendar,
  PieChart,
  Repeat,
  TrendingUp,
  Tag,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { QuickAddExpenseSheet } from "./QuickAddExpenseSheet";
import { ExpenseSummaryCards } from "./ExpenseSummaryCards";
import { ExpenseCharts } from "./ExpenseCharts";
import { CategoryBudgets } from "./CategoryBudgets";
import { ExpenseList } from "./ExpenseList";
import { RecurringExpensesDialog } from "./RecurringExpensesDialog";
import { IncomeDialog } from "./IncomeDialog";
import { SpendingInsightsCard } from "./SpendingInsightsCard";
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
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type CreateIncomeInput,
  type CreateRecurringExpenseInput,
} from "@/lib/expenses";
import {
  todayIST,
  getISTDateString,
  isTodayIST,
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

export function ExpensesContainer() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const currentIST = todayIST();
  const currentMonthYear = currentIST.slice(0, 7);

  // Previous month string
  const [currY, currM] = currentMonthYear.split("-").map(Number);
  const prevMonth = currM === 1 ? 12 : currM - 1;
  const prevYear = currM === 1 ? currY - 1 : currY;
  const previousMonthYear = `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;

  // Fetch initial data
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
          getBudgets(supabase, user.id, currentMonthYear),
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
  }, [supabase, currentMonthYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Spending metric calculations
  const { todayPaise, thisWeekPaise, thisMonthPaise, totalIncomeThisMonth } = useMemo(() => {
    let todayP = 0;
    let weekP = 0;
    let monthP = 0;

    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      if (dateStr === currentIST) todayP += e.amount_paise;
      if (new Date(e.spent_at).getTime() >= sevenDaysAgo) weekP += e.amount_paise;
      if (dateStr.startsWith(currentMonthYear)) monthP += e.amount_paise;
    });

    let incMonthP = 0;
    incomes.forEach((inc) => {
      const dateStr = getISTDateString(inc.received_at);
      if (dateStr.startsWith(currentMonthYear)) incMonthP += inc.amount_paise;
    });

    return {
      todayPaise: todayP,
      thisWeekPaise: weekP,
      thisMonthPaise: monthP,
      totalIncomeThisMonth: incMonthP,
    };
  }, [expenses, incomes, currentIST, currentMonthYear]);

  // Spending insights
  const spendingInsights = useMemo(() => {
    return calculateSpendInsights(expenses, categories, currentIST);
  }, [expenses, categories, currentIST]);

  // Handler: Save New Expense
  const handleSaveExpense = async (input: CreateExpenseInput, categoryName?: string) => {
    if (!userId) {
      toast({ title: "Authentication required", type: "error" });
      return;
    }

    // Optimistic item
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
  };

  // Handler: Delete Expense with Undo Toast
  const handleDeleteExpense = async (expenseId: string) => {
    if (!userId) return;

    const target = expenses.find((e) => e.id === expenseId);
    if (!target) return;

    // Optimistic delete
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
        currentMonthYear,
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

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            Expense Tracker
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Paise-accurate cashflow, category budgets, and spending insights.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setRecurringDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted transition-colors shadow-2xs"
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>Recurring</span>
          </button>

          <button
            onClick={() => setIncomeDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted transition-colors shadow-2xs"
          >
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span>Income</span>
          </button>

          <button
            onClick={() => {
              setEditingExpense(null);
              setQuickAddOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-95 shadow-md active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <ExpenseSummaryCards
        todayPaise={todayPaise}
        thisWeekPaise={thisWeekPaise}
        thisMonthPaise={thisMonthPaise}
        totalIncomePaise={totalIncomeThisMonth}
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-1">
        {[
          { key: "overview", label: "Overview & Analytics" },
          { key: "list", label: "Expense List" },
          { key: "budgets", label: "Category Budgets" },
          { key: "recurring", label: "Recurring & Income" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as ActiveTab)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
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
          <SpendingInsightsCard insights={spendingInsights} />
          <ExpenseCharts
            expenses={expenses}
            categories={categories}
            currentMonthYear={currentMonthYear}
            previousMonthYear={previousMonthYear}
          />
        </div>
      )}

      {/* Tab 2: Expense List */}
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
          currentMonthYear={currentMonthYear}
          onSaveBudget={handleSaveBudget}
        />
      )}

      {/* Tab 4: Recurring & Income Tab Shortcut */}
      {activeTab === "recurring" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-surface border border-border/70 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">Recurring Subscriptions</h3>
                <p className="text-xs text-text-muted">
                  {recurringExpenses.length} templates configured
                </p>
              </div>
            </div>
            <p className="text-xs text-text-muted">
              Configure rent, WiFi, and streaming subscriptions to automatically generate
              actual expenses on their due dates.
            </p>
            <button
              onClick={() => setRecurringDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 transition-opacity"
            >
              <span>Manage Subscriptions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-6 bg-surface border border-border/70 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">Income Entries</h3>
                <p className="text-xs text-text-muted">
                  {incomes.length} earnings logged
                </p>
              </div>
            </div>
            <p className="text-xs text-text-muted">
              Track incoming salary, freelance payouts, and stipends to view your real-time net
              savings rate.
            </p>
            <button
              onClick={() => setIncomeDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-success text-white hover:opacity-95 transition-opacity"
            >
              <span>View & Add Income</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Quick Add Button (Desktop / Mobile shortcut) */}
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

      {/* Quick Add Sheet */}
      <QuickAddExpenseSheet
        isOpen={quickAddOpen}
        onClose={() => {
          setQuickAddOpen(false);
          setEditingExpense(null);
        }}
        categories={categories}
        onSave={handleSaveExpense}
        defaultCategoryId={editingExpense?.category_id || undefined}
        defaultPlace={editingExpense?.place || undefined}
      />

      {/* Recurring Manager Modal */}
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

      {/* Income Modal */}
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
