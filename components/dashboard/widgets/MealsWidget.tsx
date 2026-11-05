"use client";

// ============================================================================
// Sahil's Shore: Meals Logged Today Widget
// 4-slot status (Breakfast, Lunch, Snacks, Dinner), ratings, and food spend
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WidgetContainer } from "../WidgetContainer";
import { createClient } from "@/lib/supabase/client";
import { getMeals, MealWithExpense } from "@/lib/food";
import { todayIST, getISTDateRangeUTC } from "@/lib/date-utils";
import { formatINR } from "@/lib/expenses";
import { useQuickCapture } from "@/lib/quick-capture/QuickCaptureContext";
import type { WidgetId } from "@/lib/dashboard/types";
import { Utensils, Plus, CheckCircle2, ArrowRight, Star } from "lucide-react";

interface MealsWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

export function MealsWidget({ isEditMode, onRemove }: MealsWidgetProps) {
  const [todayMeals, setTodayMeals] = useState<MealWithExpense[]>([]);
  const { open: openQuickCapture } = useQuickCapture();

  const loadMeals = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      const today = todayIST();
      const { startUTC, endUTC } = getISTDateRangeUTC(today);

      const meals = await getMeals(supabase, data.user.id, {
        startDateUTC: startUTC,
        endDateUTC: endUTC,
      });
      setTodayMeals(meals);
    } catch (e) {
      console.warn("Failed loading meals:", e);
    }
  }, []);

  useEffect(() => {
    loadMeals();

    const handleUpdate = () => loadMeals();
    window.addEventListener("shore:data-updated", handleUpdate);
    return () => window.removeEventListener("shore:data-updated", handleUpdate);
  }, [loadMeals]);

  const slots = ["breakfast", "lunch", "snack", "dinner"] as const;
  const totalFoodSpendPaise = todayMeals.reduce(
    (sum, m) => sum + (m.expense?.amount_paise || 0),
    0
  );

  return (
    <WidgetContainer
      id="meals"
      title="Meals Logged"
      icon={Utensils}
      isEditMode={isEditMode}
      onRemove={onRemove}
      actionButton={
        <button
          type="button"
          onClick={() => openQuickCapture("meal")}
          className="p-1 rounded text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          title="Log Meal"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="flex flex-col justify-between h-full space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {slots.map((slot) => {
            const meal = todayMeals.find((m) => m.meal_type.toLowerCase() === slot);
            const isLogged = !!meal;

            return (
              <div
                key={slot}
                onClick={() => !isLogged && openQuickCapture("meal")}
                className={`p-2 rounded-xl border transition-all ${
                  isLogged
                    ? "border-rose-500/30 bg-rose-500/5 text-text"
                    : "border-border/60 bg-surface-muted/20 hover:border-primary/40 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {slot}
                  </span>
                  {isLogged ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                      <Plus className="w-2.5 h-2.5" />
                      Add
                    </span>
                  )}
                </div>

                {isLogged ? (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text truncate">
                      {meal.description}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-text-muted">
                      {meal.expense?.amount_paise ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatINR(meal.expense.amount_paise)}
                        </span>
                      ) : (
                        <span>{meal.location_type === "restaurant" ? meal.restaurant_name || "Dine out" : "Home"}</span>
                      )}
                      {meal.rating && (
                        <span className="text-accent-warm font-semibold inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-accent-warm text-accent-warm" />
                          <span>{meal.rating}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-text-muted italic">Not logged</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-text-muted">
            Food spend: <strong className="text-text">{formatINR(totalFoodSpendPaise)}</strong>
          </span>
          <Link href="/food" className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Food Diary</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetContainer>
  );
}
