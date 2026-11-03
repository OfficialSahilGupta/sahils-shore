"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: On This Day Memories Widget
// Highlights photos and videos taken on today's calendar date in past years
// ============================================================================

import React from "react";
import { Sparkles, Calendar, Film } from "lucide-react";
import type { MediaItem } from "@/lib/media";

interface OnThisDayGroup {
  yearsAgo: number;
  year: number;
  items: MediaItem[];
}

interface OnThisDayWidgetProps {
  groups: OnThisDayGroup[];
  onOpenItem: (item: MediaItem) => void;
}

export function OnThisDayWidget({ groups, onOpenItem }: OnThisDayWidgetProps) {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="rounded-2xl border border-accent-warm/30 bg-gradient-to-r from-accent-warm/10 via-primary/5 to-surface p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-warm/20 text-accent-warm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">On This Day</h3>
            <p className="text-[11px] text-text-muted">Relive memories from this calendar day in past years</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.year} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-warm">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {group.yearsAgo} {group.yearsAgo === 1 ? "Year" : "Years"} Ago ({group.year})
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border shadow-xs hover:border-primary transition-all active:scale-95"
                >
                  <img
                    src={item.thumb_path || ""}
                    alt={item.file_name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.media_type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Film className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {item.links?.place_name && (
                    <div className="absolute bottom-1 left-1 right-1 truncate rounded bg-black/60 px-1 py-0.5 text-[9px] text-white backdrop-blur-xs">
                      {item.links.place_name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
