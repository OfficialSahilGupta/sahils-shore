// ============================================================================
// Sahil's Shore: Push-Style Local Reminders Engine
// Checks follow-ups, daily habits, and revision queues
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import { currentISTDateString } from "../date-utils.ts";

export interface PendingRemindersSummary {
  dueFollowUps: number;
  incompleteHabits: number;
  dueGermanCards: number;
  dueDsaProblems: number;
  totalPending: number;
}

/**
 * Requests browser permission for desktop/mobile notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Checks whether browser notification permission is currently granted.
 */
export function hasNotificationPermission(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  return Notification.permission === "granted";
}

/**
 * Dispatches a native browser notification (via ServiceWorker or Notification API).
 */
export async function sendLocalNotification(
  title: string,
  options?: NotificationOptions & { url?: string }
): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const defaultIcon = "/icons/icon-192.png";
  const defaultBadge = "/favicon.svg";

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      registration.showNotification(title, {
        icon: defaultIcon,
        badge: defaultBadge,
        ...options,
        data: { url: options?.url || "/" },
      });
      return;
    }
  }

  // Fallback to classic Notification instance
  new Notification(title, {
    icon: defaultIcon,
    ...options,
  });
}

/**
 * Scans database for pending reminders across Career follow-ups, habits, and revision queues.
 */
export async function checkDueReminders(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PendingRemindersSummary> {
  const todayIST = currentISTDateString();

  // 1. Career Follow-ups (applications with next_follow_up <= todayIST and not rejected/offer)
  let dueFollowUps = 0;
  try {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, next_follow_up, stage")
      .eq("user_id", userId)
      .not("next_follow_up", "is", null)
      .not("stage", "in", '("rejected","offer")');

    if (apps) {
      dueFollowUps = apps.filter(
        (a) => a.next_follow_up && a.next_follow_up <= todayIST
      ).length;
    }
  } catch {
    // Ignore
  }

  // 2. Incomplete Habits for today
  let incompleteHabits = 0;
  try {
    const { data: habits } = await supabase
      .from("habits")
      .select("id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true);

    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("user_id", userId)
      .eq("logged_date", todayIST)
      .eq("completed", true);

    const completedSet = new Set((logs || []).map((l) => l.habit_id));
    incompleteHabits = (habits || []).filter((h) => !completedSet.has(h.id)).length;
  } catch {
    // Ignore
  }

  // 3. German Flashcards due for review
  let dueGermanCards = 0;
  try {
    const { data: vocab } = await supabase
      .from("vocab_cards")
      .select("id, next_review_at")
      .eq("user_id", userId)
      .lte("next_review_at", todayIST);

    dueGermanCards = vocab?.length || 0;
  } catch {
    // Ignore
  }

  // 4. DSA Problems due for revision
  let dueDsaProblems = 0;
  try {
    const { data: dsa } = await supabase
      .from("dsa_problems")
      .select("id, next_revision_at")
      .eq("user_id", userId)
      .lte("next_revision_at", todayIST);

    dueDsaProblems = dsa?.length || 0;
  } catch {
    // Ignore
  }

  return {
    dueFollowUps,
    incompleteHabits,
    dueGermanCards,
    dueDsaProblems,
    totalPending: dueFollowUps + incompleteHabits + dueGermanCards + dueDsaProblems,
  };
}

/**
 * Checks pending items and triggers push notifications if threshold met.
 */
export async function triggerDailyRemindersNotification(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const summary = await checkDueReminders(supabase, userId);

  if (summary.totalPending === 0) return;

  const parts: string[] = [];
  if (summary.dueFollowUps > 0) parts.push(`${summary.dueFollowUps} job follow-up`);
  if (summary.dueGermanCards > 0) parts.push(`${summary.dueGermanCards} German cards`);
  if (summary.dueDsaProblems > 0) parts.push(`${summary.dueDsaProblems} DSA revision`);
  if (summary.incompleteHabits > 0) parts.push(`${summary.incompleteHabits} daily habits`);

  sendLocalNotification("Shore Daily Review", {
    body: `You have ${parts.join(", ")} pending today.`,
    url: "/",
  });
}
