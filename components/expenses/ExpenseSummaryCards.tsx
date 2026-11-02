"use client";

// ============================================================================
// Sahil's Shore: Expense Summary Cards
// Displays Today, This Week, This Month spending widgets, Income, and Net Savings
// ============================================================================

import React from "react";
import {
  Wallet,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  PiggyBank,
} from "lucide-react";
import { formatINR } from "@/lib/expenses";
import { Card } from "@/components/ui/card";

interface ExpenseSummaryCardsProps {
  todayPaise: number;
  thisWeekPaise: number;
  thisMonthPaise: number;
  totalIncomePaise?: number;
}

export function ExpenseSummaryCards({
  todayPaise,
  thisWeekPaise,
  thisMonthPaise,
  totalIncomePaise = 0,
}: ExpenseSummaryCardsProps) {
  const netSavingsPaise = totalIncomePaise - thisMonthPaise;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Spent Today */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-muted">Spent Today</span>
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-text tracking-tight font-mono">
          {formatINR(todayPaise)}
        </div>
        <p className="text-[11px] text-text-muted mt-1">Calendar day (IST)</p>
      </Card>

      {/* 2. Spent This Week */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-muted">This Week</span>
          <div className="h-7 w-7 rounded-lg bg-accent-warm/15 flex items-center justify-center text-accent-warm">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-text tracking-tight font-mono">
          {formatINR(thisWeekPaise)}
        </div>
        <p className="text-[11px] text-text-muted mt-1">Since Monday</p>
      </Card>

      {/* 3. Spent This Month */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-muted">This Month</span>
          <div className="h-7 w-7 rounded-lg bg-danger/10 flex items-center justify-center text-danger">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-text tracking-tight font-mono">
          {formatINR(thisMonthPaise)}
        </div>
        <p className="text-[11px] text-text-muted mt-1">Total expenses</p>
      </Card>

      {/* 4. Total Income & Net Savings */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-muted">Net Savings</span>
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center ${
              netSavingsPaise >= 0
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            <PiggyBank className="h-4 w-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-bold tracking-tight font-mono ${
            netSavingsPaise >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {formatINR(netSavingsPaise)}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-text-muted mt-1">
          <span>Income:</span>
          <span className="font-semibold text-text">{formatINR(totalIncomePaise)}</span>
        </div>
      </Card>
    </div>
  );
}
