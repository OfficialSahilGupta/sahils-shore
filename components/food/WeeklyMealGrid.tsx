"use client";

// ============================================================================
// Sahil's Shore: Weekly Meal Grid Component
// 7-day matrix (Mon - Sun) across Breakfast, Lunch, Snack, Dinner, with day spend
// ============================================================================

import React from "react";
import { Plus, Coffee, Sun, Moon, Cookie, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/expenses";
import { formatFriendlyISTDate, isTodayIST } from "@/lib/date-utils";
import type { WeeklyMealDay, MealType, MealWithExpense } from "@/lib/food";

interface WeeklyMealGridProps {
  weeklyData: WeeklyMealDay[];
  onAddMealForSlot: (dateIST: string, mealType: MealType) => void;
  onEditMeal: (meal: MealWithExpense) => void;
}

const SLOTS: Array<{ type: MealType; label: string; icon: any }> = [
  { type: "breakfast", label: "Breakfast", icon: Coffee },
  { type: "lunch", label: "Lunch", icon: Sun },
  { type: "snack", label: "Snack", icon: Cookie },
  { type: "dinner", label: "Dinner", icon: Moon },
];

export function WeeklyMealGrid({
  weeklyData,
  onAddMealForSlot,
  onEditMeal,
}: WeeklyMealGridProps) {
  const totalWeekSpendPaise = weeklyData.reduce(
    (acc, curr) => acc + curr.totalFoodSpendPaise,
    0
  );

  return (
    <div className="space-y-4">
      {/* Week Spend Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-semibold text-text">Weekly Meal Schedule</h3>
          <p className="text-xs text-text-muted">7-day nutritional & dining overview</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-text-muted mr-1.5">Week Food Spend:</span>
          <span className="text-sm font-bold text-text font-mono">
            {formatINR(totalWeekSpendPaise)}
          </span>
        </div>
      </div>

      {/* Grid: 7 Day Columns (scrollable on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 overflow-x-auto pb-2">
        {weeklyData.map((day) => {
          const isToday = isTodayIST(day.dateIST);

          return (
            <Card
              key={day.dateIST}
              className={`p-3 bg-surface border rounded-2xl flex flex-col justify-between min-w-[200px] md:min-w-0 ${
                isToday
                  ? "border-primary ring-1 ring-primary/40 shadow-xs"
                  : "border-border/70 shadow-2xs"
              }`}
            >
              {/* Day Header */}
              <div className="pb-2 mb-2 border-b border-border/50 flex items-baseline justify-between">
                <div>
                  <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-text"}`}>
                    {day.dayLabel.slice(0, 3)}
                  </span>
                  <span className="text-[10px] text-text-muted ml-1 font-mono">
                    {day.dateIST.slice(5)}
                  </span>
                </div>
                {day.totalFoodSpendPaise > 0 && (
                  <span className="text-[10px] font-semibold text-text-muted font-mono">
                    {formatINR(day.totalFoodSpendPaise)}
                  </span>
                )}
              </div>

              {/* 4 Meal Slots */}
              <div className="space-y-2 flex-1">
                {SLOTS.map(({ type, label, icon: Icon }) => {
                  const mealsInSlot = day[type];

                  return (
                    <div
                      key={type}
                      className="p-2 rounded-xl bg-surface-muted/40 border border-border/40 text-xs min-h-[58px] flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted mb-1">
                        <span className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                        <button
                          onClick={() => onAddMealForSlot(day.dateIST, type)}
                          aria-label={`Add ${label}`}
                          className="text-text-muted hover:text-primary p-0.5 rounded transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {mealsInSlot.length === 0 ? (
                        <div
                          onClick={() => onAddMealForSlot(day.dateIST, type)}
                          className="text-[11px] text-text-muted/60 italic hover:text-primary cursor-pointer truncate py-1"
                        >
                          + Log {label.toLowerCase()}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {mealsInSlot.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => onEditMeal(m)}
                              className="cursor-pointer group"
                            >
                              {m.is_skipped ? (
                                <div className="rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate group-hover:bg-purple-500/20 transition-colors">
                                  Skipped ({m.skipped_reason || "Fasting"})
                                </div>
                              ) : (
                                <>
                                  <div className="font-medium text-text text-[11px] leading-tight truncate group-hover:text-primary transition-colors">
                                    {m.description}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-text-muted mt-0.5">
                                    <span className="truncate max-w-[90px]">
                                      {m.location_type === "amrita_mess"
                                        ? "Amrita Mess"
                                        : m.location_type === "home"
                                        ? "Home"
                                        : m.restaurant_name || m.location_type}
                                    </span>
                                    {m.expense && (
                                      <span className="font-semibold text-text font-mono">
                                        {formatINR(m.expense.amount_paise)}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
