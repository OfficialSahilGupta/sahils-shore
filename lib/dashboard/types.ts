// ============================================================================
// Sahil's Shore: Dashboard Types & Layout Definitions
// ============================================================================

import type { Layout, ResponsiveLayouts } from "react-grid-layout";

export type WidgetId =
  | "greeting"
  | "priorities"
  | "tasks"
  | "habits"
  | "timer"
  | "streaks"
  | "spending"
  | "meals"
  | "activity_chart"
  | "quick_note"
  | "timeline";

export type WidgetCategory = "core" | "growth" | "life" | "insights";

export interface WidgetMeta {
  id: WidgetId;
  title: string;
  description: string;
  category: WidgetCategory;
  defaultSize: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
}

export interface SettingsDashboardLayout {
  sidebar_collapsed?: boolean;
  activeWidgets: WidgetId[];
  layouts: ResponsiveLayouts;
  pinnedPriorities: string[];
}
