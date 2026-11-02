// ============================================================================
// Sahil's Shore: Todos & Planner Data Access & Domain Logic
// Natural language parsing, recurrence calculation, subtasks, and Supabase sync
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.ts";
import type { Task, Subtask } from "../../types/index.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import {
  todayIST,
  tomorrowIST,
  addDaysIST,
  getISTDateString,
  getISTDayOfWeek,
} from "../date-utils.ts";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "custom" | "monthly";
  interval?: number; // e.g. every 1 week
  targetDays?: string[]; // e.g. ['mon', 'wed', 'fri'] for custom
  durationMinutes?: number; // default 30 min for time blocking
}

export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
  duration_minutes?: number;
}

export interface ParsedTaskInput {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: TaskPriority;
  tags: string[];
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  durationMinutes: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
  due_time?: string | null;
  tags?: string[];
  is_recurring?: boolean;
  recurrence_rule?: RecurrenceRule | null;
  duration_minutes?: number;
  subtasks?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
  due_time?: string | null;
  tags?: string[];
  is_recurring?: boolean;
  recurrence_rule?: RecurrenceRule | null;
  completed_at?: string | null;
  order_index?: number;
  duration_minutes?: number;
}

/**
 * Parses natural language task input into structured fields.
 * Example: "revise graphs tomorrow 7pm !high #dsa #prep"
 */
export function parseNaturalLanguageTask(
  rawInput: string,
  baseDate: string = todayIST()
): ParsedTaskInput {
  let text = rawInput.trim();

  // 1. Extract Priority: !urgent, !high, !medium, !low, !p0, !p1, !p2, !p3
  let priority: TaskPriority = "medium";
  const priorityMatch = text.match(/(?:^|\s)!(urgent|high|medium|low|p0|p1|p2|p3)(?:\s|$)/i);
  if (priorityMatch) {
    const rawP = priorityMatch[1].toLowerCase();
    if (rawP === "urgent" || rawP === "p0") priority = "urgent";
    else if (rawP === "high" || rawP === "p1") priority = "high";
    else if (rawP === "medium" || rawP === "p2") priority = "medium";
    else if (rawP === "low" || rawP === "p3") priority = "low";

    text = text.replace(priorityMatch[0], " ");
  }

  // 2. Extract Tags: #tag1 #tag2
  const tags: string[] = [];
  const tagMatches = Array.from(text.matchAll(/(?:^|\s)#([a-zA-Z0-9_\-]+)/g));
  for (const m of tagMatches) {
    tags.push(m[1].toLowerCase());
  }
  text = text.replace(/(?:^|\s)#[a-zA-Z0-9_\-]+/g, " ");

  // 3. Extract Time: "7pm", "7:30pm", "19:00", "07:30", "11am", "2:15 pm"
  let dueTime: string | null = null;
  const timeRegex = /(?:^|\s)(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s|$)/i;
  // Match specifically if followed by am/pm or has colon with minutes
  const strictTimeRegex = /(?:^|\s)(?:at\s+)?(\d{1,2})(?::(\d{2}))\s*(am|pm)?(?:\s|$)|(?:^|\s)(?:at\s+)?(\d{1,2})\s*(am|pm)(?:\s|$)/i;
  const timeMatch = text.match(strictTimeRegex);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1] || timeMatch[4], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = (timeMatch[3] || timeMatch[5] || "").toLowerCase();

    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      const hStr = hours < 10 ? `0${hours}` : `${hours}`;
      const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      dueTime = `${hStr}:${mStr}:00`;
      text = text.replace(timeMatch[0], " ");
    }
  }

  // 4. Extract Date: "today", "tomorrow", "day after tomorrow", "in X days", day of week
  let dueDate: string | null = null;
  const dayOfWeekNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  if (/(?:^|\s)today(?:\s|$)/i.test(text)) {
    dueDate = baseDate;
    text = text.replace(/(?:^|\s)today(?:\s|$)/i, " ");
  } else if (/(?:^|\s)day after tomorrow(?:\s|$)/i.test(text)) {
    dueDate = addDaysIST(baseDate, 2);
    text = text.replace(/(?:^|\s)day after tomorrow(?:\s|$)/i, " ");
  } else if (/(?:^|\s)tomorrow(?:\s|$)/i.test(text)) {
    dueDate = addDaysIST(baseDate, 1);
    text = text.replace(/(?:^|\s)tomorrow(?:\s|$)/i, " ");
  } else {
    // "in X days"
    const inDaysMatch = text.match(/(?:^|\s)in\s+(\d+)\s+days?(?:\s|$)/i);
    if (inDaysMatch) {
      const daysToAdd = parseInt(inDaysMatch[1], 10);
      dueDate = addDaysIST(baseDate, daysToAdd);
      text = text.replace(inDaysMatch[0], " ");
    } else {
      // Days of the week (e.g. "on friday", "this friday", "next monday", "monday")
      const dayMatch = text.match(/(?:^|\s)(?:on\s+|this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s|$)/i);
      if (dayMatch) {
        const targetDayName = dayMatch[1].toLowerCase();
        const targetDayIdx = dayOfWeekNames.indexOf(targetDayName);
        const curDate = new Date(`${baseDate}T12:00:00+05:30`);
        const curDayIdx = curDate.getDay();

        let daysUntil = targetDayIdx - curDayIdx;
        if (daysUntil <= 0) daysUntil += 7; // Target next upcoming instance
        dueDate = addDaysIST(baseDate, daysUntil);
        text = text.replace(dayMatch[0], " ");
      }
    }
  }

  // Clean cleaned title
  const cleanTitle = text.replace(/\s+/g, " ").trim();

  return {
    title: cleanTitle || rawInput.trim(),
    dueDate,
    dueTime,
    priority,
    tags,
    isRecurring: false,
    recurrenceRule: null,
    durationMinutes: 30,
  };
}

/**
 * Calculates the next recurrence date for a recurring task.
 * Handles daily, weekly, monthly, and custom day arrays in IST.
 */
export function calculateNextRecurrenceDate(
  rule: RecurrenceRule,
  completedDate: string | Date = todayIST()
): string {
  const baseDateStr =
    typeof completedDate === "string" && completedDate.length === 10
      ? completedDate
      : getISTDateString(completedDate);

  const interval = rule.interval && rule.interval > 0 ? rule.interval : 1;

  if (rule.frequency === "daily") {
    return addDaysIST(baseDateStr, interval);
  }

  if (rule.frequency === "weekly") {
    return addDaysIST(baseDateStr, interval * 7);
  }

  if (rule.frequency === "monthly") {
    const [y, m, d] = baseDateStr.split("-").map(Number);
    // Move to next month(s)
    let nextMonth = m + interval;
    let nextYear = y;
    while (nextMonth > 12) {
      nextMonth -= 12;
      nextYear += 1;
    }

    // Handle month-end day clamping (e.g., Jan 31 -> Feb 28/29)
    const daysInNextMonth = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
    const clampedDay = Math.min(d, daysInNextMonth);

    const mStr = nextMonth < 10 ? `0${nextMonth}` : `${nextMonth}`;
    const dStr = clampedDay < 10 ? `0${clampedDay}` : `${clampedDay}`;
    return `${nextYear}-${mStr}-${dStr}`;
  }

  if (rule.frequency === "custom" && rule.targetDays && rule.targetDays.length > 0) {
    const daysOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const targetDaysNorm = rule.targetDays.map((d) => d.toLowerCase().slice(0, 3));

    // Find next day in the targetDays list starting from tomorrow
    for (let offset = 1; offset <= 7; offset++) {
      const candidateDateStr = addDaysIST(baseDateStr, offset);
      const candidateDay = getISTDayOfWeek(candidateDateStr);
      if (targetDaysNorm.includes(candidateDay)) {
        return candidateDateStr;
      }
    }
  }

  // Fallback to daily
  return addDaysIST(baseDateStr, 1);
}

// ----------------------------------------------------------------------------
// Supabase Data Access Functions
// ----------------------------------------------------------------------------

export async function getTasks(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TaskWithSubtasks[]> {
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("[getTasks] Error fetching tasks:", tasksError);
    return [];
  }

  if (!tasks || tasks.length === 0) return [];

  const taskIds = tasks.map((t) => t.id);
  const { data: subtasks, error: subtasksError } = await supabase
    .from("subtasks")
    .select("*")
    .eq("user_id", userId)
    .in("task_id", taskIds)
    .order("order_index", { ascending: true });

  if (subtasksError) {
    console.warn("[getTasks] Error fetching subtasks:", subtasksError);
  }

  const subtasksByTaskId: Record<string, Subtask[]> = {};
  (subtasks || []).forEach((st) => {
    if (!subtasksByTaskId[st.task_id]) {
      subtasksByTaskId[st.task_id] = [];
    }
    subtasksByTaskId[st.task_id].push(st as Subtask);
  });

  return tasks.map((task) => {
    const rule = task.recurrence_rule as (RecurrenceRule & { durationMinutes?: number }) | null;
    return {
      ...(task as Task),
      subtasks: subtasksByTaskId[task.id] || [],
      duration_minutes: rule?.durationMinutes || 30,
    };
  });
}

export async function createTask(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateTaskInput
): Promise<TaskWithSubtasks | null> {
  const recurrenceRule = input.recurrence_rule
    ? { ...input.recurrence_rule, durationMinutes: input.duration_minutes || 30 }
    : input.duration_minutes
    ? { durationMinutes: input.duration_minutes }
    : null;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description || null,
      priority: input.priority || "medium",
      status: input.status || "todo",
      due_date: input.due_date || null,
      due_time: input.due_time || null,
      tags: input.tags || [],
      is_recurring: input.is_recurring || false,
      recurrence_rule: recurrenceRule as unknown as Json,
    })
    .select()
    .single();

  if (error || !task) {
    console.error("[createTask] Error creating task:", error);
    return null;
  }

  // Create subtasks if provided
  let createdSubtasks: Subtask[] = [];
  if (input.subtasks && input.subtasks.length > 0) {
    const subtaskRows = input.subtasks.map((stTitle, idx) => ({
      user_id: userId,
      task_id: task.id,
      title: stTitle,
      is_completed: false,
      order_index: idx,
    }));

    const { data: insertedSubtasks } = await supabase
      .from("subtasks")
      .insert(subtaskRows)
      .select();

    if (insertedSubtasks) {
      createdSubtasks = insertedSubtasks as Subtask[];
    }
  }

  // Write Timeline event: task_created
  await writeTimelineEvent(supabase, {
    userId,
    type: "task_created",
    summary: `Created task: ${task.title}`,
    refTable: "tasks",
    refId: task.id,
    meta: {
      priority: task.priority,
      tags: task.tags,
      due_date: task.due_date,
    },
  });

  return {
    ...(task as Task),
    subtasks: createdSubtasks,
    duration_minutes: input.duration_minutes || 30,
  };
}

export async function updateTask(
  supabase: SupabaseClient<Database>,
  userId: string,
  taskId: string,
  updates: UpdateTaskInput
): Promise<TaskWithSubtasks | null> {
  const updatePayload: Database["public"]["Tables"]["tasks"]["Update"] = {};

  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description;
  if (updates.priority !== undefined) updatePayload.priority = updates.priority;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.due_date !== undefined) updatePayload.due_date = updates.due_date;
  if (updates.due_time !== undefined) updatePayload.due_time = updates.due_time;
  if (updates.tags !== undefined) updatePayload.tags = updates.tags;
  if (updates.is_recurring !== undefined) updatePayload.is_recurring = updates.is_recurring;
  if (updates.completed_at !== undefined) updatePayload.completed_at = updates.completed_at;
  if (updates.order_index !== undefined) updatePayload.order_index = updates.order_index;

  if (updates.recurrence_rule !== undefined || updates.duration_minutes !== undefined) {
    updatePayload.recurrence_rule = {
      ...(updates.recurrence_rule || {}),
      durationMinutes: updates.duration_minutes || 30,
    } as unknown as Json;
  }

  const { data: updated, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !updated) {
    console.error("[updateTask] Error updating task:", error);
    return null;
  }

  return {
    ...(updated as Task),
    subtasks: [],
    duration_minutes: updates.duration_minutes || 30,
  };
}

/**
 * Completes a task: marks completed, writes timeline event, and generates next instance if recurring.
 */
export async function completeTask(
  supabase: SupabaseClient<Database>,
  userId: string,
  task: TaskWithSubtasks
): Promise<{ completedTask: TaskWithSubtasks; nextTask?: TaskWithSubtasks }> {
  const now = new Date().toISOString();

  // 1. Mark task completed
  const { data: completed, error } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_at: now,
    })
    .eq("id", task.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !completed) {
    console.error("[completeTask] Error completing task:", error);
    throw error;
  }

  // 2. Write Timeline Event
  await writeTimelineEvent(supabase, {
    userId,
    type: "task_completed",
    summary: `Completed task: ${task.title}`,
    refTable: "tasks",
    refId: task.id,
    meta: {
      tags: task.tags,
      priority: task.priority,
      completed_at: now,
    },
  });

  const completedResult: TaskWithSubtasks = {
    ...(completed as Task),
    subtasks: task.subtasks,
  };

  // 3. Generate Next Instance if recurring
  let nextTaskResult: TaskWithSubtasks | undefined;
  if (task.is_recurring && task.recurrence_rule) {
    const rule = task.recurrence_rule as unknown as RecurrenceRule;
    const nextDate = calculateNextRecurrenceDate(rule, task.due_date || todayIST());

    const nextTask = await createTask(supabase, userId, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: "todo",
      due_date: nextDate,
      due_time: task.due_time,
      tags: task.tags,
      is_recurring: true,
      recurrence_rule: rule,
      duration_minutes: task.duration_minutes || 30,
      subtasks: task.subtasks.map((s) => s.title), // copy subtask templates
    });

    if (nextTask) {
      nextTaskResult = nextTask;
    }
  }

  return {
    completedTask: completedResult,
    nextTask: nextTaskResult,
  };
}

/**
 * Reverts task completion (for Undo action).
 */
export async function uncompleteTask(
  supabase: SupabaseClient<Database>,
  userId: string,
  taskId: string
): Promise<TaskWithSubtasks | null> {
  const { data: updated, error } = await supabase
    .from("tasks")
    .update({
      status: "todo",
      completed_at: null,
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !updated) {
    console.error("[uncompleteTask] Error uncompleting task:", error);
    return null;
  }

  return {
    ...(updated as Task),
    subtasks: [],
  };
}

/**
 * Deletes a task.
 */
export async function deleteTask(
  supabase: SupabaseClient<Database>,
  userId: string,
  taskId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    console.error("[deleteTask] Error deleting task:", error);
    return false;
  }

  return true;
}

// ----------------------------------------------------------------------------
// Subtasks
// ----------------------------------------------------------------------------

export async function createSubtask(
  supabase: SupabaseClient<Database>,
  userId: string,
  taskId: string,
  title: string
): Promise<Subtask | null> {
  const { data, error } = await supabase
    .from("subtasks")
    .insert({
      user_id: userId,
      task_id: taskId,
      title,
      is_completed: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createSubtask] Error creating subtask:", error);
    return null;
  }

  return data as Subtask;
}

export async function toggleSubtask(
  supabase: SupabaseClient<Database>,
  userId: string,
  subtaskId: string,
  isCompleted: boolean
): Promise<Subtask | null> {
  const { data, error } = await supabase
    .from("subtasks")
    .update({ is_completed: isCompleted })
    .eq("id", subtaskId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[toggleSubtask] Error updating subtask:", error);
    return null;
  }

  return data as Subtask;
}

export async function deleteSubtask(
  supabase: SupabaseClient<Database>,
  userId: string,
  subtaskId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("subtasks")
    .delete()
    .eq("id", subtaskId)
    .eq("user_id", userId);

  return !error;
}
