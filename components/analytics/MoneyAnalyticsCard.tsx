"use client";

// ============================================================================
// Sahil's Shore: Money Analytics Component
// Paise-accurate INR spend by category, place, weekday, and budget adherence
// ============================================================================

import React from "react";
import type { MoneyAnalyticsSummary } from "@/lib/analytics/types";
import { formatINR as formatRupeesFromPaise } from "@/lib/expenses";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface MoneyAnalyticsCardProps {
  money: MoneyAnalyticsSummary;
}

const CATEGORY_COLORS = [
  "#1F7A8C",
  "#E0A458",
  "#4FB3C8",
  "#2E9E6B",
  "#D9922B",
  "#8FA3B0",
  "#D1495B",
  "#6B5B95",
];

export function MoneyAnalyticsCard({ money }: MoneyAnalyticsCardProps) {
  const isHigherSpend = money.monthOverMonth.percentageChange > 0;

  return (
    <div className="space-y-6">
      {/* 1. Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Spend */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>Total Spend</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-text">
            {formatRupeesFromPaise(money.totalPaise)}
          </div>
          <p className="mt-1 text-xs text-text-muted">In selected period</p>
        </div>

        {/* Card 2: Daily Average */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>Daily Average</span>
            <Calendar className="h-4 w-4 text-accent-warm" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-text">
            {formatRupeesFromPaise(money.dailyAveragePaise)}
          </div>
          <p className="mt-1 text-xs text-text-muted">Per calendar day</p>
        </div>

        {/* Card 3: Projected 30-Day Burn */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>Projected Monthly</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-text">
            {formatRupeesFromPaise(money.projectedMonthPaise)}
          </div>
          <p className="mt-1 text-xs text-text-muted">Estimated 30-day pace</p>
        </div>

        {/* Card 4: Month-over-Month */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>Period vs Previous</span>
            {isHigherSpend ? (
              <TrendingUp className="h-4 w-4 text-amber-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                isHigherSpend ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isHigherSpend ? "+" : ""}
              {money.monthOverMonth.percentageChange}%
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {isHigherSpend ? "Higher spend rate" : "Saved compared to previous"}
          </p>
        </div>
      </div>

      {/* 2. Category & Place Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-text">Spend By Category</h3>
            </div>
            <span className="text-xs text-text-muted">
              {money.byCategory.length} Categories
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {money.byCategory.length === 0 ? (
              <p className="py-6 text-center text-xs text-text-muted">
                No expenses logged in this date range.
              </p>
            ) : (
              money.byCategory.map((cat, idx) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                        }}
                      />
                      {cat.name}
                    </span>
                    <span className="text-text-muted">
                      <strong className="text-text">{formatRupeesFromPaise(cat.paise)}</strong> ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor:
                          CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Spending Places (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent-warm" />
              <h3 className="text-base font-bold text-text">Top Places</h3>
            </div>
            <span className="text-xs text-text-muted">By Spend</span>
          </div>

          <div className="mt-4 space-y-3">
            {money.byPlace.length === 0 ? (
              <p className="py-6 text-center text-xs text-text-muted">
                No place tags on expenses in this window.
              </p>
            ) : (
              money.byPlace.map((p) => (
                <div
                  key={p.place}
                  className="rounded-xl border border-border/80 bg-surface-muted/30 p-3 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-text">{p.place}</h4>
                    <p className="text-[11px] text-text-muted">
                      {p.count} transaction{p.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-text">
                    {formatRupeesFromPaise(p.paise)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Spend By Weekday & Budget Adherence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spend by Weekday (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-text">Spend By Weekday</h3>
            </div>
            <span className="text-xs text-text-muted">Patterns</span>
          </div>

          <div className="mt-4 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={money.byWeekday} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="weekday" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Total Spend"]}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    color: "var(--text)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="rupees" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Adherence (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent-warm" />
              <h3 className="text-base font-bold text-text">Monthly Budget Adherence</h3>
            </div>
            <span className="text-xs text-text-muted">Target Thresholds</span>
          </div>

          <div className="mt-4 space-y-3">
            {money.budgetAdherence.length === 0 ? (
              <p className="py-6 text-center text-xs text-text-muted">
                No category budgets set. Visit Expenses module to configure monthly limits.
              </p>
            ) : (
              money.budgetAdherence.map((b) => {
                let barColor = "bg-primary";
                let badgeClass = "text-primary border-primary/20 bg-primary/10";
                if (b.status === "amber") {
                  barColor = "bg-amber-500";
                  badgeClass = "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10";
                } else if (b.status === "danger") {
                  barColor = "bg-rose-500";
                  badgeClass = "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10";
                }

                return (
                  <div key={b.categoryId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-text">{b.categoryName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">
                          {formatRupeesFromPaise(b.spentPaise)} / {formatRupeesFromPaise(b.budgetPaise)}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                          {b.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
