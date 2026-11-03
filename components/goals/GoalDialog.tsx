"use client";

// ============================================================================
// Sahil's Shore: Goal Creation & Edit Dialog Modal
// ============================================================================

import React, { useState, useEffect } from "react";
import type { Goal, CreateGoalInput } from "@/lib/goals";
import { X, Target, Plus, Trash2, Calendar, Layers } from "lucide-react";

interface GoalDialogProps {
  isOpen: boolean;
  goalToEdit: Goal | null;
  onClose: () => void;
  onSave: (input: CreateGoalInput, editId?: string) => Promise<boolean>;
}

const CATEGORIES = ["Career", "Learning", "Health", "Personal", "Financial", "General"];

export function GoalDialog({
  isOpen,
  goalToEdit,
  onClose,
  onSave,
}: GoalDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Career");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<{ title: string; due_date?: string | null }[]>([
    { title: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setCategory(goalToEdit.category || "Career");
      setTargetDate(goalToEdit.target_date || "");
      setMilestones(
        goalToEdit.milestones.length > 0
          ? goalToEdit.milestones.map((m) => ({ title: m.title, due_date: m.due_date }))
          : [{ title: "" }]
      );
    } else {
      setTitle("");
      setCategory("Career");
      setTargetDate("");
      setMilestones([{ title: "" }]);
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddMilestoneRow = () => {
    setMilestones([...milestones, { title: "" }]);
  };

  const handleRemoveMilestoneRow = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const cleanedMilestones = milestones
      .map((m) => ({ title: m.title.trim(), due_date: m.due_date || null }))
      .filter((m) => Boolean(m.title));

    const ok = await onSave(
      {
        title: title.trim(),
        category,
        target_date: targetDate || null,
        milestones: cleanedMilestones,
      },
      goalToEdit?.id
    );

    setIsSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-xl animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-text">
              {goalToEdit ? "Edit Goal" : "Create New Goal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-border p-1.5 text-text-muted hover:bg-surface-muted hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text">Goal Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Get a Full-Stack SDE job by March"
              className="w-full rounded-2xl border border-border bg-surface-muted/30 px-3.5 py-2 text-xs text-text outline-none focus:border-primary focus:bg-surface"
            />
          </div>

          {/* Category & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface-muted/30 px-3 py-2 text-xs text-text outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Target Deadline</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface-muted/30 px-3 py-1.5 text-xs text-text outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Milestones Builder */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text">Milestones</label>
              <button
                type="button"
                onClick={handleAddMilestoneRow}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[idx].title = e.target.value;
                      setMilestones(next);
                    }}
                    placeholder={`Milestone ${idx + 1}...`}
                    className="w-full rounded-xl border border-border bg-surface-muted/30 px-3 py-1.5 text-xs text-text outline-none focus:border-primary"
                  />
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestoneRow(idx)}
                      className="p-1 text-text-muted hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-border px-4 py-2 text-xs font-medium text-text-muted hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="rounded-2xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : goalToEdit ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
