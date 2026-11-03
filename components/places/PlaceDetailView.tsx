"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Place Detail View ("Everything From This Visit")
// Aggregates linked photos, meals, and expenses + total spend calculation
// ============================================================================

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Calendar,
  Star,
  Wallet,
  Utensils,
  ImageIcon,
  ArrowLeft,
  Navigation,
  ExternalLink,
  Edit2,
  Trash2,
  Receipt,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  getPlaceDetailsWithLinkedData,
  deletePlace,
  updatePlace,
  type PlaceWithDetails,
  type PlaceCategory,
  type PlaceInput,
  PLACE_CATEGORIES,
} from "@/lib/places";
import { formatISTDate } from "@/lib/date-utils";
import { formatPaiseToINR } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/client";
import { PlaceModal } from "./PlaceModal";
import { MediaLightbox } from "../media/MediaLightbox";
import type { MediaItem } from "@/lib/media";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-border bg-surface">
      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
    </div>
  ),
});

interface PlaceDetailViewProps {
  placeId: string;
}

export function PlaceDetailView({ placeId }: PlaceDetailViewProps) {
  const [data, setData] = useState<PlaceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  const supabase = createClient();

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const res = await getPlaceDetailsWithLinkedData(supabase, user.id, placeId);
      setData(res);
    } catch (err) {
      console.error("[PlaceDetailView] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !data.place) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 text-center space-y-4">
        <h3 className="text-lg font-bold text-text">Place Not Found</h3>
        <p className="text-xs text-text-muted">The requested place could not be located.</p>
        <Link
          href="/places"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Places</span>
        </Link>
      </div>
    );
  }

  const { place, media, meals, expenses, totalSpentPaise } = data;
  const config = PLACE_CATEGORIES[place.category as PlaceCategory] || PLACE_CATEGORIES.other;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/places"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Places & Map</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Main Place Hero Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${config.bgClass} ${config.borderClass}`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="capitalize">{place.category}</span>
              </span>
              {place.rating && (
                <div className="flex items-center gap-1 text-accent-warm text-xs font-bold bg-accent-warm/10 border border-accent-warm/20 rounded-full px-2.5 py-0.5">
                  <Star className="h-3.5 w-3.5 fill-accent-warm" />
                  <span>{place.rating}.0 / 5.0</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {place.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Visited {formatISTDate(place.visited_at)}</span>
              </div>
              {place.lat && place.lng && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                  <span>
                    {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {place.notes && (
              <p className="mt-3 text-xs sm:text-sm text-text leading-relaxed bg-surface-muted/50 p-3 rounded-xl border border-border">
                {place.notes}
              </p>
            )}
          </div>

          {/* Mini Focused Map */}
          {place.lat && place.lng && (
            <div className="w-full sm:w-72 shrink-0 overflow-hidden rounded-xl border border-border shadow-xs">
              <LeafletMap places={[place]} className="h-44 w-full" />
            </div>
          )}
        </div>

        {/* Aggregate Stats: Everything From This Visit */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
          <div className="rounded-xl border border-border/80 bg-surface-muted/40 p-3 space-y-0.5">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Wallet className="h-3 w-3 text-amber-500" />
              Total Spent
            </span>
            <p className="text-sm font-bold text-text">
              {formatPaiseToINR(totalSpentPaise)}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface-muted/40 p-3 space-y-0.5">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <ImageIcon className="h-3 w-3 text-primary" />
              Photos & Media
            </span>
            <p className="text-sm font-bold text-text">{media.length}</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface-muted/40 p-3 space-y-0.5">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Utensils className="h-3 w-3 text-rose-500" />
              Meals Logged
            </span>
            <p className="text-sm font-bold text-text">{meals.length}</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface-muted/40 p-3 space-y-0.5">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Receipt className="h-3 w-3 text-emerald-500" />
              Expenses Logged
            </span>
            <p className="text-sm font-bold text-text">{expenses.length}</p>
          </div>
        </div>
      </div>

      {/* Linked Media Gallery */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-text">Photos & Videos ({media.length})</h3>
          </div>
        </div>

        {media.length === 0 ? (
          <p className="text-xs text-text-muted italic py-4">No photos or videos linked to this place yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {media.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxItem(item)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-muted hover:border-primary transition-all"
              >
                <img
                  src={item.thumb_path || ""}
                  alt={item.file_name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Linked Meals */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-bold text-text">Meals Logged Here ({meals.length})</h3>
          </div>
        </div>

        {meals.length === 0 ? (
          <p className="text-xs text-text-muted italic py-4">No meals recorded at this place.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-xl border border-border p-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-text">{meal.description || meal.restaurant_name || "Meal"}</p>
                  <p className="text-[11px] text-text-muted capitalize">
                    {meal.meal_type} • {formatISTDate(meal.eaten_at)}
                  </p>
                </div>
                {meal.rating && (
                  <span className="text-accent-warm font-bold">★ {meal.rating}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Expenses */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-text">Expenses Logged Here ({expenses.length})</h3>
          </div>
        </div>

        {expenses.length === 0 ? (
          <p className="text-xs text-text-muted italic py-4">No expenses recorded for this place.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-text">
                    {expense.notes || "Expense"}
                  </p>
                  <p className="text-[11px] text-text-muted capitalize">
                    {expense.payment_method} • {formatISTDate(expense.spent_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-text">
                    {formatPaiseToINR(expense.amount_paise)}
                  </p>
                  {expense.receipt_url && (
                    <span className="text-[10px] text-primary flex items-center gap-1 justify-end">
                      <Receipt className="h-2.5 w-2.5" />
                      Receipt attached
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <PlaceModal
        place={place}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (input) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          await updatePlace(supabase, user.id, place.id, input);
          loadDetails();
        }}
      />

      {/* Lightbox for Photos */}
      <MediaLightbox
        item={lightboxItem}
        items={media}
        isOpen={lightboxItem !== null}
        onClose={() => setLightboxItem(null)}
        onSelect={(item) => setLightboxItem(item)}
        onDelete={async (id) => {}}
        onOpenLinkPicker={() => {}}
      />
    </div>
  );
}
