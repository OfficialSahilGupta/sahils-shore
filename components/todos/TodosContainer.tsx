"use client";

// ============================================================================
// Sahil's Shore: Todos & Planner Container
// Orchestrates List, Kanban, Calendar, and Day Planner views with Smart Filters
// ============================================================================

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  List,
  Kanban as KanbanIcon,
  Calendar as CalendarIcon,
  Clock,
  Filter,
  Search,
  Plus,
  Sparkles,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { QuickAddBar } from "./QuickAddBar";
import { TaskItem } from "./TaskItem";
import { TaskDialog } from "./TaskDialog";
import { KanbanBoard, type KanbanColumnId } from "./KanbanBoard";
import { CalendarView } from "./CalendarView";
import { DayPlanner } from "./DayPlanner";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  type TaskWithSubtasks,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/todos";
import { isTodayIST, isPastIST, isFutureIST, todayIST } from "@/lib/date-utils";

type ViewMode = "list" | "kanban" | "calendar" | "planner";
type SmartFilter = "all" | "today" | "upcoming" | "overdue" | "no_date" | "completed";

export function TodosContainer() {
  const [tasks, setTasks] = useState<TaskWithSubtasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [smartFilter, setSmartFilter] = useState<SmartFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithSubtasks | null>(null);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<string | undefined>(undefined);

  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  // Fetch authenticated user & tasks
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const data = await getTasks(supabase, user.id);
          setTasks(data);
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // All unique tags extracted across tasks
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Smart filter
      if (smartFilter === "today") {
        if (!isTodayIST(task.due_date) || task.status === "completed") return false;
      } else if (smartFilter === "upcoming") {
        if (!isFutureIST(task.due_date) || task.status === "completed") return false;
      } else if (smartFilter === "overdue") {
        if (!isPastIST(task.due_date) || task.status === "completed") return false;
      } else if (smartFilter === "no_date") {
        if (task.due_date || task.status === "completed") return false;
      } else if (smartFilter === "completed") {
        if (task.status !== "completed") return false;
      }

      // 2. Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // 3. Tag filter
      if (selectedTag && !(task.tags || []).includes(selectedTag)) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q) ?? false;
        const matchesTags = (task.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });
  }, [tasks, smartFilter, priorityFilter, selectedTag, searchQuery]);

  // Counts for smart filter tabs
  const counts = useMemo(() => {
    const today = tasks.filter((t) => isTodayIST(t.due_date) && t.status !== "completed").length;
    const upcoming = tasks.filter((t) => isFutureIST(t.due_date) && t.status !== "completed").length;
    const overdue = tasks.filter((t) => isPastIST(t.due_date) && t.status !== "completed").length;
    const noDate = tasks.filter((t) => !t.due_date && t.status !== "completed").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { all: tasks.length, today, upcoming, overdue, noDate, completed };
  }, [tasks]);

  // Handler: Quick Add Task
  const handleAddTask = async (input: CreateTaskInput) => {
    if (!userId) {
      toast({ title: "Authentication required", type: "error" });
      return;
    }

    // Optimistic item
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: TaskWithSubtasks = {
      id: tempId,
      user_id: userId,
      title: input.title,
      description: input.description || null,
      priority: input.priority || "medium",
      status: input.status || "todo",
      due_date: input.due_date || null,
      due_time: input.due_time || null,
      tags: input.tags || [],
      is_recurring: input.is_recurring || false,
      recurrence_rule: input.recurrence_rule as any,
      completed_at: null,
      order_index: tasks.length,
      duration_minutes: input.duration_minutes || 30,
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const created = await createTask(supabase, userId, input);
      if (created) {
        setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
        toast({
          title: "Task created",
          description: created.title,
          type: "success",
        });
      }
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      toast({ title: "Failed to create task", type: "error" });
    }
  };

  // Handler: Save from Dialog (Create or Update)
  const handleSaveDialogTask = async (data: CreateTaskInput | UpdateTaskInput) => {
    if (!userId) return;

    if (editingTask) {
      // Update
      const oldTask = editingTask;
      setTasks((prev) =>
        prev.map((t) => (t.id === oldTask.id ? { ...t, ...(data as any) } : t))
      );

      try {
        const updated = await updateTask(supabase, userId, oldTask.id, data as UpdateTaskInput);
        if (updated) {
          setTasks((prev) =>
            prev.map((t) => (t.id === oldTask.id ? { ...updated, subtasks: oldTask.subtasks } : t))
          );
          toast({ title: "Task updated", type: "success" });
        }
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === oldTask.id ? oldTask : t)));
        toast({ title: "Failed to update task", type: "error" });
      }
    } else {
      // Create
      await handleAddTask(data as CreateTaskInput);
    }
  };

  // Handler: Toggle Complete (with optimistic update + Undo Toast)
  const handleToggleComplete = async (task: TaskWithSubtasks) => {
    if (!userId) return;

    const willBeCompleted = task.status !== "completed";

    if (willBeCompleted) {
      // Optimistic complete
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "completed", completed_at: new Date().toISOString() }
            : t
        )
      );

      // Trigger Undo Toast
      toast({
        title: "Task completed",
        description: task.title,
        type: "success",
        durationMs: 6000,
        onUndo: async () => {
          // Revert completion
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: "todo", completed_at: null } : t))
          );
          await uncompleteTask(supabase, userId, task.id);
        },
      });

      try {
        const { completedTask, nextTask } = await completeTask(supabase, userId, task);
        if (nextTask) {
          setTasks((prev) => [nextTask, ...prev]);
          toast({
            title: "Recurring task scheduled",
            description: `Next due: ${nextTask.due_date}`,
            type: "info",
          });
        }
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        toast({ title: "Error completing task", type: "error" });
      }
    } else {
      // Reopen
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "todo", completed_at: null } : t))
      );
      await uncompleteTask(supabase, userId, task.id);
    }
  };

  // Handler: Delete Task (with Undo Toast)
  const handleDeleteTask = async (task: TaskWithSubtasks) => {
    if (!userId) return;

    // Optimistically remove
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    toast({
      title: "Task deleted",
      description: task.title,
      type: "info",
      durationMs: 6000,
      onUndo: async () => {
        // Restore task
        setTasks((prev) => [task, ...prev]);
        await createTask(supabase, userId, {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          due_time: task.due_time,
          tags: task.tags,
          is_recurring: task.is_recurring,
          recurrence_rule: task.recurrence_rule as any,
          duration_minutes: task.duration_minutes,
        });
      },
    });

    try {
      await deleteTask(supabase, userId, task.id);
    } catch (err) {
      setTasks((prev) => [task, ...prev]);
      toast({ title: "Failed to delete task", type: "error" });
    }
  };

  // Handler: Move Task in Kanban
  const handleMoveKanbanTask = async (taskId: string, targetCol: KanbanColumnId) => {
    if (!userId) return;

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    if (targetCol === "done") {
      if (currentTask.status !== "completed") {
        handleToggleComplete(currentTask);
      }
      return;
    }

    let newStatus = "todo";
    let newDueDate: string | null = currentTask.due_date;

    if (targetCol === "doing") {
      newStatus = "in_progress";
    } else if (targetCol === "today") {
      newStatus = "todo";
      newDueDate = todayIST();
    } else if (targetCol === "backlog") {
      newStatus = "todo";
      newDueDate = null;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus as any,
              due_date: newDueDate,
              completed_at: null,
            }
          : t
      )
    );

    await updateTask(supabase, userId, taskId, {
      status: newStatus as any,
      due_date: newDueDate,
      completed_at: null,
    });
  };

  // Handler: Schedule on Timeline Slot in Day Planner
  const handleScheduleTask = async (taskId: string, date: string, time: string) => {
    if (!userId) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, due_date: date, due_time: time } : t
      )
    );

    await updateTask(supabase, userId, taskId, {
      due_date: date,
      due_time: time,
    });

    toast({ title: "Task scheduled on timeline", type: "success" });
  };

  // Handler: Unschedule from Day Planner slot
  const handleUnscheduleTask = async (taskId: string) => {
    if (!userId) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, due_time: null } : t))
    );

    await updateTask(supabase, userId, taskId, { due_time: null });
  };

  // Subtasks Handlers
  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    if (!userId) return;

    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        subtasks: t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, is_completed: isCompleted } : st
        ),
      }))
    );

    await toggleSubtask(supabase, userId, subtaskId, isCompleted);
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    if (!userId) return;

    const created = await createSubtask(supabase, userId, taskId, title);
    if (created) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, created] } : t
        )
      );
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!userId) return;

    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
      }))
    );

    await deleteSubtask(supabase, userId, subtaskId);
  };

  return (
    <div className="w-full space-y-6">
      {/* Module Title & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Todos & Planner
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Organize actions, manage day timelines, and hit your milestones.
          </p>
        </div>

        {/* View Switcher: List, Kanban, Calendar, Planner */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-xs">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "kanban"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <KanbanIcon className="h-3.5 w-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "calendar"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode("planner")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "planner"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Day Planner</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar with Natural Language Parsing */}
      <QuickAddBar onAddTask={handleAddTask} />

      {/* Filter and Search Bar (shown in List and Kanban views) */}
      {(viewMode === "list" || viewMode === "kanban") && (
        <div className="flex flex-col gap-3">
          {/* Smart View Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Tasks", count: counts.all },
              { id: "today", label: "Today", count: counts.today },
              { id: "upcoming", label: "Upcoming", count: counts.upcoming },
              { id: "overdue", label: "Overdue", count: counts.overdue, danger: counts.overdue > 0 },
              { id: "no_date", label: "No Date", count: counts.noDate },
              { id: "completed", label: "Done", count: counts.completed },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setSmartFilter(pill.id as SmartFilter)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition-all ${
                  smartFilter === pill.id
                    ? pill.danger
                      ? "bg-[var(--danger)] text-white shadow-xs"
                      : "bg-[var(--primary)] text-white shadow-xs"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    smartFilter === pill.id
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Extra Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tasks, tags, or notes..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              {/* Priority Select */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="all">Priority: All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* New Task Button */}
            <button
              onClick={() => {
                setEditingTask(null);
                setDialogDefaultDate(todayIST());
                setDialogOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>

          {/* Tags row */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[var(--text-muted)] text-[11px] mr-1 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Tags:
              </span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-mono transition-colors ${
                    selectedTag === tag
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW CONTENT */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-2xl bg-[var(--surface-muted)]/50"
            />
          ))}
        </div>
      ) : (
        <>
          {/* 1. LIST VIEW */}
          {viewMode === "list" && (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setDialogOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                />
              ))}

              {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-[var(--primary)] mb-2 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-[var(--text)]">
                    No tasks found
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Try another filter or add a new task above.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. KANBAN VIEW */}
          {viewMode === "kanban" && (
            <KanbanBoard
              tasks={filteredTasks}
              onMoveTask={handleMoveKanbanTask}
              onEditTask={(t) => {
                setEditingTask(t);
                setDialogOpen(true);
              }}
              onQuickAdd={(col) => {
                setEditingTask(null);
                setDialogDefaultDate(col === "today" ? todayIST() : undefined);
                setDialogOpen(true);
              }}
            />
          )}

          {/* 3. CALENDAR VIEW */}
          {viewMode === "calendar" && (
            <CalendarView
              tasks={tasks}
              onSelectTask={(t) => {
                setEditingTask(t);
                setDialogOpen(true);
              }}
              onSelectDate={(date) => {
                setEditingTask(null);
                setDialogDefaultDate(date);
                setDialogOpen(true);
              }}
            />
          )}

          {/* 4. DAY PLANNER VIEW */}
          {viewMode === "planner" && (
            <DayPlanner
              tasks={tasks}
              onScheduleTask={handleScheduleTask}
              onUnscheduleTask={handleUnscheduleTask}
              onSelectTask={(t) => {
                setEditingTask(t);
                setDialogOpen(true);
              }}
              onQuickAddAtSlot={(date, time) => {
                setEditingTask(null);
                setDialogDefaultDate(date);
                setDialogOpen(true);
              }}
              onToggleComplete={handleToggleComplete}
            />
          )}
        </>
      )}

      {/* Task Create / Edit Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultDate={dialogDefaultDate}
        onSave={handleSaveDialogTask}
      />
    </div>
  );
}
