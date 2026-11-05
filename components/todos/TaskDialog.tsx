"use client";

// ============================================================================
// Sahil's Shore: Task Create/Edit Modal Dialog
// Full control over priority, recurrence, tags, due date/time, and subtasks
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { TaskWithSubtasks, CreateTaskInput, UpdateTaskInput, RecurrenceRule, TaskPriority } from "@/lib/todos";
import { todayIST } from "@/lib/date-utils";
import { Plus, X, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/select";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithSubtasks | null;
  defaultDate?: string;
  onSave: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { key: "mon", label: "M" },
  { key: "tue", label: "T" },
  { key: "wed", label: "W" },
  { key: "thu", label: "T" },
  { key: "fri", label: "F" },
  { key: "sat", label: "S" },
  { key: "sun", label: "S" },
];

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultDate,
  onSave,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<"daily" | "weekly" | "custom" | "monthly">("daily");
  const [targetDays, setTargetDays] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.due_date || "");
      setDueTime(task.due_time ? task.due_time.substring(0, 5) : "");
      setDurationMinutes(task.duration_minutes || 30);
      setTags(task.tags || []);
      setIsRecurring(task.is_recurring);
      if (task.recurrence_rule) {
        const rule = task.recurrence_rule as unknown as RecurrenceRule;
        setRecurrenceFreq(rule.frequency || "daily");
        setTargetDays(rule.targetDays || []);
      }
      setSubtasks(task.subtasks.map((s) => s.title));
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(defaultDate || todayIST());
      setDueTime("");
      setDurationMinutes(30);
      setTags([]);
      setIsRecurring(false);
      setRecurrenceFreq("daily");
      setTargetDays([]);
      setSubtasks([]);
    }
  }, [task, defaultDate, open]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask("");
    }
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const toggleTargetDay = (dayKey: string) => {
    if (targetDays.includes(dayKey)) {
      setTargetDays(targetDays.filter((d) => d !== dayKey));
    } else {
      setTargetDays([...targetDays, dayKey]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const recurrenceRule: RecurrenceRule | null = isRecurring
        ? {
            frequency: recurrenceFreq,
            targetDays: recurrenceFreq === "custom" ? targetDays : undefined,
            durationMinutes,
          }
        : null;

      const formattedTime = dueTime ? (dueTime.length === 5 ? `${dueTime}:00` : dueTime) : null;

      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        due_time: formattedTime,
        tags,
        is_recurring: isRecurring,
        recurrence_rule: recurrenceRule,
        duration_minutes: durationMinutes,
        subtasks,
      });

      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Title <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Dijkstra algorithm"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none"
            />
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Notes / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add extra context or checklist details..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none"
            />
          </div>

          {/* Priority & Duration Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Priority
              </label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Time Block Duration
              </label>
              <Select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                options={[
                  { value: "15", label: "15 mins" },
                  { value: "30", label: "30 mins" },
                  { value: "45", label: "45 mins" },
                  { value: "60", label: "60 mins (1h)" },
                  { value: "90", label: "90 mins (1.5h)" },
                  { value: "120", label: "120 mins (2h)" },
                ]}
              />
            </div>
          </div>

          {/* Due Date & Due Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Due Date (IST)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Scheduled Time (IST)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="e.g. dsa, spring-boot (Enter to add)"
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="rounded-xl bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text)]"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recurrence Settings */}
          <div className="rounded-xl border border-[var(--border)] p-3 bg-[var(--surface-muted)]/20 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text)]">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded text-[var(--primary)]"
              />
              <span>Recurring Task (Auto-generates next on completion)</span>
            </label>

            {isRecurring && (
              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">Repeats:</span>
                  <Select
                    value={recurrenceFreq}
                    onChange={(e) =>
                      setRecurrenceFreq(e.target.value as "daily" | "weekly" | "custom" | "monthly")
                    }
                    containerClassName="w-48"
                    options={[
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "custom", label: "Specific days of week" },
                      { value: "monthly", label: "Monthly" },
                    ]}
                  />
                </div>

                {recurrenceFreq === "custom" && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {DAYS_OF_WEEK.map((d) => {
                      const selected = targetDays.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => toggleTargetDay(d.key)}
                          className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                            selected
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-muted)]"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subtasks (for new task creation) */}
          {!task && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Subtasks
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a subtask... (Enter to add)"
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="rounded-xl bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text)]"
                >
                  Add
                </button>
              </div>

              {subtasks.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {subtasks.map((st, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-[var(--surface-muted)]/50 px-2.5 py-1 text-xs text-[var(--text)]"
                    >
                      <span>{st}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(i)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSaving}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : task ? "Update Task" : "Create Task"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
