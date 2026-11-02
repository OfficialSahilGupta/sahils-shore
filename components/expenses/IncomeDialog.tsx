"use client";

// ============================================================================
// Sahil's Shore: Income Entries Dialog
// Log income sources (salary, freelance, stipend) and track total monthly earnings
// ============================================================================

import React, { useState } from "react";
import { Plus, TrendingUp, Trash2, X, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR, rupeesToPaise, type CreateIncomeInput } from "@/lib/expenses";
import { formatFriendlyISTDate, getISTDateString } from "@/lib/date-utils";
import type { Income } from "@/types/index.ts";

interface IncomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  incomes: Income[];
  onAddIncome: (input: CreateIncomeInput) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
}

export function IncomeDialog({
  isOpen,
  onClose,
  incomes,
  onAddIncome,
  onDeleteIncome,
}: IncomeDialogProps) {
  const [source, setSource] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

  const totalIncomePaise = incomes.reduce((acc, curr) => acc + curr.amount_paise, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Income Entries</h3>
              <p className="text-xs text-text-muted">
                Total logged: <span className="font-bold text-success font-mono">{formatINR(totalIncomePaise)}</span>
              </p>
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

        {/* Form */}
        <div className="py-4 space-y-3 border-b border-border/50">
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
                placeholder="e.g. Salary, Freelance, Stipend"
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
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
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-surface-muted/60 border border-border text-text font-mono focus:ring-1 focus:ring-primary"
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
              placeholder="e.g. October performance bonus"
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={isSubmitting || !source.trim() || !amountRupees}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-success text-white hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Income</span>
            </button>
          </div>
        </div>

        {/* Incomes List */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-2">
          {incomes.length === 0 ? (
            <div className="text-center py-8 text-xs text-text-muted">
              No income entries recorded yet.
            </div>
          ) : (
            incomes.map((inc) => (
              <div
                key={inc.id}
                className="p-3 bg-surface border border-border/70 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">{inc.source}</span>
                    <span className="text-[11px] text-text-muted">
                      {formatFriendlyISTDate(inc.received_at)}
                    </span>
                  </div>
                  {inc.notes && (
                    <span className="text-xs text-text-muted block mt-0.5">{inc.notes}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
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
      </div>
    </div>
  );
}
