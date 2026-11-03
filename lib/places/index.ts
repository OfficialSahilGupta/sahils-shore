// ============================================================================
// Sahil's Shore: Places & Map Data Access Layer
// Location tracking, Leaflet map coordinates, visit history, and linked data
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import type { MediaItem } from "../media/index.ts";
import type { Expense, Meal } from "../../types/index.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { currentYearMonthIST, formatISTDate } from "../date-utils.ts";

export type PlaceCategory =
  | "cafe"
  | "restaurant"
  | "travel"
  | "study spot"
  | "gym"
  | "other";

export interface Place {
  id: string;
  user_id: string;
  name: string;
  category: PlaceCategory;
  visited_at: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  linked_media_count?: number;
  linked_expenses_total_paise?: number;
}

export interface PlaceInput {
  name: string;
  category?: PlaceCategory;
  visited_at?: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  notes?: string | null;
}

export interface PlaceCategoryConfig {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  iconName: "coffee" | "utensils" | "plane" | "book-open" | "dumbbell" | "map-pin";
}

export const PLACE_CATEGORIES: Record<PlaceCategory, PlaceCategoryConfig> = {
  cafe: {
    label: "Cafe",
    color: "#E0A458",
    bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-500/30",
    iconName: "coffee",
  },
  restaurant: {
    label: "Restaurant",
    color: "#D1495B",
    bgClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    borderClass: "border-rose-500/30",
    iconName: "utensils",
  },
  travel: {
    label: "Travel",
    color: "#1F7A8C",
    bgClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    borderClass: "border-cyan-500/30",
    iconName: "plane",
  },
  "study spot": {
    label: "Study Spot",
    color: "#4FB3C8",
    bgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500/30",
    iconName: "book-open",
  },
  gym: {
    label: "Gym & Fitness",
    color: "#2E9E6B",
    bgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-500/30",
    iconName: "dumbbell",
  },
  other: {
    label: "Other",
    color: "#8FA3B0",
    bgClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    borderClass: "border-slate-500/30",
    iconName: "map-pin",
  },
};

/**
 * Fetches all places visited by the user, ordered by visited_at desc.
 */
export async function getPlaces(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { category?: string; search?: string }
): Promise<Place[]> {
  try {
    let query = supabase
      .from("places")
      .select("*")
      .eq("user_id", userId)
      .order("visited_at", { ascending: false });

    if (options?.category && options.category !== "all") {
      query = query.eq("category", options.category);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[getPlaces] Query error:", error.message);
      return [];
    }

    let places = (data || []) as Place[];

    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim();
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.notes?.toLowerCase().includes(term)
      );
    }

    return places;
  } catch (err) {
    console.error("[getPlaces] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches a single place by ID.
 */
export async function getPlaceById(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<Place | null> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as Place;
}

/**
 * Creates a new place and writes a row to timeline_events.
 */
export async function createPlace(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: PlaceInput
): Promise<Place | null> {
  try {
    const visitedAt = input.visited_at || new Date().toISOString();

    const { data, error } = await supabase
      .from("places")
      .insert({
        user_id: userId,
        name: input.name,
        category: input.category || "cafe",
        visited_at: visitedAt,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        rating: input.rating ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[createPlace] Insert failed:", error?.message);
      return null;
    }

    const saved = data as Place;

    // Write to unified timeline
    await writeTimelineEvent(supabase, {
      userId,
      type: "place_visited",
      summary: `Visited ${saved.name} (${saved.category})`,
      occurredAt: visitedAt,
      refTable: "places",
      refId: saved.id,
      meta: {
        name: saved.name,
        category: saved.category,
        rating: saved.rating,
        lat: saved.lat,
        lng: saved.lng,
      },
    });

    return saved;
  } catch (err) {
    console.error("[createPlace] Unexpected error:", err);
    return null;
  }
}

/**
 * Updates an existing place.
 */
export async function updatePlace(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  updates: Partial<PlaceInput>
): Promise<Place | null> {
  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.visited_at !== undefined) payload.visited_at = updates.visited_at;
    if (updates.lat !== undefined) payload.lat = updates.lat;
    if (updates.lng !== undefined) payload.lng = updates.lng;
    if (updates.rating !== undefined) payload.rating = updates.rating;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from("places")
      .update(payload as any)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) return null;
    return data as Place;
  } catch (err) {
    console.error("[updatePlace] Unexpected error:", err);
    return null;
  }
}

/**
 * Deletes a place.
 */
export async function deletePlace(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("places")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

/**
 * Filters places visited in the current IST calendar month.
 */
export function filterPlacesThisMonth(
  places: Place[],
  targetYearMonth: string = currentYearMonthIST()
): Place[] {
  return places.filter((p) => {
    const placeDate = formatISTDate(p.visited_at);
    return placeDate.startsWith(targetYearMonth);
  });
}

export interface PlaceWithDetails {
  place: Place;
  media: MediaItem[];
  meals: Meal[];
  expenses: Expense[];
  totalSpentPaise: number;
}

/**
 * Aggregates "Everything from this visit" for a place:
 * Linked photos/videos, linked meals, and linked expenses + total spend in paise.
 */
export async function getPlaceDetailsWithLinkedData(
  supabase: SupabaseClient<Database>,
  userId: string,
  placeId: string
): Promise<PlaceWithDetails | null> {
  try {
    const place = await getPlaceById(supabase, userId, placeId);
    if (!place) return null;

    // 1. Linked Media items
    const { data: mediaRows } = await supabase
      .from("media_items")
      .select("*")
      .eq("user_id", userId)
      .filter("links->>place_id", "eq", placeId);

    const media = (mediaRows || []).map((m) => ({
      ...m,
      links: (m.links as unknown as Record<string, unknown>) || {},
    })) as MediaItem[];

    // 2. Linked Meals (by place name or place_id)
    const { data: mealRows } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .ilike("place", place.name);

    const meals = (mealRows || []) as unknown as Meal[];

    // 3. Linked Expenses (by place name match)
    const { data: expenseRows } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .ilike("place", place.name);

    const expenses = (expenseRows || []) as unknown as Expense[];

    // 4. Calculate total spent at this place in integer paise
    const totalSpentPaise = expenses.reduce((sum, exp) => sum + (exp.amount_paise || 0), 0);

    return {
      place,
      media,
      meals,
      expenses,
      totalSpentPaise,
    };
  } catch (err) {
    console.error("[getPlaceDetailsWithLinkedData] Error:", err);
    return null;
  }
}
