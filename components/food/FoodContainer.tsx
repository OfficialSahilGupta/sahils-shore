"use client";

// ============================================================================
// Sahil's Shore: Food Diary Container Component
// Luxury meal tracking hub with Amrita Mess, permanent multi-photo galleries,
// 4-slot daily progress, custom dropdown filters, and strict favorite decoupling.
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
  GraduationCap,
  Home,
  Store,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { MealDialog } from "./MealDialog";
import { MealCard } from "./MealCard";
import { WeeklyMealGrid } from "./WeeklyMealGrid";
import { PlacesToEatAgainList } from "./PlacesToEatAgainList";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/select";
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
  type MealLocation,
  type CreateMealInput,
} from "@/lib/food";
import { todayIST, getISTDateString, formatFriendlyISTDate } from "@/lib/date-utils";
import { formatINR } from "@/lib/expenses";
import { Card } from "@/components/ui/card";

type ActiveTab = "diary" | "weekly" | "favorites" | "places";

const SLOTS: Array<{ type: MealType; label: string; icon: React.ElementType }> = [
  { type: "breakfast", label: "Breakfast", icon: Coffee },
  { type: "lunch", label: "Lunch", icon: Sun },
  { type: "snack", label: "Snack", icon: Cookie },
  { type: "dinner", label: "Dinner", icon: Moon },
];

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
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const currentIST = todayIST();

  // Find Monday of the current week (IST)
  const mondayIST = useMemo(() => {
    const today = new Date();
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

  // Today's meals breakdown
  const todayMeals = useMemo(() => {
    return meals.filter((m) => getISTDateString(m.eaten_at) === currentIST);
  }, [meals, currentIST]);

  // Weekly Food Spend (Dine-out / Outside)
  const totalWeekSpendPaise = useMemo(() => {
    return weeklyOverview.reduce((sum, d) => sum + d.totalFoodSpendPaise, 0);
  }, [weeklyOverview]);

  // Location Counts (Today & This Week)
  const amritaMessCount = useMemo(() => {
    return meals.filter(
      (m) =>
        m.location_type === "amrita_mess" &&
        getISTDateString(m.eaten_at) >= mondayIST
    ).length;
  }, [meals, mondayIST]);

  const homeCount = useMemo(() => {
    return meals.filter(
      (m) =>
        m.location_type === "home" &&
        getISTDateString(m.eaten_at) >= mondayIST
    ).length;
  }, [meals, mondayIST]);

  // Filtered meals for Diary view
  const filteredMeals = useMemo(() => {
    return meals.filter((m) => {
      if (selectedMealType !== "all" && m.meal_type !== selectedMealType) {
        return false;
      }
      if (selectedLocation !== "all" && m.location_type !== selectedLocation) {
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
  }, [meals, selectedMealType, selectedLocation, searchQuery]);

  // Strictly decoupled favorite meals list
  const favoriteMeals = useMemo(() => {
    return meals.filter((m) => m.is_favorite === true);
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

  // Determine smart next meal slot suggestion based on IST hour
  const smartNextSlot: MealType = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 18) return "snack";
    return "dinner";
  }, []);

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
          toast({ title: "Meal updated successfully", type: "success" });
          getPlacesToEatAgain(supabase, userId).then(setPlacesToEatAgain);
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
        location_type: input.location_type || "amrita_mess",
        restaurant_name: input.restaurant_name || null,
        expense_id: null,
        rating: input.rating || null,
        photo_url: input.photo_urls?.[0] || input.photo_url || null,
        photo_urls: input.photo_urls || (input.photo_url ? [input.photo_url] : []),
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
            title: input.cost_paise && input.cost_paise > 0
              ? "Meal logged & Food expense created!"
              : "Meal logged successfully",
            type: "success",
          });
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
          photo_urls: target.photo_urls,
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
      getPlacesToEatAgain(supabase, userId).then(setPlacesToEatAgain);
    } catch (err) {
      setMeals((prev) => [target, ...prev]);
      toast({ title: "Failed to delete meal", type: "error" });
    }
  };

  // Handler: Toggle Favorite with instant optimistic UI update
  const handleToggleFavorite = async (mealId: string, isFav: boolean) => {
    if (!userId) return;
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, is_favorite: isFav } : m))
    );
    await toggleMealFavorite(supabase, userId, mealId, isFav);
  };

  // Quick Add for Slot
  const handleAddMealForSlot = (dateIST: string, mealType: MealType) => {
    setEditingMeal(null);
    setDialogDefaultDate(dateIST);
    setDialogDefaultMealType(mealType);
    setDialogOpen(true);
  };

  // Re-log a Favorite Dish for Today
  const handleReLogFavorite = (favoriteMeal: MealWithExpense) => {
    setEditingMeal(null);
    setDialogDefaultDate(currentIST);
    setDialogDefaultMealType(favoriteMeal.meal_type);
    setDialogOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-accent-warm/15 flex items-center justify-center text-accent-warm">
              <Utensils className="h-5 w-5" />
            </div>
            <span>Food Diary</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Track daily meals at Amrita Mess, home, and outside dining with automatic expense sync.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingMeal(null);
            setDialogDefaultDate(undefined);
            setDialogDefaultMealType(smartNextSlot);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-95 shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Log Meal</span>
        </button>
      </div>

      {/* 2. Today's 4-Slot Progress Bar */}
      <Card className="p-4 bg-surface border border-border/80 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text">
              Today&apos;s Meals ({formatFriendlyISTDate(currentIST)})
            </h3>
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {todayMeals.length}/4 slots logged
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SLOTS.map(({ type, label, icon: SlotIcon }) => {
            const loggedInSlot = todayMeals.filter((m) => m.meal_type === type);
            const isLogged = loggedInSlot.length > 0;
            const isNextRecommended = !isLogged && smartNextSlot === type;

            return (
              <div
                key={type}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[92px] ${
                  isLogged
                    ? "bg-primary/5 border-primary/30"
                    : isNextRecommended
                    ? "bg-accent-warm/5 border-accent-warm/40 ring-1 ring-accent-warm/30"
                    : "bg-surface-muted/30 border-border/60 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold capitalize text-text">
                    <SlotIcon
                      className={`h-3.5 w-3.5 ${
                        isLogged ? "text-primary" : "text-text-muted"
                      }`}
                    />
                    <span>{label}</span>
                  </span>

                  {isLogged ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Done</span>
                    </span>
                  ) : isNextRecommended ? (
                    <span className="text-[10px] font-bold text-accent-warm uppercase tracking-wider">
                      Up Next
                    </span>
                  ) : null}
                </div>

                {isLogged ? (
                  <div className="space-y-1">
                    {loggedInSlot.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setEditingMeal(m);
                          setDialogOpen(true);
                        }}
                        className="cursor-pointer group flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-text truncate max-w-[140px] group-hover:text-primary transition-colors">
                          {m.description}
                        </span>
                        <span className="text-[10px] text-text-muted capitalize">
                          {m.location_type === "amrita_mess" ? "Mess" : m.location_type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddMealForSlot(currentIST, type)}
                    className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-lg text-xs font-semibold bg-surface border border-border/80 text-text hover:bg-surface-muted hover:border-primary/50 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Log {label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Nutrition & Dining Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-surface border border-border/70 shadow-2xs">
          <span className="text-[11px] font-semibold text-text-muted block mb-0.5">
            Meals Today
          </span>
          <span className="text-xl font-extrabold text-text font-mono">
            {todayMeals.length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface border border-border/70 shadow-2xs">
          <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1 mb-0.5">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            Amrita Mess (Week)
          </span>
          <span className="text-xl font-extrabold text-primary font-mono">
            {amritaMessCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface border border-border/70 shadow-2xs">
          <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1 mb-0.5">
            <Home className="h-3.5 w-3.5 text-accent-warm" />
            Home Meals (Week)
          </span>
          <span className="text-xl font-extrabold text-accent-warm font-mono">
            {homeCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface border border-border/70 shadow-2xs">
          <span className="text-[11px] font-semibold text-text-muted block mb-0.5">
            Week Dining Spend
          </span>
          <span className="text-xl font-extrabold text-text font-mono">
            {formatINR(totalWeekSpendPaise)}
          </span>
        </div>
      </div>

      {/* 4. Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-1 overflow-x-auto no-scrollbar">
        {[
          { key: "diary", label: "Meal Log" },
          { key: "weekly", label: "Weekly Schedule" },
          { key: "favorites", label: `Favorites (${favoriteMeals.length})` },
          { key: "places", label: `Places to Eat Again (${placesToEatAgain.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as ActiveTab)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-surface text-primary shadow-xs border border-border/70"
                : "text-text-muted hover:text-text hover:bg-surface-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Meal Log */}
      {activeTab === "diary" && (
        <div className="space-y-4">
          {/* Search & Custom Dropdown Filters */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, taste notes, restaurants..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            {/* Custom Dropdown Filters */}
            <div className="flex items-center gap-2">
              <div className="w-36">
                <Select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value)}
                  options={[
                    { value: "all", label: "All Slots" },
                    { value: "breakfast", label: "Breakfast" },
                    { value: "lunch", label: "Lunch" },
                    { value: "snack", label: "Snack" },
                    { value: "dinner", label: "Dinner" },
                  ]}
                />
              </div>

              <div className="w-44">
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  options={[
                    { value: "all", label: "All Locations" },
                    { value: "amrita_mess", label: "Amrita Mess" },
                    { value: "home", label: "Home Cooked" },
                    { value: "restaurant", label: "Restaurant" },
                    { value: "office", label: "Office" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Grouped Meal Cards */}
          {groupedMeals.length === 0 ? (
            <Card className="p-12 text-center bg-surface border border-border/70 rounded-2xl shadow-xs">
              <Utensils className="h-8 w-8 text-text-muted/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-text">No meals match your filter</p>
              <p className="text-xs text-text-muted mt-1">
                Log your breakfast, lunch, snack, or dinner to start your food diary.
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

      {/* TAB 2: Weekly Overview */}
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

      {/* TAB 3: Favorites */}
      {activeTab === "favorites" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text">Favorite Dishes</h3>
              <p className="text-xs text-text-muted">
                Curated meals you love. Tap &ldquo;Log for Today&rdquo; to re-log any favorite dish instantly.
              </p>
            </div>
            <span className="text-xs font-mono text-text-muted font-bold">
              {favoriteMeals.length} favorites
            </span>
          </div>

          {favoriteMeals.length === 0 ? (
            <Card className="p-12 text-center bg-surface border border-border/70 rounded-2xl shadow-xs">
              <Heart className="h-8 w-8 text-danger/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-text">No favorite dishes marked yet</p>
              <p className="text-xs text-text-muted mt-1">
                Click the heart icon on any meal card to add it to your favorites catalog.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {favoriteMeals.map((meal) => (
                <div key={meal.id} className="space-y-1.5">
                  <MealCard
                    meal={meal}
                    onEdit={(m) => {
                      setEditingMeal(m);
                      setDialogOpen(true);
                    }}
                    onDelete={handleDeleteMeal}
                    onToggleFavorite={handleToggleFavorite}
                  />
                  <button
                    type="button"
                    onClick={() => handleReLogFavorite(meal)}
                    className="w-full py-1.5 px-3 rounded-xl bg-surface border border-border/80 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Log this again today</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Places to Eat Again */}
      {activeTab === "places" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-text">Places to Eat Again</h3>
            <p className="text-xs text-text-muted">
              Curated outside dining spots and restaurants marked for revisit or rated 4+ stars.
            </p>
          </div>
          <PlacesToEatAgainList places={placesToEatAgain} />
        </div>
      )}

      {/* Log/Edit Meal Dialog */}
      <MealDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveMeal}
        editingMeal={editingMeal}
        defaultDate={dialogDefaultDate}
        defaultMealType={dialogDefaultMealType}
      />
    </div>
  );
}
