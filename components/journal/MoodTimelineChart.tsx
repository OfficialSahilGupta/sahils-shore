"use client";

// ============================================================================
// Sahil's Shore: Mood & Energy Timeline Visualizer
// Recharts dual-axis line/area chart showing mood & energy trajectories
// ============================================================================

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { MoodTimelinePoint } from "@/lib/journal";
import { Sparkles, Zap, Smile } from "lucide-react";

interface MoodTimelineChartProps {
  data: MoodTimelinePoint[];
  daysCount: number;
  onDaysCountChange: (count: number) => void;
}

export function MoodTimelineChart({
  data,
  daysCount,
  onDaysCountChange,
}: MoodTimelineChartProps) {
  // Compute averages
  const validMoods = data.map((d) => d.mood).filter((v): v is number => v !== null && v > 0);
  const validEnergies = data.map((d) => d.energy).filter((v): v is number => v !== null && v > 0);

  const avgMood = validMoods.length > 0
    ? (validMoods.reduce((a, b) => a + b, 0) / validMoods.length).toFixed(1)
    : "-";

  const avgEnergy = validEnergies.length > 0
    ? (validEnergies.reduce((a, b) => a + b, 0) / validEnergies.length).toFixed(1)
    : "-";

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
      {/* Header & Days Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Mood & Energy Trajectory</span>
          </h3>
          <p className="text-xs text-text-muted">
            Daily self-ratings (1 = low, 5 = peak) over time
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-surface-muted p-1 text-xs">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => onDaysCountChange(days)}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                daysCount === days
                  ? "bg-surface text-primary shadow-xs font-semibold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smile className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-text-muted font-medium">Average Mood</div>
            <div className="text-base font-bold text-text">{avgMood} <span className="text-xs font-normal text-text-muted">/ 5.0</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-accent-warm/20 bg-accent-warm/5 p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-warm/10 text-accent-warm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-text-muted font-medium">Average Energy</div>
            <div className="text-base font-bold text-text">{avgEnergy} <span className="text-xs font-normal text-text-muted">/ 5.0</span></div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis
              dataKey="friendlyDate"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-border bg-surface p-2.5 shadow-lg text-xs space-y-1">
                      <div className="font-semibold text-text">{label}</div>
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Smile className="h-3.5 w-3.5" />
                        <span>Mood: {payload[0]?.value ?? "Not logged"} / 5</span>
                      </div>
                      <div className="flex items-center gap-2 text-accent-warm font-medium">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Energy: {payload[1]?.value ?? "Not logged"} / 5</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
            />
            <Line
              type="monotone"
              dataKey="mood"
              name="Mood"
              stroke="#1F7A8C"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#1F7A8C" }}
              activeDot={{ r: 5 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="#E0A458"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#E0A458" }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
