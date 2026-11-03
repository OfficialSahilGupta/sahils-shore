"use client";

// ============================================================================
// Sahil's Shore: Travel Timeline Component
// Chronological vertical journey connecting visited places over time
// ============================================================================

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Star,
  ExternalLink,
  Navigation,
  Sparkles,
} from "lucide-react";
import type { Place, PlaceCategory } from "@/lib/places";
import { PLACE_CATEGORIES } from "@/lib/places";
import { formatISTDate } from "@/lib/date-utils";

interface TravelTimelineProps {
  places: Place[];
}

export function TravelTimeline({ places }: TravelTimelineProps) {
  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-surface">
        <p className="text-xs text-text-muted">No places logged yet to construct your travel timeline.</p>
      </div>
    );
  }

  // Sort places chronologically descending
  const sorted = [...places].sort(
    (a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
  );

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {sorted.map((place) => {
        const config = PLACE_CATEGORIES[place.category as PlaceCategory] || PLACE_CATEGORIES.other;

        return (
          <div key={place.id} className="relative group">
            {/* Timeline Circle Node */}
            <div
              className="absolute -left-6 sm:-left-8 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface shadow-xs transition-transform group-hover:scale-125"
              style={{ backgroundColor: config.color }}
            >
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>

            {/* Event Card */}
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${config.bgClass} ${config.borderClass}`}
                  >
                    <MapPin className="h-2.5 w-2.5" />
                    <span className="capitalize">{place.category}</span>
                  </span>
                  <span className="text-xs font-semibold text-text">{place.name}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    <span>{formatISTDate(place.visited_at)}</span>
                  </div>
                  {place.rating && (
                    <div className="flex items-center text-accent-warm font-semibold">
                      <Star className="h-3 w-3 fill-accent-warm mr-0.5" />
                      <span>{place.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {place.notes && (
                <p className="text-xs text-text-muted leading-relaxed">{place.notes}</p>
              )}

              <div className="pt-2 flex items-center justify-between">
                {place.lat && place.lng ? (
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-emerald-500" />
                    {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                  </span>
                ) : (
                  <span />
                )}

                <Link
                  href={`/places/${place.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Visit Details</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
