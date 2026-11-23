"use client";

// ============================================================================
// Sahil's Shore: Expense Summary Cards
// 5-card row: Today, Week, Month, Income & Savings, Budget Health
// ============================================================================

import React from "react";
import {
  Clock,
  Calendar,
  BarChart2,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";
import { formatINR } from "@/lib/expenses";
import { Card } from "@/components/ui/card";

// ── helpers ──────────────────────────────────────────────────────────────────

function trendPct(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

interface TrendChipProps {
  current: number;
  previous?: number;
  label: string;
}

function TrendChip({ current, previous, label }: TrendChipProps) {
  if (previous === undefined || previous === null) return null;
  const pct = trendPct(current, previous);
  if (pct === null) return null;

  const up = current > previous;
  // Spending more = bad (red), spending less = good (green)
  const good = !up;

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
        good
          ? "bg-success/10 text-success"
          : "bg-danger/10 text-danger"
      }`}
    >
      {up ? (
        <TrendingUp className="h-3 w-3 shrink-0" />
      ) : (
        <TrendingDown className="h-3 w-3 shrink-0" />
      )}
      <span>
        {Math.abs(pct)}% {label}
      </span>
    </div>
  );
}

// ── Savings Rate SVG ring ─────────────────────────────────────────────────────

interface SavingsRingProps {
  savingsPaise: number;
  incomePaise: number;
}

function SavingsRing({ savingsPaise, incomePaise }: SavingsRingProps) {
  const r = 24;
  const circumference = 2 * Math.PI * r;
  const pct = incomePaise > 0 ? Math.max(0, Math.min(100, (savingsPaise / incomePaise) * 100)) : 0;
  const dash = (pct / 100) * circumference;
  const isNeg = savingsPaise < 0;
  const strokeColor = isNeg ? "var(--danger)" : "var(--success)";
  const pctLabel = Math.round(pct);

  return (
    <svg viewBox="0 0 72 72" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="6"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={strokeColor}
      >
        {isNeg ? "-" : ""}{pctLabel}%
      </text>
    </svg>
  );
}

// ── Budget Health Ring ────────────────────────────────────────────────────────

interface BudgetRingProps {
  pct: number; // 0-100, % budget remaining avg
}

function BudgetRing({ pct }: BudgetRingProps) {
  const r = 24;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  const strokeColor =
    pct >= 50
      ? "var(--success)"
      : pct >= 20
      ? "var(--warning)"
      : "var(--danger)";

  return (
    <svg viewBox="0 0 72 72" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="6"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={strokeColor}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ── Month label helper ────────────────────────────────────────────────────────

function monthLabel(monthYear?: string): string {
  if (!monthYear) return "This Month";
  const [y, m] = monthYear.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExpenseSummaryCardsProps {
  todayPaise: number;
  thisWeekPaise: number;
  thisMonthPaise: number;
  totalIncomePaise: number;
  // Trend comparisons
  yesterdayPaise?: number;
  lastWeekPaise?: number;
  lastMonthPaise?: number;
  // Budget health (0-100 = average remaining % across categories)
  budgetHealthPct?: number;
  // If viewing a past month, label changes
  selectedMonthYear?: string;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ExpenseSummaryCards({
  todayPaise,
  thisWeekPaise,
  thisMonthPaise,
  totalIncomePaise = 0,
  yesterdayPaise,
  lastWeekPaise,
  lastMonthPaise,
  budgetHealthPct,
  selectedMonthYear,
}: ExpenseSummaryCardsProps) {
  const netSavingsPaise = totalIncomePaise - thisMonthPaise;
  const isViewingPastMonth =
    selectedMonthYear !== undefined &&
    selectedMonthYear !== "";
  const monthCardLabel = isViewingPastMonth
    ? monthLabel(selectedMonthYear)
    : "This Month";

  return (
    <div
      className="
        grid gap-3
        grid-cols-2
        md:grid-cols-3
        lg:grid-cols-5
        min-w-0
      "
    >
      {/* ── 1. Spent Today ── */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-muted truncate min-w-0">
            Spent Today
          </span>
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-text tracking-tight font-mono break-words min-w-0">
          {formatINR(todayPaise)}
        </div>
        <TrendChip current={todayPaise} previous={yesterdayPaise} label="vs yesterday" />
      </Card>

      {/* ── 2. This Week ── */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-muted truncate min-w-0">
            This Week
          </span>
          <div className="h-7 w-7 rounded-lg bg-accent-warm/15 flex items-center justify-center text-accent-warm shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-text tracking-tight font-mono break-words min-w-0">
          {formatINR(thisWeekPaise)}
        </div>
        <TrendChip current={thisWeekPaise} previous={lastWeekPaise} label="vs last week" />
      </Card>

      {/* ── 3. This Month / Past Month ── */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-muted truncate min-w-0">
            {monthCardLabel}
          </span>
          <div className="h-7 w-7 rounded-lg bg-danger/10 flex items-center justify-center text-danger shrink-0">
            <BarChart2 className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-text tracking-tight font-mono break-words min-w-0">
          {formatINR(thisMonthPaise)}
        </div>
        {!isViewingPastMonth && (
          <TrendChip current={thisMonthPaise} previous={lastMonthPaise} label="vs last month" />
        )}
      </Card>

      {/* ── 4. Income & Savings ── */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-muted truncate min-w-0">
            Income &amp; Savings
          </span>
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
              netSavingsPaise >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            <PiggyBank className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-text-muted">Income</div>
            <div className="text-sm font-bold text-success font-mono break-words">
              {formatINR(totalIncomePaise)}
            </div>
            <div className="text-[11px] text-text-muted mt-1">Savings</div>
            <div
              className={`text-sm font-bold font-mono break-words ${
                netSavingsPaise >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatINR(netSavingsPaise)}
            </div>
          </div>
          <SavingsRing savingsPaise={netSavingsPaise} incomePaise={totalIncomePaise} />
        </div>
      </Card>

      {/* ── 5. Budget Health ── */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-muted truncate min-w-0">
            Budget Health
          </span>
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>

        {budgetHealthPct !== undefined ? (
          <div className="flex items-center gap-3">
            <BudgetRing pct={budgetHealthPct} />
            <div className="min-w-0">
              <div
                className={`text-sm font-semibold ${
                  budgetHealthPct >= 50
                    ? "text-success"
                    : budgetHealthPct >= 20
                    ? "text-warning"
                    : "text-danger"
                }`}
              >
                {budgetHealthPct >= 50
                  ? "On track"
                  : budgetHealthPct >= 20
                  ? "Caution"
                  : "Over budget"}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {Math.round(budgetHealthPct)}% budget remaining
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-xs text-text-muted">
              No budgets set. Set per-category limits to track health.
            </p>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-1 cursor-pointer">
              <Plus className="h-3 w-3 shrink-0" />
              <span>Set budgets</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
