"use client";

// ============================================================================
// Sahil's Shore: Monthly Category Budgets
// Category icons, overall summary row, remaining-amount badge in green
// ============================================================================

import React, { useState } from "react";
import {
  Wallet,
  Plus,
  Pencil,
  X,
  Tag,
  Utensils,
  Car,
  ShoppingCart,
  Zap,
  Heart,
  BookOpen,
  Tv,
  Dumbbell,
  ShoppingBag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  formatINR,
  rupeesToPaise,
  paiseToRupees,
  calculateBudgetStatus,
} from "@/lib/expenses";
import type { ExpenseCategory, Budget, Expense } from "@/types/index.ts";
import { getISTDateString } from "@/lib/date-utils";

// ---------------------------------------------------------------------------
// Category icon helper (same as ExpenseList)
// ---------------------------------------------------------------------------
function getCategoryIcon(categoryName: string): React.ElementType {
  const name = (categoryName || "").toLowerCase();
  if (name.includes("food") || name.includes("eat") || name.includes("meal") || name.includes("restaurant")) return Utensils;
  if (name.includes("transport") || name.includes("travel") || name.includes("car") || name.includes("fuel") || name.includes("auto") || name.includes("cab")) return Car;
  if (name.includes("shopping")) return ShoppingCart;
  if (name.includes("bill") || name.includes("utilit") || name.includes("electric") || name.includes("internet") || name.includes("phone")) return Zap;
  if (name.includes("health") || name.includes("medical") || name.includes("doctor") || name.includes("medicine")) return Heart;
  if (name.includes("education") || name.includes("study") || name.includes("learning") || name.includes("course") || name.includes("book")) return BookOpen;
  if (name.includes("entertainment") || name.includes("stream") || name.includes("movie") || name.includes("ott")) return Tv;
  if (name.includes("gym") || name.includes("fitness") || name.includes("workout") || name.includes("sport")) return Dumbbell;
  if (name.includes("grocer") || name.includes("supermarket") || name.includes("vegetable") || name.includes("fruit")) return ShoppingBag;
  return Tag;
}

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

  // ---------------------------------------------------------------------------
  // Overall summary
  // ---------------------------------------------------------------------------
  const totalBudgetedPaise = Array.from(budgetMap.values()).reduce(
    (acc, b) => acc + b.amount_paise, 0
  );
  const totalSpentPaise = currentMonthExpenses.reduce((acc, e) => acc + e.amount_paise, 0);
  const overallPct = totalBudgetedPaise > 0
    ? Math.round((totalSpentPaise / totalBudgetedPaise) * 100)
    : 0;
  const overallBarColor =
    overallPct >= 100 ? "bg-danger" : overallPct >= 80 ? "bg-warning" : "bg-primary";
  const overallFill = Math.min(overallPct, 100);

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------
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
      {/* ---- Section header ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text">Category Budgets</h3>
          <p className="text-xs text-text-muted">
            Caps for {currentMonthYear}. Progress turns amber at 80% and red at 100%.
          </p>
        </div>
      </div>

      {/* ---- Overall Summary Row ---- */}
      {totalBudgetedPaise > 0 && (
        <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text">Overall Budget Usage</p>
                <p className="text-[11px] text-text-muted">{currentMonthYear}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-text font-mono">{formatINR(totalSpentPaise)}</p>
              <p className="text-[11px] text-text-muted font-mono">of {formatINR(totalBudgetedPaise)}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${overallBarColor}`}
                style={{ width: `${overallFill}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-muted">{overallPct}% used</span>
              {totalSpentPaise <= totalBudgetedPaise ? (
                <span className="text-success font-bold">
                  {formatINR(totalBudgetedPaise - totalSpentPaise)} remaining
                </span>
              ) : (
                <span className="text-danger font-bold">
                  Over by {formatINR(totalSpentPaise - totalBudgetedPaise)}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ---- Category Grid ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const spent = spendMap.get(cat.id) || 0;
          const budgetObj = budgetMap.get(cat.id);
          const budgetPaise = budgetObj ? budgetObj.amount_paise : 0;
          const status = calculateBudgetStatus(spent, budgetPaise);
          const CatIcon = getCategoryIcon(cat.name);
          const catColor = cat.color || "#1F7A8C";

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
              <div className="flex items-start justify-between mb-2 gap-2">
                {/* Icon circle + name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${catColor}22`, color: catColor }}
                  >
                    <CatIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-text truncate">{cat.name}</h4>
                    <span className="text-[11px] text-text-muted">
                      {budgetPaise > 0
                        ? `${formatINR(spent)} of ${formatINR(budgetPaise)}`
                        : `${formatINR(spent)} spent (No budget set)`}
                    </span>
                  </div>
                </div>

                {/* Status badge + edit */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {budgetPaise > 0 && !status.isOver && status.statusColor === "normal" && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-success/10 text-success">
                      {formatINR(status.remainingPaise)} left
                    </span>
                  )}
                  {budgetPaise > 0 && status.statusColor !== "normal" && (
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
                    <span className="text-text-muted">{status.percentage}% used</span>
                    <span className={status.isOver ? "text-danger font-bold" : "text-success font-semibold"}>
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
                    <Plus className="h-3 w-3 shrink-0" /> Set Budget
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ---- Edit Budget Modal (unchanged) ---- */}
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
