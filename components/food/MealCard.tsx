"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Meal Card Component
// Displays dish details, photo thumbnail, cost, rating, taste/health notes,
// and quick favorite / eat-again actions.
// ============================================================================

import React from "react";
import {
  Star,
  Heart,
  RotateCcw,
  MapPin,
  Pencil,
  Trash2,
  Tag,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/expenses";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import type { MealWithExpense, MealType } from "@/lib/food";

interface MealCardProps {
  meal: MealWithExpense;
  onEdit: (meal: MealWithExpense) => void;
  onDelete: (mealId: string, expenseId?: string | null) => void;
  onToggleFavorite: (mealId: string, isFav: boolean) => void;
}

const MEAL_ICONS: Record<MealType, any> = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Cookie,
  dinner: Moon,
};

export function MealCard({
  meal,
  onEdit,
  onDelete,
  onToggleFavorite,
}: MealCardProps) {
  const Icon = MEAL_ICONS[meal.meal_type] || Sun;
  const costPaise = meal.expense?.amount_paise || 0;

  return (
    <Card className="p-4 bg-surface border border-border/70 rounded-2xl shadow-2xs hover:border-border transition-colors flex flex-col justify-between group">
      <div>
        {/* Top Header: Meal Type + Time + Favorite */}
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
              onClick={() => onToggleFavorite(meal.id, !meal.is_favorite)}
              aria-label={meal.is_favorite ? "Unfavorite" : "Favorite"}
              className="p-1 rounded-md text-text-muted hover:text-danger transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${
                  meal.is_favorite
                    ? "fill-danger text-danger"
                    : "text-text-muted hover:text-danger"
                }`}
              />
            </button>
            <button
              onClick={() => onEdit(meal)}
              aria-label="Edit meal"
              className="p-1 rounded-md text-text-muted hover:text-text opacity-70 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(meal.id, meal.expense_id)}
              aria-label="Delete meal"
              className="p-1 rounded-md text-text-muted hover:text-danger opacity-70 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content: Dish Title & Photo */}
        <div className="flex gap-3 items-start my-2">
          {meal.photo_url && (
            <img
              src={meal.photo_url}
              alt={meal.description}
              className="h-16 w-16 object-cover rounded-xl border border-border shrink-0 shadow-2xs"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-text leading-snug">
              {meal.description}
            </h4>

            {/* Place / Restaurant */}
            <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {meal.restaurant_name ||
                  (meal.location_type === "home" ? "Home cooked" : meal.location_type)}
              </span>
              {meal.eat_again && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-accent-warm/15 text-accent-warm">
                  <RotateCcw className="h-2.5 w-2.5" /> Eat Again
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Taste & Health Notes */}
        {(meal.notes_taste || meal.notes_health) && (
          <div className="text-xs space-y-0.5 py-2 px-2.5 rounded-xl bg-surface-muted/50 border border-border/40 mt-2">
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

        {/* Cost */}
        {costPaise > 0 ? (
          <span className="font-bold text-text font-mono text-sm">
            {formatINR(costPaise)}
          </span>
        ) : (
          <span className="text-[11px] text-text-muted">No cost logged</span>
        )}
      </div>
    </Card>
  );
}
