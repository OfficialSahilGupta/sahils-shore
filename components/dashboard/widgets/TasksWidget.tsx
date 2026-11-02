"use client";

// ============================================================================
// Sahil's Shore: Today's Tasks Widget
// Pending tasks due today with inline quick addition & completion check
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getTasks, completeTask, uncompleteTask, createTask, parseNaturalLanguageTask } from "@/lib/todos";
import { todayIST } from "@/lib/date-utils";
import { useToast } from "@/components/ui/toast";
import type { Task } from "@/types";
import type { WidgetId } from "@/lib/dashboard/types";
import { CheckSquare, Plus, Circle, CheckCircle2, ArrowRight } from "lucide-react";

interface TasksWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

export function TasksWidget({ isEditMode, onRemove }: TasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadTasks = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      setUserId(data.user.id);

      const all = await getTasks(supabase, data.user.id);
      const today = todayIST();
      // Filter tasks due today or without due date, or overdue
      const todayList = all.filter((t) => {
        if (t.status === "completed") return false;
        if (!t.due_date) return true;
        return t.due_date <= today;
      });
      setTasks(todayList);
    } catch (e) {
      console.warn("Failed loading tasks:", e);
    }
  }, []);

  useEffect(() => {
    loadTasks();

    const handleUpdate = () => loadTasks();
    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadTasks]);

  const handleToggle = async (task: Task) => {
    const supabase = createClient();
    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await completeTask(supabase, userId || "anonymous", task as any);
    toast({ title: "Task completed", type: "success" });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shore:data-updated"));
    }
  };

  const handleInlineAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const supabase = createClient();
      const parsed = parseNaturalLanguageTask(newTitle.trim());
      const res = await createTask(supabase, userId || "anonymous", {
        title: parsed.title,
        priority: parsed.priority || "medium",
        due_date: parsed.dueDate || todayIST(),
        due_time: parsed.dueTime,
        tags: parsed.tags.length > 0 ? parsed.tags : ["today"],
      });

      if (res) {
        setNewTitle("");
        setTasks((prev) => [res, ...prev]);
        toast({ title: "Task added", type: "success" });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("shore:data-updated"));
        }
      }
    } catch {
      toast({ title: "Failed to add task", type: "error" });
    }
  };

  return (
    <WidgetContainer
      id="tasks"
      title="Today's Tasks"
      icon={CheckSquare}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <span className="text-[11px] font-bold text-primary">
          {tasks.length} pending
        </span>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-3">
        {/* Inline Add Input */}
        <form onSubmit={handleInlineAdd} className="relative">
          <input
            type="text"
            placeholder="Add task... (e.g. Call recruiter !high)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary placeholder:text-text-muted/60"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-primary hover:opacity-80 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 max-h-48 pr-0.5">
          {tasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted">
              All caught up! No pending tasks for today.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-border/70 hover:border-primary/40 bg-surface transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(task)}
                  className="text-text-muted hover:text-emerald-500 transition-colors shrink-0"
                >
                  <Circle className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-semibold text-text truncate flex-1">
                  {task.title}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded shrink-0 ${
                    task.priority === "urgent"
                      ? "bg-danger/10 text-danger"
                      : task.priority === "high"
                      ? "bg-warning/10 text-warning"
                      : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">{tasks.length} remaining</span>
          <Link href="/todos" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Planner & Kanban</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
