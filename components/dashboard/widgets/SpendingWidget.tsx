"use client";

// ============================================================================
// Sahil's Shore: Today's Spend & Budget Widget
// Paise-accurate INR spend today, budget status, and remaining monthly target
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getExpenses, getBudgets, formatINR, calculateBudgetStatus } from "@/lib/expenses";
import { todayIST, getISTDateRangeUTC } from "@/lib/date-utils";
import { useQuickCapture } from "@/lib/quick-capture/QuickCaptureContext";
import type { Expense, Budget } from "@/types";
import type { WidgetId } from "@/lib/dashboard/types";
import { Wallet, Plus, ArrowRight, TrendingUp } from "lucide-react";

interface SpendingWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

export function SpendingWidget({ isEditMode, onRemove }: SpendingWidgetProps) {
  const [todaySpendPaise, setTodaySpendPaise] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [totalMonthlyBudgetPaise, setTotalMonthlyBudgetPaise] = useState(0);
  const [monthlySpendPaise, setMonthlySpendPaise] = useState(0);
  const { open: openQuickCapture } = useQuickCapture();

  const loadSpending = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      const uid = data.user.id;
      const today = todayIST();
      const { startUTC, endUTC } = getISTDateRangeUTC(today);

      // Fetch expenses for today
      const todayExpenses = await getExpenses(supabase, uid, {
        startDateUTC: startUTC,
        endDateUTC: endUTC,
      });

      const todayTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount_paise || 0), 0);
      setTodaySpendPaise(todayTotal);
      setTodayCount(todayExpenses.length);

      // Fetch monthly budgets
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const monthYear = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
      const budgets = await getBudgets(supabase, uid, monthYear);
      const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount_paise || 0), 0);
      setTotalMonthlyBudgetPaise(totalBudget);

      // Fetch monthly expenses
      const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0)).toISOString();
      const monthExpenses = await getExpenses(supabase, uid, {
        startDateUTC: monthStart,
      });
      const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount_paise || 0), 0);
      setMonthlySpendPaise(monthTotal);
    } catch (e) {
      console.warn("Failed loading spending widget:", e);
    }
  }, []);

  useEffect(() => {
    loadSpending();

    const handleUpdate = () => loadSpending();
    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadSpending]);

  const budgetStatusObj = totalMonthlyBudgetPaise > 0
    ? calculateBudgetStatus(monthlySpendPaise, totalMonthlyBudgetPaise)
    : null;

  const budgetColor = budgetStatusObj?.statusColor || "normal";
  const percentSpent = budgetStatusObj ? Math.min(100, Math.round(budgetStatusObj.percentage)) : 0;

  return (
    <WidgetContainer
      id="spending"
      title="Spent Today"
      icon={Wallet}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <button
          type="button"
          onClick={() => openQuickCapture("expense")}
          className="p-1 rounded text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          title="Quick Add Expense"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-3">
        <div>
          <div className="text-2xl font-extrabold text-text tracking-tight">
            {formatINR(todaySpendPaise)}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            {todayCount} {todayCount === 1 ? "expense" : "expenses"} logged today
          </p>
        </div>

        {/* Monthly Budget Progress */}
        {totalMonthlyBudgetPaise > 0 ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Monthly Budget</span>
              <span className={`font-semibold ${
                budgetColor === "red"
                  ? "text-danger"
                  : budgetColor === "amber"
                  ? "text-warning"
                  : "text-text"
              }`}>
                {percentSpent}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  budgetColor === "red"
                    ? "bg-danger"
                    : budgetColor === "amber"
                    ? "bg-warning"
                    : "bg-primary"
                }`}
                style={{ width: `${percentSpent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>{formatINR(monthlySpendPaise)} spent</span>
              <span>{formatINR(Math.max(0, totalMonthlyBudgetPaise - monthlySpendPaise))} left</span>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-xl border border-border/60 bg-surface-muted/30 text-[11px] text-text-muted">
            Set up category budgets in the Expenses module to track targets.
          </div>
        )}

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Paise-accurate integer</span>
          <Link href="/expenses" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Expenses</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
