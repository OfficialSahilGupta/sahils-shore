"use client";

// ============================================================================
// Sahil's Shore: Weekly & Monthly Recharts Analytics
// Visualizes daily time allocations and targets across IST days
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import type { Activity, ActivityLog } from "@/types";
import {
  generateWeeklyChartData,
  generateMonthlyChartData,
} from "@/lib/tracker";
import { todayIST } from "@/lib/date-utils";

interface ActivityChartsProps {
  logs: ActivityLog[];
  activities: Activity[];
}

export function ActivityCharts({ logs, activities }: ActivityChartsProps) {
  const [chartMode, setChartMode] = useState<"weekly" | "monthly">("weekly");

  const today = todayIST();
  const currentYearMonth = today.substring(0, 7); // "YYYY-MM"

  const weeklyData = useMemo(() => {
    return generateWeeklyChartData(logs, activities, today);
  }, [logs, activities, today]);

  const monthlyData = useMemo(() => {
    return generateMonthlyChartData(logs, activities, currentYearMonth);
  }, [logs, activities, currentYearMonth]);

  const activeActivities = activities.filter((a) => a.is_active);

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs space-y-4">
      {/* Chart Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--text)]">
            Focus Time Distribution
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Compare time invested against daily targets
          </p>
        </div>

        <div className="flex rounded-xl bg-[var(--surface-muted)] p-1 text-xs">
          <button
            onClick={() => setChartMode("weekly")}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              chartMode === "weekly"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Weekly (Mon - Sun)
          </button>
          <button
            onClick={() => setChartMode("monthly")}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              chartMode === "monthly"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Monthly Trend
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        {chartMode === "weekly" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis
                dataKey="dayShort"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                unit="m"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
              {/* Target Line */}
              {weeklyData[0]?.targetMinutes > 0 && (
                <ReferenceLine
                  y={weeklyData[0].targetMinutes}
                  stroke="var(--warning)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Daily Target",
                    fill: "var(--warning)",
                    fontSize: 10,
                    position: "top",
                  }}
                />
              )}

              {/* Stacked bars for each active activity */}
              {activeActivities.map((act) => (
                <Bar
                  key={act.id}
                  dataKey={act.name}
                  stackId="a"
                  fill={act.color || "var(--primary)"}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="monthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis
                dataKey="dayNum"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                unit="m"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelFormatter={(v) => `Day ${v}`}
              />
              {monthlyData[0]?.targetMinutes > 0 && (
                <ReferenceLine
                  y={monthlyData[0].targetMinutes}
                  stroke="var(--warning)"
                  strokeDasharray="4 4"
                />
              )}
              <Area
                type="monotone"
                dataKey="totalMinutes"
                name="Total Minutes"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#monthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
