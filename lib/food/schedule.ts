// ============================================================================
// Sahil's Shore: Meal Schedule & Regular Timing Configuration
// Manages Sahil's regular meal timings:
// - Breakfast: 07:30 to 08:30 (typical 08:00)
// - Lunch: 12:00 to 13:15 (typical 12:45)
// - Snacks: 16:30 to 17:15 (typical 17:00)
// - Dinner: 19:00 to 20:00 (typical 19:30)
// Fully editable per meal (datetime-local + quick chips) and system-wide (localStorage).
// ============================================================================

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";
import { todayIST } from "../date-utils.ts";

export interface MealSlotConfig {
  type: MealType;
  label: string;
  startTime: string; // 24-hr "HH:MM", e.g. "07:30"
  endTime: string;   // 24-hr "HH:MM", e.g. "08:30"
  typicalTime: string; // 24-hr "HH:MM", e.g. "08:00"
  displayRange: string; // e.g. "7:30 AM – 8:30 AM"
  quickTimes: string[]; // 24-hr shortcuts, e.g. ["07:30", "08:00", "08:30"]
}

export type MealSchedule = Record<MealType, MealSlotConfig>;

export const DEFAULT_MEAL_SCHEDULE: MealSchedule = {
  breakfast: {
    type: "breakfast",
    label: "Breakfast",
    startTime: "07:30",
    endTime: "08:30",
    typicalTime: "08:00",
    displayRange: "7:30 AM – 8:30 AM",
    quickTimes: ["07:30", "08:00", "08:30"],
  },
  lunch: {
    type: "lunch",
    label: "Lunch",
    startTime: "12:00",
    endTime: "13:15",
    typicalTime: "12:45",
    displayRange: "12:00 PM – 1:15 PM",
    quickTimes: ["12:00", "12:45", "13:15"],
  },
  snack: {
    type: "snack",
    label: "Snacks",
    startTime: "16:30",
    endTime: "17:15",
    typicalTime: "17:00",
    displayRange: "4:30 PM – 5:15 PM",
    quickTimes: ["16:30", "17:00", "17:15"],
  },
  dinner: {
    type: "dinner",
    label: "Dinner",
    startTime: "19:00",
    endTime: "20:00",
    typicalTime: "19:30",
    displayRange: "7:00 PM – 8:00 PM",
    quickTimes: ["19:00", "19:30", "20:00"],
  },
};

export const STORAGE_MEAL_SCHEDULE_KEY = "shore_meal_schedule";

/**
 * Converts 24-hr "HH:MM" string to 12-hr format (e.g. "07:30" -> "7:30 AM", "13:15" -> "1:15 PM").
 */
export function format24To12(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24;
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;

  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  const mFmt = m < 10 ? `0${m}` : `${m}`;
  return `${h}:${mFmt} ${ampm}`;
}

/**
 * Generates a friendly display range: "7:30 AM – 8:30 AM"
 */
export function formatRangeDisplay(start24: string, end24: string): string {
  return `${format24To12(start24)} – ${format24To12(end24)}`;
}

/**
 * Loads meal schedule from localStorage with fallback to Sahil's default schedule.
 */
export function getMealSchedule(): MealSchedule {
  if (typeof window === "undefined") {
    return DEFAULT_MEAL_SCHEDULE;
  }

  try {
    const raw = localStorage.getItem(STORAGE_MEAL_SCHEDULE_KEY);
    if (!raw) return DEFAULT_MEAL_SCHEDULE;

    const parsed = JSON.parse(raw);
    const schedule: MealSchedule = { ...DEFAULT_MEAL_SCHEDULE };

    for (const key of ["breakfast", "lunch", "snack", "dinner"] as MealType[]) {
      if (parsed[key]) {
        const item = parsed[key];
        const start = item.startTime || DEFAULT_MEAL_SCHEDULE[key].startTime;
        const end = item.endTime || DEFAULT_MEAL_SCHEDULE[key].endTime;
        const typical = item.typicalTime || DEFAULT_MEAL_SCHEDULE[key].typicalTime;
        schedule[key] = {
          type: key,
          label: DEFAULT_MEAL_SCHEDULE[key].label,
          startTime: start,
          endTime: end,
          typicalTime: typical,
          displayRange: formatRangeDisplay(start, end),
          quickTimes: [start, typical, end],
        };
      }
    }
    return schedule;
  } catch {
    return DEFAULT_MEAL_SCHEDULE;
  }
}

/**
 * Persists an edited meal schedule to localStorage and emits an update event.
 */
export function saveMealSchedule(schedule: MealSchedule): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_MEAL_SCHEDULE_KEY, JSON.stringify(schedule));
    window.dispatchEvent(new Event("shore_meal_schedule_changed"));
  } catch (err) {
    console.error("Failed to save meal schedule:", err);
  }
}

/**
 * Resets meal schedule to Sahil's default timings.
 */
export function resetMealSchedule(): MealSchedule {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_MEAL_SCHEDULE_KEY);
      window.dispatchEvent(new Event("shore_meal_schedule_changed"));
    } catch {}
  }
  return DEFAULT_MEAL_SCHEDULE;
}

/**
 * Determines the smart upcoming or active meal slot based on current time.
 */
export function getSmartNextMealSlot(
  now: Date = new Date(),
  schedule: MealSchedule = DEFAULT_MEAL_SCHEDULE
): MealType {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const bEnd = parseMinutes(schedule.breakfast.endTime);
  const lEnd = parseMinutes(schedule.lunch.endTime);
  const sEnd = parseMinutes(schedule.snack.endTime);

  // Transition cutoffs with comfortable buffer
  // Before breakfast ends + 2 hours (approx 10:30 AM): breakfast
  if (currentMinutes < bEnd + 120) return "breakfast";
  // Before lunch ends + 2 hours (approx 3:15 PM): lunch
  if (currentMinutes < lEnd + 120) return "lunch";
  // Before snack ends + 1.25 hours (approx 6:30 PM): snack
  if (currentMinutes < sEnd + 75) return "snack";
  // Otherwise dinner
  return "dinner";
}

/**
 * Computes an ISO-compatible "YYYY-MM-DDTHH:mm" for the datetime-local picker:
 * - If dateIST is a past/future date, defaults to that slot's typical regular time.
 * - If dateIST is today:
 *   - If current time is close to that slot (within 60 mins), uses current time.
 *   - Otherwise defaults to that slot's typical regular time.
 */
export function getDefaultMealDateTime(
  dateIST?: string,
  mealType: MealType = "lunch",
  schedule: MealSchedule = DEFAULT_MEAL_SCHEDULE
): string {
  const targetDateStr = dateIST || todayIST();
  const slot = schedule[mealType] || DEFAULT_MEAL_SCHEDULE[mealType];
  const typicalTime = slot.typicalTime || "12:45";

  const today = todayIST();
  if (targetDateStr === today) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM] = slot.endTime.split(":").map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    // If current time is within or within 45 mins of window, use current instant
    if (currentMins >= startMins - 45 && currentMins <= endMins + 45) {
      const tzOffset = now.getTimezoneOffset() * 60000;
      return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    }
  }

  // Otherwise, default cleanly to the slot's regular typical time on target date
  return `${targetDateStr}T${typicalTime}`;
}

/**
 * Checks whether a given timestamp falls within the slot's regular window.
 */
export function isMealInRegularWindow(
  isoDate: string,
  mealType: MealType,
  schedule: MealSchedule = DEFAULT_MEAL_SCHEDULE
): boolean {
  if (!isoDate) return true;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return true;

  // Format in IST time
  const istFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = istFormatter.formatToParts(d);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const min = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const currentMins = hour * 60 + min;

  const slot = schedule[mealType] || DEFAULT_MEAL_SCHEDULE[mealType];
  const [startH, startM] = slot.startTime.split(":").map(Number);
  const [endH, endM] = slot.endTime.split(":").map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  return currentMins >= startMins && currentMins <= endMins;
}
