"use client";

// ============================================================================
// Sahil's Shore: Monthly Category Budgets
// Progress bars turning amber at 80% and red at 100%, with inline budget editing
// ============================================================================

import React, { useState } from "react";
import {
  Wallet,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Plus,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  formatINR,
  rupeesToPaise,
  paiseToRupees,
  calculateBudgetStatus,
  type BudgetStatusColor,
} from "@/lib/expenses";
import type { ExpenseCategory, Budget, Expense } from "@/types/index.ts";
import { getISTDateString } from "@/lib/date-utils";

interface CategoryBudgetsProps {
  categories: ExpenseCategory[];
  budgets: Budget[];
  expenses: Expense[];
  currentMonthYear: string; // "YYYY-MM"
  onSaveBudget: (categoryId: string, amountPaise: number) => Promise<void>;
}

export function CategoryBudgets({
  categories,
  budgets,
  expenses,
  currentMonthYear,
  onSaveBudget,
}: CategoryBudgetsProps) {
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [budgetRupeesInput, setBudgetRupeesInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Group current month spending by category
  const currentMonthExpenses = expenses.filter((e) =>
    getISTDateString(e.spent_at).startsWith(currentMonthYear)
  );

  const spendMap = new Map<string, number>();
  currentMonthExpenses.forEach((e) => {
    if (e.category_id) {
      spendMap.set(e.category_id, (spendMap.get(e.category_id) || 0) + e.amount_paise);
    }
  });

  const budgetMap = new Map<string, Budget>();
  budgets.forEach((b) => budgetMap.set(b.category_id, b));

  const handleOpenEdit = (cat: ExpenseCategory) => {
    const existingBudget = budgetMap.get(cat.id);
    setEditingCategory(cat);
    setBudgetRupeesInput(
      existingBudget ? paiseToRupees(existingBudget.amount_paise).toString() : ""
    );
  };

  const handleSave = async () => {
    if (!editingCategory) return;
    setIsSaving(true);
    try {
      const paise = rupeesToPaise(budgetRupeesInput);
      await onSaveBudget(editingCategory.id, paise);
      setEditingCategory(null);
    } catch (err) {
      console.error("Failed to save budget:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text">Category Budgets</h3>
          <p className="text-xs text-text-muted">
            Caps for {currentMonthYear}. Progress turns amber at 80% and red at 100%.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const spent = spendMap.get(cat.id) || 0;
          const budgetObj = budgetMap.get(cat.id);
          const budgetPaise = budgetObj ? budgetObj.amount_paise : 0;
          const status = calculateBudgetStatus(spent, budgetPaise);

          // Color tokens according to status
          let barBgClass = "bg-primary";
          let badgeClass = "bg-primary/10 text-primary";
          let statusText = "On Track";

          if (status.statusColor === "red") {
            barBgClass = "bg-danger";
            badgeClass = "bg-danger/10 text-danger";
            statusText = status.isOver ? "Over Budget" : "100% Reached";
          } else if (status.statusColor === "amber") {
            barBgClass = "bg-warning";
            badgeClass = "bg-warning/15 text-warning";
            statusText = "Near Limit (≥80%)";
          }

          const fillPercentage = Math.min(status.percentage, 100);

          return (
            <Card
              key={cat.id}
              className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color || "#1F7A8C" }}
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-text">{cat.name}</h4>
                    <span className="text-[11px] text-text-muted">
                      {budgetPaise > 0
                        ? `${formatINR(spent)} of ${formatINR(budgetPaise)}`
                        : `${formatINR(spent)} spent (No budget set)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {budgetPaise > 0 && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badgeClass}`}>
                      {statusText}
                    </span>
                  )}
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                    aria-label={`Edit ${cat.name} budget`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {budgetPaise > 0 ? (
                <div className="space-y-1.5 mt-3">
                  <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barBgClass}`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-text-muted">
                      {status.percentage}% used
                    </span>
                    <span className={status.isOver ? "text-danger font-bold" : "text-text-muted"}>
                      {status.isOver
                        ? `Over by ${formatINR(status.overspendPaise)}`
                        : `${formatINR(status.remainingPaise)} left`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">No monthly cap set</span>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Set Budget
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingCategory && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-text">
                Budget for {editingCategory.name}
              </h4>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Monthly spending cap for {currentMonthYear} (in INR).
            </p>

            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                  ₹
                </span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={budgetRupeesInput}
                  onChange={(e) => setBudgetRupeesInput(e.target.value)}
                  placeholder="e.g. 8000"
                  className="w-full pl-8 pr-3 py-2 text-sm font-semibold rounded-xl bg-surface-muted border border-border text-text focus:outline-hidden focus:ring-1 focus:ring-primary font-mono"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-surface-muted hover:bg-border/60 text-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 transition-opacity"
              >
                Save Cap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
