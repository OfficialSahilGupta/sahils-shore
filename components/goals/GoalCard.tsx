"use client";

// ============================================================================
// Sahil's Shore: Interactive Goal Card Component
// Progress ring, checkable milestones, linked badges, deadline countdown
// ============================================================================

import React, { useState } from "react";
import type { Goal } from "@/lib/goals";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import {
  Target,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  MoreVertical,
  X,
} from "lucide-react";

interface GoalCardProps {
  goal: Goal;
  onToggleMilestone: (goal: Goal, milestoneId: string, isCompleted: boolean) => Promise<void>;
  onAddMilestone: (goalId: string, title: string) => Promise<void>;
  onDeleteMilestone: (milestoneId: string) => Promise<void>;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Career: { bg: "bg-blue-500/10", text: "text-blue-500" },
  Learning: { bg: "bg-primary/10", text: "text-primary" },
  Health: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  Personal: { bg: "bg-accent-warm/10", text: "text-accent-warm" },
  Financial: { bg: "bg-purple-500/10", text: "text-purple-500" },
  General: { bg: "bg-surface-muted", text: "text-text-muted" },
};

export function GoalCard({
  goal,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const catStyle = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.General;
  const isCompleted = goal.status === "completed" || goal.progress_percent === 100;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    await onAddMilestone(goal.id, newMilestoneTitle.trim());
    setNewMilestoneTitle("");
    setIsAddingMilestone(false);
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <div className="space-y-4">
        {/* Top Meta Bar */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold ${catStyle.bg} ${catStyle.text}`}>
              {goal.category}
            </span>
            {isCompleted && (
              <span className="rounded-xl bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(goal)}
              className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text transition-colors text-xs"
              title="Edit Goal"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete goal "${goal.title}"?`)) onDelete(goal.id);
              }}
              className="rounded-lg p-1 text-text-muted hover:text-rose-500 transition-colors"
              title="Delete Goal"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Goal Title */}
        <div>
          <h3 className="text-base font-bold text-text leading-snug">
            {goal.title}
          </h3>
          {goal.target_date && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Target: {formatFriendlyISTDate(goal.target_date)} ({goal.target_date})</span>
            </p>
          )}
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text">Progress</span>
            <span className="font-bold text-primary">{goal.progress_percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${goal.progress_percent}%` }}
            />
          </div>
        </div>

        {/* Linked Entities Chips */}
        {(goal.linked_task_ids.length > 0 ||
          goal.linked_habit_ids.length > 0 ||
          goal.linked_activity_ids.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-text-muted">
            {goal.linked_task_ids.length > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 font-medium">
                <CheckSquare className="h-3 w-3 text-primary" />
                <span>{goal.linked_task_ids.length} Tasks</span>
              </span>
            )}
            {goal.linked_habit_ids.length > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 font-medium">
                <Activity className="h-3 w-3 text-accent-warm" />
                <span>{goal.linked_habit_ids.length} Habits</span>
              </span>
            )}
            {goal.linked_activity_ids.length > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 font-medium">
                <Layers className="h-3 w-3 text-blue-500" />
                <span>{goal.linked_activity_ids.length} Activities</span>
              </span>
            )}
          </div>
        )}

        {/* Milestones Checklist */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text">
              Milestones ({goal.milestones.filter((m) => m.is_completed).length}/{goal.milestones.length})
            </span>
            {!isAddingMilestone && (
              <button
                onClick={() => setIsAddingMilestone(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>Milestone</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {goal.milestones.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">No milestones defined yet.</p>
            ) : (
              goal.milestones.map((m) => (
                <div
                  key={m.id}
                  className="group flex items-center justify-between rounded-xl bg-surface-muted/30 p-2 hover:bg-surface-muted/60 transition-colors"
                >
                  <label className="flex items-center gap-2 text-xs text-text cursor-pointer select-none min-w-0">
                    <input
                      type="checkbox"
                      checked={m.is_completed}
                      onChange={(e) => onToggleMilestone(goal, m.id, e.target.checked)}
                      className="rounded text-primary h-3.5 w-3.5"
                    />
                    <span className={`truncate ${m.is_completed ? "line-through text-text-muted" : "font-medium"}`}>
                      {m.title}
                    </span>
                  </label>

                  <button
                    onClick={() => onDeleteMilestone(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-rose-500 transition-opacity"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Inline Milestone Adder */}
          {isAddingMilestone && (
            <form onSubmit={handleAddSubmit} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="New milestone title..."
                autoFocus
                className="w-full rounded-xl border border-border bg-surface px-2.5 py-1 text-xs text-text outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="rounded-xl bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingMilestone(false)}
                className="text-xs text-text-muted hover:text-text px-1"
                aria-label="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
