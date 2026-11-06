"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Meal Card Component
// Displays dish details, multi-photo gallery strip, location badge (Amrita Mess,
// Home, Restaurant), cost in paise/INR, ratings, and instant favorite toggle.
// ============================================================================

import React, { useState } from "react";
import {
  Star,
  Heart,
  RotateCcw,
  MapPin,
  Pencil,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Cookie,
  GraduationCap,
  Home,
  Building2,
  Store,
  Compass,
  CheckCircle2,
  Image as ImageIcon,
  X,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/expenses";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import type { MealWithExpense, MealType, MealLocation } from "@/lib/food";

interface MealCardProps {
  meal: MealWithExpense;
  onEdit: (meal: MealWithExpense) => void;
  onDelete: (mealId: string, expenseId?: string | null) => void;
  onToggleFavorite: (mealId: string, isFav: boolean) => void;
}

const MEAL_ICONS: Record<MealType, React.ElementType> = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Cookie,
  dinner: Moon,
};

const LOCATION_CONFIG: Record<
  MealLocation,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  amrita_mess: {
    label: "Amrita Mess",
    icon: GraduationCap,
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  home: {
    label: "Home Cooked",
    icon: Home,
    badgeClass: "bg-accent-warm/15 text-accent-warm border-accent-warm/25",
  },
  restaurant: {
    label: "Restaurant",
    icon: Store,
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  office: {
    label: "Office",
    icon: Building2,
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
  },
  other: {
    label: "Other",
    icon: Compass,
    badgeClass: "bg-surface-muted text-text-muted border-border",
  },
};

export function MealCard({
  meal,
  onEdit,
  onDelete,
  onToggleFavorite,
}: MealCardProps) {
  const [activePhotoModalIndex, setActivePhotoModalIndex] = useState<number | null>(null);

  const Icon = MEAL_ICONS[meal.meal_type] || Sun;
  const costPaise = meal.expense?.amount_paise || 0;
  const locType = (meal.location_type || "amrita_mess") as MealLocation;
  const locConfig = LOCATION_CONFIG[locType] || LOCATION_CONFIG.other;
  const LocIcon = locConfig.icon;

  const photos = meal.photo_urls && meal.photo_urls.length > 0
    ? meal.photo_urls
    : meal.photo_url
    ? [meal.photo_url]
    : [];

  return (
    <>
      <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-2xs hover:border-border hover:shadow-xs transition-all flex flex-col justify-between group">
        <div>
          {/* Top Header: Meal Type + Time + Favorite & Actions */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary capitalize">
                <Icon className="h-3.5 w-3.5" />
                <span>{meal.meal_type}</span>
              </span>
              <span className="text-[11px] text-text-muted">
                {formatFriendlyISTDate(meal.eaten_at)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleFavorite(meal.id, !meal.is_favorite)}
                aria-label={meal.is_favorite ? "Unfavorite dish" : "Favorite dish"}
                className={`p-1.5 rounded-lg transition-all ${
                  meal.is_favorite
                    ? "text-danger hover:bg-danger/10"
                    : "text-text-muted hover:text-danger hover:bg-surface-muted"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${
                    meal.is_favorite ? "fill-danger text-danger" : "stroke-[2]"
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => onEdit(meal)}
                aria-label="Edit meal"
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted opacity-80 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(meal.id, meal.expense_id)}
                aria-label="Delete meal"
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 opacity-80 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Content: Dish Title & Photo */}
          <div className="flex gap-3 items-start my-2">
            {photos.length > 0 && (
              <div
                className="relative cursor-pointer shrink-0 group/photo"
                onClick={() => setActivePhotoModalIndex(0)}
              >
                <img
                  src={photos[0]}
                  alt={meal.description}
                  className="h-16 w-16 object-cover rounded-xl border border-border shadow-2xs group-hover/photo:opacity-90 transition-opacity"
                />
                {photos.length > 1 && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-black/75 text-white backdrop-blur-xs">
                    +{photos.length - 1}
                  </span>
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base font-bold text-text leading-snug">
                {meal.description}
              </h4>

              {/* Location or Skipped Badge */}
              {meal.is_skipped ? (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                    <Clock className="h-3 w-3" />
                    <span>Skipped Slot • {meal.skipped_reason || "Fasting"}</span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${locConfig.badgeClass}`}
                  >
                    <LocIcon className="h-3 w-3 shrink-0" />
                    <span>
                      {locType === "restaurant" && meal.restaurant_name
                        ? meal.restaurant_name
                        : locConfig.label}
                    </span>
                  </span>

                  {meal.eat_again && locType === "restaurant" && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-warm/15 text-accent-warm border border-accent-warm/25">
                      <RotateCcw className="h-2.5 w-2.5" /> Eat Again
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Extra Photo Thumbnail Strip (if multiple photos) */}
          {photos.length > 1 && (
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              {photos.map((pUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoModalIndex(idx)}
                  className="relative h-10 w-10 rounded-lg overflow-hidden border border-border shrink-0 hover:border-primary transition-colors"
                >
                  <img
                    src={pUrl}
                    alt={`Photo ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Taste & Health Notes */}
          {(meal.notes_taste || meal.notes_health) && (
            <div className="text-xs space-y-1 py-2 px-2.5 rounded-xl bg-surface-muted/50 border border-border/40 mt-2">
              {meal.notes_taste && (
                <div className="text-text-muted">
                  <span className="font-semibold text-text">Taste: </span>
                  {meal.notes_taste}
                </div>
              )}
              {meal.notes_health && (
                <div className="text-text-muted">
                  <span className="font-semibold text-text">Health: </span>
                  {meal.notes_health}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Rating Stars & Cost Badge */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40 text-xs">
          {/* Rating */}
          <div className="flex items-center gap-1">
            {meal.rating ? (
              <div className="flex items-center text-accent-warm">
                {Array.from({ length: meal.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-accent-warm" />
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-text-muted italic">Unrated</span>
            )}
          </div>

          {/* Cost Badge */}
          {costPaise > 0 ? (
            <span className="font-bold text-text font-mono text-sm bg-surface-muted/60 px-2 py-0.5 rounded-lg border border-border/60">
              {formatINR(costPaise)}
            </span>
          ) : locType === "amrita_mess" || locType === "home" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary/80">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>Included</span>
            </span>
          ) : (
            <span className="text-[11px] text-text-muted">No cost logged</span>
          )}
        </div>
      </Card>

      {/* Lightbox Modal for Photo Preview */}
      {activePhotoModalIndex !== null && photos[activePhotoModalIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setActivePhotoModalIndex(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActivePhotoModalIndex(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={photos[activePhotoModalIndex]}
              alt={meal.description}
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            {photos.length > 1 && (
              <div className="flex items-center gap-2 mt-3">
                {photos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoModalIndex(idx)}
                    className={`h-10 w-10 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activePhotoModalIndex
                        ? "border-primary scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
