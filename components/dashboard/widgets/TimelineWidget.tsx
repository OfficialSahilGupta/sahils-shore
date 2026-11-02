"use client";

// ============================================================================
// Sahil's Shore: Embedded Unified Timeline Widget
// Live chronological feed of today's trackable actions with link to Day View
// ============================================================================

import React from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { UnifiedTimeline } from "@/components/timeline/UnifiedTimeline";
import { todayIST } from "@/lib/date-utils";
import type { WidgetId } from "@/lib/dashboard/types";
import { Compass, ExternalLink, ArrowRight } from "lucide-react";

interface TimelineWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

export function TimelineWidget({ isEditMode, onRemove }: TimelineWidgetProps) {
  const today = todayIST();

  return (
    <WidgetContainer
      id="timeline"
      title="Unified Timeline"
      icon={Compass}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <Link
          href={`/day/${today}`}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          <span>Day View</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      }
    >
      <div className="h-full flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto max-h-72">
          <UnifiedTimeline date={today} limit={8} />
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] mt-2">
          <span className="text-text-muted">All modules sync here</span>
          <Link
            href={`/day/${today}`}
            className="text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span>Full Chronology</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
