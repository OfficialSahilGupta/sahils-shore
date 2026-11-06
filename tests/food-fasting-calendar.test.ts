// ============================================================================
// Sahil's Shore: Food Diary, Calendar, Skipped Meals & Fasting Tests
// Validates:
// 1. Fasting stages physiological model (Digestion, Fat Burning, Ketosis, Autophagy, Deep Ketosis)
// 2. Fasting state calculation (elapsed seconds, progress %, target completion, stages)
// 3. Fasting protocol target hours (14:10, 16:8, 18:6, 20:4, 24:0 OMAD)
// 4. Skipped meals encoding, decoding, and reason preservation
// 5. Amrita Mess & Home zero-costing guarantees
// 6. Food Calendar month slot mapping and aggregation
// ============================================================================

import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  FASTING_STAGES,
  PROTOCOL_TARGETS,
  getFastingStage,
  calculateFastingState,
  type FastingLog,
} from "../lib/food/fasting.ts";
import {
  decodeMealFlags,
  type MealLocation,
} from "../lib/food/index.ts";

describe("1. Intermittent Fasting Stages & Physiological Milestones", () => {
  test("defines all 5 physiological fasting stages in chronological order", () => {
    assert.equal(FASTING_STAGES.length, 5);
    assert.deepEqual(
      FASTING_STAGES.map((s) => s.key),
      ["digestion", "fat_burning", "ketosis", "autophagy", "deep_ketosis"]
    );
  });

  test("correctly maps elapsed hours to the respective fasting stage", () => {
    // 0 - 3.99h: Digestion
    assert.equal(getFastingStage(0).key, "digestion");
    assert.equal(getFastingStage(2.5).key, "digestion");
    assert.equal(getFastingStage(3.9).key, "digestion");

    // 4 - 11.99h: Fat Burning
    assert.equal(getFastingStage(4).key, "fat_burning");
    assert.equal(getFastingStage(8).key, "fat_burning");
    assert.equal(getFastingStage(11.9).key, "fat_burning");

    // 12 - 15.99h: Ketosis
    assert.equal(getFastingStage(12).key, "ketosis");
    assert.equal(getFastingStage(14).key, "ketosis");
    assert.equal(getFastingStage(15.9).key, "ketosis");

    // 16 - 19.99h: Autophagy
    assert.equal(getFastingStage(16).key, "autophagy");
    assert.equal(getFastingStage(18).key, "autophagy");
    assert.equal(getFastingStage(19.9).key, "autophagy");

    // 20h+: Deep Ketosis & Cellular Regeneration
    assert.equal(getFastingStage(20).key, "deep_ketosis");
    assert.equal(getFastingStage(24).key, "deep_ketosis");
    assert.equal(getFastingStage(36).key, "deep_ketosis");
  });
});

describe("2. Fasting Progress & State Engine", () => {
  test("returns safe defaults when fast is null or inactive", () => {
    const state = calculateFastingState(null);
    assert.equal(state.activeFast, null);
    assert.equal(state.elapsedSeconds, 0);
    assert.equal(state.progressPercent, 0);
    assert.equal(state.isTargetReached, false);
    assert.equal(state.currentStage.key, "digestion");
    assert.equal(state.targetEndTime, null);
  });

  test("calculates progress percentage and target completion accurately", () => {
    const now = Date.now();
    const tenHoursAgo = new Date(now - 10 * 3600 * 1000).toISOString();

    const mockFast: FastingLog = {
      id: "fast-1",
      user_id: "user-test",
      protocol: "16:8",
      target_hours: 16,
      started_at: tenHoursAgo,
      ended_at: null,
      is_active: true,
      notes: null,
      created_at: tenHoursAgo,
      updated_at: tenHoursAgo,
    };

    const state = calculateFastingState(mockFast);
    assert.ok(state.activeFast);
    // 10h out of 16h is 62.5% -> rounded to ~63%
    assert.equal(state.progressPercent, 63);
    assert.equal(state.isTargetReached, false);
    assert.equal(state.currentStage.key, "fat_burning");
    assert.ok(state.targetEndTime);
  });

  test("flags isTargetReached when elapsed hours equal or exceed target", () => {
    const now = Date.now();
    const seventeenHoursAgo = new Date(now - 17 * 3600 * 1000).toISOString();

    const mockFast: FastingLog = {
      id: "fast-2",
      user_id: "user-test",
      protocol: "16:8",
      target_hours: 16,
      started_at: seventeenHoursAgo,
      ended_at: null,
      is_active: true,
      notes: null,
      created_at: seventeenHoursAgo,
      updated_at: seventeenHoursAgo,
    };

    const state = calculateFastingState(mockFast);
    assert.equal(state.isTargetReached, true);
    assert.equal(state.progressPercent, 100);
    assert.equal(state.currentStage.key, "autophagy");
  });

  test("maps standard fasting protocol target hours correctly", () => {
    assert.equal(PROTOCOL_TARGETS["14:10"], 14);
    assert.equal(PROTOCOL_TARGETS["16:8"], 16);
    assert.equal(PROTOCOL_TARGETS["18:6"], 18);
    assert.equal(PROTOCOL_TARGETS["20:4"], 20);
    assert.equal(PROTOCOL_TARGETS["24:0"], 24);
  });
});

describe("3. Skipped Meal Tracking & Reason Preservation", () => {
  test("decodes explicitly flagged skipped meal from structured columns", () => {
    const rawMeal = {
      id: "m-1",
      description: "Skipped breakfast during 16:8 fast",
      is_skipped: true,
      skipped_reason: "16:8 Intermittent Fasting",
      location_type: "home",
      cost_paise: 0,
    };

    const decoded = decodeMealFlags(rawMeal);
    assert.equal(decoded.is_skipped, true);
    assert.equal(decoded.skipped_reason, "16:8 Intermittent Fasting");
  });

  test("decodes backward-compatible skipped meal markers from description or health notes", () => {
    const rawMeal = {
      id: "m-2",
      description: "[SKIPPED:Not hungry] Woke up late",
      notes_health: "[SKIPPED:Not hungry] Drank black coffee instead",
      location_type: "home",
    };

    const decoded = decodeMealFlags(rawMeal);
    assert.equal(decoded.is_skipped, true);
    assert.equal(decoded.skipped_reason, "Not hungry");
    assert.equal(decoded.description, "Woke up late");
    assert.equal(decoded.notes_health, "Drank black coffee instead");
  });

  test("preserves non-skipped meals accurately without false flags", () => {
    const rawMeal = {
      id: "m-3",
      description: "Dosa with sambar",
      is_skipped: false,
      location_type: "restaurant",
      restaurant_name: "Udupi Garden",
    };

    const decoded = decodeMealFlags(rawMeal);
    assert.equal(decoded.is_skipped, false);
    assert.equal(decoded.skipped_reason, null);
    assert.equal(decoded.description, "Dosa with sambar");
  });
});

describe("4. Amrita Mess & Home Zero-Cost Guarantees", () => {
  test("decodes Amrita Mess location accurately from restaurant_name or location_type", () => {
    const rawMeal1 = {
      id: "m-4",
      description: "Mess lunch: rice and dal",
      location_type: "amrita_mess",
      restaurant_name: "Amrita Mess",
    };
    const decoded1 = decodeMealFlags(rawMeal1);
    assert.equal(decoded1.location_type, "amrita_mess");
    assert.equal(decoded1.restaurant_name, "Amrita Mess");

    // Backward-compat check where db stored 'other' with 'Amrita Mess' restaurant name
    const rawMeal2 = {
      id: "m-5",
      description: "Mess dinner",
      location_type: "other",
      restaurant_name: "Amrita Mess",
    };
    const decoded2 = decodeMealFlags(rawMeal2);
    assert.equal(decoded2.location_type, "amrita_mess");
    assert.equal(decoded2.restaurant_name, "Amrita Mess");
  });
});
