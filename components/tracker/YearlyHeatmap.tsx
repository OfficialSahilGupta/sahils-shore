"use client";

// ============================================================================
// Sahil's Shore: GitHub-Style Yearly Activity Heatmap
// 52-week grid (IST based) with intensity colors, combined & per-activity filtering
// ============================================================================

import React, { useState, useMemo } from "react";
import type { Activity, ActivityLog } from "@/types";
import { generateYearlyHeatmapData, type HeatmapDay } from "@/lib/tracker";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import { Select } from "@/components/ui/select";

interface YearlyHeatmapProps {
  logs: ActivityLog[];
  activities: Activity[];
}

export function YearlyHeatmap({ logs, activities }: YearlyHeatmapProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const heatmapDays = useMemo(() => {
    return generateYearlyHeatmapData(
      logs,
      selectedActivityId === "all" ? undefined : selectedActivityId
    );
  }, [logs, selectedActivityId]);

  // Group into 52 columns of 7 days (weeks)
  const weeks = useMemo(() => {
    const cols: HeatmapDay[][] = [];
    for (let i = 0; i < heatmapDays.length; i += 7) {
      cols.push(heatmapDays.slice(i, i + 7));
    }
    return cols;
  }, [heatmapDays]);

  // Overall statistics
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let activeDays = 0;

    heatmapDays.forEach((d) => {
      totalMinutes += d.minutes;
      if (d.minutes > 0) activeDays++;
    });

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      activeDays,
      totalDays: heatmapDays.length,
    };
  }, [heatmapDays]);

  return (
    <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--text)]">
            Activity Heatmap
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {stats.activeDays} active days • {stats.totalHours} hours logged this year
          </p>
        </div>

        {/* Activity Filter Dropdown */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-[var(--text-muted)] font-medium shrink-0">Filter:</span>
          <Select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            containerClassName="w-auto max-w-[220px]"
          >
            <option value="all">Combined (All Activities)</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1 min-w-[720px]">
          {/* Day of Week Row Labels (Mon, Wed, Fri) + 52 Weeks Grid */}
          <div className="flex gap-1.5">
            {/* Weekday indicator labels */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-[var(--text-muted)] py-0.5 pr-1 select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* 52 Columns of 7 Squares */}
            <div className="flex gap-1 flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const levelColors = [
                      "bg-[var(--surface-muted)]/70 hover:ring-1 hover:ring-[var(--border)]",
                      "bg-[var(--primary)]/30 hover:ring-1 hover:ring-[var(--primary)]",
                      "bg-[var(--primary)]/60 hover:ring-1 hover:ring-[var(--primary)]",
                      "bg-[var(--primary)]/85 hover:ring-1 hover:ring-[var(--primary)]",
                      "bg-[var(--primary)] hover:ring-1 hover:ring-white",
                    ];

                    return (
                      <div
                        key={day.date}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-3 w-3 rounded-xs transition-transform cursor-pointer ${
                          levelColors[day.level]
                        }`}
                        title={`${formatFriendlyISTDate(day.date)}: ${day.minutes} mins`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]/40">
            <div>
              {hoveredDay ? (
                <span className="font-medium text-[var(--text)]">
                  {formatFriendlyISTDate(hoveredDay.date)}:{" "}
                  <strong className="text-[var(--primary)]">
                    {hoveredDay.minutes} minutes
                  </strong>{" "}
                  logged
                </span>
              ) : (
                <span>Hover over squares to inspect daily logs</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-xs bg-[var(--surface-muted)]" />
              <div className="h-2.5 w-2.5 rounded-xs bg-[var(--primary)]/30" />
              <div className="h-2.5 w-2.5 rounded-xs bg-[var(--primary)]/60" />
              <div className="h-2.5 w-2.5 rounded-xs bg-[var(--primary)]/85" />
              <div className="h-2.5 w-2.5 rounded-xs bg-[var(--primary)]" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
