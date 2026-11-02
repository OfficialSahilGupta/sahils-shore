"use client";

// ============================================================================
// Sahil's Shore: Activity Manager Modal
// Manage customizable activities (DSA, Spring Boot, MERN, German, Gym, Reading...)
// ============================================================================

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Activity } from "@/types";
import { Plus, Edit2, Trash2, Check } from "lucide-react";

interface ActivityManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  onCreateActivity: (data: { name: string; color: string; daily_target_minutes: number }) => Promise<void>;
  onUpdateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  onDeleteActivity: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  "#1F7A8C", // Shore teal
  "#E0A458", // Warm sand
  "#2E9E6B", // Success green
  "#D1495B", // Rose / danger
  "#8E44AD", // Purple
  "#3498DB", // Sky blue
  "#E67E22", // Sunset orange
  "#34495E", // Midnight slate
];

export function ActivityManager({
  open,
  onOpenChange,
  activities,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
}: ActivityManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setName(activity.name);
    setColor(activity.color || PRESET_COLORS[0]);
    setDailyTargetMinutes(activity.daily_target_minutes || 60);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setDailyTargetMinutes(60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateActivity(editingId, {
          name: name.trim(),
          color,
          daily_target_minutes: dailyTargetMinutes,
        });
      } else {
        await onCreateActivity({
          name: name.trim(),
          color,
          daily_target_minutes: dailyTargetMinutes,
        });
      }
      cancelEdit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Activities</DialogTitle>
        </DialogHeader>

        {/* Existing Activities List */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Current Activities
          </label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {activities.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: a.color || "var(--primary)" }}
                  />
                  <span className="font-semibold text-[var(--text)] truncate">
                    {a.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {a.daily_target_minutes}m target
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteActivity(a.id)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add or Edit Activity Form */}
        <form onSubmit={handleSubmit} className="border-t border-[var(--border)] pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-[var(--text)]">
            {editingId ? "Edit Activity" : "Add New Activity"}
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. System Design"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1">
                Daily Target (mins)
              </label>
              <input
                type="number"
                min={0}
                max={1440}
                value={dailyTargetMinutes}
                onChange={(e) => setDailyTargetMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1.5">
              Accent Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{editingId ? "Save Changes" : "Add Activity"}</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
