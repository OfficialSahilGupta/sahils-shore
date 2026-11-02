// ============================================================================
// Sahil's Shore: Dashboard Layout Service
// Manages responsive grid layouts, widget metadata, and persistence to settings.layout
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.ts";
import type { Layout, LayoutItem, ResponsiveLayouts } from "react-grid-layout";
import type { WidgetId, WidgetMeta, SettingsDashboardLayout } from "./types.ts";

export const ALL_WIDGET_IDS: WidgetId[] = [
  "greeting",
  "priorities",
  "spending",
  "meals",
  "tasks",
  "habits",
  "timer",
  "timeline",
  "streaks",
  "activity_chart",
  "quick_note",
];

export const ALL_WIDGET_METAS: WidgetMeta[] = [
  {
    id: "greeting",
    title: "Greeting & Horizon",
    description: "Time-aware greeting, IST date, and calm quote of the day.",
    category: "core",
    defaultSize: { w: 12, h: 2, minW: 6, minH: 2 },
  },
  {
    id: "priorities",
    title: "Top 3 Priorities",
    description: "Focus on your 3 highest-leverage tasks pinned for today.",
    category: "core",
    defaultSize: { w: 6, h: 4, minW: 4, minH: 3 },
  },
  {
    id: "spending",
    title: "Today's Spend & Budget",
    description: "Paise-accurate INR spend and remaining monthly budget.",
    category: "life",
    defaultSize: { w: 3, h: 4, minW: 3, minH: 3 },
  },
  {
    id: "meals",
    title: "Meals Logged",
    description: "Breakfast, lunch, snacks, and dinner logs with ratings.",
    category: "life",
    defaultSize: { w: 3, h: 4, minW: 3, minH: 3 },
  },
  {
    id: "tasks",
    title: "Today's Tasks",
    description: "Pending tasks due today with quick inline addition.",
    category: "core",
    defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
  },
  {
    id: "habits",
    title: "Habit Checklist",
    description: "Daily habits, flame streaks, and quick completion checks.",
    category: "growth",
    defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
  },
  {
    id: "timer",
    title: "Focus Timer",
    description: "Integrated Pomodoro and stopwatch with activity tracking.",
    category: "growth",
    defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
  },
  {
    id: "timeline",
    title: "Unified Timeline",
    description: "Chronological vertical feed of today's trackable actions.",
    category: "core",
    defaultSize: { w: 7, h: 6, minW: 4, minH: 4 },
  },
  {
    id: "streaks",
    title: "Active Streaks",
    description: "Consistency leaderboard across habits and learning tracks.",
    category: "growth",
    defaultSize: { w: 5, h: 3, minW: 3, minH: 2 },
  },
  {
    id: "activity_chart",
    title: "Mini Activity Chart",
    description: "Visual breakdown of study and focus time throughout the week.",
    category: "insights",
    defaultSize: { w: 5, h: 3, minW: 3, minH: 3 },
  },
  {
    id: "quick_note",
    title: "Quick Note",
    description: "Instant scratchpad for thoughts, snippets, and ideas.",
    category: "life",
    defaultSize: { w: 5, h: 3, minW: 3, minH: 2 },
  },
];

export function getDefaultLayouts(): ResponsiveLayouts {
  const lg: Layout = [
    { i: "greeting", x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
    { i: "priorities", x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
    { i: "spending", x: 6, y: 2, w: 3, h: 4, minW: 3, minH: 3 },
    { i: "meals", x: 9, y: 2, w: 3, h: 4, minW: 3, minH: 3 },
    { i: "tasks", x: 0, y: 6, w: 4, h: 5, minW: 3, minH: 4 },
    { i: "habits", x: 4, y: 6, w: 4, h: 5, minW: 3, minH: 4 },
    { i: "timer", x: 8, y: 6, w: 4, h: 5, minW: 3, minH: 4 },
    { i: "timeline", x: 0, y: 11, w: 7, h: 6, minW: 4, minH: 4 },
    { i: "streaks", x: 7, y: 11, w: 5, h: 3, minW: 3, minH: 2 },
    { i: "activity_chart", x: 7, y: 14, w: 5, h: 3, minW: 3, minH: 3 },
    { i: "quick_note", x: 7, y: 17, w: 5, h: 3, minW: 3, minH: 2 },
  ];

  const md: Layout = [
    { i: "greeting", x: 0, y: 0, w: 10, h: 2, minW: 6, minH: 2 },
    { i: "priorities", x: 0, y: 2, w: 5, h: 4, minW: 3, minH: 3 },
    { i: "spending", x: 5, y: 2, w: 5, h: 4, minW: 3, minH: 3 },
    { i: "meals", x: 0, y: 6, w: 5, h: 4, minW: 3, minH: 3 },
    { i: "timer", x: 5, y: 6, w: 5, h: 4, minW: 3, minH: 3 },
    { i: "tasks", x: 0, y: 10, w: 5, h: 5, minW: 3, minH: 4 },
    { i: "habits", x: 5, y: 10, w: 5, h: 5, minW: 3, minH: 4 },
    { i: "timeline", x: 0, y: 15, w: 6, h: 6, minW: 4, minH: 4 },
    { i: "streaks", x: 6, y: 15, w: 4, h: 3, minW: 3, minH: 2 },
    { i: "activity_chart", x: 6, y: 18, w: 4, h: 3, minW: 3, minH: 3 },
    { i: "quick_note", x: 0, y: 21, w: 10, h: 3, minW: 3, minH: 2 },
  ];

  const sm: Layout = [
    { i: "greeting", x: 0, y: 0, w: 6, h: 2 },
    { i: "priorities", x: 0, y: 2, w: 6, h: 4 },
    { i: "spending", x: 0, y: 6, w: 3, h: 4 },
    { i: "meals", x: 3, y: 6, w: 3, h: 4 },
    { i: "tasks", x: 0, y: 10, w: 6, h: 5 },
    { i: "habits", x: 0, y: 15, w: 6, h: 5 },
    { i: "timer", x: 0, y: 20, w: 6, h: 5 },
    { i: "timeline", x: 0, y: 25, w: 6, h: 6 },
    { i: "streaks", x: 0, y: 31, w: 6, h: 3 },
    { i: "activity_chart", x: 0, y: 34, w: 6, h: 3 },
    { i: "quick_note", x: 0, y: 37, w: 6, h: 3 },
  ];

  const xs: Layout = [
    { i: "greeting", x: 0, y: 0, w: 4, h: 3 },
    { i: "priorities", x: 0, y: 3, w: 4, h: 4 },
    { i: "spending", x: 0, y: 7, w: 2, h: 4 },
    { i: "meals", x: 2, y: 7, w: 2, h: 4 },
    { i: "tasks", x: 0, y: 11, w: 4, h: 5 },
    { i: "habits", x: 0, y: 16, w: 4, h: 5 },
    { i: "timer", x: 0, y: 21, w: 4, h: 5 },
    { i: "timeline", x: 0, y: 26, w: 4, h: 6 },
    { i: "streaks", x: 0, y: 32, w: 4, h: 3 },
    { i: "activity_chart", x: 0, y: 35, w: 4, h: 3 },
    { i: "quick_note", x: 0, y: 38, w: 4, h: 3 },
  ];

  const xxs: Layout = [
    { i: "greeting", x: 0, y: 0, w: 2, h: 3 },
    { i: "priorities", x: 0, y: 3, w: 2, h: 4 },
    { i: "spending", x: 0, y: 7, w: 2, h: 4 },
    { i: "meals", x: 0, y: 11, w: 2, h: 4 },
    { i: "tasks", x: 0, y: 15, w: 2, h: 5 },
    { i: "habits", x: 0, y: 20, w: 2, h: 5 },
    { i: "timer", x: 0, y: 25, w: 2, h: 5 },
    { i: "timeline", x: 0, y: 30, w: 2, h: 6 },
    { i: "streaks", x: 0, y: 36, w: 2, h: 3 },
    { i: "activity_chart", x: 0, y: 39, w: 2, h: 3 },
    { i: "quick_note", x: 0, y: 42, w: 2, h: 3 },
  ];

  return { lg, md, sm, xs, xxs };
}

const STORAGE_KEY = "shore_dashboard_layout_v1";

/**
 * Loads dashboard layout from localStorage and Supabase settings table.
 */
export async function loadDashboardLayout(
  supabase?: SupabaseClient<Database> | null,
  userId?: string | null
): Promise<SettingsDashboardLayout> {
  const defaults: SettingsDashboardLayout = {
    activeWidgets: [...ALL_WIDGET_IDS],
    layouts: getDefaultLayouts(),
    pinnedPriorities: [],
  };

  // 1. Try local cache first for zero-delay hydration
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local) as SettingsDashboardLayout;
        if (parsed && parsed.layouts) {
          defaults.layouts = { ...defaults.layouts, ...parsed.layouts };
          if (Array.isArray(parsed.activeWidgets)) {
            defaults.activeWidgets = parsed.activeWidgets;
          }
          if (Array.isArray(parsed.pinnedPriorities)) {
            defaults.pinnedPriorities = parsed.pinnedPriorities;
          }
        }
      }
    } catch {}
  }

  // 2. Fetch from Supabase if authenticated
  if (supabase && userId) {
    try {
      const { data } = await supabase
        .from("settings")
        .select("layout")
        .eq("user_id", userId)
        .single();

      if (data?.layout && typeof data.layout === "object") {
        const remote = data.layout as unknown as Partial<SettingsDashboardLayout>;
        if (remote.layouts) {
          defaults.layouts = { ...defaults.layouts, ...remote.layouts };
        }
        if (Array.isArray(remote.activeWidgets)) {
          defaults.activeWidgets = remote.activeWidgets as WidgetId[];
        }
        if (Array.isArray(remote.pinnedPriorities)) {
          defaults.pinnedPriorities = remote.pinnedPriorities;
        }

        // Cache back to localStorage
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
          } catch {}
        }
      }
    } catch (err) {
      console.warn("[loadDashboardLayout] Remote fetch failed:", err);
    }
  }

  return defaults;
}

/**
 * Persists dashboard layout to localStorage and Supabase settings.layout.
 */
export async function saveDashboardLayout(
  config: SettingsDashboardLayout,
  supabase?: SupabaseClient<Database> | null,
  userId?: string | null
): Promise<boolean> {
  // 1. Save locally
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error("[saveDashboardLayout] LocalStorage error:", e);
    }
  }

  // 2. Save remotely if user is logged in
  if (supabase && userId) {
    try {
      const { error } = await supabase
        .from("settings")
        .update({
          layout: config as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[saveDashboardLayout] Remote update failed:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[saveDashboardLayout] Unexpected error:", err);
      return false;
    }
  }

  return true;
}
