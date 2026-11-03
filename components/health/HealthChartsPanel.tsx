"use client";

// ============================================================================
// Sahil's Shore: Health Trends Recharts Panel
// Visualizes hydration, sleep, workouts, and weight trends over 7/30 days
// ============================================================================

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { HealthTrendPoint } from "@/lib/health";
import { Droplet, Moon, Dumbbell, Scale, Activity } from "lucide-react";

interface HealthChartsPanelProps {
  trendData: HealthTrendPoint[];
  daysCount: number;
  onDaysCountChange: (days: number) => void;
}

type ActiveChart = "all" | "water" | "sleep" | "workout" | "weight";

export function HealthChartsPanel({
  trendData,
  daysCount,
  onDaysCountChange,
}: HealthChartsPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveChart>("all");

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Health & Vital Trends</h3>
            <p className="text-xs text-text-muted">
              Visual trajectories over the last {daysCount} days
            </p>
          </div>
        </div>

        {/* Days count toggle */}
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

      {/* Metric Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
        {[
          { id: "all", label: "Overview Grid" },
          { id: "water", label: "Hydration (Glasses)", icon: Droplet },
          { id: "sleep", label: "Sleep (Hours)", icon: Moon },
          { id: "workout", label: "Workouts (Minutes)", icon: Dumbbell },
          { id: "weight", label: "Weight (kg)", icon: Scale },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveChart)}
              className={`rounded-xl px-3 py-1 font-medium transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-surface-muted/50 text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div
        className={`grid gap-4 ${
          activeTab === "all" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* Water Chart */}
        {(activeTab === "all" || activeTab === "water") && (
          <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text flex items-center gap-1.5">
                <Droplet className="h-3.5 w-3.5 text-blue-500" />
                <span>Water Hydration (Glasses)</span>
              </span>
              <span className="text-[10px] text-text-muted">Target: 8 glasses</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="friendlyDate" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-xl border border-border bg-surface p-2 text-xs shadow-md">
                            <span className="font-semibold text-text">{label}:</span>{" "}
                            <span className="font-bold text-blue-500">{payload[0]?.value} glasses</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={8} stroke="#10B981" strokeDasharray="3 3" />
                  <Bar dataKey="waterGlasses" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sleep Chart */}
        {(activeTab === "all" || activeTab === "sleep") && (
          <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-purple-500" />
                <span>Sleep Duration (Hours)</span>
              </span>
              <span className="text-[10px] text-text-muted">Target: 7.5 - 8.5h</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="friendlyDate" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-xl border border-border bg-surface p-2 text-xs shadow-md">
                            <span className="font-semibold text-text">{label}:</span>{" "}
                            <span className="font-bold text-purple-500">{payload[0]?.value} hrs</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={8} stroke="#8B5CF6" strokeDasharray="3 3" />
                  <Bar dataKey="sleepHours" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Workouts Chart */}
        {(activeTab === "all" || activeTab === "workout") && (
          <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-emerald-500" />
                <span>Workout Duration (Minutes)</span>
              </span>
              <span className="text-[10px] text-text-muted">Goal: 30+ mins</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="friendlyDate" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-xl border border-border bg-surface p-2 text-xs shadow-md">
                            <span className="font-semibold text-text">{label}:</span>{" "}
                            <span className="font-bold text-emerald-500">{payload[0]?.value} minutes</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="workoutMinutes" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weight Chart */}
        {(activeTab === "all" || activeTab === "weight") && (
          <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-accent-warm" />
                <span>Body Weight (kg)</span>
              </span>
              <span className="text-[10px] text-text-muted">Trend line</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="friendlyDate" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-xl border border-border bg-surface p-2 text-xs shadow-md">
                            <span className="font-semibold text-text">{label}:</span>{" "}
                            <span className="font-bold text-accent-warm">{payload[0]?.value} kg</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weightKg"
                    stroke="#E0A458"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#E0A458" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
