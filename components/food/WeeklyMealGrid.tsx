"use client";

// ============================================================================
// Sahil's Shore: Weekly Meal Grid Component
// 7-day matrix (Mon - Sun) across Breakfast, Lunch, Snack, Dinner, with day spend.
// Upgraded for lower screens with mobile day switcher & responsive single-day view.
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Coffee,
  Sun,
  Moon,
  Cookie,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/expenses";
import { formatFriendlyISTDate, isTodayIST, todayIST } from "@/lib/date-utils";
import type { WeeklyMealDay, MealType, MealWithExpense } from "@/lib/food";
import {
  getMealSchedule,
  type MealSchedule,
  DEFAULT_MEAL_SCHEDULE,
} from "@/lib/food/schedule";

interface WeeklyMealGridProps {
  weeklyData: WeeklyMealDay[];
  onAddMealForSlot: (dateIST: string, mealType: MealType) => void;
  onEditMeal: (meal: MealWithExpense) => void;
}

const SLOTS: Array<{ type: MealType; label: string; icon: React.ElementType }> = [
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
  const [schedule, setSchedule] = useState<MealSchedule>(DEFAULT_MEAL_SCHEDULE);

  // Find index of today or default to 0
  const todayDate = todayIST();
  const initialTodayIdx = useMemo(() => {
    const idx = weeklyData.findIndex((d) => d.dateIST === todayDate);
    return idx >= 0 ? idx : 0;
  }, [weeklyData, todayDate]);

  const [activeMobileDayIdx, setActiveMobileDayIdx] = useState<number>(initialTodayIdx);

  useEffect(() => {
    const update = () => setSchedule(getMealSchedule());
    update();
    if (typeof window !== "undefined") {
      window.addEventListener("shore_meal_schedule_changed", update);
      return () => window.removeEventListener("shore_meal_schedule_changed", update);
    }
  }, []);

  useEffect(() => {
    setActiveMobileDayIdx(initialTodayIdx);
  }, [initialTodayIdx]);

  const totalWeekSpendPaise = useMemo(
    () => weeklyData.reduce((acc, curr) => acc + curr.totalFoodSpendPaise, 0),
    [weeklyData]
  );

  const selectedMobileDay = weeklyData[activeMobileDayIdx] || weeklyData[0];

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      {/* Week Spend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h3 className="text-sm font-semibold text-text">Weekly Meal Schedule</h3>
          <p className="text-xs text-text-muted">7-day nutritional & dining overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Week Food Spend:</span>
          <span className="text-sm font-bold text-text font-mono">
            {formatINR(totalWeekSpendPaise)}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE VIEW (< md): Sleek Day Pill Switcher + Single Day Focus Card */}
      {/* ==================================================================== */}
      <div className="md:hidden space-y-3">
        {/* Horizontal Day Switcher */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          {weeklyData.map((day, idx) => {
            const isToday = isTodayIST(day.dateIST);
            const isSelected = idx === activeMobileDayIdx;
            const shortName = day.dayLabel.slice(0, 3);
            const dayNum = day.dateIST.slice(8);

            return (
              <button
                key={day.dateIST}
                type="button"
                onClick={() => setActiveMobileDayIdx(idx)}
                className={`flex-1 min-w-[48px] py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/30"
                    : isToday
                    ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                    : "bg-surface border-border text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {shortName}
                </span>
                <span className="text-xs font-bold font-mono mt-0.5">
                  {dayNum}
                </span>
                {day.totalFoodSpendPaise > 0 && (
                  <span
                    className={`text-[9px] font-mono mt-0.5 truncate max-w-[44px] ${
                      isSelected ? "text-primary-foreground/90 font-semibold" : "text-text-muted font-medium"
                    }`}
                  >
                    ₹{Math.round(day.totalFoodSpendPaise / 100)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Header with Prev/Next Navigation */}
        {selectedMobileDay && (
          <Card
            className={`p-4 bg-surface border rounded-2xl shadow-xs space-y-4 ${
              isTodayIST(selectedMobileDay.dateIST)
                ? "border-primary/60 ring-1 ring-primary/30"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activeMobileDayIdx <= 0}
                  onClick={() => setActiveMobileDayIdx((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg border border-border bg-surface-muted/60 text-text-muted hover:text-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text">
                      {selectedMobileDay.dayLabel}
                    </span>
                    {isTodayIST(selectedMobileDay.dateIST) && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-primary/15 text-primary">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted font-mono">
                    {formatFriendlyISTDate(selectedMobileDay.dateIST)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedMobileDay.totalFoodSpendPaise > 0 && (
                  <div className="text-right mr-1">
                    <span className="text-[10px] text-text-muted block">Spend</span>
                    <span className="text-xs font-bold text-text font-mono">
                      {formatINR(selectedMobileDay.totalFoodSpendPaise)}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  disabled={activeMobileDayIdx >= weeklyData.length - 1}
                  onClick={() =>
                    setActiveMobileDayIdx((prev) => Math.min(weeklyData.length - 1, prev + 1))
                  }
                  className="p-1.5 rounded-lg border border-border bg-surface-muted/60 text-text-muted hover:text-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Next day"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 4 Meal Slots for the selected day */}
            <div className="space-y-2.5">
              {SLOTS.map(({ type, label, icon: Icon }) => {
                const mealsInSlot = selectedMobileDay[type] || [];

                return (
                  <div
                    key={type}
                    className="p-3 rounded-xl bg-surface-muted/40 border border-border/50 text-xs flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-text font-medium">{label}</span>
                        <span className="text-[10px] font-mono text-text-muted/75 font-normal">
                          ({schedule[type]?.startTime})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddMealForSlot(selectedMobileDay.dateIST, type)}
                        className="inline-flex items-center gap-1 text-[11px] text-primary font-medium hover:underline p-1 rounded transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Log</span>
                      </button>
                    </div>

                    {mealsInSlot.length === 0 ? (
                      <div
                        onClick={() => onAddMealForSlot(selectedMobileDay.dateIST, type)}
                        className="text-[11px] text-text-muted/60 italic hover:text-primary cursor-pointer py-1.5 px-2 rounded-lg border border-dashed border-border/50 flex items-center justify-between transition-colors bg-surface/40"
                      >
                        <span>+ Log {label.toLowerCase()}</span>
                        <span className="text-[10px] font-mono opacity-50">
                          ~{schedule[type]?.typicalTime}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {mealsInSlot.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => onEditMeal(m)}
                            className="p-2 rounded-lg bg-surface border border-border/60 cursor-pointer group hover:border-primary/40 transition-colors"
                          >
                            {m.is_skipped ? (
                              <div className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                                Skipped ({m.skipped_reason || "Fasting"})
                              </div>
                            ) : (
                              <>
                                <div className="font-semibold text-text text-xs leading-snug break-words group-hover:text-primary transition-colors">
                                  {m.description}
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-text-muted mt-1 gap-2">
                                  <span className="truncate">
                                    {m.location_type === "amrita_mess"
                                      ? "Amrita Mess"
                                      : m.location_type === "home"
                                      ? "Home"
                                      : m.restaurant_name || m.location_type}
                                  </span>
                                  {m.expense && (
                                    <span className="font-bold text-text font-mono shrink-0">
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
        )}
      </div>

      {/* ==================================================================== */}
      {/* DESKTOP VIEW (>= md): Full 7-Day Side-by-Side Comparison Matrix     */}
      {/* ==================================================================== */}
      <div className="hidden md:grid md:grid-cols-7 gap-3 pb-2 min-w-0 w-full">
        {weeklyData.map((day) => {
          const isToday = isTodayIST(day.dateIST);

          return (
            <Card
              key={day.dateIST}
              className={`p-3 bg-surface border rounded-2xl flex flex-col justify-between min-w-0 ${
                isToday
                  ? "border-primary ring-1 ring-primary/40 shadow-xs"
                  : "border-border/70 shadow-2xs"
              }`}
            >
              {/* Day Header */}
              <div className="pb-2 mb-2 border-b border-border/50 flex items-baseline justify-between min-w-0">
                <div className="min-w-0 truncate">
                  <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-text"}`}>
                    {day.dayLabel.slice(0, 3)}
                  </span>
                  <span className="text-[10px] text-text-muted ml-1 font-mono">
                    {day.dateIST.slice(5)}
                  </span>
                </div>
                {day.totalFoodSpendPaise > 0 && (
                  <span className="text-[10px] font-semibold text-text-muted font-mono shrink-0 ml-1">
                    {formatINR(day.totalFoodSpendPaise)}
                  </span>
                )}
              </div>

              {/* 4 Meal Slots */}
              <div className="space-y-2 flex-1 min-w-0">
                {SLOTS.map(({ type, label, icon: Icon }) => {
                  const mealsInSlot = day[type] || [];

                  return (
                    <div
                      key={type}
                      className="p-2 rounded-xl bg-surface-muted/40 border border-border/40 text-xs min-h-[58px] flex flex-col justify-between min-w-0"
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted mb-1 min-w-0">
                        <span className="flex items-center gap-1 min-w-0 truncate">
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{label}</span>
                          <span className="text-[9px] font-mono text-text-muted/70 font-normal shrink-0">
                            ({schedule[type]?.startTime})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onAddMealForSlot(day.dateIST, type)}
                          aria-label={`Add ${label}`}
                          className="text-text-muted hover:text-primary p-0.5 rounded transition-colors shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {mealsInSlot.length === 0 ? (
                        <div
                          onClick={() => onAddMealForSlot(day.dateIST, type)}
                          className="text-[11px] text-text-muted/60 italic hover:text-primary cursor-pointer truncate py-1 flex items-center justify-between min-w-0"
                        >
                          <span className="truncate">+ Log {label.toLowerCase()}</span>
                          <span className="text-[9px] font-mono opacity-50 shrink-0 ml-1">
                            ~{schedule[type]?.typicalTime}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1 min-w-0">
                          {mealsInSlot.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => onEditMeal(m)}
                              className="cursor-pointer group min-w-0"
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
                                  <div className="flex items-center justify-between text-[10px] text-text-muted mt-0.5 min-w-0 gap-1">
                                    <span className="truncate max-w-[85px]">
                                      {m.location_type === "amrita_mess"
                                        ? "Amrita Mess"
                                        : m.location_type === "home"
                                        ? "Home"
                                        : m.restaurant_name || m.location_type}
                                    </span>
                                    {m.expense && (
                                      <span className="font-semibold text-text font-mono shrink-0">
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
