"use client";

// ============================================================================
// Sahil's Shore: Places List Component
// Searchable, filterable directory of visited places with visit details
// ============================================================================

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Star,
  Edit2,
  Trash2,
  ExternalLink,
  Navigation,
} from "lucide-react";
import type { Place, PlaceCategory } from "@/lib/places";
import { PLACE_CATEGORIES } from "@/lib/places";
import { formatISTDate } from "@/lib/date-utils";

interface PlacesListProps {
  places: Place[];
  onEditPlace: (place: Place) => void;
  onDeletePlace: (id: string) => Promise<void>;
}

export function PlacesList({
  places,
  onEditPlace,
  onDeletePlace,
}: PlacesListProps) {
  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-surface">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-text-muted mb-3">
          <MapPin className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-text">No places recorded yet</h4>
        <p className="mt-1 text-xs text-text-muted max-w-sm">
          Log cafes, restaurants, travel spots, study hubs, and gyms to map your life journey.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => {
        const config = PLACE_CATEGORIES[place.category as PlaceCategory] || PLACE_CATEGORIES.other;

        return (
          <div
            key={place.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="space-y-3">
              {/* Category & Rating */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${config.bgClass} ${config.borderClass}`}
                >
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{place.category}</span>
                </span>

                {place.rating && (
                  <div className="flex items-center gap-0.5 text-accent-warm text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 fill-accent-warm" />
                    <span>{place.rating}.0</span>
                  </div>
                )}
              </div>

              {/* Title & Notes */}
              <div>
                <h4 className="text-base font-bold text-text group-hover:text-primary transition-colors">
                  {place.name}
                </h4>
                {place.notes && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted leading-relaxed">
                    {place.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Metadata & Actions */}
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{formatISTDate(place.visited_at)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href={`/places/${place.id}`}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                  title="View place details and linked visits"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => onEditPlace(place)}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                  title="Edit place"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete place "${place.name}"?`)) {
                      onDeletePlace(place.id);
                    }
                  }}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-red-500/10 hover:text-danger transition-colors"
                  title="Delete place"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
