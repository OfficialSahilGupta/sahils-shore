"use client";

// ============================================================================
// Sahil's Shore: Places This Month Widget
// Monthly exploration summary with quick-access cards
// ============================================================================

import React from "react";
import Link from "next/link";
import { Compass, MapPin, Star, Calendar } from "lucide-react";
import type { Place, PlaceCategory } from "@/lib/places";
import { PLACE_CATEGORIES, filterPlacesThisMonth } from "@/lib/places";
import { formatISTDate } from "@/lib/date-utils";

interface PlacesThisMonthProps {
  places: Place[];
  onSelectPlace?: (place: Place) => void;
}

export function PlacesThisMonth({ places, onSelectPlace }: PlacesThisMonthProps) {
  const thisMonthPlaces = filterPlacesThisMonth(places);

  if (thisMonthPlaces.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-surface to-accent-warm/5 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Places This Month</h3>
            <p className="text-[11px] text-text-muted">
              {thisMonthPlaces.length} {thisMonthPlaces.length === 1 ? "destination" : "destinations"} explored in IST
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {thisMonthPlaces.map((place) => {
          const config = PLACE_CATEGORIES[place.category as PlaceCategory] || PLACE_CATEGORIES.other;

          return (
            <Link
              key={place.id}
              href={`/places/${place.id}`}
              className="flex flex-col justify-between shrink-0 w-48 rounded-xl border border-border bg-surface p-3 shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all text-left"
            >
              <div className="space-y-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold border ${config.bgClass} ${config.borderClass}`}
                >
                  <span className="capitalize">{place.category}</span>
                </span>
                <p className="truncate text-xs font-bold text-text">{place.name}</p>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
                <span>{formatISTDate(place.visited_at)}</span>
                {place.rating && (
                  <span className="text-accent-warm font-semibold flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-accent-warm text-accent-warm" />
                    <span>{place.rating}</span>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
