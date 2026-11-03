"use client";

// ============================================================================
// Sahil's Shore: German Vocab Review Heatmap
// Activity intensity visualization over past 60 days
// ============================================================================

import React from "react";
import { Flame } from "lucide-react";
import { todayIST } from "@/lib/date-utils";

interface ReviewHeatmapProps {
  heatmapData: Record<string, number>;
}

export function ReviewHeatmap({ heatmapData }: ReviewHeatmapProps) {
  const dates = Object.keys(heatmapData).sort(); // chronological
  const totalReviews = Object.values(heatmapData).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(heatmapData).filter((v) => v > 0).length;

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-surface-muted/60 border-transparent";
    if (count <= 2) return "bg-primary/30 border-primary/40";
    if (count <= 5) return "bg-primary/60 border-primary/70";
    if (count <= 10) return "bg-primary text-white border-primary";
    return "bg-teal-600 dark:bg-teal-400 text-white border-teal-500";
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-surface-muted shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-text">Review Consistency Heatmap</h4>
          <span className="text-xs text-text-muted">Past 60 Days</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>
            <strong className="text-text font-bold">{totalReviews}</strong> cards reviewed
          </span>
          <span>
            <strong className="text-text font-bold">{activeDays}</strong> active days
          </span>
        </div>
      </div>

      {/* Grid of days */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-[500px]">
          {dates.map((date) => {
            const count = heatmapData[date] || 0;
            const isToday = date === todayIST();

            return (
              <div
                key={date}
                className="group relative flex-1"
                title={`${date}: ${count} card${count === 1 ? "" : "s"} reviewed`}
              >
                <div
                  className={`h-7 rounded-md border transition-all ${getColorClass(
                    count
                  )} ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
                />
                {/* Floating tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 px-2 py-1 text-[11px] font-medium bg-black/85 text-white rounded shadow-md whitespace-nowrap pointer-events-none">
                  {date}: {count} reviewed
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] text-text-muted">
        <span>Less</span>
        <div className="w-3 h-3 rounded bg-surface-muted/60" />
        <div className="w-3 h-3 rounded bg-primary/30" />
        <div className="w-3 h-3 rounded bg-primary/60" />
        <div className="w-3 h-3 rounded bg-primary" />
        <div className="w-3 h-3 rounded bg-teal-600 dark:bg-teal-400" />
        <span>More</span>
      </div>
    </div>
  );
}
