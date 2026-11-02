"use client";

// ============================================================================
// Sahil's Shore: Daily Tracker & Habits Container
// Orchestrates Timer, Habits, Streaks, GitHub Heatmap, and Recharts Analytics
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { TimerWidget } from "./TimerWidget";
import { TargetProgressRings } from "./TargetProgressRings";
import { YearlyHeatmap } from "./YearlyHeatmap";
import { ActivityCharts } from "./ActivityCharts";
import { ManualLogDialog } from "./ManualLogDialog";
import { ActivityManager } from "./ActivityManager";
import { HabitChecklist } from "@/components/habits/HabitChecklist";
import { HabitDialog } from "@/components/habits/HabitDialog";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityLogs,
  logActivityTime,
  calculateActivityStreaks,
  type ActivityStreakInfo,
} from "@/lib/tracker";
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  logHabitDay,
  type HabitWithLogs,
  type CreateHabitInput,
} from "@/lib/habits";
import type { Activity, ActivityLog } from "@/types";
import { Plus, Settings, Clock, Sparkles } from "lucide-react";

export function TrackerContainer() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [habits, setHabits] = useState<HabitWithLogs[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [manualLogOpen, setManualLogOpen] = useState(false);
  const [activityManagerOpen, setActivityManagerOpen] = useState(false);
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithLogs | null>(null);

  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  // Load user data
  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);

        const [acts, logs, habs] = await Promise.all([
          getActivities(supabase, user.id),
          getActivityLogs(supabase, user.id, 500),
          getHabits(supabase, user.id),
        ]);

        setActivities(acts);
        if (acts.length > 0 && !selectedActivityId) {
          setSelectedActivityId(acts[0].id);
        }
        setActivityLogs(logs);
        setHabits(habs);
      }
    } catch (err) {
      console.error("Failed to load tracker data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedActivityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate streaks per activity
  const activityStreaks = useMemo(() => {
    const map: Record<string, ActivityStreakInfo> = {};
    activities.forEach((act) => {
      const actLogs = activityLogs.filter((l) => l.activity_id === act.id);
      map[act.id] = calculateActivityStreaks(
        actLogs,
        act.daily_target_minutes,
        15
      );
    });
    return map;
  }, [activities, activityLogs]);

  // Handler: Log Activity Session (from Timer or Manual Log)
  const handleLogActivitySession = async (
    activityId: string,
    durationSeconds: number,
    notes?: string,
    customDate?: string
  ) => {
    if (!userId) return;

    const act = activities.find((a) => a.id === activityId);
    const actName = act ? act.name : "Activity";
    const minutes = Math.round(durationSeconds / 60);

    // Optimistic log
    const optimisticLog: ActivityLog = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      activity_id: activityId,
      duration_seconds: durationSeconds,
      started_at: customDate
        ? `${customDate}T12:00:00.000Z`
        : new Date().toISOString(),
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActivityLogs((prev) => [optimisticLog, ...prev]);

    toast({
      title: "Session Logged",
      description: `${minutes}m of ${actName}`,
      type: "success",
    });

    try {
      const saved = await logActivityTime(
        supabase,
        userId,
        {
          activity_id: activityId,
          duration_seconds: durationSeconds,
          started_at: optimisticLog.started_at,
          notes: notes || null,
        },
        actName
      );

      if (saved) {
        setActivityLogs((prev) =>
          prev.map((l) => (l.id === optimisticLog.id ? saved : l))
        );
      }
    } catch (err) {
      setActivityLogs((prev) => prev.filter((l) => l.id !== optimisticLog.id));
      toast({ title: "Failed to log session", type: "error" });
    }
  };

  // Activity Manager handlers
  const handleCreateActivity = async (data: {
    name: string;
    color: string;
    daily_target_minutes: number;
  }) => {
    if (!userId) return;
    const created = await createActivity(supabase, userId, data);
    if (created) {
      setActivities((prev) => [...prev, created]);
      setSelectedActivityId(created.id);
      toast({ title: "Activity created", type: "success" });
    }
  };

  const handleUpdateActivity = async (id: string, data: Partial<Activity>) => {
    if (!userId) return;
    const updated = await updateActivity(supabase, userId, id, data);
    if (updated) {
      setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast({ title: "Activity updated", type: "success" });
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!userId) return;
    const ok = await deleteActivity(supabase, userId, id);
    if (ok) {
      setActivities((prev) => prev.filter((a) => a.id !== id));
      if (selectedActivityId === id) {
        setSelectedActivityId(activities.find((a) => a.id !== id)?.id || "");
      }
      toast({ title: "Activity deleted", type: "info" });
    }
  };

  // Habits Handlers
  const handleToggleHabitComplete = async (habit: HabitWithLogs) => {
    if (!userId) return;

    const willBeCompleted = !habit.streakInfo.isCompletedToday;
    const action = willBeCompleted ? "complete" : "clear";

    // Optimistic toggle
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habit.id) return h;
        return {
          ...h,
          streakInfo: {
            ...h.streakInfo,
            isCompletedToday: willBeCompleted,
            isSkippedToday: false,
            currentStreak: willBeCompleted
              ? h.streakInfo.currentStreak + 1
              : Math.max(0, h.streakInfo.currentStreak - 1),
          },
        };
      })
    );

    if (willBeCompleted) {
      toast({
        title: "Habit completed",
        description: habit.title,
        type: "success",
      });
    }

    try {
      await logHabitDay(supabase, userId, habit, undefined, action);
      await loadData();
    } catch (err) {
      toast({ title: "Error updating habit", type: "error" });
      await loadData();
    }
  };

  const handleSkipHabitDay = async (habit: HabitWithLogs, reason?: string) => {
    if (!userId) return;

    // Optimistic skip
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habit.id) return h;
        return {
          ...h,
          streakInfo: {
            ...h.streakInfo,
            isCompletedToday: false,
            isSkippedToday: true,
          },
        };
      })
    );

    toast({
      title: "Habit skipped for today",
      description: "Streak preserved",
      type: "info",
    });

    try {
      await logHabitDay(supabase, userId, habit, undefined, "skip", reason);
      await loadData();
    } catch (err) {
      toast({ title: "Error skipping habit", type: "error" });
      await loadData();
    }
  };

  const handleSaveHabit = async (input: CreateHabitInput) => {
    if (!userId) return;

    if (editingHabit) {
      await updateHabit(supabase, userId, editingHabit.id, input);
      toast({ title: "Habit updated", type: "success" });
    } else {
      await createHabit(supabase, userId, input);
      toast({ title: "Habit created", type: "success" });
    }
    await loadData();
  };

  const handleDeleteHabit = async (habit: HabitWithLogs) => {
    if (!userId) return;
    await deleteHabit(supabase, userId, habit.id);
    setHabits((prev) => prev.filter((h) => h.id !== habit.id));
    toast({ title: "Habit deleted", type: "info" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 animate-pulse rounded-3xl bg-[var(--surface-muted)]/50" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--surface-muted)]/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Daily Tracker & Habits
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Pomodoro focus sessions, habit consistency streaks, and activity analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setManualLogOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors shadow-xs"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Manual Log</span>
          </button>

          <button
            onClick={() => setActivityManagerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors shadow-xs"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Activities</span>
          </button>
        </div>
      </div>

      {/* Timer & Pomodoro Widget (survives browser refresh) */}
      <TimerWidget
        activities={activities}
        selectedActivityId={selectedActivityId}
        onSelectActivity={setSelectedActivityId}
        onLogSession={handleLogActivitySession}
      />

      {/* Target Progress Rings (Today's Progress vs Daily Targets) */}
      <TargetProgressRings
        activities={activities}
        activityStreaks={activityStreaks}
        onSelectActivity={setSelectedActivityId}
        activeActivityId={selectedActivityId}
      />

      {/* Habits Checklist */}
      <HabitChecklist
        habits={habits}
        onToggleComplete={handleToggleHabitComplete}
        onSkipDay={handleSkipHabitDay}
        onEditHabit={(h) => {
          setEditingHabit(h);
          setHabitDialogOpen(true);
        }}
        onDeleteHabit={handleDeleteHabit}
        onOpenCreate={() => {
          setEditingHabit(null);
          setHabitDialogOpen(true);
        }}
      />

      {/* Recharts Focus Time Analytics (Weekly & Monthly Trends) */}
      <ActivityCharts logs={activityLogs} activities={activities} />

      {/* GitHub-Style Yearly Heatmap */}
      <YearlyHeatmap logs={activityLogs} activities={activities} />

      {/* Manual Session Log Dialog */}
      <ManualLogDialog
        open={manualLogOpen}
        onOpenChange={setManualLogOpen}
        activities={activities}
        defaultActivityId={selectedActivityId}
        onLog={async (actId, durSec, date, notes) => {
          await handleLogActivitySession(actId, durSec, notes, date);
        }}
      />

      {/* Activity Manager Dialog */}
      <ActivityManager
        open={activityManagerOpen}
        onOpenChange={setActivityManagerOpen}
        activities={activities}
        onCreateActivity={handleCreateActivity}
        onUpdateActivity={handleUpdateActivity}
        onDeleteActivity={handleDeleteActivity}
      />

      {/* Habit Create / Edit Dialog */}
      <HabitDialog
        open={habitDialogOpen}
        onOpenChange={setHabitDialogOpen}
        habit={editingHabit}
        onSave={handleSaveHabit}
      />
    </div>
  );
}
