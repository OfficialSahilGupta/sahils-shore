"use client";

// ============================================================================
// Sahil's Shore: Expense Recharts Visualizations
// 7 charts: Category Donut, Daily Trend, Weekly Bar, Payment Method Split,
// Month vs Previous Month, 3-Month Rolling Trend, Top Places (top 7)
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
  LineChart,
  Line,
  Label,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatINR, formatIndianNumber, paiseToRupees } from "@/lib/expenses";
import { getISTDateString } from "@/lib/date-utils";
import type { Expense, ExpenseCategory } from "@/types/index.ts";

// ── Types ──────────────────────────────────────────────────────────────────

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  currentMonthYear: string;  // "YYYY-MM"
  previousMonthYear: string; // "YYYY-MM"
  selectedMonthYear?: string; // "YYYY-MM" (may differ from current when browsing past months); defaults to currentMonthYear
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_CATEGORY_COLORS = [
  "#E0A458",
  "#1F7A8C",
  "#4FB3C8",
  "#D1495B",
  "#9B5DE5",
  "#2E9E6B",
  "#F15BB5",
  "#5B6B76",
];

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  UPI: "#1F7A8C",
  Cash: "#2E9E6B",
  Card: "#9B5DE5",
  "Net Banking": "#E0A458",
  Other: "#5B6B76",
};

const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Net Banking", "Other"];

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Format paise as a compact label for the donut centre, e.g. "₹12.4k" or "₹850" */
function formatCompact(paise: number): string {
  const rupees = paiseToRupees(paise);
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}k`;
  return `₹${formatIndianNumber(rupees)}`;
}

/** Shared tooltip content style */
const tooltipStyle = {
  backgroundColor: "var(--surface)",
  borderColor: "var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "var(--text)",
};

/** Shared card header block */
function ChartHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}

// ── Custom centre label for the donut ──────────────────────────────────────

interface DonutCentreProps {
  viewBox?: { cx?: number; cy?: number };
  totalPaise: number;
}

function DonutCentreLabel({ viewBox, totalPaise }: DonutCentreProps) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  const label = formatCompact(totalPaise);
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan
        x={cx}
        y={cy - 7}
        fontSize={13}
        fontWeight={700}
        fill="var(--text)"
      >
        {label}
      </tspan>
      <tspan x={cx} y={cy + 10} fontSize={10} fill="var(--text-muted)">
        total
      </tspan>
    </text>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function ExpenseCharts({
  expenses,
  categories,
  currentMonthYear,
  previousMonthYear,
  selectedMonthYear: selectedMonthYearProp,
}: ExpenseChartsProps) {
  const selectedMonthYear = selectedMonthYearProp ?? currentMonthYear;
  const categoryMap = useMemo(() => {
    const map = new Map<string, ExpenseCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // ── 1. Category Donut ───────────────────────────────────────────────────

  const { donutData, donutTotalPaise } = useMemo(() => {
    const currentMonthExpenses = expenses.filter((e) =>
      getISTDateString(e.spent_at).startsWith(selectedMonthYear)
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

    return {
      donutData: result.sort((a, b) => b.value - a.value),
      donutTotalPaise: totalPaise,
    };
  }, [expenses, selectedMonthYear, categoryMap]);

  // ── 2. Daily Spend Trend ────────────────────────────────────────────────

  const dailyTrendData = useMemo(() => {
    const [year, month] = selectedMonthYear.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const daySpendMap = new Map<number, number>();
    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      if (dateStr.startsWith(selectedMonthYear)) {
        const day = parseInt(dateStr.split("-")[2], 10);
        daySpendMap.set(day, (daySpendMap.get(day) || 0) + e.amount_paise);
      }
    });

    const data: Array<{ day: string; amount: number; amountPaise: number }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const paise = daySpendMap.get(d) || 0;
      data.push({ day: `${d}`, amount: paiseToRupees(paise), amountPaise: paise });
    }
    return data;
  }, [expenses, selectedMonthYear]);

  // ── 3. Month vs Previous Month ──────────────────────────────────────────

  const comparisonData = useMemo(() => {
    const currentSpend = new Map<string, number>();
    const prevSpend = new Map<string, number>();

    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      const catId = e.category_id || "other";
      if (dateStr.startsWith(selectedMonthYear)) {
        currentSpend.set(catId, (currentSpend.get(catId) || 0) + e.amount_paise);
      } else if (dateStr.startsWith(previousMonthYear)) {
        prevSpend.set(catId, (prevSpend.get(catId) || 0) + e.amount_paise);
      }
    });

    return categories.map((cat) => ({
      category: cat.name,
      currentMonth: paiseToRupees(currentSpend.get(cat.id) || 0),
      previousMonth: paiseToRupees(prevSpend.get(cat.id) || 0),
      currentPaise: currentSpend.get(cat.id) || 0,
      prevPaise: prevSpend.get(cat.id) || 0,
      color: cat.color || "#1F7A8C",
    }));
  }, [expenses, categories, selectedMonthYear, previousMonthYear]);

  // ── 4. Top 7 Places ─────────────────────────────────────────────────────

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
      .slice(0, 7);
  }, [expenses]);

  // ── 5. Weekly Spending (last 7 days) ────────────────────────────────────

  const { weeklyData, todayDayName } = useMemo(() => {
    const today = new Date();
    const todayStr = getISTDateString(today);
    const todayName = SHORT_DAY_NAMES[today.getDay()];

    const days: Array<{ dateStr: string; dayName: string }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getISTDateString(d);
      const dayName = SHORT_DAY_NAMES[d.getDay()];
      days.push({ dateStr, dayName });
    }

    const spendByDate = new Map<string, number>();
    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      spendByDate.set(dateStr, (spendByDate.get(dateStr) || 0) + e.amount_paise);
    });

    const data = days.map(({ dateStr, dayName }) => ({
      day: dayName,
      amount: paiseToRupees(spendByDate.get(dateStr) || 0),
      amountPaise: spendByDate.get(dateStr) || 0,
      isToday: dateStr === todayStr,
    }));

    return { weeklyData: data, todayDayName: todayName };
  }, [expenses]);

  // ── 6. Payment Method Split (current month) ─────────────────────────────

  const paymentSplitData = useMemo(() => {
    const spendByMethod = new Map<string, number>();

    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      if (!dateStr.startsWith(selectedMonthYear)) return;

      const raw = (e.payment_method || "Other").trim();
      // Normalise to known keys
      let method = "Other";
      if (raw === "UPI") method = "UPI";
      else if (raw === "Cash") method = "Cash";
      else if (raw === "Card" || raw === "Credit Card" || raw === "Debit Card") method = "Card";
      else if (raw === "Net Banking" || raw === "NEFT" || raw === "RTGS") method = "Net Banking";

      spendByMethod.set(method, (spendByMethod.get(method) || 0) + e.amount_paise);
    });

    return PAYMENT_METHODS.filter((m) => (spendByMethod.get(m) || 0) > 0).map((method) => ({
      name: method,
      value: paiseToRupees(spendByMethod.get(method) || 0),
      amountPaise: spendByMethod.get(method) || 0,
      color: PAYMENT_METHOD_COLORS[method],
    }));
  }, [expenses, selectedMonthYear]);

  // ── 7. 3-Month Rolling Trend ────────────────────────────────────────────

  const threeMonthData = useMemo(() => {
    // Parse currentMonthYear to get the two prior months
    const [curYear, curMonth] = currentMonthYear.split("-").map(Number);

    const months: Array<{ label: string; monthYear: string }> = [];
    for (let i = 2; i >= 0; i--) {
      let m = curMonth - i;
      let y = curYear;
      while (m <= 0) { m += 12; y -= 1; }
      const monthYear = `${y}-${String(m).padStart(2, "0")}`;
      const label = SHORT_MONTH_NAMES[m - 1];
      months.push({ label, monthYear });
    }

    const spendByMonthYear = new Map<string, number>();
    expenses.forEach((e) => {
      const dateStr = getISTDateString(e.spent_at);
      const my = dateStr.substring(0, 7);
      if (months.some((m) => m.monthYear === my)) {
        spendByMonthYear.set(my, (spendByMonthYear.get(my) || 0) + e.amount_paise);
      }
    });

    return months.map(({ label, monthYear }) => ({
      month: label,
      amount: paiseToRupees(spendByMonthYear.get(monthYear) || 0),
      amountPaise: spendByMonthYear.get(monthYear) || 0,
    }));
  }, [expenses, currentMonthYear]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Row 1: Category Donut + Daily Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Category Donut */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <ChartHeader
            title="Category Split"
            subtitle="Current month expenditure breakdown"
          />

          {donutData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-text-muted">
              No expenses recorded for this month yet.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Donut with centre total */}
              <div className="h-56 w-56 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                      <Label
                        content={
                          <DonutCentreLabel totalPaise={donutTotalPaise} />
                        }
                        position="center"
                      />
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`₹${formatIndianNumber(val)}`, "Spent"]}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 w-full min-w-0 space-y-2 overflow-y-auto max-h-56 pr-1">
                {donutData.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-xs min-w-0">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-text font-medium truncate">{d.name}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
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
          <ChartHeader
            title="Daily Spend Trend"
            subtitle="Daily distribution across the month"
          />

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
                  contentStyle={tooltipStyle}
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

      {/* ── Row 2: Weekly Bar + Payment Method Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weekly Spending Bar Chart */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <ChartHeader
            title="This Week's Spending"
            subtitle="Daily totals for the past 7 days"
          />

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="day"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: number) => [`₹${formatIndianNumber(val)}`, "Spent"]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`week-bar-${index}`}
                      fill={entry.isToday ? "var(--accent-warm)" : "var(--primary)"}
                      opacity={entry.isToday ? 1 : 0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment Method Split Donut */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <ChartHeader
            title="Payment Method Split"
            subtitle="How you paid — current month"
          />

          {paymentSplitData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-xs text-text-muted">
              No expenses with payment methods this month.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-[200px] w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentSplitData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {paymentSplitData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`₹${formatIndianNumber(val)}`, "Spent"]}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full min-w-0 space-y-2">
                {paymentSplitData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs min-w-0">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-text font-medium truncate">{d.name}</span>
                    </div>
                    <span className="font-semibold text-text font-mono shrink-0 ml-2">
                      {formatINR(d.amountPaise)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 3: Month vs Previous Month + 3-Month Rolling Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Month vs Previous Month */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <ChartHeader
            title="Month vs Previous Month"
            subtitle="Category comparison with last month"
          />

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
                  contentStyle={tooltipStyle}
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

        {/* 3-Month Rolling Trend */}
        <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
          <ChartHeader
            title="3-Month Trend"
            subtitle="Monthly spend over the last 3 months"
          />

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={threeMonthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="month"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: number) => [`₹${formatIndianNumber(val)}`, "Total Spend"]}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--primary)", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Row 4: Top Places (full width, top 7) ── */}
      <Card className="p-5 bg-surface border border-border/70 rounded-2xl shadow-xs">
        <ChartHeader
          title="Top Places"
          subtitle="Where you spend the most (all time)"
        />

        {topPlacesData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-text-muted">
            Add places to your expenses to see top locations.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 pt-1">
            {topPlacesData.map((item, index) => {
              const maxSpend = topPlacesData[0]?.amountRupees || 1;
              const pct = Math.round((item.amountRupees / maxSpend) * 100);

              return (
                <div key={item.place} className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between text-xs min-w-0">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="h-5 w-5 rounded-md bg-surface-muted text-[10px] font-bold text-text-muted flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-text truncate">{item.place}</span>
                      <span className="text-[11px] text-text-muted shrink-0">
                        ({item.count} {item.count === 1 ? "visit" : "visits"})
                      </span>
                    </div>
                    <span className="font-bold text-text font-mono shrink-0 ml-2">
                      {formatINR(item.amountPaise)}
                    </span>
                  </div>
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
  );
}
