// ============================================================================
// Sahil's Shore: Goals & Milestones Data Layer
// Long-term goal tracking, milestones, dynamic linked progress, quarterly views
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { todayIST } from "../date-utils.ts";

export interface Milestone {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: string;
  target_date: string | null;
  status: "in_progress" | "completed" | "archived";
  progress_percent: number;
  linked_task_ids: string[];
  linked_habit_ids: string[];
  linked_activity_ids: string[];
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  title: string;
  category?: string;
  target_date?: string | null;
  linked_task_ids?: string[];
  linked_habit_ids?: string[];
  linked_activity_ids?: string[];
  milestones?: { title: string; due_date?: string | null }[];
}

export interface UpdateGoalInput {
  title?: string;
  category?: string;
  target_date?: string | null;
  status?: "in_progress" | "completed" | "archived";
  progress_percent?: number;
  linked_task_ids?: string[];
  linked_habit_ids?: string[];
  linked_activity_ids?: string[];
}

/**
 * Derives the quarter identifier for a given "YYYY-MM-DD" date string (e.g. "Q1 2026").
 */
export function getQuarterForDate(dateStr?: string | null): string {
  if (!dateStr || dateStr.length < 7) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const q = Math.ceil(currentMonth / 3);
    return `Q${q} ${currentYear}`;
  }

  const [yearStr, monthStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const q = Math.ceil(month / 3);
  return `Q${q} ${year}`;
}

/**
 * Computes dynamic progress percentage (0 - 100%) for a goal given its milestones
 * and linked task completion states.
 */
export function calculateGoalProgress(
  milestones: { is_completed: boolean }[],
  linkedTasksCount: number = 0,
  completedLinkedTasksCount: number = 0
): number {
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.is_completed).length;

  if (totalMilestones === 0 && linkedTasksCount === 0) {
    return 0;
  }

  if (totalMilestones > 0 && linkedTasksCount === 0) {
    return Math.round((completedMilestones / totalMilestones) * 100);
  }

  if (totalMilestones === 0 && linkedTasksCount > 0) {
    return Math.round((completedLinkedTasksCount / linkedTasksCount) * 100);
  }

  // Weighted: 70% Milestones, 30% Linked Tasks
  const milestoneScore = (completedMilestones / totalMilestones) * 70;
  const taskScore = (completedLinkedTasksCount / linkedTasksCount) * 30;

  return Math.min(100, Math.round(milestoneScore + taskScore));
}

/**
 * Groups goals by quarter string (e.g. "Q1 2026", "Q2 2026").
 */
export function groupGoalsByQuarter(goals: Goal[]): Record<string, Goal[]> {
  const groups: Record<string, Goal[]> = {};

  goals.forEach((goal) => {
    const quarter = getQuarterForDate(goal.target_date);
    if (!groups[quarter]) {
      groups[quarter] = [];
    }
    groups[quarter].push(goal);
  });

  return groups;
}

/**
 * Fetches all goals with milestones for the authenticated user.
 */
export async function getGoals(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Goal[]> {
  try {
    const [goalsRes, milestonesRes] = await Promise.all([
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("milestones")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    if (goalsRes.error) {
      console.error("[getGoals] Error fetching goals:", goalsRes.error.message);
      return [];
    }

    const allMilestones = (milestonesRes.data || []) as Milestone[];
    const milestonesMap = new Map<string, Milestone[]>();

    allMilestones.forEach((m) => {
      const list = milestonesMap.get(m.goal_id) || [];
      list.push(m);
      milestonesMap.set(m.goal_id, list);
    });

    return (goalsRes.data || []).map((row) => ({
      ...row,
      category: row.category || "General",
      linked_task_ids: (row as any).linked_task_ids || [],
      linked_habit_ids: (row as any).linked_habit_ids || [],
      linked_activity_ids: (row as any).linked_activity_ids || [],
      milestones: milestonesMap.get(row.id) || [],
    })) as Goal[];
  } catch (err) {
    console.error("[getGoals] Unexpected error:", err);
    return [];
  }
}

/**
 * Creates a new goal with optional initial milestones and logs to timeline_events.
 */
export async function createGoal(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateGoalInput
): Promise<Goal | null> {
  try {
    const {
      title,
      category = "General",
      target_date = null,
      linked_task_ids = [],
      linked_habit_ids = [],
      linked_activity_ids = [],
      milestones = [],
    } = input;

    // 1. Insert Goal
    const { data: goalData, error: goalErr } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: title.trim(),
        category: category.trim(),
        target_date: target_date || null,
        status: "in_progress",
        progress_percent: 0,
        linked_task_ids,
        linked_habit_ids,
        linked_activity_ids,
      } as any)
      .select()
      .single();

    if (goalErr || !goalData) {
      console.error("[createGoal] Insert error:", goalErr?.message);
      return null;
    }

    const goalId = goalData.id;
    let createdMilestones: Milestone[] = [];

    // 2. Insert Milestones if provided
    if (milestones.length > 0) {
      const mRows = milestones.map((m) => ({
        user_id: userId,
        goal_id: goalId,
        title: m.title.trim(),
        due_date: m.due_date || null,
        is_completed: false,
      }));

      const { data: mData } = await supabase
        .from("milestones")
        .insert(mRows as any)
        .select();

      createdMilestones = (mData || []) as Milestone[];
    }

    // 3. Write to timeline_events
    await writeTimelineEvent(supabase, {
      userId,
      type: "goal_created",
      summary: `Set goal: ${goalData.title} (${category})`,
      refTable: "goals",
      refId: goalId,
      meta: {
        title: goalData.title,
        category,
        target_date,
        milestones_count: milestones.length,
      },
    });

    return {
      ...(goalData as any),
      category: goalData.category || category,
      linked_task_ids: (goalData as any).linked_task_ids || linked_task_ids,
      linked_habit_ids: (goalData as any).linked_habit_ids || linked_habit_ids,
      linked_activity_ids: (goalData as any).linked_activity_ids || linked_activity_ids,
      milestones: createdMilestones,
    };
  } catch (err) {
    console.error("[createGoal] Unexpected error:", err);
    return null;
  }
}

/**
 * Updates an existing goal.
 */
export async function updateGoal(
  supabase: SupabaseClient<Database>,
  goalId: string,
  updates: UpdateGoalInput
): Promise<Goal | null> {
  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.category !== undefined) payload.category = updates.category.trim();
    if (updates.target_date !== undefined) payload.target_date = updates.target_date;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.progress_percent !== undefined) payload.progress_percent = updates.progress_percent;
    if (updates.linked_task_ids !== undefined) payload.linked_task_ids = updates.linked_task_ids;
    if (updates.linked_habit_ids !== undefined) payload.linked_habit_ids = updates.linked_habit_ids;
    if (updates.linked_activity_ids !== undefined) payload.linked_activity_ids = updates.linked_activity_ids;

    const { data, error } = await supabase
      .from("goals")
      .update(payload)
      .eq("id", goalId)
      .select()
      .single();

    if (error) {
      console.error("[updateGoal] Error:", error.message);
      return null;
    }

    return data as Goal;
  } catch (err) {
    console.error("[updateGoal] Unexpected error:", err);
    return null;
  }
}

/**
 * Deletes a goal and cascading milestones.
 */
export async function deleteGoal(
  supabase: SupabaseClient<Database>,
  goalId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    return !error;
  } catch (err) {
    console.error("[deleteGoal] Unexpected error:", err);
    return false;
  }
}

/**
 * Adds a new milestone to a goal and re-evaluates progress.
 */
export async function createMilestone(
  supabase: SupabaseClient<Database>,
  userId: string,
  goalId: string,
  title: string,
  dueDate?: string | null
): Promise<Milestone | null> {
  try {
    const { data, error } = await supabase
      .from("milestones")
      .insert({
        user_id: userId,
        goal_id: goalId,
        title: title.trim(),
        due_date: dueDate || null,
        is_completed: false,
      } as any)
      .select()
      .single();

    if (error || !data) return null;
    return data as Milestone;
  } catch (err) {
    console.error("[createMilestone] Unexpected error:", err);
    return null;
  }
}

/**
 * Toggles completion status of a milestone, updates progress, and logs to timeline_events.
 */
export async function toggleMilestone(
  supabase: SupabaseClient<Database>,
  userId: string,
  goal: Goal,
  milestoneId: string,
  isCompleted: boolean
): Promise<boolean> {
  try {
    const completedAt = isCompleted ? new Date().toISOString() : null;

    const { data: updatedM, error } = await supabase
      .from("milestones")
      .update({
        is_completed: isCompleted,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", milestoneId)
      .select()
      .single();

    if (error || !updatedM) return false;

    // Recalculate progress for the goal
    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, is_completed: isCompleted } : m
    );

    const newProgress = calculateGoalProgress(updatedMilestones);

    await supabase
      .from("goals")
      .update({
        progress_percent: newProgress,
        status: newProgress === 100 ? "completed" : "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.id);

    // If completed, write timeline event
    if (isCompleted) {
      await writeTimelineEvent(supabase, {
        userId,
        type: "milestone_completed",
        summary: `Achieved milestone: ${updatedM.title} (${goal.title})`,
        refTable: "milestones",
        refId: milestoneId,
        meta: {
          milestone_title: updatedM.title,
          goal_title: goal.title,
          goal_id: goal.id,
          new_progress_percent: newProgress,
        },
      });
    }

    return true;
  } catch (err) {
    console.error("[toggleMilestone] Unexpected error:", err);
    return false;
  }
}

/**
 * Deletes a milestone.
 */
export async function deleteMilestone(
  supabase: SupabaseClient<Database>,
  milestoneId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);
    return !error;
  } catch (err) {
    console.error("[deleteMilestone] Unexpected error:", err);
    return false;
  }
}
