"use client";

// ============================================================================
// Sahil's Shore: Food Diary Container Component
// Orchestrates Meal Diary, Weekly Meal Grid, Favorites, and Places to Eat Again.
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Utensils,
  Plus,
  Calendar,
  Heart,
  RotateCcw,
  Search,
  Filter,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from "lucide-react";
import { MealDialog } from "./MealDialog";
import { MealCard } from "./MealCard";
import { WeeklyMealGrid } from "./WeeklyMealGrid";
import { PlacesToEatAgainList } from "./PlacesToEatAgainList";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  toggleMealFavorite,
  getPlacesToEatAgain,
  buildWeeklyMealOverview,
  type MealWithExpense,
  type MealType,
  type CreateMealInput,
  type UpdateMealInput,
} from "@/lib/food";
import { todayIST, getISTDateString, formatFriendlyISTDate } from "@/lib/date-utils";
import { Card } from "@/components/ui/card";

type ActiveTab = "diary" | "weekly" | "favorites" | "places";

export function FoodContainer() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("diary");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [meals, setMeals] = useState<MealWithExpense[]>([]);
  const [placesToEatAgain, setPlacesToEatAgain] = useState<any[]>([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealWithExpense | null>(null);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<string | undefined>(undefined);
  const [dialogDefaultMealType, setDialogDefaultMealType] = useState<MealType | undefined>(undefined);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<string>("all");

  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const currentIST = todayIST();

  // Find Monday of the current week (IST)
  const mondayIST = useMemo(() => {
    const today = new Date();
    // Monday is day 1 in ISO (0 is Sunday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mondayDate = new Date(today.setDate(diff));
    return getISTDateString(mondayDate);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const [mealsData, placesData] = await Promise.all([
          getMeals(supabase, user.id),
          getPlacesToEatAgain(supabase, user.id),
        ]);
        setMeals(mealsData);
        setPlacesToEatAgain(placesData);
      }
    } catch (err) {
      console.error("Error loading food data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Weekly meal overview calculation
  const weeklyOverview = useMemo(() => {
    return buildWeeklyMealOverview(meals, mondayIST);
  }, [meals, mondayIST]);

  // Filtered meals for Diary view
  const filteredMeals = useMemo(() => {
    return meals.filter((m) => {
      if (selectedMealType !== "all" && m.meal_type !== selectedMealType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = m.description.toLowerCase().includes(q);
        const matchesRest = m.restaurant_name?.toLowerCase().includes(q) ?? false;
        const matchesTaste = m.notes_taste?.toLowerCase().includes(q) ?? false;
        const matchesHealth = m.notes_health?.toLowerCase().includes(q) ?? false;
        if (!matchesDesc && !matchesRest && !matchesTaste && !matchesHealth) return false;
      }
      return true;
    });
  }, [meals, selectedMealType, searchQuery]);

  // Favorite meals list
  const favoriteMeals = useMemo(() => {
    return meals.filter((m) => m.is_favorite || (m.rating && m.rating >= 4));
  }, [meals]);

  // Group filtered meals by IST date
  const groupedMeals = useMemo(() => {
    const groups = new Map<string, MealWithExpense[]>();
    filteredMeals.forEach((meal) => {
      const dateStr = getISTDateString(meal.eaten_at);
      const existing = groups.get(dateStr) || [];
      existing.push(meal);
      groups.set(dateStr, existing);
    });

    return Array.from(groups.entries()).map(([dateStr, items]) => ({
      dateStr,
      items,
    }));
  }, [filteredMeals]);

  // Handler: Save (Create or Update) Meal
  const handleSaveMeal = async (input: CreateMealInput) => {
    if (!userId) {
      toast({ title: "Authentication required", type: "error" });
      return;
    }

    if (editingMeal) {
      // Update existing meal
      try {
        const updated = await updateMeal(
          supabase,
          userId,
          editingMeal.id,
          input,
          editingMeal
        );
        if (updated) {
          setMeals((prev) => prev.map((m) => (m.id === editingMeal.id ? updated : m)));
          toast({ title: "Meal updated and synced with expense", type: "success" });
        }
      } catch (err) {
        toast({ title: "Failed to update meal", type: "error" });
      }
    } else {
      // Create new meal
      const tempId = `temp-${Date.now()}`;
      const optimisticMeal: MealWithExpense = {
        id: tempId,
        user_id: userId,
        meal_type: input.meal_type,
        description: input.description,
        location_type: input.location_type || "home",
        restaurant_name: input.restaurant_name || null,
        expense_id: null,
        rating: input.rating || null,
        photo_url: input.photo_url || null,
        notes_taste: input.notes_taste || null,
        notes_health: input.notes_health || null,
        is_favorite: input.is_favorite || false,
        eat_again: input.eat_again || false,
        eaten_at: input.eaten_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expense: null,
      };

      setMeals((prev) => [optimisticMeal, ...prev]);

      try {
        const created = await createMeal(supabase, userId, input);
        if (created) {
          setMeals((prev) => prev.map((m) => (m.id === tempId ? created : m)));
          toast({
            title: input.cost_paise
              ? "Meal logged & Food expense created!"
              : "Meal logged successfully",
            type: "success",
          });
          // Refresh places if needed
          getPlacesToEatAgain(supabase, userId).then(setPlacesToEatAgain);
        }
      } catch (err) {
        setMeals((prev) => prev.filter((m) => m.id !== tempId));
        toast({ title: "Failed to log meal", type: "error" });
      }
    }
  };

  // Handler: Delete Meal with Undo Toast
  const handleDeleteMeal = async (mealId: string, expenseId?: string | null) => {
    if (!userId) return;

    const target = meals.find((m) => m.id === mealId);
    if (!target) return;

    // Optimistic delete
    setMeals((prev) => prev.filter((m) => m.id !== mealId));

    toast({
      title: "Meal deleted",
      onUndo: async () => {
        setMeals((prev) => [target, ...prev]);
        await createMeal(supabase, userId, {
          meal_type: target.meal_type,
          description: target.description,
          location_type: target.location_type,
          restaurant_name: target.restaurant_name,
          cost_paise: target.expense?.amount_paise,
          rating: target.rating,
          photo_url: target.photo_url,
          notes_taste: target.notes_taste,
          notes_health: target.notes_health,
          is_favorite: target.is_favorite,
          eat_again: target.eat_again,
          eaten_at: target.eaten_at,
        });
      },
    });

    try {
      await deleteMeal(supabase, userId, mealId, expenseId);
    } catch (err) {
      setMeals((prev) => [target, ...prev]);
      toast({ title: "Failed to delete meal", type: "error" });
    }
  };

  // Handler: Toggle Favorite
  const handleToggleFavorite = async (mealId: string, isFav: boolean) => {
    if (!userId) return;
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, is_favorite: isFav } : m))
    );
    await toggleMealFavorite(supabase, userId, mealId, isFav);
  };

  // Quick Add for Slot in Weekly Grid
  const handleAddMealForSlot = (dateIST: string, mealType: MealType) => {
    setEditingMeal(null);
    setDialogDefaultDate(dateIST);
    setDialogDefaultMealType(mealType);
    setDialogOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-accent-warm/15 flex items-center justify-center text-accent-warm">
              <Utensils className="h-5 w-5" />
            </div>
            Food Diary
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Log what you eat, taste/health notes, ratings, and auto-sync with expenses.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setEditingMeal(null);
            setDialogDefaultDate(undefined);
            setDialogDefaultMealType(undefined);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-95 shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Log Meal</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-1">
        {[
          { key: "diary", label: "Meal Log" },
          { key: "weekly", label: "Weekly Schedule" },
          { key: "favorites", label: "Favorites" },
          { key: "places", label: "Places to Eat Again" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as ActiveTab)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === tab.key
                ? "bg-surface text-primary shadow-xs border border-border/70"
                : "text-text-muted hover:text-text hover:bg-surface-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Meal Log */}
      {activeTab === "diary" && (
        <div className="space-y-4">
          {/* Search & Slot Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, restaurants, taste notes..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-border/70 text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            {/* Meal Slot Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {["all", "breakfast", "lunch", "snack", "dinner"].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedMealType(slot)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    selectedMealType === slot
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-surface text-text-muted hover:text-text border border-border/60"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Meal Cards */}
          {groupedMeals.length === 0 ? (
            <Card className="p-12 text-center bg-surface border border-border/70 rounded-2xl shadow-xs">
              <p className="text-sm font-medium text-text">No meals logged yet</p>
              <p className="text-xs text-text-muted mt-1">
                Log your breakfast, lunch, snacks, or dinner to start your food diary.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedMeals.map((group) => (
                <div key={group.dateStr} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      {formatFriendlyISTDate(group.dateStr)}
                    </span>
                    <span className="h-px flex-1 bg-border/60" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        onEdit={(m) => {
                          setEditingMeal(m);
                          setDialogOpen(true);
                        }}
                        onDelete={handleDeleteMeal}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Weekly Overview */}
      {activeTab === "weekly" && (
        <WeeklyMealGrid
          weeklyData={weeklyOverview}
          onAddMealForSlot={handleAddMealForSlot}
          onEditMeal={(m) => {
            setEditingMeal(m);
            setDialogOpen(true);
          }}
        />
      )}

      {/* Tab 3: Favorites */}
      {activeTab === "favorites" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Favorite Dishes</h3>
            <span className="text-xs text-text-muted font-mono">
              {favoriteMeals.length} favorites
            </span>
          </div>

          {favoriteMeals.length === 0 ? (
            <Card className="p-12 text-center bg-surface border border-border/70 rounded-2xl shadow-xs">
              <Heart className="h-8 w-8 text-danger/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-text">No favorite meals marked yet</p>
              <p className="text-xs text-text-muted mt-1">
                Click the heart icon on any meal or rate it 4-5 stars to add it here.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {favoriteMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onEdit={(m) => {
                    setEditingMeal(m);
                    setDialogOpen(true);
                  }}
                  onDelete={handleDeleteMeal}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Places to Eat Again */}
      {activeTab === "places" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text">Places to Eat Again</h3>
            <p className="text-xs text-text-muted">
              Top-rated dining spots and restaurants marked for revisits.
            </p>
          </div>
          <PlacesToEatAgainList places={placesToEatAgain} />
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-20 md:bottom-8 right-6 z-40">
        <button
          onClick={() => {
            setEditingMeal(null);
            setDialogDefaultDate(undefined);
            setDialogDefaultMealType(undefined);
            setDialogOpen(true);
          }}
          aria-label="Log Meal"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="h-7 w-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Meal Modal */}
      <MealDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingMeal(null);
        }}
        onSave={handleSaveMeal}
        editingMeal={editingMeal}
        defaultDate={dialogDefaultDate}
        defaultMealType={dialogDefaultMealType}
      />
    </div>
  );
}
