"use client";

// ============================================================================
// Sahil's Shore: Career Analytics & Funnel Component
// Applications sent this week/month, response rate, interviews, by-stage funnel
// ============================================================================

import React from "react";
import type { Application } from "@/types/career";
import { calculateCareerStats } from "@/lib/career";
import {
  TrendingUp,
  Send,
  Users,
  Award,
  Filter,
  CheckCircle2,
  Inbox,
  ArchiveX,
  Target,
  Lightbulb,
} from "lucide-react";

interface CareerStatsPanelProps {
  applications: Application[];
}

export function CareerStatsPanel({ applications }: CareerStatsPanelProps) {
  const stats = calculateCareerStats(applications);

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Applications Sent (Week) */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Sent This Week</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text">{stats.applicationsThisWeek}</span>
            <span className="text-[11px] text-text-muted">
              ({stats.applicationsThisMonth} this month)
            </span>
          </div>
        </div>

        {/* Metric 2: Response Rate */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Response Rate</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.responseRatePct}%
            </span>
            <span className="text-[11px] text-text-muted">interview/offer</span>
          </div>
        </div>

        {/* Metric 3: Active Interviews */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Active Interviews</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.activeInterviews}
            </span>
            <span className="text-[11px] text-text-muted">in pipeline</span>
          </div>
        </div>

        {/* Metric 4: Offers */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Offers Received</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{stats.offersCount}</span>
            <span className="text-[11px] text-text-muted">
              of {stats.totalApplications} total
            </span>
          </div>
        </div>
      </div>

      {/* By-Stage Funnel Visualization */}
      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-text">Job Application Funnel</h4>
          </div>
          <span className="text-xs text-text-muted font-medium">
            Total Pipeline: {stats.totalApplications} applications
          </span>
        </div>

        {stats.totalApplications === 0 ? (
          <p className="text-xs text-text-muted py-6 text-center italic">
            No applications added yet. Start tracking applications to see your conversion funnel.
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {stats.funnel.map((step) => {
              const stageColors: Record<string, { bg: string; text: string; bar: string }> = {
                wishlist: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", bar: "bg-slate-500" },
                applied: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
                interview: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
                offer: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
                rejected: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" },
              };
              const col = stageColors[step.stage] || stageColors.wishlist;

              return (
                <div key={step.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${col.text}`}>{step.label}</span>
                      <span className="text-text-muted text-[11px]">
                        ({step.count} application{step.count !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-text text-xs">
                      {step.pct}%
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-3 w-full bg-surface-muted rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${col.bar} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(step.pct, step.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Career Pipeline Advice */}
      <div className="p-4 rounded-2xl bg-surface-muted/50 border border-border/70 text-xs text-text-muted space-y-1.5">
        <span className="font-bold text-text flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span>Job Hunt Strategy Tip</span>
        </span>
        <p className="leading-relaxed">
          Maintain 8-12 applications per week with customized bullet points from your Bullet Bank.
          Always schedule a follow-up 5-7 business days after applying to increase response rates by up to 35%.
        </p>
      </div>
    </div>
  );
}
