"use client";

// ============================================================================
// Sahil's Shore: Quarterly Goals View Component
// Groups goals into quarterly horizon buckets (Q1, Q2, Q3, Q4) with progress stats
// ============================================================================

import React from "react";
import type { Goal } from "@/lib/goals";
import { groupGoalsByQuarter } from "@/lib/goals";
import { GoalCard } from "./GoalCard";
import { Calendar, Target, CheckCircle2 } from "lucide-react";

interface QuarterlyGoalsViewProps {
  goals: Goal[];
  onToggleMilestone: (goal: Goal, milestoneId: string, isCompleted: boolean) => Promise<void>;
  onAddMilestone: (goalId: string, title: string) => Promise<void>;
  onDeleteMilestone: (milestoneId: string) => Promise<void>;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export function QuarterlyGoalsView({
  goals,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onEditGoal,
  onDeleteGoal,
}: QuarterlyGoalsViewProps) {
  const grouped = groupGoalsByQuarter(goals);
  const quarters = Object.keys(grouped).sort();

  if (quarters.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center text-text-muted">
        <Target className="h-10 w-10 text-primary/40 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-text">No Goals Set Yet</h3>
        <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          Start turning your vision into reality by creating your first quarterly goal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {quarters.map((q) => {
        const qGoals = grouped[q] || [];
        const completedCount = qGoals.filter(
          (g) => g.status === "completed" || g.progress_percent === 100
        ).length;
        const avgProgress = Math.round(
          qGoals.reduce((sum, g) => sum + g.progress_percent, 0) / qGoals.length
        );

        return (
          <section key={q} className="space-y-4">
            {/* Quarter Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-surface px-5 py-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                  {q.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">{q} Horizon</h3>
                  <p className="text-[11px] text-text-muted">
                    {qGoals.length} goal{qGoals.length > 1 ? "s" : ""} • {completedCount} completed
                  </p>
                </div>
              </div>

              {/* Quarter Aggregate Progress */}
              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <div className="text-right">
                  <div className="text-[10px] text-text-muted font-medium">Quarter Progress</div>
                  <div className="text-xs font-bold text-primary">{avgProgress}%</div>
                </div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Grid of Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggleMilestone={onToggleMilestone}
                  onAddMilestone={onAddMilestone}
                  onDeleteMilestone={onDeleteMilestone}
                  onEdit={onEditGoal}
                  onDelete={onDeleteGoal}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
