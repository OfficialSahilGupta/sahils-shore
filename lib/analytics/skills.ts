// ============================================================================
// Sahil's Shore: Skills & Focus Analytics Engine
// Time per skill (DSA, Spring Boot, MERN, German), trends, and 24x7 IST heatmap
// ============================================================================

import type {
  SkillTimeSummary,
  DailySkillTrend,
  FocusHeatmapCell,
  SkillStreak,
} from "./types";
import { utcToZonedDate } from "../date-utils.ts";

export interface RawActivityLog {
  id: string;
  activity_id: string;
  duration_minutes: number;
  started_at: string; // UTC ISO
  notes?: string | null;
  activity_name?: string;
}

export interface RawActivity {
  id: string;
  name: string;
  target_minutes?: number;
  color?: string | null;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Normalizes activity names into standardized skill buckets.
 */
export function normalizeSkillName(rawName: string): "DSA" | "SpringBoot" | "MERN" | "German" | "Other" {
  const lower = rawName.toLowerCase();
  if (lower.includes("dsa") || lower.includes("leetcode") || lower.includes("algorithm")) {
    return "DSA";
  }
  if (lower.includes("spring") || lower.includes("java") || lower.includes("hibernate")) {
    return "SpringBoot";
  }
  if (
    lower.includes("mern") ||
    lower.includes("react") ||
    lower.includes("node") ||
    lower.includes("express") ||
    lower.includes("mongo") ||
    lower.includes("next")
  ) {
    return "MERN";
  }
  if (lower.includes("german") || lower.includes("deutsch")) {
    return "German";
  }
  return "Other";
}

const SKILL_COLORS: Record<string, string> = {
  DSA: "#1F7A8C",        // Deep sea teal
  SpringBoot: "#E0A458", // Warm sunset
  MERN: "#4FB3C8",       // Bright turquoise
  German: "#2E9E6B",     // Emerald forest
  Other: "#8FA3B0",      // Slate
};

const DISPLAY_NAMES: Record<string, string> = {
  DSA: "DSA & Problem Solving",
  SpringBoot: "Java & Spring Boot",
  MERN: "MERN & Next.js",
  German: "German Language",
  Other: "Other Focus / Life",
};

/**
 * Computes skill breakdown percentages and total focus time.
 */
export function computeSkillBreakdown(logs: RawActivityLog[]): {
  breakdown: SkillTimeSummary[];
  totalFocusMinutes: number;
} {
  const minutesMap: Record<string, { minutes: number; count: number }> = {
    DSA: { minutes: 0, count: 0 },
    SpringBoot: { minutes: 0, count: 0 },
    MERN: { minutes: 0, count: 0 },
    German: { minutes: 0, count: 0 },
    Other: { minutes: 0, count: 0 },
  };

  let totalFocusMinutes = 0;

  for (const log of logs) {
    const mins = Math.max(0, log.duration_minutes || 0);
    const category = normalizeSkillName(log.activity_name || "Other");
    minutesMap[category].minutes += mins;
    minutesMap[category].count += 1;
    totalFocusMinutes += mins;
  }

  const breakdown: SkillTimeSummary[] = (["DSA", "SpringBoot", "MERN", "German", "Other"] as const).map(
    (key) => {
      const mins = minutesMap[key].minutes;
      const pct = totalFocusMinutes > 0 ? Math.round((mins / totalFocusMinutes) * 100) : 0;
      return {
        skill: DISPLAY_NAMES[key],
        minutes: mins,
        hours: Math.round((mins / 60) * 10) / 10,
        percentage: pct,
        color: SKILL_COLORS[key],
        sessionsCount: minutesMap[key].count,
      };
    }
  );

  return { breakdown, totalFocusMinutes };
}

/**
 * Builds daily skill focus trend for time-series charts.
 */
export function computeDailySkillTrends(
  logs: RawActivityLog[],
  dateList: string[]
): DailySkillTrend[] {
  const map: Record<string, { DSA: number; SpringBoot: number; MERN: number; German: number; Other: number }> = {};

  for (const d of dateList) {
    map[d] = { DSA: 0, SpringBoot: 0, MERN: 0, German: 0, Other: 0 };
  }

  for (const log of logs) {
    if (!log.started_at) continue;
    // Determine IST date
    const istDate = utcToZonedDate(log.started_at);
    const dateStr = istDate.toISOString().slice(0, 10);
    if (!map[dateStr]) {
      map[dateStr] = { DSA: 0, SpringBoot: 0, MERN: 0, German: 0, Other: 0 };
    }
    const cat = normalizeSkillName(log.activity_name || "Other");
    map[dateStr][cat] += Math.max(0, log.duration_minutes || 0);
  }

  return dateList.map((d) => {
    const data = map[d] || { DSA: 0, SpringBoot: 0, MERN: 0, German: 0, Other: 0 };
    const total = data.DSA + data.SpringBoot + data.MERN + data.German + data.Other;
    return {
      date: d,
      DSA: data.DSA,
      SpringBoot: data.SpringBoot,
      MERN: data.MERN,
      German: data.German,
      Other: data.Other,
      total,
    };
  });
}

/**
 * Generates a 24-hour x 7-weekday heatmap grid based on IST timestamps.
 */
export function computeFocusHoursHeatmap(logs: RawActivityLog[]): FocusHeatmapCell[] {
  // 7 days (0=Sun .. 6=Sat) x 24 hours (0..23)
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const log of logs) {
    if (!log.started_at || !log.duration_minutes) continue;
    const istDate = utcToZonedDate(log.started_at);
    const weekday = istDate.getUTCDay(); // using zoned date's day
    const hour = istDate.getUTCHours();  // using zoned date's hour
    const mins = Math.max(0, log.duration_minutes);

    if (weekday >= 0 && weekday < 7 && hour >= 0 && hour < 24) {
      matrix[weekday][hour] += mins;
    }
  }

  // Find max minutes in any single cell for intensity scaling
  let maxCellMinutes = 0;
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      if (matrix[w][h] > maxCellMinutes) {
        maxCellMinutes = matrix[w][h];
      }
    }
  }

  const cells: FocusHeatmapCell[] = [];
  // Order weekdays: Monday (1) through Sunday (0)
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

  for (const w of weekdayOrder) {
    for (let h = 0; h < 24; h++) {
      const minutes = matrix[w][h];
      let intensity = 0;
      if (minutes > 0) {
        if (minutes < 20) intensity = 1;
        else if (minutes < 45) intensity = 2;
        else if (minutes < 90) intensity = 3;
        else intensity = 4;
      }
      cells.push({
        weekdayIndex: w,
        weekdayName: WEEKDAY_NAMES[w],
        hour: h,
        minutes,
        intensity,
      });
    }
  }

  return cells;
}

/**
 * Calculates current and longest streak per activity from raw logs.
 */
export function computeSkillStreaks(
  activities: RawActivity[],
  logs: RawActivityLog[],
  todayISTDate: string
): SkillStreak[] {
  return activities.map((act) => {
    const actLogs = logs.filter((l) => l.activity_id === act.id);
    const activeDates = new Set<string>();

    let totalMinutes = 0;
    for (const l of actLogs) {
      if (!l.started_at) continue;
      const istDate = utcToZonedDate(l.started_at).toISOString().slice(0, 10);
      activeDates.add(istDate);
      totalMinutes += Math.max(0, l.duration_minutes || 0);
    }

    const sortedDates = Array.from(activeDates).sort().reverse();
    const lastActiveDate = sortedDates.length > 0 ? sortedDates[0] : null;

    // Current streak calculation
    let currentStreak = 0;
    const checkDate = new Date(`${todayISTDate}T00:00:00Z`);

    // Check if active today
    if (activeDates.has(todayISTDate)) {
      currentStreak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      // Check yesterday
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      const yesterdayStr = checkDate.toISOString().slice(0, 10);
      if (!activeDates.has(yesterdayStr)) {
        currentStreak = 0;
      }
    }

    if (currentStreak > 0 || activeDates.has(checkDate.toISOString().slice(0, 10))) {
      while (true) {
        const dStr = checkDate.toISOString().slice(0, 10);
        if (activeDates.has(dStr)) {
          if (!activeDates.has(todayISTDate) && currentStreak === 0) {
            currentStreak = 1;
          } else if (activeDates.has(todayISTDate)) {
            currentStreak++;
          }
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const allSortedAsc = Array.from(activeDates).sort();

    for (let i = 0; i < allSortedAsc.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(`${allSortedAsc[i - 1]}T00:00:00Z`);
        const curr = new Date(`${allSortedAsc[i]}T00:00:00Z`);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    return {
      name: act.name,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalMinutes,
      lastActiveDate,
    };
  });
}
