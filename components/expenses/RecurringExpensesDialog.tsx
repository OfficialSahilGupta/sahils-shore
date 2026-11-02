"use client";

// ============================================================================
// Sahil's Shore: Recurring Expenses Manager
// Subscriptions, rent, bills with auto-creation engine and pause/active toggles
// ============================================================================

import React, { useState } from "react";
import {
  Repeat,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Power,
  X,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  formatINR,
  rupeesToPaise,
  paiseToRupees,
  type CreateRecurringExpenseInput,
} from "@/lib/expenses";
import type { RecurringExpense, ExpenseCategory } from "@/types/index.ts";

interface RecurringExpensesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recurringExpenses: RecurringExpense[];
  categories: ExpenseCategory[];
  onAddRecurring: (input: CreateRecurringExpenseInput) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
  onProcessRecurring: () => Promise<void>;
  isProcessing?: boolean;
}

export function RecurringExpensesDialog({
  isOpen,
  onClose,
  recurringExpenses,
  categories,
  onAddRecurring,
  onToggleActive,
  onDeleteRecurring,
  onProcessRecurring,
  isProcessing = false,
}: RecurringExpensesDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [amountRupees, setAmountRupees] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || "");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [frequency, setFrequency] = useState<"monthly" | "weekly" | "yearly">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categoryMap = new Map<string, ExpenseCategory>();
  categories.forEach((c) => categoryMap.set(c.id, c));

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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Recurring Expenses</h3>
              <p className="text-xs text-text-muted">Rent, subscriptions, and recurring bills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-full text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Action Bar: Auto-Create Engine & Add Button */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onProcessRecurring}
              disabled={isProcessing || recurringExpenses.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-accent-warm text-white hover:opacity-95 active:scale-95 transition-all shadow-xs disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isProcessing ? "Processing..." : "Auto-Generate Due Items"}</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-muted hover:bg-border/60 text-text transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddForm ? "Cancel" : "Add Recurring"}</span>
            </button>
          </div>

          {/* Add Recurring Form */}
          {showAddForm && (
            <Card className="p-4 bg-surface-muted/40 border border-border/80 rounded-2xl space-y-3 animate-in fade-in">
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
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border text-text font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted mb-1 block">
                    Category
                  </label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-text"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted mb-1 block">
                    Subscription / Place
                  </label>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Netflix, Apartment Rent, Gym"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-text"
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
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-border text-text"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95"
                >
                  Save Subscription
                </button>
              </div>
            </Card>
          )}

          {/* List of Recurring Expenses */}
          {recurringExpenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No recurring expenses set up yet. Add your rent, WiFi, or subscriptions above.
            </div>
          ) : (
            <div className="space-y-2">
              {recurringExpenses.map((item) => {
                const cat = item.category_id ? categoryMap.get(item.category_id) : null;

                return (
                  <Card
                    key={item.id}
                    className={`p-3 bg-surface border border-border/70 rounded-xl flex items-center justify-between gap-3 ${
                      !item.is_active ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleActive(item.id, !item.is_active)}
                        aria-label={item.is_active ? "Pause" : "Activate"}
                        className={`p-2 rounded-lg transition-colors ${
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
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-surface-muted text-text-muted capitalize">
                            {item.frequency} (Day {item.day_of_month || 1})
                          </span>
                        </div>
                        <span className="text-xs text-text-muted block">
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
                        aria-label="Delete recurring template"
                        className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-surface-muted transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
