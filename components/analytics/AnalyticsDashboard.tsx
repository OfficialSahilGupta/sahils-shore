"use client";

// ============================================================================
// Sahil's Shore: Analytics Dashboard Main Container
// Date range selector, productivity score, skills heatmap, money, life, & reports
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnalyticsBundle, DateRangePreset } from "@/lib/analytics/types";
import { resolveDateRange } from "@/lib/analytics/service";
import { fetchAnalyticsBundle } from "@/lib/analytics/service";
import { ProductivityScoreCard } from "./ProductivityScoreCard";
import { SkillFocusHeatmap } from "./SkillFocusHeatmap";
import { MoneyAnalyticsCard } from "./MoneyAnalyticsCard";
import { LifeCorrelationsCard } from "./LifeCorrelationsCard";
import { MonthlyReportModal } from "./MonthlyReportModal";
import { AICoachCard } from "@/components/coach/AICoachCard";
import {
  BarChart3,
  Calendar,
  Sparkles,
  Code2,
  Wallet,
  HeartHandshake,
  FileText,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

type AnalyticsTab = "overview" | "skills" | "money" | "life";

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setUserId(user.id);

      const resolvedRange = resolveDateRange(
        preset,
        preset === "custom" && customStart && customEnd
          ? { start: customStart, end: customEnd }
          : undefined
      );

      const data = await fetchAnalyticsBundle(supabase, user.id, resolvedRange);
      setBundle(data);
    } catch (err) {
      console.error("Failed to load analytics bundle:", err);
    } finally {
      setIsLoading(false);
    }
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const presetOptions: { id: DateRangePreset; label: string }[] = [
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "90d", label: "90 Days" },
    { id: "month", label: "This Month" },
    { id: "year", label: "Year to Date" },
  ];

  const tabs: { id: AnalyticsTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "skills", label: "Skills & Focus", icon: Code2 },
    { id: "money", label: "Money & Budgets", icon: Wallet },
    { id: "life", label: "Life & Correlations", icon: HeartHandshake },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
            <span>Personal Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Analytics & Insights
          </h1>
          <p className="text-xs text-text-muted sm:text-sm mt-0.5">
            Deep-dive performance, skill momentum, financial burn rate, and life patterns.
          </p>
        </div>

        {/* Date Range Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Chips */}
          <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-sm">
            {presetOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPreset(opt.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  preset === opt.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-text-muted hover:text-text hover:bg-surface-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Export Report Button */}
          {bundle && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted shadow-sm transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Export Report</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="flex items-center justify-center rounded-xl border border-border bg-surface p-2 text-text-muted hover:text-text hover:bg-surface-muted shadow-sm transition-colors disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-text-muted hover:bg-surface-muted hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Content Views */}
      {isLoading && !bundle ? (
        <div className="py-16 space-y-4 animate-pulse">
          <div className="h-48 w-full rounded-2xl bg-surface-muted" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-64 rounded-2xl bg-surface-muted" />
            <div className="h-64 rounded-2xl bg-surface-muted" />
          </div>
        </div>
      ) : bundle ? (
        <div className="space-y-6">
          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Productivity Score Engine Card */}
              <ProductivityScoreCard data={bundle.productivity} />

              {/* AI Coach Card */}
              <AICoachCard initialDate={bundle.dateRange.endDate} />

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mini Skills Card */}
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-text">Focus Tracks</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("skills")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View Details →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {bundle.skills.breakdown.slice(0, 4).map((s) => (
                      <div key={s.skill} className="flex items-center justify-between text-xs">
                        <span className="text-text font-medium">{s.skill}</span>
                        <span className="text-text-muted">
                          <strong className="text-text">{s.hours}h</strong> ({s.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini Money Card */}
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-accent-warm" />
                      <h3 className="text-sm font-bold text-text">Spending Snapshot</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("money")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View Details →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {bundle.money.byCategory.slice(0, 4).map((c) => (
                      <div key={c.categoryId} className="flex items-center justify-between text-xs">
                        <span className="text-text font-medium">{c.name}</span>
                        <span className="text-text-muted">
                          <strong className="text-text">₹{c.rupees.toLocaleString("en-IN")}</strong> ({c.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Skills & Focus */}
          {activeTab === "skills" && (
            <SkillFocusHeatmap
              skills={bundle.skills.breakdown}
              trends={bundle.skills.trends}
              heatmap={bundle.skills.heatmap}
              streaks={bundle.skills.streaks}
              totalFocusMinutes={bundle.skills.totalFocusMinutes}
            />
          )}

          {/* Tab 3: Money & Budgets */}
          {activeTab === "money" && (
            <MoneyAnalyticsCard money={bundle.money} />
          )}

          {/* Tab 4: Life & Correlations */}
          {activeTab === "life" && (
            <LifeCorrelationsCard life={bundle.life} />
          )}
        </div>
      ) : null}

      {/* Monthly Report Modal */}
      {bundle && reportModalOpen && (
        <MonthlyReportModal
          bundle={bundle}
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </div>
  );
}
