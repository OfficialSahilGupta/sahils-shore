"use client";

// ============================================================================
// Sahil's Shore: Spending Insights Card
// Weekend vs Weekday Spend, Biggest Category, and Projected Month-End Spend
// ============================================================================

import React from "react";
import { Sparkles, Calendar, PieChart, TrendingUp, Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR, type SpendingInsights } from "@/lib/expenses";

interface SpendingInsightsCardProps {
  insights: SpendingInsights;
}

export function SpendingInsightsCard({ insights }: SpendingInsightsCardProps) {
  const { weekendWeekdayComparisonText, biggestCategory, projectedMonthEnd } = insights;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Weekend vs Weekday Spend */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider">
              Weekend vs Weekday
            </h4>
          </div>
          <p className="text-sm font-medium text-text mt-1">
            {weekendWeekdayComparisonText}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40 text-xs">
          <div>
            <span className="text-text-muted text-[11px] block">Weekend Total</span>
            <span className="font-semibold text-text font-mono">
              {formatINR(insights.weekendSpendPaise)}
            </span>
            <span className="text-[10px] text-text-muted block">
              Avg {formatINR(insights.weekendDailyAvgPaise)}/day
            </span>
          </div>
          <div>
            <span className="text-text-muted text-[11px] block">Weekday Total</span>
            <span className="font-semibold text-text font-mono">
              {formatINR(insights.weekdaySpendPaise)}
            </span>
            <span className="text-[10px] text-text-muted block">
              Avg {formatINR(insights.weekdayDailyAvgPaise)}/day
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Biggest Category this month */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-accent-warm/15 flex items-center justify-center text-accent-warm">
              <PieChart className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider">
              Top Category
            </h4>
          </div>

          {biggestCategory ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-text">{biggestCategory.name}</span>
                <span className="text-xs font-semibold text-accent-warm font-mono">
                  {biggestCategory.percentage}% of total
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 font-mono">
                {formatINR(biggestCategory.amountPaise)} spent so far
              </p>
            </div>
          ) : (
            <p className="text-xs text-text-muted mt-1">
              Add categorized expenses to identify your largest spending bucket.
            </p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-border/40">
          <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${biggestCategory?.percentage || 0}%`,
                backgroundColor: biggestCategory?.color || "var(--accent-warm)",
              }}
            />
          </div>
        </div>
      </Card>

      {/* 3. Projected Month-End Spend */}
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-primary-soft/30 flex items-center justify-center text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider">
              Projected Month-End
            </h4>
          </div>

          <div className="text-xl font-bold text-text font-mono">
            {formatINR(projectedMonthEnd.projectedTotalPaise)}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Based on {formatINR(projectedMonthEnd.dailyAvgPaise)}/day pace across {projectedMonthEnd.daysInMonth} days
          </p>
        </div>

        <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-border/40">
          <span className="text-text-muted">
            Day {projectedMonthEnd.daysPassed} of {projectedMonthEnd.daysInMonth}
          </span>
          <span className="text-text font-medium">
            {projectedMonthEnd.daysRemaining} days left
          </span>
        </div>
      </Card>
    </div>
  );
}
