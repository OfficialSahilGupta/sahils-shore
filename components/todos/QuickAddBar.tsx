"use client";

// ============================================================================
// Sahil's Shore: Quick Add Bar with Live Natural Language Parsing
// e.g. "revise graphs tomorrow 7pm !high #dsa"
// ============================================================================

import React, { useState, useMemo } from "react";
import { Plus, Calendar, Clock, AlertCircle, Hash, Sparkles } from "lucide-react";
import { parseNaturalLanguageTask, type CreateTaskInput } from "@/lib/todos";
import { formatFriendlyISTDate, formatISTTime } from "@/lib/date-utils";

interface QuickAddBarProps {
  onAddTask: (input: CreateTaskInput) => Promise<void>;
  placeholder?: string;
  defaultDate?: string;
}

export function QuickAddBar({
  onAddTask,
  placeholder = "Quick add: 'revise graphs tomorrow 7pm !high #dsa' (Press Enter)",
  defaultDate,
}: QuickAddBarProps) {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live parsed preview
  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    return parseNaturalLanguageTask(input, defaultDate);
  }, [input, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    const taskData = parseNaturalLanguageTask(input, defaultDate);
    setIsSubmitting(true);
    try {
      await onAddTask({
        title: taskData.title,
        priority: taskData.priority,
        due_date: taskData.dueDate,
        due_time: taskData.dueTime,
        tags: taskData.tags,
        is_recurring: taskData.isRecurring,
        recurrence_rule: taskData.recurrenceRule,
        duration_minutes: taskData.durationMinutes,
      });
      setInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="group relative flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-sm transition-all focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-1 py-1 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="flex items-center gap-1 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Live Token Parsing Preview */}
        {parsed && input.trim().length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-[var(--border)]/50">
            <span className="text-[var(--text-muted)] text-[11px] font-medium mr-1">
              Parsed:
            </span>

            {/* Title preview */}
            <span className="font-semibold text-[var(--text)]">
              &quot;{parsed.title}&quot;
            </span>

            {/* Due Date preview */}
            {parsed.dueDate && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--primary-soft)] px-2 py-0.5 text-[var(--primary)] font-medium">
                <Calendar className="h-3 w-3" />
                {formatFriendlyISTDate(parsed.dueDate)}
              </span>
            )}

            {/* Due Time preview */}
            {parsed.dueTime && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[var(--text)] font-medium">
                <Clock className="h-3 w-3" />
                {formatISTTime(parsed.dueTime)}
              </span>
            )}

            {/* Priority preview */}
            {parsed.priority && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${
                  parsed.priority === "urgent"
                    ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                    : parsed.priority === "high"
                    ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                    : parsed.priority === "medium"
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                {parsed.priority.toUpperCase()}
              </span>
            )}

            {/* Tags preview */}
            {parsed.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[var(--text-muted)] font-mono text-[11px]"
              >
                <Hash className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
