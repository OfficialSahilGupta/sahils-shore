// ============================================================================
// Sahil's Shore: Life Analytics & Pearson Correlation Engine
// Mood vs. Productivity vs. Spending analysis with scientific disclaimers
// ============================================================================

import type {
  DailyCorrelationPoint,
  CorrelationMetric,
  PlacesAnalyticsSummary,
  MealsAnalyticsSummary,
  LifeCorrelationsSummary,
} from "./types";
import { paiseToRupees } from "../expenses/index.ts";
import { utcToZonedDate } from "../date-utils.ts";

export interface RawJournalEntry {
  date: string; // YYYY-MM-DD
  mood?: number | null; // 1-5
  energy?: number | null; // 1-5
}

export interface RawPlaceVisit {
  id: string;
  name: string;
  category?: string | null;
  visited_at?: string | null;
}

export interface RawMeal {
  id: string;
  slot: string; // breakfast, lunch, snack, dinner
  restaurant?: string | null;
  cost_paise?: number | null;
  eaten_at?: string | null;
}

/**
 * Calculates Pearson correlation coefficient (r) between two numeric arrays.
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length < 2 || x.length !== y.length) return 0;

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  const r = numerator / denominator;
  return Math.round(r * 100) / 100;
}

/**
 * Classifies Pearson r into human-friendly strength and direction.
 */
export function interpretCorrelation(
  r: number,
  type: "mood_prod" | "mood_spend" | "prod_spend"
): CorrelationMetric {
  const abs = Math.abs(r);
  let direction: "positive" | "negative" | "none" = "none";
  let strength: "strong" | "moderate" | "weak" | "none" = "none";

  if (abs >= 0.6) strength = "strong";
  else if (abs >= 0.35) strength = "moderate";
  else if (abs >= 0.15) strength = "weak";

  if (r > 0.05) direction = "positive";
  else if (r < -0.05) direction = "negative";

  let label = `${direction === "positive" ? "Positive" : direction === "negative" ? "Negative" : "Neutral"} (${r >= 0 ? "+" : ""}${r})`;
  let interpretation = "";

  if (type === "mood_prod") {
    if (strength === "none") {
      interpretation = "Mood and daily productivity flow largely independently in this period.";
    } else if (direction === "positive") {
      interpretation = "Elevated mood strongly coincides with higher task completion and focus hours.";
    } else {
      interpretation = "High productivity days occasionally coincided with lower self-reported mood or fatigue.";
    }
  } else if (type === "mood_spend") {
    if (strength === "none") {
      interpretation = "Daily expenditures show virtually zero link with emotional mood swings.";
    } else if (direction === "positive") {
      interpretation = "Celebratory or social spending tended to occur on higher-mood days.";
    } else {
      interpretation = "Impulse or stress-related expenses appeared slightly more on lower-mood days.";
    }
  } else {
    // prod_spend
    if (strength === "none") {
      interpretation = "Spending pace has minimal correlation with your study/work output.";
    } else if (direction === "positive") {
      interpretation = "Productive outings (cafes, study materials, tech tools) correspond with higher spend.";
    } else {
      interpretation = "Deepest focus days were low-spend days spent entirely at home.";
    }
  }

  return {
    r,
    direction,
    strength,
    label,
    interpretation,
  };
}

/**
 * Aggregates Places visited in period.
 */
export function computePlacesSummary(places: RawPlaceVisit[]): PlacesAnalyticsSummary {
  const placeMap: Record<string, { count: number; category: string }> = {};

  for (const p of places) {
    const name = (p.name || "").trim();
    if (!name) continue;
    if (!placeMap[name]) {
      placeMap[name] = { count: 0, category: p.category || "General" };
    }
    placeMap[name].count += 1;
  }

  const sorted = Object.entries(placeMap)
    .map(([name, data]) => ({ name, visits: data.count, category: data.category }))
    .sort((a, b) => b.visits - a.visits);

  return {
    totalVisits: places.length,
    uniquePlacesCount: sorted.length,
    topPlaces: sorted.slice(0, 5),
  };
}

/**
 * Aggregates meals by dining type (Home vs Restaurant vs Other).
 */
export function computeMealsSummary(meals: RawMeal[]): MealsAnalyticsSummary {
  let homeMeals = 0;
  let restaurantMeals = 0;
  let otherMeals = 0;
  let outsideFoodPaise = 0;

  const eateryMap: Record<string, { count: number; spendPaise: number }> = {};

  for (const m of meals) {
    const rest = (m.restaurant || "").trim();
    const cost = Number(m.cost_paise) || 0;

    if (!rest || rest.toLowerCase().includes("home")) {
      homeMeals += 1;
    } else {
      restaurantMeals += 1;
      outsideFoodPaise += cost;
      if (!eateryMap[rest]) {
        eateryMap[rest] = { count: 0, spendPaise: 0 };
      }
      eateryMap[rest].count += 1;
      eateryMap[rest].spendPaise += cost;
    }
  }

  const topEateries = Object.entries(eateryMap)
    .map(([name, data]) => ({ name, count: data.count, spendPaise: data.spendPaise }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalLogged: meals.length,
    homeMeals,
    restaurantMeals,
    otherMeals,
    outsideFoodPaise,
    outsideFoodRupees: paiseToRupees(outsideFoodPaise),
    topEateries,
  };
}
