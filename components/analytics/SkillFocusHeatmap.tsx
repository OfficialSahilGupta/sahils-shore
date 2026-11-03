"use client";

// ============================================================================
// Sahil's Shore: Skills & 24x7 Focus Heatmap Component
// Visualizes skill allocation, daily trends, best focus hours, and streaks
// ============================================================================

import React, { useState } from "react";
import type {
  SkillTimeSummary,
  DailySkillTrend,
  FocusHeatmapCell,
  SkillStreak,
} from "@/lib/analytics/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Code2,
  Calendar,
  Flame,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";

interface SkillFocusHeatmapProps {
  skills: SkillTimeSummary[];
  trends: DailySkillTrend[];
  heatmap: FocusHeatmapCell[];
  streaks: SkillStreak[];
  totalFocusMinutes: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SkillFocusHeatmap({
  skills,
  trends,
  heatmap,
  streaks,
  totalFocusMinutes,
}: SkillFocusHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<FocusHeatmapCell | null>(null);

  // Group heatmap by weekdayName
  const heatmapByDay: Record<string, Record<number, FocusHeatmapCell>> = {};
  for (const day of WEEKDAYS) {
    heatmapByDay[day] = {};
  }
  for (const cell of heatmap) {
    if (heatmapByDay[cell.weekdayName]) {
      heatmapByDay[cell.weekdayName][cell.hour] = cell;
    }
  }

  // Find best focus hour (highest aggregate minutes across all days)
  const hourTotals: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourTotals[h] = 0;
  for (const cell of heatmap) {
    hourTotals[cell.hour] += cell.minutes;
  }
  const bestHour = Object.entries(hourTotals).sort((a, b) => b[1] - a[1])[0];
  const bestHourNum = bestHour ? parseInt(bestHour[0], 10) : 10;
  const bestHourLabel =
    bestHourNum === 0
      ? "12 AM"
      : bestHourNum < 12
      ? `${bestHourNum} AM`
      : bestHourNum === 12
      ? "12 PM"
      : `${bestHourNum - 12} PM`;

  return (
    <div className="space-y-6">
      {/* 1. Skill Distribution & Streaks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Skill Hours Breakdown (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-text">Time Per Skill Track</h3>
            </div>
            <span className="text-xs font-semibold text-text-muted">
              Total: {Math.round((totalFocusMinutes / 60) * 10) / 10} hrs
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {skills.map((skill) => (
              <div key={skill.skill} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: skill.color }}
                    />
                    {skill.skill}
                  </span>
                  <span className="text-text-muted">
                    <strong className="text-text">{skill.hours}h</strong> ({skill.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${skill.percentage}%`,
                      backgroundColor: skill.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Daily Trend Chart */}
          <div className="mt-6 pt-5 border-t border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Daily Study Trends (Minutes)
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => val.slice(5)}
                    stroke="var(--text-muted)"
                    fontSize={11}
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "0.75rem",
                      color: "var(--text)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="DSA" stackId="a" fill="#1F7A8C" name="DSA" />
                  <Bar dataKey="SpringBoot" stackId="a" fill="#E0A458" name="Spring Boot" />
                  <Bar dataKey="MERN" stackId="a" fill="#4FB3C8" name="MERN" />
                  <Bar dataKey="German" stackId="a" fill="#2E9E6B" name="German" />
                  <Bar dataKey="Other" stackId="a" fill="#8FA3B0" name="Other" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Streaks & Insights (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <Flame className="h-4 w-4 text-accent-warm" />
              <h3 className="text-base font-bold text-text">Skill Streaks & Rhythm</h3>
            </div>

            <div className="mt-4 space-y-3">
              {streaks.map((st) => (
                <div
                  key={st.name}
                  className="rounded-xl border border-border/80 bg-surface-muted/30 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-text">{st.name}</h4>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {st.totalMinutes > 0 ? `${Math.round((st.totalMinutes / 60) * 10) / 10} hrs logged` : "No activity"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-accent-warm">
                        <Flame className="h-3.5 w-3.5 fill-current" />
                        <span>{st.currentStreak}d</span>
                      </div>
                      <span className="text-[10px] text-text-muted">current</span>
                    </div>
                    <div className="border-l border-border pl-3">
                      <span className="text-xs font-bold text-text">{st.longestStreak}d</span>
                      <div className="text-[10px] text-text-muted">best</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Clock className="h-4 w-4" />
              <span>Optimal Focus Window</span>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Your historical sweet spot for deep work peaks around <strong className="text-text">{bestHourLabel} IST</strong>. Schedule your hardest algorithms or system design tasks then.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Best Focus Hours Heatmap (24 hours x 7 days) */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-text">Focus Hours Heatmap (IST)</h3>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Heatmap of actual focus minutes logged by hour of the day (00:00 to 23:00 IST) across the week.
            </p>
          </div>

          {/* Intensity Legend */}
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <span>Less</span>
            <span className="h-3 w-3 rounded-sm bg-surface-muted border border-border/50" />
            <span className="h-3 w-3 rounded-sm bg-primary/25" />
            <span className="h-3 w-3 rounded-sm bg-primary/50" />
            <span className="h-3 w-3 rounded-sm bg-primary/75" />
            <span className="h-3 w-3 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="min-w-[680px]">
            {/* Top Hour Labels */}
            <div className="grid grid-cols-[3rem_repeat(24,1fr)] gap-1 mb-1 text-[10px] font-mono text-text-muted text-center">
              <span />
              {HOURS.map((h) => (
                <span key={h} className={h % 3 === 0 ? "font-bold text-text" : "opacity-60"}>
                  {h % 3 === 0 ? (h === 0 ? "12A" : h < 12 ? `${h}A` : h === 12 ? "12P" : `${h - 12}P`) : "·"}
                </span>
              ))}
            </div>

            {/* Weekday Rows */}
            <div className="space-y-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="grid grid-cols-[3rem_repeat(24,1fr)] gap-1 items-center">
                  <span className="text-[11px] font-medium text-text-muted">{day}</span>
                  {HOURS.map((h) => {
                    const cell = heatmapByDay[day]?.[h] || {
                      weekdayIndex: 0,
                      weekdayName: day,
                      hour: h,
                      minutes: 0,
                      intensity: 0,
                    };

                    let bgClass = "bg-surface-muted/60 hover:border-primary/50";
                    if (cell.intensity === 1) bgClass = "bg-primary/25 hover:bg-primary/35";
                    else if (cell.intensity === 2) bgClass = "bg-primary/50 hover:bg-primary/60";
                    else if (cell.intensity === 3) bgClass = "bg-primary/75 hover:bg-primary/85";
                    else if (cell.intensity === 4) bgClass = "bg-primary text-white";

                    return (
                      <div
                        key={h}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-6 rounded-sm border border-transparent transition-all cursor-pointer ${bgClass}`}
                        title={`${day} ${h}:00 IST — ${cell.minutes} mins`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip on Hover */}
        <div className="mt-3 min-h-[22px] text-xs text-text-muted">
          {hoveredCell ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-text">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <strong>{hoveredCell.weekdayName}</strong> at{" "}
              <strong>
                {hoveredCell.hour === 0
                  ? "12:00 AM"
                  : hoveredCell.hour < 12
                  ? `${hoveredCell.hour}:00 AM`
                  : hoveredCell.hour === 12
                  ? "12:00 PM"
                  : `${hoveredCell.hour - 12}:00 PM`}{" "}
                IST
              </strong>
              : <span className="text-primary font-bold">{hoveredCell.minutes} minutes</span> logged
            </span>
          ) : (
            <span>Hover over any hour cell to inspect exact focus time.</span>
          )}
        </div>
      </div>
    </div>
  );
}
