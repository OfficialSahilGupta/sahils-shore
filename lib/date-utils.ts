// ============================================================================
// Sahil's Shore: Date & IST (Asia/Kolkata) Utilities
// Core helper for time conversions, IST day-boundary detection, and calendar grids
// ============================================================================

export const IST_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MINUTES = 330; // UTC+05:30

/**
 * Returns a new Date object representing the current instant.
 */
export function nowUTC(): Date {
  return new Date();
}

/**
 * Formats a Date or UTC ISO string into an IST calendar date string: "YYYY-MM-DD"
 * Critical for handling day boundaries: 18:30 UTC = 00:00 IST next day.
 */
export function getISTDateString(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  // Format using Intl in Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(d); // Returns "YYYY-MM-DD"
}

/**
 * Returns the current IST date string "YYYY-MM-DD"
 */
export function todayIST(): string {
  return getISTDateString(new Date());
}

/**
 * Returns tomorrow's IST date string "YYYY-MM-DD"
 */
export function tomorrowIST(): string {
  return addDaysIST(todayIST(), 1);
}

/**
 * Returns yesterday's IST date string "YYYY-MM-DD"
 */
export function yesterdayIST(): string {
  return addDaysIST(todayIST(), -1);
}

/**
 * Adds or subtracts days from an IST date string "YYYY-MM-DD"
 */
export function addDaysIST(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Create date at noon UTC to prevent DST or timezone edge slips
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  d.setUTCDate(d.getUTCDate() + days);
  return getISTDateString(d);
}

/**
 * Calculates day difference between two "YYYY-MM-DD" strings (b - a)
 */
export function diffDaysIST(dateA: string, dateB: string): number {
  const [y1, m1, d1] = dateA.split("-").map(Number);
  const [y2, m2, d2] = dateB.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Formats an IST date string "YYYY-MM-DD" or Date into human-friendly format
 * e.g., "Today", "Tomorrow", "Yesterday", or "Mon, 2 Nov"
 */
export function formatFriendlyISTDate(dateStrOrDate: string | Date): string {
  const dateStr =
    typeof dateStrOrDate === "string" && dateStrOrDate.length === 10
      ? dateStrOrDate
      : getISTDateString(dateStrOrDate);

  const today = todayIST();
  if (dateStr === today) return "Today";
  if (dateStr === tomorrowIST()) return "Tomorrow";
  if (dateStr === yesterdayIST()) return "Yesterday";

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 6, 0, 0)); // 6 AM UTC = 11:30 AM IST
  const currentYear = new Date().getFullYear();

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: y !== currentYear ? "numeric" : undefined,
  }).format(date);
}

/**
 * Formats a time string ("HH:MM" or "HH:MM:SS") or Date to 12-hour IST format (e.g., "7:00 PM")
 */
export function formatISTTime(timeOrDate: string | Date | null | undefined): string {
  if (!timeOrDate) return "";

  if (typeof timeOrDate === "string" && timeOrDate.includes(":")) {
    const parts = timeOrDate.split(":");
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeOrDate;

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minStr} ${ampm}`;
  }

  const d = typeof timeOrDate === "string" ? new Date(timeOrDate) : timeOrDate;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Returns lowercase 3-letter day of the week in IST ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')
 */
export function getISTDayOfWeek(dateStrOrDate: string | Date = new Date()): string {
  const d =
    typeof dateStrOrDate === "string"
      ? dateStrOrDate.length === 10
        ? new Date(`${dateStrOrDate}T12:00:00+05:30`)
        : new Date(dateStrOrDate)
      : dateStrOrDate;

  const dayName = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    weekday: "short",
  })
    .format(d)
    .toLowerCase();

  return dayName; // 'mon', 'tue', etc.
}

/**
 * Checks if a given date string is in the past compared to today in IST
 */
export function isPastIST(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return dateStr < todayIST();
}

/**
 * Checks if a given date string is today in IST
 */
export function isTodayIST(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return dateStr === todayIST();
}

/**
 * Checks if a given date string is in the future compared to today in IST
 */
export function isFutureIST(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return dateStr > todayIST();
}

/**
 * Returns 7 days for the week containing `baseDate` (Monday to Sunday) in IST
 */
export function getISTWeekDays(baseDate: string = todayIST()): {
  date: string;
  dayName: string;
  dayShort: string;
  dayNum: number;
  isToday: boolean;
}[] {
  const d = new Date(`${baseDate}T12:00:00+05:30`);
  // Get day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const day = d.getDay();
  // We want Monday as start of week: Mon = 0, Sun = 6
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const mondayDateStr = addDaysIST(baseDate, diffToMonday);

  const days = [];
  const today = todayIST();

  for (let i = 0; i < 7; i++) {
    const curDateStr = addDaysIST(mondayDateStr, i);
    const curDate = new Date(`${curDateStr}T12:00:00+05:30`);
    days.push({
      date: curDateStr,
      dayName: new Intl.DateTimeFormat("en-US", { timeZone: IST_TIMEZONE, weekday: "long" }).format(curDate),
      dayShort: new Intl.DateTimeFormat("en-US", { timeZone: IST_TIMEZONE, weekday: "short" }).format(curDate),
      dayNum: parseInt(curDateStr.split("-")[2], 10),
      isToday: curDateStr === today,
    });
  }

  return days;
}

/**
 * Generates month calendar grid (weeks of Monday - Sunday) for year & month (1-indexed month)
 */
export function getISTMonthGrid(year: number, month: number): {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}[] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  const firstDayStr = getISTDateString(firstDay);
  const startDayOfWeek = firstDay.getDay(); // 0 is Sun
  const leadingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const startDateStr = addDaysIST(firstDayStr, -leadingDays);
  const grid = [];
  const today = todayIST();

  // 6 rows * 7 days = 42 cells
  for (let i = 0; i < 42; i++) {
    const cellDateStr = addDaysIST(startDateStr, i);
    const cellMonth = parseInt(cellDateStr.split("-")[1], 10);
    const dayNum = parseInt(cellDateStr.split("-")[2], 10);

    grid.push({
      date: cellDateStr,
      dayNum,
      isCurrentMonth: cellMonth === month,
      isToday: cellDateStr === today,
    });
  }

  return grid;
}

/**
 * Returns UTC ISO string range [startUTC, endUTC] for a 24-hour IST calendar day "YYYY-MM-DD".
 * For example: "2026-11-02" in IST begins at 2026-11-01T18:30:00.000Z and ends at 2026-11-02T18:29:59.999Z.
 */
export function getISTDateRangeUTC(dateStr: string = todayIST()): {
  startUTC: string;
  endUTC: string;
} {
  const start = new Date(`${dateStr}T00:00:00.000+05:30`);
  const end = new Date(`${dateStr}T23:59:59.999+05:30`);
  return {
    startUTC: start.toISOString(),
    endUTC: end.toISOString(),
  };
}
