"use client";

// ============================================================================
// Sahil's Shore: Task Item Component
// Renders individual task row with priority, tags, subtasks, and quick actions
// ============================================================================

import React, { useState } from "react";
import {
  Check,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Repeat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TaskWithSubtasks } from "@/lib/todos";
import {
  formatFriendlyISTDate,
  formatISTTime,
  isPastIST,
  isTodayIST,
} from "@/lib/date-utils";

interface TaskItemProps {
  task: TaskWithSubtasks;
  onToggleComplete: (task: TaskWithSubtasks) => void;
  onEdit: (task: TaskWithSubtasks) => void;
  onDelete: (task: TaskWithSubtasks) => void;
  onToggleSubtask: (subtaskId: string, isCompleted: boolean) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const isCompleted = task.status === "completed";
  const isOverdue = !isCompleted && isPastIST(task.due_date);
  const isToday = !isCompleted && isTodayIST(task.due_date);

  const completedSubtasksCount = task.subtasks.filter((s) => s.is_completed).length;
  const totalSubtasksCount = task.subtasks.length;

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
    setIsAddingSubtask(false);
  };

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 bg-[var(--surface)] ${
        isCompleted
          ? "border-[var(--border)]/60 opacity-60 bg-[var(--surface-muted)]/20"
          : isOverdue
          ? "border-[var(--danger)]/30 hover:border-[var(--danger)]/50"
          : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Completion Checkbox */}
        <button
          onClick={() => onToggleComplete(task)}
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-all ${
            isCompleted
              ? "border-[var(--success)] bg-[var(--success)] text-white"
              : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/30"
          }`}
          title={isCompleted ? "Mark incomplete" : "Mark completed"}
        >
          {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </button>

        {/* Task Title & Details */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEdit(task)}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium leading-snug break-words ${
                isCompleted
                  ? "line-through text-[var(--text-muted)]"
                  : "text-[var(--text)]"
              }`}
            >
              {task.title}
            </span>

            {/* Recurring Badge */}
            {task.is_recurring && (
              <span
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--surface-muted)] text-[var(--text-muted)]"
                title="Recurring task"
              >
                <Repeat className="h-2.5 w-2.5" />
                <span>Repeat</span>
              </span>
            )}
          </div>

          {/* Metadata Row: Due Date, Due Time, Priority, Tags, Subtasks counter */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            {/* Due Date */}
            {task.due_date && (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  isOverdue
                    ? "text-[var(--danger)] font-semibold"
                    : isToday
                    ? "text-[var(--primary)] font-semibold"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {formatFriendlyISTDate(task.due_date)}
              </span>
            )}

            {/* Due Time */}
            {task.due_time && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                <Clock className="h-3 w-3" />
                {formatISTTime(task.due_time)}
              </span>
            )}

            {/* Priority */}
            {task.priority !== "medium" && (
              <Badge variant={task.priority} className="text-[10px] py-0 px-1.5">
                {task.priority.toUpperCase()}
              </Badge>
            )}

            {/* Tags */}
            {task.tags &&
              task.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]"
                >
                  #{tag}
                </span>
              ))}

            {/* Subtask count */}
            {totalSubtasksCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="inline-flex items-center gap-1 rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-medium text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span>
                  {completedSubtasksCount}/{totalSubtasksCount} subtasks
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Edit, Delete */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
            title="Edit task"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Subtasks Accordion Section */}
      {isExpanded && (
        <div className="border-t border-[var(--border)]/60 bg-[var(--surface-muted)]/30 px-9 py-2.5 space-y-2">
          {task.subtasks.map((st) => (
            <div
              key={st.id}
              className="group/subtask flex items-center justify-between gap-2 text-xs"
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={st.is_completed}
                  onChange={(e) => onToggleSubtask(st.id, e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20"
                />
                <span
                  className={
                    st.is_completed
                      ? "line-through text-[var(--text-muted)]"
                      : "text-[var(--text)]"
                  }
                >
                  {st.title}
                </span>
              </label>
              <button
                onClick={() => onDeleteSubtask(st.id)}
                className="opacity-0 group-hover/subtask:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--danger)]"
                title="Delete subtask"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Add Subtask Input */}
          {isAddingSubtask ? (
            <form onSubmit={handleSubtaskSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                autoFocus
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Subtask title... (Enter to save)"
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="rounded-md bg-[var(--primary)] px-2 py-1 text-xs text-white disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSubtask(false)}
                className="rounded-md px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingSubtask(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--primary)] hover:underline pt-0.5"
            >
              <Plus className="h-3 w-3" />
              Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}
