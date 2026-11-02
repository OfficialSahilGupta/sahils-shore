"use client";

// ============================================================================
// Sahil's Shore: Active Streaks Leaderboard Widget
// Streaks across activities (DSA, Spring Boot, German) and active habits
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getActivities, getActivityLogs, calculateActivityStreaks } from "@/lib/tracker";
import { getHabits } from "@/lib/habits";
import type { WidgetId } from "@/lib/dashboard/types";
import { Flame, ArrowRight, Zap, Trophy } from "lucide-react";

interface StreaksWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

interface StreakItem {
  title: string;
  streak: number;
  type: "activity" | "habit";
  color?: string;
}

export function StreaksWidget({ isEditMode, onRemove }: StreaksWidgetProps) {
  const [streaks, setStreaks] = useState<StreakItem[]>([]);

  const loadStreaks = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      const uid = data.user.id;
      const [acts, habits] = await Promise.all([
        getActivities(supabase, uid),
        getHabits(supabase, uid),
      ]);

      const items: StreakItem[] = [];

      // 1. Habit streaks
      for (const h of habits.filter((h) => h.is_active)) {
        items.push({
          title: h.title,
          streak: h.streakInfo?.currentStreak ?? h.current_streak ?? 0,
          type: "habit",
          color: h.color || undefined,
        });
      }

      // 2. Activity streaks (if logs exist)
      for (const a of acts.slice(0, 4)) {
        try {
          const logs = await getActivityLogs(supabase, a.id);
          const st = calculateActivityStreaks(logs, a.daily_target_minutes || 15);
          items.push({
            title: a.name,
            streak: st.currentStreak,
            type: "activity",
            color: a.color || undefined,
          });
        } catch {}
      }

      // Sort by streak descending
      items.sort((a, b) => b.streak - a.streak);
      setStreaks(items);
    } catch (e) {
      console.warn("Failed loading streaks:", e);
    }
  }, []);

  useEffect(() => {
    loadStreaks();

    const handleUpdate = () => loadStreaks();
    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadStreaks]);

  return (
    <WidgetContainer
      id="streaks"
      title="Active Streaks"
      icon={Flame}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <div className="flex items-center gap-1 text-[11px] font-bold text-orange-500">
          <Trophy className="w-3.5 h-3.5" />
          <span>Consistency</span>
        </div>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-2">
        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-36 pr-0.5">
          {streaks.length === 0 ? (
            <div className="py-4 text-center text-xs text-text-muted">
              No active streaks logged yet. Keep showing up daily!
            </div>
          ) : (
            streaks.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl border border-border/70 bg-surface text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1 rounded bg-orange-500/10 text-orange-500 shrink-0">
                    {s.type === "habit" ? (
                      <Zap className="w-3 h-3" />
                    ) : (
                      <Flame className="w-3 h-3" />
                    )}
                  </span>
                  <span className="font-semibold text-text truncate">{s.title}</span>
                </div>

                <div className="flex items-center gap-1 font-bold text-orange-500 font-mono text-xs shrink-0">
                  <span>{s.streak}</span>
                  <span className="text-[10px] font-normal text-text-muted">days</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Never miss twice</span>
          <Link href="/tracker" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Heatmap</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
