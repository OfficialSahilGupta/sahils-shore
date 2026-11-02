"use client";

// ============================================================================
// Sahil's Shore: Widget Library Modal
// Browse available widgets and add them to the dashboard in edit layout mode
// ============================================================================

import React from "react";
import { ALL_WIDGET_METAS } from "@/lib/dashboard/layout-service";
import type { WidgetId, WidgetMeta } from "@/lib/dashboard/types";
import {
  X,
  Plus,
  Check,
  Compass,
  Pin,
  Wallet,
  Utensils,
  CheckSquare,
  Zap,
  Clock,
  Flame,
  BarChart2,
  FileText,
  Sparkles,
} from "lucide-react";

interface WidgetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWidgetIds: WidgetId[];
  onAddWidget: (id: WidgetId) => void;
}

export function WidgetLibraryModal({
  isOpen,
  onClose,
  activeWidgetIds,
  onAddWidget,
}: WidgetLibraryModalProps) {
  if (!isOpen) return null;

  const getWidgetIcon = (id: WidgetId) => {
    switch (id) {
      case "greeting":
        return <Compass className="w-4 h-4 text-primary" />;
      case "priorities":
        return <Pin className="w-4 h-4 text-primary" />;
      case "spending":
        return <Wallet className="w-4 h-4 text-amber-500" />;
      case "meals":
        return <Utensils className="w-4 h-4 text-rose-500" />;
      case "tasks":
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case "habits":
        return <Zap className="w-4 h-4 text-orange-500" />;
      case "timer":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "timeline":
        return <Compass className="w-4 h-4 text-primary" />;
      case "streaks":
        return <Flame className="w-4 h-4 text-orange-500" />;
      case "activity_chart":
        return <BarChart2 className="w-4 h-4 text-purple-500" />;
      case "quick_note":
        return <FileText className="w-4 h-4 text-teal-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface-muted/40">
          <div>
            <h3 className="text-sm font-bold text-text">Widget Library</h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Select widgets to display on your Today dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Widgets */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
          {ALL_WIDGET_METAS.map((meta) => {
            const isActive = activeWidgetIds.includes(meta.id);

            return (
              <div
                key={meta.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isActive
                    ? "border-border/60 bg-surface-muted/20 text-text-muted"
                    : "border-border bg-surface hover:border-primary/40 hover:shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-xl bg-surface border border-border shrink-0 mt-0.5">
                    {getWidgetIcon(meta.id)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-text truncate">
                        {meta.title}
                      </h4>
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded bg-surface-muted text-text-muted">
                        {meta.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-text-muted/70 px-2.5 py-1 rounded-lg bg-surface-muted/60">
                      <Check className="w-3 h-3 text-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddWidget(meta.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground bg-primary hover:opacity-95 px-3 py-1.5 rounded-lg shadow-xs transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 bg-surface-muted/30 flex items-center justify-between text-xs">
          <span className="text-text-muted">
            {activeWidgetIds.length} of {ALL_WIDGET_METAS.length} widgets active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
