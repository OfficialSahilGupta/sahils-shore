// ============================================================================
// Sahil's Shore: Food Diary Data Access & Domain Logic
// Meal logging, automatic expense synchronization, favorites, places to eat again,
// and weekly meal overviews with schema-resilient persistence.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import type { Meal, Expense } from "../../types/index.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { formatINR, createExpense, updateExpense, deleteExpense } from "../expenses/index.ts";
import { getISTDateString, todayIST, addDaysIST } from "../date-utils.ts";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealLocation = "home" | "restaurant" | "office" | "other";

export interface CreateMealInput {
  meal_type: MealType;
  description: string;
  location_type?: MealLocation;
  restaurant_name?: string | null;
  cost_paise?: number; // integer paise
  rating?: number | null; // 1-5
  photo_url?: string | null;
  notes_taste?: string | null;
  notes_health?: string | null;
  is_favorite?: boolean;
  eat_again?: boolean;
  eaten_at?: string;
}

export interface UpdateMealInput {
  meal_type?: MealType;
  description?: string;
  location_type?: MealLocation;
  restaurant_name?: string | null;
  cost_paise?: number; // integer paise
  rating?: number | null; // 1-5
  photo_url?: string | null;
  notes_taste?: string | null;
  notes_health?: string | null;
  is_favorite?: boolean;
  eat_again?: boolean;
  eaten_at?: string;
}

export interface MealWithExpense extends Meal {
  expense?: Expense | null;
}

export interface WeeklyMealDay {
  dateIST: string;
  dayOfWeek: string;
  dayLabel: string;
  breakfast: MealWithExpense[];
  lunch: MealWithExpense[];
  snack: MealWithExpense[];
  dinner: MealWithExpense[];
  totalFoodSpendPaise: number;
}

// ----------------------------------------------------------------------------
// Schema-Resilience Helpers for Favorite and Eat-Again Flags
// Gracefully handles both upgraded schemas (with columns) and base schemas
// ----------------------------------------------------------------------------

export function encodeTasteNotes(
  notesTaste: string | null | undefined,
  isFavorite?: boolean,
  eatAgain?: boolean
): string | null {
  let text = (notesTaste || "").replace(/\s*\[FAV\]|\s*\[EAT_AGAIN\]/g, "").trim();
  if (isFavorite) text = text ? `${text} [FAV]` : "[FAV]";
  if (eatAgain) text = text ? `${text} [EAT_AGAIN]` : "[EAT_AGAIN]";
  return text || null;
}

export function decodeMealFlags(m: any): {
  is_favorite: boolean;
  eat_again: boolean;
  notes_taste: string | null;
} {
  const hasFavCol = typeof m.is_favorite === "boolean";
  const hasEatAgainCol = typeof m.eat_again === "boolean";

  const rawTaste = m.notes_taste || "";
  const is_favorite = hasFavCol
    ? m.is_favorite
    : rawTaste.includes("[FAV]") || m.rating === 5;
  const eat_again = hasEatAgainCol
    ? m.eat_again
    : rawTaste.includes("[EAT_AGAIN]") || (m.rating && m.rating >= 4);
  const cleanTaste = rawTaste.replace(/\s*\[FAV\]|\s*\[EAT_AGAIN\]/g, "").trim() || null;

  return { is_favorite, eat_again, notes_taste: cleanTaste };
}

/**
 * Finds or creates the default "Food" category for the user to attach meal expenses to.
 */
export async function getOrCreateFoodCategory(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  // 1. Try to find existing Food category
  const { data: existing, error: findError } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", "Food")
    .limit(1)
    .maybeSingle();

  if (!findError && existing) {
    return existing.id;
  }

  // 2. Otherwise create Food category
  const { data: created, error: insertError } = await supabase
    .from("expense_categories")
    .insert({
      user_id: userId,
      name: "Food",
      icon: "Utensils",
      color: "#E0A458",
      is_default: true,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[getOrCreateFoodCategory] Error creating category:", insertError);
    return null;
  }

  return created.id;
}

/**
 * Fetches all meals with optional date filtering and pagination.
 */
export async function getMeals(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: {
    startDateUTC?: string;
    endDateUTC?: string;
    mealType?: MealType;
  }
): Promise<MealWithExpense[]> {
  let query = supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .order("eaten_at", { ascending: false });

  if (options?.startDateUTC) {
    query = query.gte("eaten_at", options.startDateUTC);
  }
  if (options?.endDateUTC) {
    query = query.lte("eaten_at", options.endDateUTC);
  }
  if (options?.mealType) {
    query = query.eq("meal_type", options.mealType);
  }

  const { data: meals, error } = await query;
  if (error) {
    console.error("[getMeals] Error:", error);
    return [];
  }

  if (!meals || meals.length === 0) return [];

  // Fetch linked expenses if any
  const expenseIds = meals
    .map((m) => m.expense_id)
    .filter((id): id is string => Boolean(id));

  let expenseMap = new Map<string, Expense>();
  if (expenseIds.length > 0) {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .in("id", expenseIds);

    (expenses || []).forEach((exp) => expenseMap.set(exp.id, exp as Expense));
  }

  return meals.map((m) => {
    const decoded = decodeMealFlags(m);
    return {
      ...(m as Meal),
      is_favorite: decoded.is_favorite,
      eat_again: decoded.eat_again,
      notes_taste: decoded.notes_taste,
      expense: m.expense_id ? expenseMap.get(m.expense_id) || null : null,
    };
  });
}

/**
 * Logs a new meal.
 * If cost_paise > 0, automatically creates a linked expense in the "Food" category,
 * updates the meal's expense_id, and logs timeline events.
 */
export async function createMeal(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateMealInput
): Promise<MealWithExpense | null> {
  const eatenAt = input.eaten_at || new Date().toISOString();
  let createdExpenseId: string | null = null;
  let createdExpense: Expense | null = null;

  // 1. If cost > 0, auto-create linked expense
  const costPaise = input.cost_paise || 0;
  if (costPaise > 0) {
    const foodCatId = await getOrCreateFoodCategory(supabase, userId);
    const placeDesc =
      input.location_type === "restaurant" && input.restaurant_name
        ? input.restaurant_name
        : input.location_type === "home"
        ? "Home"
        : input.restaurant_name || input.location_type || "Dining";

    createdExpense = await createExpense(
      supabase,
      userId,
      {
        category_id: foodCatId,
        amount_paise: costPaise,
        spent_at: eatenAt,
        payment_method: "UPI",
        place: placeDesc,
        notes: `Meal (${input.meal_type}): ${input.description}`,
      },
      "Food"
    );

    if (createdExpense) {
      createdExpenseId = createdExpense.id;
    }
  }

  // 2. Insert Meal record
  // Try inserting with is_favorite & eat_again first
  const fullPayload = {
    user_id: userId,
    meal_type: input.meal_type,
    description: input.description,
    location_type: input.location_type || "home",
    restaurant_name: input.restaurant_name || null,
    expense_id: createdExpenseId,
    rating: input.rating || null,
    photo_url: input.photo_url || null,
    notes_taste: input.notes_taste || null,
    notes_health: input.notes_health || null,
    is_favorite: input.is_favorite || false,
    eat_again: input.eat_again || false,
    eaten_at: eatenAt,
  };

  let mealRow: any = null;
  const res1 = await supabase.from("meals").insert(fullPayload as any).select().single();

  if (!res1.error) {
    mealRow = res1.data;
  } else if (res1.error.code === "PGRST204" || res1.error.message?.includes("column")) {
    // If table doesn't have is_favorite / eat_again columns, encode into notes_taste gracefully
    const encodedTaste = encodeTasteNotes(input.notes_taste, input.is_favorite, input.eat_again);
    const fallbackPayload = {
      user_id: userId,
      meal_type: input.meal_type,
      description: input.description,
      location_type: input.location_type || "home",
      restaurant_name: input.restaurant_name || null,
      expense_id: createdExpenseId,
      rating: input.rating || null,
      photo_url: input.photo_url || null,
      notes_taste: encodedTaste,
      notes_health: input.notes_health || null,
      eaten_at: eatenAt,
    };

    const res2 = await supabase.from("meals").insert(fallbackPayload as any).select().single();
    if (!res2.error) {
      mealRow = res2.data;
    } else {
      console.error("[createMeal] Error creating meal on fallback:", res2.error);
      if (createdExpenseId) {
        await deleteExpense(supabase, userId, createdExpenseId);
      }
      throw res2.error;
    }
  } else {
    console.error("[createMeal] Error creating meal:", res1.error);
    if (createdExpenseId) {
      await deleteExpense(supabase, userId, createdExpenseId);
    }
    throw res1.error;
  }

  const flags = decodeMealFlags(mealRow);
  const createdMeal: Meal = {
    ...mealRow,
    is_favorite: flags.is_favorite,
    eat_again: flags.eat_again,
    notes_taste: flags.notes_taste,
  };

  // 3. Write Timeline Event: meal_logged
  const ratingText = createdMeal.rating ? ` ★${createdMeal.rating}` : "";
  const costText = costPaise > 0 ? ` (${formatINR(costPaise)})` : "";
  await writeTimelineEvent(supabase, {
    userId,
    type: "meal_logged",
    summary: `${createdMeal.meal_type.toUpperCase()}: ${createdMeal.description}${costText}${ratingText}`,
    occurredAt: createdMeal.eaten_at,
    refTable: "meals",
    refId: createdMeal.id,
    meta: {
      meal_type: createdMeal.meal_type,
      location_type: createdMeal.location_type,
      restaurant_name: createdMeal.restaurant_name,
      rating: createdMeal.rating,
      cost_paise: costPaise,
      expense_id: createdExpenseId,
    },
  });

  return {
    ...createdMeal,
    expense: createdExpense,
  };
}

/**
 * Updates a meal and keeps any linked expense synchronized.
 */
export async function updateMeal(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  input: UpdateMealInput,
  currentMeal: MealWithExpense
): Promise<MealWithExpense | null> {
  let expenseId = currentMeal.expense_id;
  let linkedExpense = currentMeal.expense || null;
  const newCostPaise = input.cost_paise !== undefined ? input.cost_paise : (linkedExpense?.amount_paise || 0);

  // Synchronize linked expense
  if (expenseId && newCostPaise > 0) {
    // Update existing linked expense
    const placeDesc =
      input.location_type === "restaurant" && input.restaurant_name
        ? input.restaurant_name
        : input.restaurant_name || currentMeal.restaurant_name || currentMeal.location_type;

    const desc = input.description || currentMeal.description;
    const mType = input.meal_type || currentMeal.meal_type;

    linkedExpense = await updateExpense(supabase, userId, expenseId, {
      amount_paise: newCostPaise,
      place: placeDesc,
      notes: `Meal (${mType}): ${desc}`,
      spent_at: input.eaten_at || currentMeal.eaten_at,
    });
  } else if (expenseId && newCostPaise === 0) {
    // Cost was removed -> delete linked expense
    await deleteExpense(supabase, userId, expenseId);
    expenseId = null;
    linkedExpense = null;
  } else if (!expenseId && newCostPaise > 0) {
    // Cost was added -> create new linked expense
    const foodCatId = await getOrCreateFoodCategory(supabase, userId);
    const placeDesc =
      input.location_type === "restaurant" && input.restaurant_name
        ? input.restaurant_name
        : input.restaurant_name || input.location_type || "Dining";

    const desc = input.description || currentMeal.description;
    const mType = input.meal_type || currentMeal.meal_type;

    linkedExpense = await createExpense(
      supabase,
      userId,
      {
        category_id: foodCatId,
        amount_paise: newCostPaise,
        spent_at: input.eaten_at || currentMeal.eaten_at,
        payment_method: "UPI",
        place: placeDesc,
        notes: `Meal (${mType}): ${desc}`,
      },
      "Food"
    );

    if (linkedExpense) {
      expenseId = linkedExpense.id;
    }
  }

  // Update Meal table
  const fullUpdatePayload = {
    meal_type: input.meal_type,
    description: input.description,
    location_type: input.location_type,
    restaurant_name: input.restaurant_name,
    expense_id: expenseId,
    rating: input.rating,
    photo_url: input.photo_url,
    notes_taste: input.notes_taste,
    notes_health: input.notes_health,
    is_favorite: input.is_favorite,
    eat_again: input.eat_again,
    eaten_at: input.eaten_at,
    updated_at: new Date().toISOString(),
  };

  let updateRes = await supabase
    .from("meals")
    .update(fullUpdatePayload as any)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateRes.error && (updateRes.error.code === "PGRST204" || updateRes.error.message?.includes("column"))) {
    const encodedTaste = encodeTasteNotes(
      input.notes_taste !== undefined ? input.notes_taste : currentMeal.notes_taste,
      input.is_favorite !== undefined ? input.is_favorite : currentMeal.is_favorite,
      input.eat_again !== undefined ? input.eat_again : currentMeal.eat_again
    );
    const fallbackUpdate = {
      meal_type: input.meal_type,
      description: input.description,
      location_type: input.location_type,
      restaurant_name: input.restaurant_name,
      expense_id: expenseId,
      rating: input.rating,
      photo_url: input.photo_url,
      notes_taste: encodedTaste,
      notes_health: input.notes_health,
      eaten_at: input.eaten_at,
      updated_at: new Date().toISOString(),
    };
    updateRes = await supabase
      .from("meals")
      .update(fallbackUpdate as any)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
  }

  if (updateRes.error) {
    console.error("[updateMeal] Error:", updateRes.error);
    throw updateRes.error;
  }

  const flags = decodeMealFlags(updateRes.data);
  return {
    ...updateRes.data,
    is_favorite: flags.is_favorite,
    eat_again: flags.eat_again,
    notes_taste: flags.notes_taste,
    expense: linkedExpense,
  };
}

/**
 * Deletes a meal and removes its linked expense to maintain clean sync.
 */
export async function deleteMeal(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  expenseId?: string | null
): Promise<boolean> {
  // 1. Delete linked expense if present
  if (expenseId) {
    await deleteExpense(supabase, userId, expenseId);
  }

  // 2. Delete meal
  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[deleteMeal] Error deleting meal:", error);
    return false;
  }
  return true;
}

/**
 * Toggles a meal's favorite flag.
 */
export async function toggleMealFavorite(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  isFavorite: boolean
): Promise<boolean> {
  const res1 = await supabase
    .from("meals")
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() } as any)
    .eq("id", id)
    .eq("user_id", userId);

  if (!res1.error) return true;

  if (res1.error.code === "PGRST204" || res1.error.message?.includes("column")) {
    const { data: current } = await supabase
      .from("meals")
      .select("notes_taste")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (current) {
      const eatAgain = current.notes_taste?.includes("[EAT_AGAIN]");
      const updatedTaste = encodeTasteNotes(current.notes_taste, isFavorite, eatAgain);
      await supabase
        .from("meals")
        .update({ notes_taste: updatedTaste, updated_at: new Date().toISOString() } as any)
        .eq("id", id)
        .eq("user_id", userId);
      return true;
    }
  }

  return false;
}

/**
 * Toggles a meal's "eat again" flag.
 */
export async function toggleMealEatAgain(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  eatAgain: boolean
): Promise<boolean> {
  const res1 = await supabase
    .from("meals")
    .update({ eat_again: eatAgain, updated_at: new Date().toISOString() } as any)
    .eq("id", id)
    .eq("user_id", userId);

  if (!res1.error) return true;

  if (res1.error.code === "PGRST204" || res1.error.message?.includes("column")) {
    const { data: current } = await supabase
      .from("meals")
      .select("notes_taste")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (current) {
      const isFav = current.notes_taste?.includes("[FAV]");
      const updatedTaste = encodeTasteNotes(current.notes_taste, isFav, eatAgain);
      await supabase
        .from("meals")
        .update({ notes_taste: updatedTaste, updated_at: new Date().toISOString() } as any)
        .eq("id", id)
        .eq("user_id", userId);
      return true;
    }
  }

  return false;
}

/**
 * Fetches meals marked as favorite or high-rated.
 */
export async function getFavoriteMeals(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MealWithExpense[]> {
  const allMeals = await getMeals(supabase, userId);
  return allMeals.filter((m) => m.is_favorite || (m.rating && m.rating >= 4));
}

/**
 * Fetches unique places and restaurants marked with "Eat Again" or rating >= 4.
 */
export async function getPlacesToEatAgain(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<
  Array<{
    restaurant_name: string;
    last_visited_at: string;
    avg_rating: number;
    recommended_items: string[];
    visit_count: number;
  }>
> {
  const allMeals = await getMeals(supabase, userId);

  // Group by restaurant / place
  const placeMap = new Map<
    string,
    {
      ratings: number[];
      items: Set<string>;
      lastVisited: string;
      eatAgainMarked: boolean;
    }
  >();

  allMeals.forEach((m) => {
    const place = m.restaurant_name?.trim();
    if (!place) return;

    const existing = placeMap.get(place) || {
      ratings: [],
      items: new Set<string>(),
      lastVisited: m.eaten_at,
      eatAgainMarked: false,
    };

    if (m.rating) existing.ratings.push(m.rating);
    if (m.eat_again) existing.eatAgainMarked = true;
    if (m.description) existing.items.add(m.description);

    if (new Date(m.eaten_at) > new Date(existing.lastVisited)) {
      existing.lastVisited = m.eaten_at;
    }

    placeMap.set(place, existing);
  });

  const places: Array<{
    restaurant_name: string;
    last_visited_at: string;
    avg_rating: number;
    recommended_items: string[];
    visit_count: number;
  }> = [];

  placeMap.forEach((info, name) => {
    const avgRating =
      info.ratings.length > 0
        ? Math.round(
            (info.ratings.reduce((a, b) => a + b, 0) / info.ratings.length) * 10
          ) / 10
        : 4.0;

    // Qualify if marked eat_again OR high rated
    if (info.eatAgainMarked || avgRating >= 4.0) {
      places.push({
        restaurant_name: name,
        last_visited_at: info.lastVisited,
        avg_rating: avgRating,
        recommended_items: Array.from(info.items).slice(0, 4),
        visit_count: info.ratings.length || 1,
      });
    }
  });

  return places.sort((a, b) => b.avg_rating - a.avg_rating);
}

/**
 * Builds a structured weekly overview (7 days, Mon - Sun) of meals and daily spend.
 */
export function buildWeeklyMealOverview(
  meals: MealWithExpense[],
  mondayDateIST: string
): WeeklyMealDay[] {
  const daysOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const weekGrid: WeeklyMealDay[] = [];

  for (let i = 0; i < 7; i++) {
    const dateIST = addDaysIST(mondayDateIST, i);
    const dayOfWeek = daysOrder[i];
    const dayLabel = dayNames[i];

    // Filter meals for this IST calendar day
    const dayMeals = meals.filter(
      (m) => getISTDateString(m.eaten_at) === dateIST
    );

    let totalFoodSpendPaise = 0;
    const breakfast: MealWithExpense[] = [];
    const lunch: MealWithExpense[] = [];
    const snack: MealWithExpense[] = [];
    const dinner: MealWithExpense[] = [];

    dayMeals.forEach((m) => {
      const spend = m.expense?.amount_paise || 0;
      totalFoodSpendPaise += spend;

      if (m.meal_type === "breakfast") breakfast.push(m);
      else if (m.meal_type === "lunch") lunch.push(m);
      else if (m.meal_type === "snack") snack.push(m);
      else if (m.meal_type === "dinner") dinner.push(m);
    });

    weekGrid.push({
      dateIST,
      dayOfWeek,
      dayLabel,
      breakfast,
      lunch,
      snack,
      dinner,
      totalFoodSpendPaise,
    });
  }

  return weekGrid;
}
