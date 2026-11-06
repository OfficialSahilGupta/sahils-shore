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

export * from "./fasting.ts";
export * from "./schedule.ts";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealLocation = "home" | "amrita_mess" | "restaurant" | "office" | "other";

export interface CreateMealInput {
  meal_type: MealType;
  description: string;
  location_type?: MealLocation;
  restaurant_name?: string | null;
  cost_paise?: number; // integer paise
  rating?: number | null; // 1-5
  photo_url?: string | null;
  photo_urls?: string[];
  notes_taste?: string | null;
  notes_health?: string | null;
  is_favorite?: boolean;
  eat_again?: boolean;
  is_skipped?: boolean;
  skipped_reason?: string | null;
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
  photo_urls?: string[];
  notes_taste?: string | null;
  notes_health?: string | null;
  is_favorite?: boolean;
  eat_again?: boolean;
  is_skipped?: boolean;
  skipped_reason?: string | null;
  eaten_at?: string;
}

export interface MealWithExpense extends Omit<Meal, "photo_urls"> {
  expense?: Expense | null;
  photo_urls?: string[];
  is_skipped?: boolean;
  skipped_reason?: string | null;
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
// Schema-Resilience Helpers for Favorite, Eat-Again & Skipped Flags
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
  is_skipped: boolean;
  skipped_reason: string | null;
  notes_taste: string | null;
  notes_health: string | null;
  description: string;
  photo_urls: string[];
  location_type: MealLocation;
  restaurant_name: string | null;
} {
  const hasFavCol = typeof m.is_favorite === "boolean";
  const hasEatAgainCol = typeof m.eat_again === "boolean";

  const rawTaste = m.notes_taste || "";
  const rawHealth = m.notes_health || "";
  const rawDesc = m.description || "";

  // Strictly decouple is_favorite from star rating:
  const is_favorite = hasFavCol
    ? m.is_favorite
    : rawTaste.includes("[FAV]");

  const eat_again = hasEatAgainCol
    ? m.eat_again
    : rawTaste.includes("[EAT_AGAIN]");

  // Skipped meal detection
  const hasSkippedMarker = rawDesc.startsWith("[SKIPPED]") || rawHealth.includes("[SKIPPED");
  const is_skipped = typeof m.is_skipped === "boolean" ? m.is_skipped : hasSkippedMarker;

  let skipped_reason: string | null = m.skipped_reason || null;
  if (!skipped_reason) {
    if (rawHealth.includes("[SKIPPED:")) {
      const match = rawHealth.match(/\[SKIPPED:([^\]]+)\]/);
      if (match) skipped_reason = match[1].trim();
    } else if (rawDesc.includes("[SKIPPED:")) {
      const match = rawDesc.match(/\[SKIPPED:([^\]]+)\]/);
      if (match) skipped_reason = match[1].trim();
    }
  }

  const cleanTaste = rawTaste.replace(/\s*\[FAV\]|\s*\[EAT_AGAIN\]/g, "").trim() || null;
  const cleanHealth = rawHealth.replace(/\s*\[SKIPPED:[^\]]+\]|\s*\[SKIPPED\]/g, "").trim() || null;
  const cleanDesc = rawDesc.replace(/\s*\[SKIPPED:[^\]]+\]|\s*\[SKIPPED\]\s*/g, "").trim() || rawDesc;

  // Normalize photo_urls array
  let photo_urls: string[] = [];
  if (Array.isArray(m.photo_urls)) {
    photo_urls = m.photo_urls;
  } else if (typeof m.photo_urls === "string" && m.photo_urls.startsWith("[")) {
    try {
      photo_urls = JSON.parse(m.photo_urls);
    } catch {
      photo_urls = [];
    }
  } else if (m.photo_url) {
    photo_urls = [m.photo_url];
  }

  // Location mapping (ensuring Amrita Mess decodes back accurately)
  const isAmrita =
    m.location_type === "amrita_mess" ||
    m.restaurant_name === "Amrita Mess" ||
    (m.location_type === "other" && m.restaurant_name?.toLowerCase().includes("amrita mess"));

  const location_type: MealLocation = isAmrita ? "amrita_mess" : (m.location_type || "home");
  const restaurant_name = isAmrita ? "Amrita Mess" : (m.restaurant_name || null);

  return {
    is_favorite,
    eat_again,
    is_skipped,
    skipped_reason,
    notes_taste: cleanTaste,
    notes_health: cleanHealth,
    description: cleanDesc,
    photo_urls,
    location_type,
    restaurant_name,
  };
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
      description: decoded.description,
      location_type: decoded.location_type,
      restaurant_name: decoded.restaurant_name,
      is_favorite: decoded.is_favorite,
      eat_again: decoded.eat_again,
      is_skipped: decoded.is_skipped,
      skipped_reason: decoded.skipped_reason,
      notes_taste: decoded.notes_taste,
      notes_health: decoded.notes_health,
      photo_urls: decoded.photo_urls,
      expense: m.expense_id ? expenseMap.get(m.expense_id) || null : null,
    };
  });
}

/**
 * Logs a new meal or records a skipped meal.
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

  const isSkipped = Boolean(input.is_skipped);
  const skippedReason = input.skipped_reason || null;

  const effectiveDescription = isSkipped
    ? (input.description ? `[SKIPPED${skippedReason ? `:${skippedReason}` : ""}] ${input.description}` : `[SKIPPED${skippedReason ? `:${skippedReason}` : ""}] Skipped ${input.meal_type}`)
    : input.description;

  const effectiveHealthNotes = isSkipped && skippedReason
    ? (input.notes_health ? `[SKIPPED:${skippedReason}] ${input.notes_health}` : `[SKIPPED:${skippedReason}]`)
    : input.notes_health || null;

  // 1. If cost > 0 and NOT skipped, auto-create linked expense (Home and Amrita Mess are always ₹0 expense)
  const isFreeLocation = isSkipped || input.location_type === "home" || input.location_type === "amrita_mess";
  const costPaise = isFreeLocation ? 0 : (input.cost_paise || 0);

  const loc = isSkipped ? "home" : (input.location_type || "home");
  const restaurantName =
    loc === "amrita_mess"
      ? (input.restaurant_name?.trim() || "Amrita Mess")
      : loc === "home"
      ? null
      : (input.restaurant_name?.trim() || null);

  // PostgreSQL safe location: check (location_type in ('home', 'restaurant', 'office', 'other'))
  const dbLocationType = loc === "amrita_mess" ? "other" : loc;

  const photoUrls = input.photo_urls && input.photo_urls.length > 0
    ? input.photo_urls
    : (input.photo_url ? [input.photo_url] : []);
  const primaryPhotoUrl = photoUrls[0] || input.photo_url || null;

  if (costPaise > 0) {
    const foodCatId = await getOrCreateFoodCategory(supabase, userId);
    const placeDesc =
      loc === "restaurant" && restaurantName
        ? restaurantName
        : restaurantName || loc || "Dining";

    createdExpense = await createExpense(
      supabase,
      userId,
      {
        category_id: foodCatId,
        amount_paise: costPaise,
        spent_at: eatenAt,
        payment_method: "UPI",
        place: placeDesc,
        notes: `Meal (${input.meal_type}): ${effectiveDescription}`,
      },
      "Food"
    );

    if (createdExpense) {
      createdExpenseId = createdExpense.id;
    }
  }

  // 2. Insert Meal record
  const fullPayload: Record<string, unknown> = {
    user_id: userId,
    meal_type: input.meal_type,
    description: effectiveDescription,
    location_type: dbLocationType,
    restaurant_name: restaurantName,
    expense_id: createdExpenseId,
    rating: isSkipped ? null : (input.rating || null),
    photo_url: primaryPhotoUrl,
    photo_urls: photoUrls,
    notes_taste: isSkipped ? null : (input.notes_taste || null),
    notes_health: effectiveHealthNotes,
    is_favorite: input.is_favorite || false,
    eat_again: input.eat_again || false,
    is_skipped: isSkipped,
    skipped_reason: skippedReason,
    eaten_at: eatenAt,
  };

  let mealRow: any = null;
  const res1 = await supabase.from("meals").insert(fullPayload as any).select().single();

  if (!res1.error) {
    mealRow = res1.data;
  } else if (res1.error.code === "PGRST204" || res1.error.message?.includes("column")) {
    // If table doesn't have is_favorite / is_skipped / photo_urls columns, fallback gracefully
    const encodedTaste = encodeTasteNotes(input.notes_taste, input.is_favorite, input.eat_again);
    delete fullPayload.is_skipped;
    delete fullPayload.skipped_reason;
    delete fullPayload.photo_urls;
    delete fullPayload.is_favorite;
    delete fullPayload.eat_again;

    fullPayload.notes_taste = encodedTaste;

    const res2 = await supabase.from("meals").insert(fullPayload as any).select().single();
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
  const createdMeal: MealWithExpense = {
    ...mealRow,
    description: flags.description,
    location_type: flags.location_type,
    restaurant_name: flags.restaurant_name,
    is_favorite: flags.is_favorite,
    eat_again: flags.eat_again,
    is_skipped: flags.is_skipped,
    skipped_reason: flags.skipped_reason,
    notes_taste: flags.notes_taste,
    notes_health: flags.notes_health,
    photo_urls: flags.photo_urls.length > 0 ? flags.photo_urls : photoUrls,
  };

  // 3. Write Timeline Event: meal_logged
  const ratingText = createdMeal.rating ? ` (${createdMeal.rating}/5 stars)` : "";
  const costText = costPaise > 0 ? ` (${formatINR(costPaise)})` : "";
  const summaryText = createdMeal.is_skipped
    ? `SKIPPED ${createdMeal.meal_type.toUpperCase()}${createdMeal.skipped_reason ? ` • ${createdMeal.skipped_reason}` : " (Fasting)"}`
    : `${createdMeal.meal_type.toUpperCase()}: ${createdMeal.description}${costText}${ratingText}`;

  await writeTimelineEvent(supabase, {
    userId,
    type: "meal_logged",
    summary: summaryText,
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
      is_skipped: createdMeal.is_skipped,
      skipped_reason: createdMeal.skipped_reason,
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

  const isSkipped = input.is_skipped !== undefined ? input.is_skipped : (currentMeal.is_skipped || false);
  const skippedReason = input.skipped_reason !== undefined ? input.skipped_reason : currentMeal.skipped_reason;

  const effectiveDescription = isSkipped
    ? (input.description ? `[SKIPPED${skippedReason ? `:${skippedReason}` : ""}] ${input.description}` : `[SKIPPED${skippedReason ? `:${skippedReason}` : ""}] Skipped ${input.meal_type || currentMeal.meal_type}`)
    : (input.description !== undefined ? input.description : currentMeal.description);

  const effectiveHealthNotes = isSkipped && skippedReason
    ? (input.notes_health ? `[SKIPPED:${skippedReason}] ${input.notes_health}` : `[SKIPPED:${skippedReason}]`)
    : (input.notes_health !== undefined ? input.notes_health : currentMeal.notes_health);

  const loc = isSkipped ? "home" : (input.location_type !== undefined ? input.location_type : currentMeal.location_type);
  const isFreeLocation = isSkipped || loc === "home" || loc === "amrita_mess";
  const newCostPaise = isFreeLocation
    ? 0
    : input.cost_paise !== undefined
    ? input.cost_paise
    : (linkedExpense?.amount_paise || 0);

  const restaurantName =
    loc === "amrita_mess"
      ? (input.restaurant_name?.trim() || "Amrita Mess")
      : loc === "home"
      ? null
      : (input.restaurant_name !== undefined ? (input.restaurant_name?.trim() || null) : currentMeal.restaurant_name);

  // PostgreSQL safe location
  const dbLocationType = loc === "amrita_mess" ? "other" : loc;

  // Synchronize linked expense
  if (expenseId && newCostPaise > 0) {
    const placeDesc =
      loc === "restaurant" && restaurantName
        ? restaurantName
        : restaurantName || loc || "Dining";

    const desc = effectiveDescription || currentMeal.description;
    const mType = input.meal_type || currentMeal.meal_type;

    linkedExpense = await updateExpense(supabase, userId, expenseId, {
      amount_paise: newCostPaise,
      place: placeDesc,
      notes: `Meal (${mType}): ${desc}`,
      spent_at: input.eaten_at || currentMeal.eaten_at,
    });
  } else if (expenseId && newCostPaise === 0) {
    await deleteExpense(supabase, userId, expenseId);
    expenseId = null;
    linkedExpense = null;
  } else if (!expenseId && newCostPaise > 0) {
    const foodCatId = await getOrCreateFoodCategory(supabase, userId);
    const placeDesc =
      loc === "restaurant" && restaurantName
        ? restaurantName
        : restaurantName || loc || "Dining";

    const desc = effectiveDescription || currentMeal.description;
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

  const photoUrls = input.photo_urls !== undefined
    ? input.photo_urls
    : (input.photo_url ? [input.photo_url] : currentMeal.photo_urls || (currentMeal.photo_url ? [currentMeal.photo_url] : []));
  const primaryPhotoUrl = photoUrls[0] || input.photo_url || null;

  // Update Meal table
  const fullUpdatePayload: Record<string, unknown> = {
    meal_type: input.meal_type,
    description: effectiveDescription,
    location_type: dbLocationType,
    restaurant_name: restaurantName,
    expense_id: expenseId,
    rating: isSkipped ? null : input.rating,
    photo_url: primaryPhotoUrl,
    photo_urls: photoUrls,
    notes_taste: isSkipped ? null : input.notes_taste,
    notes_health: effectiveHealthNotes,
    is_favorite: input.is_favorite,
    eat_again: input.eat_again,
    is_skipped: isSkipped,
    skipped_reason: skippedReason,
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
    delete fullUpdatePayload.is_skipped;
    delete fullUpdatePayload.skipped_reason;
    delete fullUpdatePayload.photo_urls;
    delete fullUpdatePayload.is_favorite;
    delete fullUpdatePayload.eat_again;
    fullUpdatePayload.notes_taste = encodedTaste;

    updateRes = await supabase
      .from("meals")
      .update(fullUpdatePayload as any)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
  }

  if (updateRes.error || !updateRes.data) {
    console.error("[updateMeal] Error updating meal:", updateRes.error);
    return null;
  }

  const flags = decodeMealFlags(updateRes.data);
  return {
    ...(updateRes.data as Meal),
    description: flags.description,
    location_type: flags.location_type,
    restaurant_name: flags.restaurant_name,
    is_favorite: flags.is_favorite,
    eat_again: flags.eat_again,
    is_skipped: flags.is_skipped,
    skipped_reason: flags.skipped_reason,
    notes_taste: flags.notes_taste,
    notes_health: flags.notes_health,
    photo_urls: flags.photo_urls.length > 0 ? flags.photo_urls : photoUrls,
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
 * Fetches meals marked as favorite.
 */
export async function getFavoriteMeals(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MealWithExpense[]> {
  const allMeals = await getMeals(supabase, userId);
  return allMeals.filter((m) => m.is_favorite === true);
}

/**
 * Fetches unique places and restaurants marked with "Eat Again" or rating >= 4.
 * Excludes Home and Amrita Mess so it remains a curated dining directory.
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
    // Exclude home and amrita_mess from outside dining directory
    if (m.location_type === "home" || m.location_type === "amrita_mess") return;
    const place = m.restaurant_name?.trim();
    if (!place) return;
    const lower = place.toLowerCase();
    if (lower === "home" || lower === "amrita mess" || lower === "amrita_mess" || lower === "kitchen") return;

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
