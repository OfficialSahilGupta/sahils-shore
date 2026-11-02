"use client";

// ============================================================================
// Sahil's Shore: Mini Activity Focus Chart Widget
// Recharts bar chart showing focus minutes for the past 7 days (Mon-Sun IST)
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getActivities, getActivityLogs, generateWeeklyChartData } from "@/lib/tracker";
import { getISTWeekDays, todayIST } from "@/lib/date-utils";
import type { WidgetId } from "@/lib/dashboard/types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Activity as ActivityIcon, ArrowRight, BarChart2 } from "lucide-react";

interface ActivityChartWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

export function ActivityChartWidget({ isEditMode, onRemove }: ActivityChartWidgetProps) {
  const [chartData, setChartData] = useState<{ day: string; minutes: number }[]>([]);
  const [weekTotalMinutes, setWeekTotalMinutes] = useState(0);

  const loadChartData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      const uid = data.user.id;
      const acts = await getActivities(supabase, uid);

      // Aggregate all activity logs
      let allLogs: any[] = [];
      for (const a of acts) {
        try {
          const l = await getActivityLogs(supabase, a.id);
          allLogs = allLogs.concat(l);
        } catch {}
      }

      const weekDays = getISTWeekDays(todayIST());
      const formatted = weekDays.map((w) => {
        const dayLogs = allLogs.filter((l) => {
          const logDate = l.logged_at ? l.logged_at.split("T")[0] : "";
          return logDate === w.date;
        });
        const mins = dayLogs.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
        return {
          day: w.dayShort,
          minutes: mins,
        };
      });

      setChartData(formatted);
      const total = formatted.reduce((sum, f) => sum + f.minutes, 0);
      setWeekTotalMinutes(total);
    } catch (e) {
      console.warn("Failed loading activity chart:", e);
    }
  }, []);

  useEffect(() => {
    loadChartData();

    const handleUpdate = () => loadChartData();
    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadChartData]);

  const hours = Math.floor(weekTotalMinutes / 60);
  const remainingMins = weekTotalMinutes % 60;

  return (
    <WidgetContainer
      id="activity_chart"
      title="Mini Activity Chart"
      icon={BarChart2}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <span className="text-[11px] font-bold text-primary">
          {hours > 0 ? `${hours}h ${remainingMins}m` : `${weekTotalMinutes}m`} this week
        </span>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-2">
        <div className="h-32 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-1.5 rounded-lg border border-border bg-surface shadow-xs text-[11px]">
                        <span className="font-bold text-primary">
                          {payload[0].value} mins
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="minutes" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Weekly study time</span>
          <Link href="/tracker" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Analytics</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
