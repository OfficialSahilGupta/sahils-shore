"use client";

// ============================================================================
// Sahil's Shore: Goals & Milestones Top-Level Container
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Goal, CreateGoalInput } from "@/lib/goals";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  createMilestone,
  toggleMilestone,
  deleteMilestone,
} from "@/lib/goals";
import { GoalCard } from "./GoalCard";
import { GoalDialog } from "./GoalDialog";
import { QuarterlyGoalsView } from "./QuarterlyGoalsView";
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Layers,
  Filter,
} from "lucide-react";

type ViewMode = "quarterly" | "category" | "all";
type StatusFilter = "all" | "in_progress" | "completed" | "archived";

export function GoalsContainer() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("quarterly");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const loadGoals = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const supabase = createClient();
    const list = await getGoals(supabase, userId);
    setGoals(list);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadGoals();
    }
  }, [userId, loadGoals]);

  // Handlers
  const handleSaveGoal = async (
    input: CreateGoalInput,
    editId?: string
  ): Promise<boolean> => {
    if (!userId) return false;
    const supabase = createClient();

    if (editId) {
      const updated = await updateGoal(supabase, editId, {
        title: input.title,
        category: input.category,
        target_date: input.target_date,
      });
      if (updated) {
        loadGoals();
        return true;
      }
    } else {
      const created = await createGoal(supabase, userId, input);
      if (created) {
        setGoals((prev) => [created, ...prev]);
        loadGoals();
        return true;
      }
    }
    return false;
  };

  const handleDeleteGoal = async (goalId: string) => {
    const supabase = createClient();
    const ok = await deleteGoal(supabase, goalId);
    if (ok) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  const handleToggleMilestone = async (
    goal: Goal,
    milestoneId: string,
    isCompleted: boolean
  ) => {
    if (!userId) return;
    const supabase = createClient();
    const ok = await toggleMilestone(supabase, userId, goal, milestoneId, isCompleted);
    if (ok) {
      loadGoals();
    }
  };

  const handleAddMilestone = async (goalId: string, title: string) => {
    if (!userId) return;
    const supabase = createClient();
    const m = await createMilestone(supabase, userId, goalId, title);
    if (m) {
      loadGoals();
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    const supabase = createClient();
    const ok = await deleteMilestone(supabase, milestoneId);
    if (ok) {
      loadGoals();
    }
  };

  // Filter goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (statusFilter === "in_progress") return g.status === "in_progress";
      if (statusFilter === "completed") return g.status === "completed" || g.progress_percent === 100;
      if (statusFilter === "archived") return g.status === "archived";
      return true;
    });
  }, [goals, statusFilter]);

  // Aggregate stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "completed" || g.progress_percent === 100).length;
  const totalMilestones = goals.reduce((sum, g) => sum + g.milestones.length, 0);
  const completedMilestones = goals.reduce(
    (sum, g) => sum + g.milestones.filter((m) => m.is_completed).length,
    0
  );
  const avgProgress = totalGoals > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress_percent, 0) / totalGoals)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 md:px-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Vision & Milestone Planning
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Long-Term Goals
          </h1>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setDialogOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Aggregate Stats Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1">
          <div className="text-[11px] font-semibold text-primary">Total Goals</div>
          <div className="text-xl font-bold text-text">{totalGoals}</div>
          <div className="text-[10px] text-text-muted">{completedGoals} completed</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
          <div className="text-[11px] font-semibold text-emerald-500">Milestones Done</div>
          <div className="text-xl font-bold text-text">
            {completedMilestones} <span className="text-xs font-normal text-text-muted">/ {totalMilestones}</span>
          </div>
          <div className="text-[10px] text-text-muted">Achieved checkpoints</div>
        </div>

        <div className="rounded-2xl border border-accent-warm/20 bg-accent-warm/5 p-4 space-y-1">
          <div className="text-[11px] font-semibold text-accent-warm">Average Progress</div>
          <div className="text-xl font-bold text-text">{avgProgress}%</div>
          <div className="text-[10px] text-text-muted">Across all active goals</div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1">
          <div className="text-[11px] font-semibold text-blue-500">Active Pipeline</div>
          <div className="text-xl font-bold text-text">{totalGoals - completedGoals}</div>
          <div className="text-[10px] text-text-muted">In-progress objectives</div>
        </div>
      </div>

      {/* Controls Bar: View Modes & Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-3">
        {/* View Switcher */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface p-1 text-xs">
          {[
            { id: "quarterly", label: "Quarterly View", icon: Calendar },
            { id: "all", label: "All Goals Grid", icon: Layers },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-text-muted hover:text-text"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: "all", label: "All" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id as StatusFilter)}
              className={`rounded-xl px-3 py-1 font-medium transition-all ${
                statusFilter === s.id
                  ? "bg-surface-muted text-primary font-bold shadow-xs border border-primary/20"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Content */}
      {viewMode === "quarterly" ? (
        <QuarterlyGoalsView
          goals={filteredGoals}
          onToggleMilestone={handleToggleMilestone}
          onAddMilestone={handleAddMilestone}
          onDeleteMilestone={handleDeleteMilestone}
          onEditGoal={(g) => {
            setEditingGoal(g);
            setDialogOpen(true);
          }}
          onDeleteGoal={handleDeleteGoal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleMilestone={handleToggleMilestone}
              onAddMilestone={handleAddMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onEdit={(g) => {
                setEditingGoal(g);
                setDialogOpen(true);
              }}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <GoalDialog
        isOpen={dialogOpen}
        goalToEdit={editingGoal}
        onClose={() => {
          setDialogOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
