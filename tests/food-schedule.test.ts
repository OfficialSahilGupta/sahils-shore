// ============================================================================
// Sahil's Shore: Meal Schedule & Regular Timing Engine Tests
// Validates:
// 1. Sahil's regular meal schedule definitions (Breakfast, Lunch, Snacks, Dinner)
// 2. 24-hr to 12-hr time string conversions & range formatting
// 3. Smart next meal slot recommendation algorithm
// 4. Pre-fill datetime generation across target dates and slot defaults
// 5. Window boundary detection for regular vs irregular dining days
// ============================================================================

import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MEAL_SCHEDULE,
  format24To12,
  formatRangeDisplay,
  getSmartNextMealSlot,
  getDefaultMealDateTime,
  isMealInRegularWindow,
} from "../lib/food/schedule.ts";

describe("1. Sahil's Default Regular Meal Schedule", () => {
  test("defines all 4 daily meal slots with exact requested time ranges", () => {
    // Breakfast: around 7:30 to 8:30
    const breakfast = DEFAULT_MEAL_SCHEDULE.breakfast;
    assert.equal(breakfast.startTime, "07:30");
    assert.equal(breakfast.endTime, "08:30");
    assert.equal(breakfast.typicalTime, "08:00");
    assert.equal(breakfast.displayRange, "7:30 AM – 8:30 AM");

    // Lunch: around 12:00 to 1:15 PM (13:15)
    const lunch = DEFAULT_MEAL_SCHEDULE.lunch;
    assert.equal(lunch.startTime, "12:00");
    assert.equal(lunch.endTime, "13:15");
    assert.equal(lunch.typicalTime, "12:45");
    assert.equal(lunch.displayRange, "12:00 PM – 1:15 PM");

    // Snacks: around 4:30 to 5:15 PM (16:30 to 17:15)
    const snack = DEFAULT_MEAL_SCHEDULE.snack;
    assert.equal(snack.startTime, "16:30");
    assert.equal(snack.endTime, "17:15");
    assert.equal(snack.typicalTime, "17:00");
    assert.equal(snack.displayRange, "4:30 PM – 5:15 PM");

    // Dinner: around 7:00 to 8:00 PM (19:00 to 20:00)
    const dinner = DEFAULT_MEAL_SCHEDULE.dinner;
    assert.equal(dinner.startTime, "19:00");
    assert.equal(dinner.endTime, "20:00");
    assert.equal(dinner.typicalTime, "19:30");
    assert.equal(dinner.displayRange, "7:00 PM – 8:00 PM");
  });
});

describe("2. 24-Hour to 12-Hour Converter & Range Formatting", () => {
  test("accurately converts 24-hr times to 12-hr AM/PM strings", () => {
    assert.equal(format24To12("07:30"), "7:30 AM");
    assert.equal(format24To12("08:00"), "8:00 AM");
    assert.equal(format24To12("12:00"), "12:00 PM");
    assert.equal(format24To12("12:45"), "12:45 PM");
    assert.equal(format24To12("13:15"), "1:15 PM");
    assert.equal(format24To12("16:30"), "4:30 PM");
    assert.equal(format24To12("17:00"), "5:00 PM");
    assert.equal(format24To12("17:15"), "5:15 PM");
    assert.equal(format24To12("19:00"), "7:00 PM");
    assert.equal(format24To12("19:30"), "7:30 PM");
    assert.equal(format24To12("20:00"), "8:00 PM");
  });

  test("generates formatted range display cleanly", () => {
    assert.equal(formatRangeDisplay("07:30", "08:30"), "7:30 AM – 8:30 AM");
    assert.equal(formatRangeDisplay("12:00", "13:15"), "12:00 PM – 1:15 PM");
    assert.equal(formatRangeDisplay("16:30", "17:15"), "4:30 PM – 5:15 PM");
    assert.equal(formatRangeDisplay("19:00", "20:00"), "7:00 PM – 8:00 PM");
  });
});

describe("3. Smart Next Meal Slot Recommendation", () => {
  test("recommends breakfast during morning hours up to 10:30 AM", () => {
    const morningDate = new Date("2026-11-06T08:15:00");
    assert.equal(getSmartNextMealSlot(morningDate), "breakfast");

    const earlyDate = new Date("2026-11-06T07:30:00");
    assert.equal(getSmartNextMealSlot(earlyDate), "breakfast");
  });

  test("recommends lunch from mid-morning until afternoon", () => {
    const noonDate = new Date("2026-11-06T12:30:00");
    assert.equal(getSmartNextMealSlot(noonDate), "lunch");

    const midAfternoon = new Date("2026-11-06T14:45:00");
    assert.equal(getSmartNextMealSlot(midAfternoon), "lunch");
  });

  test("recommends snack during late afternoon / evening tea hours", () => {
    const snackTime = new Date("2026-11-06T17:00:00");
    assert.equal(getSmartNextMealSlot(snackTime), "snack");
  });

  test("recommends dinner during evening and night hours", () => {
    const dinnerTime = new Date("2026-11-06T19:45:00");
    assert.equal(getSmartNextMealSlot(dinnerTime), "dinner");

    const lateNight = new Date("2026-11-06T22:30:00");
    assert.equal(getSmartNextMealSlot(lateNight), "dinner");
  });
});

describe("4. Datetime Pre-filling for Regular and Irregular Days", () => {
  test("attaches typical regular meal time to target past or future dates", () => {
    // Past date logging:
    const breakfastIso = getDefaultMealDateTime("2026-11-01", "breakfast");
    assert.equal(breakfastIso, "2026-11-01T08:00");

    const lunchIso = getDefaultMealDateTime("2026-11-02", "lunch");
    assert.equal(lunchIso, "2026-11-02T12:45");

    const snackIso = getDefaultMealDateTime("2026-11-03", "snack");
    assert.equal(snackIso, "2026-11-03T17:00");

    const dinnerIso = getDefaultMealDateTime("2026-11-04", "dinner");
    assert.equal(dinnerIso, "2026-11-04T19:30");
  });
});

describe("5. Meal Window Adherence vs Irregular Days", () => {
  test("identifies when meal falls within regular schedule window", () => {
    // Breakfast window: 07:30 to 08:30 IST (+05:30)
    const inWindowBreakfast = "2026-11-06T08:00:00+05:30";
    assert.equal(isMealInRegularWindow(inWindowBreakfast, "breakfast"), true);

    // Lunch window: 12:00 to 13:15 IST
    const inWindowLunch = "2026-11-06T12:45:00+05:30";
    assert.equal(isMealInRegularWindow(inWindowLunch, "lunch"), true);

    // Snack window: 16:30 to 17:15 IST
    const inWindowSnack = "2026-11-06T17:05:00+05:30";
    assert.equal(isMealInRegularWindow(inWindowSnack, "snack"), true);

    // Dinner window: 19:00 to 20:00 IST
    const inWindowDinner = "2026-11-06T19:30:00+05:30";
    assert.equal(isMealInRegularWindow(inWindowDinner, "dinner"), true);
  });

  test("flags irregular days when meals are taken outside the regular window", () => {
    // Irregular day: woke up late, had breakfast at 10:45 AM IST
    const irregularBreakfast = "2026-11-06T10:45:00+05:30";
    assert.equal(isMealInRegularWindow(irregularBreakfast, "breakfast"), false);

    // Irregular day: late night dinner at 22:30 IST
    const irregularDinner = "2026-11-06T22:30:00+05:30";
    assert.equal(isMealInRegularWindow(irregularDinner, "dinner"), false);
  });
});
