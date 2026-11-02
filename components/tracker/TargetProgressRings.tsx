"use client";

// ============================================================================
// Sahil's Shore: Target Progress Rings
// Per-activity today target progress rings with streaks and status indicators
// ============================================================================

import React from "react";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Flame, CheckCircle2 } from "lucide-react";
import type { Activity } from "@/types";
import type { ActivityStreakInfo } from "@/lib/tracker";

interface TargetProgressRingsProps {
  activities: Activity[];
  activityStreaks: Record<string, ActivityStreakInfo>;
  onSelectActivity: (activityId: string) => void;
  activeActivityId: string;
}

export function TargetProgressRings({
  activities,
  activityStreaks,
  onSelectActivity,
  activeActivityId,
}: TargetProgressRingsProps) {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {activities.map((activity) => {
        const streakInfo = activityStreaks[activity.id] || {
          currentStreak: 0,
          bestStreak: 0,
          todayLoggedMinutes: 0,
          totalMinutes: 0,
          hasMetTodayTarget: false,
        };

        const target = activity.daily_target_minutes || 0;
        const logged = streakInfo.todayLoggedMinutes;
        const percentage =
          target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : logged > 0 ? 100 : 0;

        const isSelected = activity.id === activeActivityId;

        return (
          <div
            key={activity.id}
            onClick={() => onSelectActivity(activity.id)}
            className={`w-full h-full flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
              isSelected
                ? "border-[var(--primary)] bg-[var(--primary-soft)]/20 shadow-sm"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50"
            }`}
          >
            <CircularProgress
              value={percentage}
              size={54}
              strokeWidth={5}
              strokeColor={activity.color || "var(--primary)"}
            >
              {streakInfo.hasMetTodayTarget ? (
                <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
              ) : (
                <span className="text-[11px] font-bold font-mono text-[var(--text)]">
                  {percentage}%
                </span>
              )}
            </CircularProgress>

            <span className="text-xs font-semibold text-[var(--text)] mt-2 text-center truncate max-w-[110px]">
              {activity.name}
            </span>

            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              {logged}/{target}m
            </span>

            {/* Streak count */}
            <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-[var(--text-muted)]">
              <Flame
                className={`h-3 w-3 ${
                  streakInfo.currentStreak > 0
                    ? "text-[var(--warning)] fill-[var(--warning)]"
                    : "text-[var(--text-muted)]"
                }`}
              />
              <span>{streakInfo.currentStreak}d streak</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
