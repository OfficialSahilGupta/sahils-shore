"use client";

// ============================================================================
// Sahil's Shore: Dashboard Widget Container
// Standardized wrapper card for all dashboard widgets with drag handle,
// action header, and edit-mode controls.
// ============================================================================

import React from "react";
import type { WidgetId } from "@/lib/dashboard/types";
import { GripVertical, X } from "lucide-react";

interface WidgetContainerProps {
  id: WidgetId;
  title: string;
  icon: React.ElementType;
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function WidgetContainer({
  id,
  title,
  icon: Icon,
  isEditMode = false,
  onRemove,
  actionButton,
  children,
  className = "",
  noPadding = false,
}: WidgetContainerProps) {
  return (
    <div
      className={`relative flex flex-col h-full w-full rounded-2xl border bg-surface shadow-xs overflow-hidden transition-all duration-150 ${
        isEditMode
          ? "border-primary/50 ring-2 ring-primary/20 shadow-md"
          : "border-border hover:border-border/80"
      } ${className}`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-muted/30 select-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag Handle (Visible in Edit Mode) */}
          {isEditMode ? (
            <div
              className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 rounded text-primary hover:bg-primary/10 transition-colors"
              title="Drag to reposition widget"
            >
              <GripVertical className="w-4 h-4 stroke-[2.5]" />
            </div>
          ) : (
            <div className="p-1 rounded text-primary bg-primary/10">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}

          <h3 className="text-xs font-bold text-text truncate tracking-tight">{title}</h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Custom Action (e.g. + or Module Link) */}
          {!isEditMode && actionButton}

          {/* Remove Widget Button (In Edit Mode) */}
          {isEditMode && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              title="Hide this widget"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content Body */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto ${
          noPadding ? "p-0" : "p-3 sm:p-4"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
