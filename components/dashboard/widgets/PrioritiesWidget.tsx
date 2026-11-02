"use client";

// ============================================================================
// Sahil's Shore: Top 3 Priorities Widget
// Pin high-leverage tasks for today with 1-tap completion & selector
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getTasks, completeTask, uncompleteTask } from "@/lib/todos";
import { todayIST } from "@/lib/date-utils";
import { useToast } from "@/components/ui/toast";
import type { Task } from "@/types";
import type { WidgetId } from "@/lib/dashboard/types";
import {
  CheckCircle2,
  Circle,
  Pin,
  Plus,
  ArrowRight,
  Sparkles,
  X,
  Search,
} from "lucide-react";

interface PrioritiesWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
  pinnedIds?: string[];
  onUpdatePinnedIds?: (ids: string[]) => void;
}

const PINNED_STORAGE_KEY = "shore_pinned_priorities_v1";

export function PrioritiesWidget({
  isEditMode,
  onRemove,
  pinnedIds: propPinnedIds,
  onUpdatePinnedIds,
}: PrioritiesWidgetProps) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const loadTasksAndPins = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        const tasks = await getTasks(supabase, data.user.id);
        setAllTasks(tasks);

        // Load pins from prop, or localStorage
        let savedPins = propPinnedIds;
        if (!savedPins && typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(PINNED_STORAGE_KEY);
            if (raw) savedPins = JSON.parse(raw);
          } catch {}
        }

        // If no pins saved, auto-pin top 3 high/urgent tasks for today
        if (!savedPins || savedPins.length === 0) {
          const auto = tasks
            .filter((t) => t.status !== "completed")
            .sort((a, b) => {
              const pRank = { urgent: 4, high: 3, medium: 2, low: 1 };
              return (
                (pRank[b.priority as keyof typeof pRank] || 0) -
                (pRank[a.priority as keyof typeof pRank] || 0)
              );
            })
            .slice(0, 3)
            .map((t) => t.id);
          savedPins = auto;
        }

        setPinnedIds(savedPins || []);
      }
    } catch (e) {
      console.warn("Failed loading priorities:", e);
    }
  }, [propPinnedIds]);

  useEffect(() => {
    loadTasksAndPins();

    const handleUpdate = () => loadTasksAndPins();
    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadTasksAndPins]);

  const updatePins = (newIds: string[]) => {
    setPinnedIds(newIds);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(newIds));
      } catch {}
    }
    onUpdatePinnedIds?.(newIds);
  };

  const handleToggleTask = async (task: Task) => {
    const isCompleted = task.status === "completed";
    const supabase = createClient();

    // Optimistic update
    setAllTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: isCompleted ? "todo" : "completed" }
          : t
      )
    );

    if (isCompleted) {
      await uncompleteTask(supabase, userId || "anonymous", task as any);
      toast({ title: "Task reopened", type: "info" });
    } else {
      await completeTask(supabase, userId || "anonymous", task as any);
      toast({ title: "Priority completed! 🎯", type: "success" });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shore:data-updated"));
    }
  };

  const togglePin = (taskId: string) => {
    if (pinnedIds.includes(taskId)) {
      updatePins(pinnedIds.filter((id) => id !== taskId));
    } else {
      if (pinnedIds.length >= 3) {
        toast({ title: "Maximum 3 priorities allowed", type: "info" });
        return;
      }
      updatePins([...pinnedIds, taskId]);
    }
  };

  const priorityTasks = pinnedIds
    .map((id) => allTasks.find((t) => t.id === id))
    .filter(Boolean) as Task[];

  const completedCount = priorityTasks.filter((t) => t.status === "completed").length;

  return (
    <WidgetContainer
      id="priorities"
      title="Top 3 Priorities"
      icon={Pin}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-primary">
            {completedCount}/{priorityTasks.length || 3}
          </span>
          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            className="p-1 rounded text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
            title="Choose Top 3 Priorities"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-2">
        {priorityTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
            <p className="text-xs text-text-muted">No priorities pinned for today.</p>
            <button
              onClick={() => setSelectorOpen(true)}
              className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Select 3 priorities</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {priorityTasks.map((t, idx) => {
              const isDone = t.status === "completed";
              return (
                <div
                  key={t.id}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                    isDone
                      ? "border-emerald-500/20 bg-emerald-500/5 text-text-muted line-through"
                      : "border-border/80 bg-surface hover:border-primary/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(t)}
                    className="mt-0.5 shrink-0 text-text-muted hover:text-primary transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-4 h-4 text-text-muted hover:text-primary" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-primary font-mono">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-text truncate">
                        {t.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                      <span
                        className={`font-semibold uppercase tracking-wider px-1 py-0.2 rounded text-[9px] ${
                          t.priority === "urgent"
                            ? "bg-danger/10 text-danger"
                            : t.priority === "high"
                            ? "bg-warning/10 text-warning"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {t.priority}
                      </span>
                      {t.tags && t.tags.length > 0 && (
                        <span className="text-text-muted">
                          #{t.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-text-muted">
          <span>{completedCount === 3 ? "All priorities cleared! 🎉" : `${3 - completedCount} remaining`}</span>
          <Link href="/todos" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>All Tasks</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Pin Selector Modal */}
      {selectorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setSelectorOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl overflow-hidden p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-text">Choose Top 3 Priorities</h4>
              </div>
              <button
                onClick={() => setSelectorOpen(false)}
                className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {allTasks
                .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((t) => {
                  const isPinned = pinnedIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => togglePin(t.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                        isPinned
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-text hover:bg-surface-muted"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold truncate">{t.title}</p>
                        <span className="text-[10px] text-text-muted capitalize">
                          {t.priority} • {t.status}
                        </span>
                      </div>
                      <Pin
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isPinned ? "fill-primary text-primary" : "text-text-muted"
                        }`}
                      />
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="text-text-muted">
                {pinnedIds.length}/3 pinned
              </span>
              <button
                onClick={() => setSelectorOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}
