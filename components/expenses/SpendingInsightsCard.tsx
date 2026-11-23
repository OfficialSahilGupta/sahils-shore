"use client";

// ============================================================================
// Sahil's Shore: Spending Insights Card
// 6 insight cards: Weekend vs Weekday, Top Category, Projected Month-End,
//   Unusual Spend Alert, Top Merchant, Daily Budget
// ============================================================================

import React, { useMemo } from "react";
import {
  Calendar,
  PieChart,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR, type SpendingInsights } from "@/lib/expenses";
import { getISTDateString, todayIST } from "@/lib/date-utils";
import type { Expense, ExpenseCategory } from "@/types/index";

// ── Props ─────────────────────────────────────────────────────────────────────

interface SpendingInsightsCardProps {
  insights: SpendingInsights;
  expenses?: Expense[];
  categories?: ExpenseCategory[];
  totalBudgetPaise?: number;
  currentMonthYear?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysInMonth(monthYear: string): number {
  const [y, m] = monthYear.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function daysRemainingInMonth(monthYear: string): number {
  const today = todayIST();
  const [y, m] = monthYear.split("-").map(Number);
  const lastDay = new Date(y, m, 0);
  const lastDayStr = getISTDateString(lastDay);
  if (today > lastDayStr) return 0;
  const totalDays = daysInMonth(monthYear);
  const dayOfMonth = parseInt(today.split("-")[2], 10);
  return Math.max(0, totalDays - dayOfMonth);
}

function formatDate(isoDateOrTimestamp: string): string {
  const d = new Date(isoDateOrTimestamp);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

// ── Insight Card shell ────────────────────────────────────────────────────────

interface InsightCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function InsightCard({ icon, iconBg, title, children, footer }: InsightCardProps) {
  return (
    <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col justify-between min-w-0">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <h4 className="text-xs font-semibold text-text uppercase tracking-wider truncate min-w-0">
            {title}
          </h4>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
      {footer && (
        <div className="mt-3 pt-3 border-t border-border/40 min-w-0">{footer}</div>
      )}
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SpendingInsightsCard({
  insights,
  expenses = [],
  categories: _categories = [],
  totalBudgetPaise,
  currentMonthYear,
}: SpendingInsightsCardProps) {
  const { weekendWeekdayComparisonText, biggestCategory, projectedMonthEnd } = insights;

  // ── Unusual Spend: any day > 2× daily average ──────────────────────────────
  const unusualDay = useMemo<{ date: string; amount: number } | null>(() => {
    if (!expenses.length) return null;
    // Group by IST date
    const byDate = new Map<string, number>();
    for (const e of expenses) {
      const dateKey = getISTDateString(e.spent_at);
      byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + e.amount_paise);
    }
    if (!byDate.size) return null;
    const days = Array.from(byDate.values());
    const avg = days.reduce((s, v) => s + v, 0) / days.length;
    if (avg === 0) return null;
    let worst: { date: string; amount: number } | null = null;
    const entries = Array.from(byDate.entries());
    for (let i = 0; i < entries.length; i++) {
      const [date, amount] = entries[i];
      if (amount > 2 * avg) {
        if (!worst || amount > worst.amount) {
          worst = { date, amount };
        }
      }
    }
    return worst;
  }, [expenses]);

  // ── Top Merchant ───────────────────────────────────────────────────────────
  const topMerchant = useMemo<{ name: string; amount: number; count: number } | null>(() => {
    if (!expenses.length) return null;
    const byPlace = new Map<string, { amount: number; count: number }>();
    for (const e of expenses) {
      const place = e.place?.trim();
      if (!place) continue;
      const existing = byPlace.get(place) ?? { amount: 0, count: 0 };
      byPlace.set(place, {
        amount: existing.amount + e.amount_paise,
        count: existing.count + 1,
      });
    }
    if (!byPlace.size) return null;
    let top: { name: string; amount: number; count: number } | null = null;
    const entries = Array.from(byPlace.entries());
    for (let i = 0; i < entries.length; i++) {
      const [name, data] = entries[i];
      if (!top || data.amount > top.amount) {
        top = { name, ...data };
      }
    }
    return top;
  }, [expenses]);

  // ── Daily Budget remaining ─────────────────────────────────────────────────
  const dailyBudgetData = useMemo(() => {
    if (!totalBudgetPaise || !currentMonthYear) return null;
    const spent = projectedMonthEnd.currentSpentPaise;
    const remaining = totalBudgetPaise - spent;
    const daysLeft = daysRemainingInMonth(currentMonthYear);
    if (daysLeft <= 0) return null;
    const safeDaily = Math.round(remaining / daysLeft);
    return { safeDaily, remaining, daysLeft };
  }, [totalBudgetPaise, currentMonthYear, projectedMonthEnd.currentSpentPaise]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
      {/* ── 1. Weekend vs Weekday ── */}
      <InsightCard
        icon={<Calendar className="h-3.5 w-3.5" />}
        iconBg="bg-primary/10 text-primary"
        title="Weekend vs Weekday"
        footer={
          <div className="grid grid-cols-2 gap-2 text-xs min-w-0">
            <div className="min-w-0">
              <span className="text-text-muted text-[11px] block">Weekend Total</span>
              <span className="font-semibold text-text font-mono break-words">
                {formatINR(insights.weekendSpendPaise)}
              </span>
              <span className="text-[10px] text-text-muted block">
                Avg {formatINR(insights.weekendDailyAvgPaise)}/day
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-text-muted text-[11px] block">Weekday Total</span>
              <span className="font-semibold text-text font-mono break-words">
                {formatINR(insights.weekdaySpendPaise)}
              </span>
              <span className="text-[10px] text-text-muted block">
                Avg {formatINR(insights.weekdayDailyAvgPaise)}/day
              </span>
            </div>
          </div>
        }
      >
        <p className="text-sm font-medium text-text mt-1 break-words">
          {weekendWeekdayComparisonText}
        </p>
      </InsightCard>

      {/* ── 2. Top Category ── */}
      <InsightCard
        icon={<PieChart className="h-3.5 w-3.5" />}
        iconBg="bg-accent-warm/15 text-accent-warm"
        title="Top Category"
        footer={
          <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${biggestCategory?.percentage ?? 0}%`,
                backgroundColor: biggestCategory?.color ?? "var(--accent-warm)",
              }}
            />
          </div>
        }
      >
        {biggestCategory ? (
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
              <span className="text-lg font-bold text-text truncate min-w-0">
                {biggestCategory.name}
              </span>
              <span className="text-xs font-semibold text-accent-warm font-mono shrink-0">
                {biggestCategory.percentage}% of total
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1 font-mono break-words">
              {formatINR(biggestCategory.amountPaise)} spent so far
            </p>
          </div>
        ) : (
          <p className="text-xs text-text-muted mt-1">
            Add categorized expenses to identify your largest spending bucket.
          </p>
        )}
      </InsightCard>

      {/* ── 3. Projected Month-End ── */}
      <InsightCard
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        iconBg="bg-primary-soft/30 text-primary"
        title="Projected Month-End"
        footer={
          <div className="flex items-center justify-between text-xs min-w-0 gap-2">
            <span className="text-text-muted shrink-0">
              Day {projectedMonthEnd.daysPassed} of {projectedMonthEnd.daysInMonth}
            </span>
            <span className="text-text font-medium shrink-0">
              {projectedMonthEnd.daysRemaining} days left
            </span>
          </div>
        }
      >
        <div className="text-xl font-bold text-text font-mono break-words min-w-0">
          {formatINR(projectedMonthEnd.projectedTotalPaise)}
        </div>
        <p className="text-xs text-text-muted mt-1 break-words">
          Based on {formatINR(projectedMonthEnd.dailyAvgPaise)}/day across{" "}
          {projectedMonthEnd.daysInMonth} days
        </p>
      </InsightCard>

      {/* ── 4. Unusual Spend Alert ── */}
      <InsightCard
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        iconBg="bg-warning/15 text-warning"
        title="Unusual Spend Alert"
      >
        {unusualDay ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text break-words">
              Spike on {formatDate(unusualDay.date)}
            </p>
            <p className="text-xs text-text-muted mt-1 break-words">
              <span className="font-mono font-semibold text-danger">
                {formatINR(unusualDay.amount)}
              </span>{" "}
              — more than 2× your daily average
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-muted mt-1 break-words">
            No spending spikes this month. Great consistency!
          </p>
        )}
      </InsightCard>

      {/* ── 5. Top Merchant ── */}
      <InsightCard
        icon={<MapPin className="h-3.5 w-3.5" />}
        iconBg="bg-primary/10 text-primary"
        title="Top Merchant"
      >
        {topMerchant ? (
          <div className="min-w-0">
            <p className="text-lg font-bold text-text truncate min-w-0" title={topMerchant.name}>
              {topMerchant.name}
            </p>
            <p className="text-xs text-text-muted mt-1 break-words">
              <span className="font-mono font-semibold text-text">
                {formatINR(topMerchant.amount)}
              </span>{" "}
              across {topMerchant.count} visit{topMerchant.count !== 1 ? "s" : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-muted mt-1 break-words">
            Log expenses with a place to see your top merchant.
          </p>
        )}
      </InsightCard>

      {/* ── 6. Daily Budget ── */}
      <InsightCard
        icon={<Target className="h-3.5 w-3.5" />}
        iconBg="bg-success/10 text-success"
        title="Daily Budget"
      >
        {dailyBudgetData ? (
          <div className="min-w-0">
            <div
              className={`text-xl font-bold font-mono break-words min-w-0 ${
                dailyBudgetData.safeDaily <= 0 ? "text-danger" : "text-success"
              }`}
            >
              {dailyBudgetData.safeDaily <= 0
                ? "Over budget"
                : formatINR(dailyBudgetData.safeDaily) + "/day"}
            </div>
            <p className="text-xs text-text-muted mt-1 break-words">
              {dailyBudgetData.safeDaily <= 0
                ? `Exceeded by ${formatINR(Math.abs(dailyBudgetData.remaining))}`
                : `To stay on track — ${dailyBudgetData.daysLeft} days remaining`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-muted mt-1 break-words">
            Set monthly budgets to see your safe daily spend limit.
          </p>
        )}
      </InsightCard>
    </div>
  );
}
