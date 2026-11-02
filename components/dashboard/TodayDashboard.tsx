"use client";

// ============================================================================
// Sahil's Shore: Today Dashboard Container
// Drag-and-drop, resizable responsive widget grid powered by react-grid-layout
// Breakpoints for Desktop (lg), Laptop (md), Tablet (sm), and Mobile (xs, xxs)
// Edit layout mode with widget library, resize handles, and settings persistence
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ResponsiveGridLayout, useContainerWidth, Layout, ResponsiveLayouts } from "react-grid-layout";
import { createClient } from "@/lib/supabase/client";
import {
  ALL_WIDGET_IDS,
  ALL_WIDGET_METAS,
  getDefaultLayouts,
  loadDashboardLayout,
  saveDashboardLayout,
} from "@/lib/dashboard/layout-service";
import type { WidgetId, SettingsDashboardLayout } from "@/lib/dashboard/types";
import { todayIST } from "@/lib/date-utils";
import { useQuickCapture } from "@/lib/quick-capture/QuickCaptureContext";
import { useToast } from "@/components/ui/toast";

// Widgets
import { GreetingWidget } from "./widgets/GreetingWidget";
import { PrioritiesWidget } from "./widgets/PrioritiesWidget";
import { SpendingWidget } from "./widgets/SpendingWidget";
import { MealsWidget } from "./widgets/MealsWidget";
import { TasksWidget } from "./widgets/TasksWidget";
import { HabitsWidget } from "./widgets/HabitsWidget";
import { FocusTimerWidget } from "./widgets/FocusTimerWidget";
import { TimelineWidget } from "./widgets/TimelineWidget";
import { StreaksWidget } from "./widgets/StreaksWidget";
import { ActivityChartWidget } from "./widgets/ActivityChartWidget";
import { QuickNoteWidget } from "./widgets/QuickNoteWidget";
import { WidgetLibraryModal } from "./WidgetLibraryModal";

import {
  SlidersHorizontal,
  Check,
  RotateCcw,
  Plus,
  Compass,
  Calendar,
  Sparkles,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";

export function TodayDashboard() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(getDefaultLayouts());
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>([...ALL_WIDGET_IDS]);
  const [pinnedPriorities, setPinnedPriorities] = useState<string[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { open: openQuickCapture } = useQuickCapture();
  const { toast } = useToast();

  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
    initialWidth: 1200,
  });

  // Load layout configuration from storage & Supabase
  const loadConfig = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id || null;
      setUserId(uid);

      const config = await loadDashboardLayout(supabase, uid);
      if (config.layouts) setLayouts(config.layouts);
      if (config.activeWidgets && config.activeWidgets.length > 0) {
        setActiveWidgets(config.activeWidgets);
      }
      if (config.pinnedPriorities) {
        setPinnedPriorities(config.pinnedPriorities);
      }
    } catch (e) {
      console.warn("Error loading dashboard layout:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Persist layout changes
  const persistLayout = useCallback(
    async (
      newLayouts: ResponsiveLayouts,
      newActive: WidgetId[],
      newPins: string[]
    ) => {
      try {
        const supabase = createClient();
        const config: SettingsDashboardLayout = {
          activeWidgets: newActive,
          layouts: newLayouts,
          pinnedPriorities: newPins,
        };
        await saveDashboardLayout(config, supabase, userId);
      } catch (err) {
        console.warn("Failed saving layout:", err);
      }
    },
    [userId]
  );

  const handleLayoutChange = (currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
    setLayouts(allLayouts);
    if (isEditMode) {
      persistLayout(allLayouts, activeWidgets, pinnedPriorities);
    }
  };

  const handleRemoveWidget = (id: WidgetId) => {
    const updated = activeWidgets.filter((w) => w !== id);
    setActiveWidgets(updated);
    persistLayout(layouts, updated, pinnedPriorities);
    toast({ title: "Widget hidden", description: "You can re-add it anytime from the library." });
  };

  const handleAddWidget = (id: WidgetId) => {
    if (activeWidgets.includes(id)) return;

    const nextActive = [...activeWidgets, id];
    setActiveWidgets(nextActive);

    const meta = ALL_WIDGET_METAS.find((m) => m.id === id);
    const defW = meta?.defaultSize.w || 4;
    const defH = meta?.defaultSize.h || 4;

    const nextLayouts: ResponsiveLayouts = { ...layouts };
    const breakpoints = ["lg", "md", "sm", "xs", "xxs"] as const;
    const colMap = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

    for (const bp of breakpoints) {
      const existing = nextLayouts[bp] || [];
      if (!existing.some((item) => item.i === id)) {
        const maxY = existing.reduce((max, item) => Math.max(max, item.y + item.h), 0);
        nextLayouts[bp] = [
          ...existing,
          {
            i: id,
            x: 0,
            y: maxY,
            w: Math.min(defW, colMap[bp]),
            h: defH,
            minW: meta?.defaultSize.minW,
            minH: meta?.defaultSize.minH,
          },
        ] as unknown as Layout;
      }
    }

    setLayouts(nextLayouts);
    persistLayout(nextLayouts, nextActive, pinnedPriorities);
    toast({ title: "Widget added to dashboard! ✨", type: "success" });
  };

  const handleResetDefaults = () => {
    const def = getDefaultLayouts();
    setLayouts(def);
    setActiveWidgets([...ALL_WIDGET_IDS]);
    persistLayout(def, [...ALL_WIDGET_IDS], pinnedPriorities);
    toast({ title: "Layout reset to defaults", type: "info" });
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode -> persist final state
      persistLayout(layouts, activeWidgets, pinnedPriorities);
      toast({ title: "Layout saved", type: "success" });
    }
    setIsEditMode(!isEditMode);
  };

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case "greeting":
        return <GreetingWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "priorities":
        return (
          <PrioritiesWidget
            isEditMode={isEditMode}
            onRemove={handleRemoveWidget}
            pinnedIds={pinnedPriorities}
            onUpdatePinnedIds={(ids) => {
              setPinnedPriorities(ids);
              persistLayout(layouts, activeWidgets, ids);
            }}
          />
        );
      case "spending":
        return <SpendingWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "meals":
        return <MealsWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "tasks":
        return <TasksWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "habits":
        return <HabitsWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "timer":
        return <FocusTimerWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "timeline":
        return <TimelineWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "streaks":
        return <StreaksWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "activity_chart":
        return <ActivityChartWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      case "quick_note":
        return <QuickNoteWidget isEditMode={isEditMode} onRemove={handleRemoveWidget} />;
      default:
        return null;
    }
  };

  const today = todayIST();

  return (
    <div className="flex flex-col gap-5 pb-16 max-w-7xl mx-auto w-full">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border p-3.5 sm:p-4 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-text">Today Dashboard</h1>
            <p className="text-[11px] text-text-muted">
              Your day, your shore • Drag-and-drop customizable layout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Day View Shortcut */}
          <Link
            href={`/day/${today}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-muted text-xs font-semibold text-text transition-colors shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Day View</span>
          </Link>

          {/* Quick Capture Button */}
          <button
            type="button"
            onClick={() => openQuickCapture()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 shadow-2xs transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Capture</span>
          </button>

          {/* Edit Layout Toggle */}
          <button
            type="button"
            onClick={handleToggleEditMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-2xs ${
              isEditMode
                ? "bg-accent-warm text-accent-foreground border-accent-warm shadow-xs"
                : "border-border bg-surface hover:bg-surface-muted text-text"
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted" />
                <span>Edit Layout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-accent-warm/10 border border-accent-warm/30 text-text animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-accent-warm shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-accent-warm">Customizing Layout:</span>{" "}
              Drag headers to reposition, drag bottom-right corners to resize, or remove widgets with X.
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-primary hover:bg-surface-muted shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Widget</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold text-text-muted hover:text-danger hover:bg-danger/10 shadow-2xs transition-colors"
              title="Reset all breakpoints to default layout"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Responsive Grid Container */}
      <div ref={containerRef as any} className="w-full min-h-[500px]">
        {mounted && isLoaded ? (
          <ResponsiveGridLayout
            width={width}
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={70}
            dragConfig={{ enabled: isEditMode, handle: ".widget-drag-handle" }}
            resizeConfig={{ enabled: isEditMode }}
            margin={[16, 16]}
            onLayoutChange={handleLayoutChange}
            className="layout"
          >
            {activeWidgets.map((widgetId) => (
              <div key={widgetId} className="h-full w-full">
                {renderWidget(widgetId)}
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            <div className="col-span-full h-32 rounded-2xl bg-surface-muted/60" />
            <div className="h-64 rounded-2xl bg-surface-muted/60" />
            <div className="h-64 rounded-2xl bg-surface-muted/60" />
            <div className="h-64 rounded-2xl bg-surface-muted/60" />
            <div className="h-64 rounded-2xl bg-surface-muted/60" />
          </div>
        )}
      </div>

      {/* Widget Library Modal */}
      <WidgetLibraryModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        activeWidgetIds={activeWidgets}
        onAddWidget={handleAddWidget}
      />
    </div>
  );
}
