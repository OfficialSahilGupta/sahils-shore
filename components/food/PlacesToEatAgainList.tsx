"use client";

// ============================================================================
// Sahil's Shore: Places to Eat Again Component
// Curated restaurants and cafes marked with "Eat Again" or rated >= 4.0
// ============================================================================

import React from "react";
import { MapPin, Star, RotateCcw, Utensils, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatFriendlyISTDate } from "@/lib/date-utils";

interface PlacesToEatAgainListProps {
  places: Array<{
    restaurant_name: string;
    last_visited_at: string;
    avg_rating: number;
    recommended_items: string[];
    visit_count: number;
  }>;
}

export function PlacesToEatAgainList({ places }: PlacesToEatAgainListProps) {
  if (places.length === 0) {
    return (
      <Card className="p-8 text-center bg-surface border border-border/70 rounded-2xl shadow-xs">
        <p className="text-sm font-semibold text-text">No places saved to eat again yet</p>
        <p className="text-xs text-text-muted mt-1">
          When logging meals, mark restaurants with &ldquo;Place to eat again&rdquo; or rate them 4+ stars.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {places.map((place) => (
        <Card
          key={place.restaurant_name}
          className="p-4 bg-surface border border-border/70 rounded-2xl shadow-xs hover:border-border transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-accent-warm/15 flex items-center justify-center text-accent-warm shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text leading-tight">
                    {place.restaurant_name}
                  </h4>
                  <span className="text-[11px] text-text-muted">
                    Visited {place.visit_count} {place.visit_count === 1 ? "time" : "times"}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-muted text-xs font-bold text-accent-warm">
                <Star className="h-3 w-3 fill-accent-warm" />
                <span>{place.avg_rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Recommended items */}
            {place.recommended_items.length > 0 && (
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-text-muted block mb-1">
                  Dishes you enjoyed:
                </span>
                <div className="flex flex-wrap gap-1">
                  {place.recommended_items.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-text"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40 text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Last visit: {formatFriendlyISTDate(place.last_visited_at)}
            </span>
            <span className="text-primary font-semibold flex items-center gap-1">
              <RotateCcw className="h-2.5 w-2.5" /> Revisit
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
