"use client";

// ============================================================================
// Sahil's Shore: Life Analytics & Correlations Component
// Mood vs. Productivity vs. Spending with scientific disclaimer & places/dining stats
// ============================================================================

import React from "react";
import type { LifeCorrelationsSummary } from "@/lib/analytics/types";
import { formatINR as formatRupeesFromPaise } from "@/lib/expenses";
import {
  HeartHandshake,
  AlertCircle,
  Smile,
  Zap,
  Wallet,
  MapPin,
  Utensils,
  Compass,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface LifeCorrelationsCardProps {
  life: LifeCorrelationsSummary;
}

export function LifeCorrelationsCard({ life }: LifeCorrelationsCardProps) {
  const { moodVsProductivity, moodVsSpending, productivityVsSpending, places, meals, dailyPoints } = life;

  return (
    <div className="space-y-6">
      {/* 1. Scientific Disclaimer Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3.5">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-text-muted space-y-1">
          <p className="font-bold text-text">
            Statistical Notice: Correlation is Not Causation
          </p>
          <p>
            Statistical associations between your subjective mood ratings, focus minutes, and spending are exploratory reflections. A high correlation merely indicates co-occurrence in time, not that one directly caused the other.
          </p>
        </div>
      </div>

      {/* 2. Three Correlation Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Mood vs. Productivity */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Smile className="h-4 w-4 text-emerald-500" />
                <span>Mood ↔ Productivity</span>
              </div>
              <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-mono font-bold text-text">
                r = {moodVsProductivity.r}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-sm font-bold text-text capitalize">
                {moodVsProductivity.strength} {moodVsProductivity.direction} link
              </span>
              <p className="mt-1 text-xs text-text-muted">
                {moodVsProductivity.interpretation}
              </p>
            </div>
          </div>
        </div>

        {/* Metric 2: Mood vs. Spending */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Wallet className="h-4 w-4 text-primary" />
                <span>Mood ↔ Spending</span>
              </div>
              <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-mono font-bold text-text">
                r = {moodVsSpending.r}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-sm font-bold text-text capitalize">
                {moodVsSpending.strength} {moodVsSpending.direction} link
              </span>
              <p className="mt-1 text-xs text-text-muted">
                {moodVsSpending.interpretation}
              </p>
            </div>
          </div>
        </div>

        {/* Metric 3: Productivity vs. Spending */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Zap className="h-4 w-4 text-accent-warm" />
                <span>Productivity ↔ Spend</span>
              </div>
              <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-mono font-bold text-text">
                r = {productivityVsSpending.r}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-sm font-bold text-text capitalize">
                {productivityVsSpending.strength} {productivityVsSpending.direction} link
              </span>
              <p className="mt-1 text-xs text-text-muted">
                {productivityVsSpending.interpretation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Daily Trajectory Chart (Mood & Productivity) */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold text-text">Daily Rhythm & Mood Trajectory</h3>
          </div>
          <span className="text-xs text-text-muted">Normalized Timeline</span>
        </div>

        <div className="mt-5 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis dataKey="date" tickFormatter={(val) => val.slice(5)} stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "0.75rem",
                  color: "var(--text)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey="productivityScore"
                name="Productivity Score"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey={(d) => (d.mood ? d.mood * 20 : null)}
                name="Mood (scaled %)"
                stroke="#2E9E6B"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Places & Meals Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Places Visited (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-text">Places & Exploration</h3>
            </div>
            <span className="text-xs text-text-muted font-bold text-text">
              {places.totalVisits} visits
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {places.topPlaces.length === 0 ? (
              <p className="py-6 text-center text-xs text-text-muted">
                No places logged in this date range.
              </p>
            ) : (
              places.topPlaces.map((pl) => (
                <div
                  key={pl.name}
                  className="rounded-xl border border-border/80 bg-surface-muted/30 p-3 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-text">{pl.name}</h4>
                    <span className="text-[10px] text-text-muted capitalize">
                      {pl.category}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {pl.visits} visit{pl.visits === 1 ? "" : "s"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dining & Meals (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-accent-warm" />
              <h3 className="text-base font-bold text-text">Dining Breakdown</h3>
            </div>
            <span className="text-xs text-text-muted">
              {meals.totalLogged} Meals
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/80 bg-surface-muted/30 p-3 text-center">
              <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                Home Cooked
              </span>
              <div className="mt-1 text-xl font-bold text-text">
                {meals.homeMeals}
              </div>
            </div>
            <div className="rounded-xl border border-border/80 bg-surface-muted/30 p-3 text-center">
              <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                Restaurants & Out
              </span>
              <div className="mt-1 text-xl font-bold text-accent-warm">
                {meals.restaurantMeals}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-text-muted">Outside Dining Spend:</span>
            <span className="font-bold text-text">
              {formatRupeesFromPaise(meals.outsideFoodPaise)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
