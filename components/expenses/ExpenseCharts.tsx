"use client";

// ============================================================================
// Sahil's Shore: Expense Recharts Visualizations
// Category Donut, Daily Trend, Month vs Previous Month, and Top Places
// ============================================================================

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatINR, formatIndianNumber, paiseToRupees } from "@/lib/expenses";
import { getISTDateString, formatFriendlyISTDate } from "@/lib/date-utils";
import type { Expense, ExpenseCategory } from "@/types/index.ts";

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  currentMonthYear: string; // "YYYY-MM"
  previousMonthYear: string; // "YYYY-MM"
}

const DEFAULT_CATEGORY_COLORS = [
  "#E0A458", // Food
  "#1F7A8C", // Transport
  "#4FB3C8", // Study
  "#D1495B", // Bills
  "#9B5DE5", // Shopping
  "#2E9E6B", // Health
  "#F15BB5", // Entertainment
  "#5B6B76", // Other
];

export function ExpenseCharts({
  expenses,
  categories,
  currentMonthYear,
  previousMonthYear,
}: ExpenseChartsProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<string, ExpenseCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // 1. Category Donut Data
  const donutData = useMemo(() => {
    const currentMonthExpenses = expenses.filter((e) =>
      getISTDateString(e.spent_at).startsWith(currentMonthYear)
    );

    const spendByCat = new Map<string, number>();
    let totalPaise = 0;

    currentMonthExpenses.forEach((e) => {
      totalPaise += e.amount_paise;
      const catKey = e.category_id || "uncategorized";
      spendByCat.set(catKey, (spendByCat.get(catKey) || 0) + e.amount_paise);
    });

    const result = Array.from(spendByCat.entries()).map(([catId, amountPaise], idx) => {
      const catObj = catId !== "uncategorized" ? categoryMap.get(catId) : null;
      return {
        id: catId,
        name: catObj?.name || "Other",
        value: paiseToRupees(amountPaise),
        amountPaise,
        percentage: totalPaise > 0 ? Math.round((amountPaise / totalPaise) * 100) : 0,
        color: catObj?.color || DEFAULT_CATEGORY_COLORS[idx % DEFAULT_CATEGORY_COLORS.length],
      };
    });

    return result.sort((a, b) => b.value - a.value);
  }, [expenses, currentMonthYear, categoryMap]);

  // 2. Daily Spend Trend (Current Month)
  const dailyTrendData = useMemo(() => {
    const [year, month] = currentMonthYear.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // Group spend by day of month
    const daySpendMap = new Map<number, number>();
    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      if (dateStr.startsWith(currentMonthYear)) {
        const day = parseInt(dateStr.split("-")[2], 10);
        daySpendMap.set(day, (daySpendMap.get(day) || 0) + e.amount_paise);
      }
    });

    const data: Array<{ day: string; amount: number; amountPaise: number }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const paise = daySpendMap.get(d) || 0;
      data.push({
        day: `${d}`,
        amount: paiseToRupees(paise),
        amountPaise: paise,
      });
    }

    return data;
  }, [expenses, currentMonthYear]);

  // 3. Month vs Previous Month Comparison per Category
  const comparisonData = useMemo(() => {
    const currentSpend = new Map<string, number>();
    const prevSpend = new Map<string, number>();

    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      const catId = e.category_id || "other";
      if (dateStr.startsWith(currentMonthYear)) {
        currentSpend.set(catId, (currentSpend.get(catId) || 0) + e.amount_paise);
      } else if (dateStr.startsWith(previousMonthYear)) {
        prevSpend.set(catId, (prevSpend.get(catId) || 0) + e.amount_paise);
      }
    });

    return categories.map((cat) => {
      const curr = currentSpend.get(cat.id) || 0;
      const prev = prevSpend.get(cat.id) || 0;
      return {
        category: cat.name,
        currentMonth: paiseToRupees(curr),
        previousMonth: paiseToRupees(prev),
        currentPaise: curr,
        prevPaise: prev,
        color: cat.color || "#1F7A8C",
      };
    });
  }, [expenses, categories, currentMonthYear, previousMonthYear]);

  // 4. Top Places
  const topPlacesData = useMemo(() => {
    const placeMap = new Map<string, { paise: number; count: number }>();
    expenses.forEach((e) => {
      const place = e.place?.trim();
      if (place) {
        const existing = placeMap.get(place) || { paise: 0, count: 0 };
        placeMap.set(place, {
          paise: existing.paise + e.amount_paise,
          count: existing.count + 1,
        });
      }
    });

    return Array.from(placeMap.entries())
      .map(([place, data]) => ({
        place,
        amountRupees: paiseToRupees(data.paise),
        amountPaise: data.paise,
        count: data.count,
      }))
      .sort((a, b) => b.amountRupees - a.amountRupees)
      .slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Top Row: Donut Chart & Daily Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Donut */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Category Split</h3>
              <p className="text-xs text-text-muted">Current month expenditure breakdown</p>
            </div>
          </div>

          {donutData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-text-muted">
              No expenses recorded for this month yet.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-56 w-56 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`₹${formatIndianNumber(val)}`, "Spent"]}
                      contentStyle={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend & Percentages */}
              <div className="flex-1 w-full space-y-2 overflow-y-auto max-h-56 pr-1">
                {donutData.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-text font-medium truncate">{d.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-text font-mono">
                        {formatINR(d.amountPaise)}
                      </span>
                      <span className="text-[11px] text-text-muted ml-1.5 font-mono">
                        ({d.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Daily Trend Area Chart */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Daily Spend Trend</h3>
              <p className="text-xs text-text-muted">Daily distribution across the month</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="day"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: number) => [`₹${formatIndianNumber(val)}`, "Spent"]}
                  labelFormatter={(day) => `Day ${day}`}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Month vs Previous Month & Top Places */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Month vs Previous Month */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Month vs Previous Month</h3>
              <p className="text-xs text-text-muted">Category comparison with last month</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `₹${formatIndianNumber(val)}`,
                    name === "currentMonth" ? "This Month" : "Last Month",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => (value === "currentMonth" ? "This Month" : "Last Month")}
                />
                <Bar dataKey="currentMonth" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previousMonth" fill="var(--surface-muted)" stroke="var(--border)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Places Leaderboard */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Top Places</h3>
              <p className="text-xs text-text-muted">Where you spend the most</p>
            </div>
          </div>

          {topPlacesData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-text-muted">
              Add places to your expenses to see top locations.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {topPlacesData.map((item, index) => {
                const maxSpend = topPlacesData[0]?.amountRupees || 1;
                const pct = Math.round((item.amountRupees / maxSpend) * 100);

                return (
                  <div key={item.place} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-surface-muted text-[10px] font-bold text-text-muted flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-text">{item.place}</span>
                        <span className="text-[11px] text-text-muted">({item.count} orders)</span>
                      </div>
                      <span className="font-bold text-text font-mono">
                        {formatINR(item.amountPaise)}
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
