// ============================================================================
// Sahil's Shore: Workout & Fitness Hub Data Access & Logic Layer
// Single-user workout logging, sets & volume, PR calculations, physique photos,
// motivational engine, and seamless sync to timeline_events & health_logs.
// ============================================================================

import { createClient } from "../supabase/client.ts";
import { todayIST, getISTDateString } from "../date-utils.ts";
import { writeTimelineEvent } from "../timeline/index.ts";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Core"
  | "Cardio";

export type SplitType =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "full_body"
  | "cardio_core"
  | "custom";

export interface WorkoutSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (6-10)
  completed: boolean;
  isPr?: boolean;
}

export interface WorkoutExercise {
  id?: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  orderIndex: number;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutDate: string; // YYYY-MM-DD
  routineName: string;
  splitType: SplitType;
  muscleGroups: MuscleGroup[];
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  intensityRating: number; // 1 - 5
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface PhysiquePhoto {
  id: string;
  userId: string;
  photoDate: string; // YYYY-MM-DD
  photoUrl: string;
  driveFileId?: string | null;
  syncStatus?: "synced" | "pending" | "failed";
  poseType: "front" | "back" | "side" | "legs" | "flex" | "scale";
  weightKg?: number;
  notes?: string;
  createdAt: string;
}

export interface WorkoutPR {
  id: string;
  userId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  estimated1rm: number;
  achievedDate: string;
  notes?: string;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  splitType: SplitType;
  description: string;
  muscleGroups: MuscleGroup[];
  defaultExercises: Array<{
    exerciseName: string;
    muscleGroup: MuscleGroup;
    suggestedSets: number;
    suggestedReps: number;
  }>;
}

// ============================================================================
// Built-in Standard Exercise Bank (40+ Compound & Isolation Movements)
// ============================================================================

export const EXERCISE_BANK: Array<{ name: string; muscleGroup: MuscleGroup; isCompound: boolean }> = [
  // Chest
  { name: "Barbell Flat Bench Press", muscleGroup: "Chest", isCompound: true },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest", isCompound: true },
  { name: "Decline Barbell Press", muscleGroup: "Chest", isCompound: true },
  { name: "Chest Dips", muscleGroup: "Chest", isCompound: true },
  { name: "Cable Chest Fly", muscleGroup: "Chest", isCompound: false },
  { name: "Push-ups", muscleGroup: "Chest", isCompound: true },
  { name: "Pec Deck Machine", muscleGroup: "Chest", isCompound: false },

  // Back
  { name: "Conventional Deadlift", muscleGroup: "Back", isCompound: true },
  { name: "Barbell Bent-Over Row", muscleGroup: "Back", isCompound: true },
  { name: "Pull-ups / Chin-ups", muscleGroup: "Back", isCompound: true },
  { name: "Lat Pulldown", muscleGroup: "Back", isCompound: true },
  { name: "Seated Cable Row", muscleGroup: "Back", isCompound: true },
  { name: "Single-Arm Dumbbell Row", muscleGroup: "Back", isCompound: true },
  { name: "T-Bar Row", muscleGroup: "Back", isCompound: true },
  { name: "Face Pulls", muscleGroup: "Back", isCompound: false },

  // Shoulders
  { name: "Overhead Barbell Press (OHP)", muscleGroup: "Shoulders", isCompound: true },
  { name: "Seated Dumbbell Shoulder Press", muscleGroup: "Shoulders", isCompound: true },
  { name: "Dumbbell Lateral Raises", muscleGroup: "Shoulders", isCompound: false },
  { name: "Cable Lateral Raises", muscleGroup: "Shoulders", isCompound: false },
  { name: "Reverse Pec Deck (Rear Delts)", muscleGroup: "Shoulders", isCompound: false },
  { name: "Barbell Front Raises", muscleGroup: "Shoulders", isCompound: false },
  { name: "Dumbbell Shrugs", muscleGroup: "Shoulders", isCompound: false },

  // Arms - Triceps & Biceps
  { name: "Tricep Rope Pushdowns", muscleGroup: "Triceps", isCompound: false },
  { name: "Skull Crushers (EZ Bar)", muscleGroup: "Triceps", isCompound: false },
  { name: "Close-Grip Bench Press", muscleGroup: "Triceps", isCompound: true },
  { name: "Overhead Dumbbell Tricep Extension", muscleGroup: "Triceps", isCompound: false },
  { name: "Barbell Bicep Curl", muscleGroup: "Biceps", isCompound: false },
  { name: "Incline Dumbbell Curl", muscleGroup: "Biceps", isCompound: false },
  { name: "Hammer Curls", muscleGroup: "Biceps", isCompound: false },
  { name: "Preacher Curls", muscleGroup: "Biceps", isCompound: false },

  // Legs - Quads, Hamstrings, Glutes, Calves
  { name: "Barbell Back Squat", muscleGroup: "Quads", isCompound: true },
  { name: "Front Squat", muscleGroup: "Quads", isCompound: true },
  { name: "Leg Press", muscleGroup: "Quads", isCompound: true },
  { name: "Bulgarian Split Squats", muscleGroup: "Quads", isCompound: true },
  { name: "Leg Extensions", muscleGroup: "Quads", isCompound: false },
  { name: "Romanian Deadlift (RDL)", muscleGroup: "Hamstrings", isCompound: true },
  { name: "Lying Leg Curls", muscleGroup: "Hamstrings", isCompound: false },
  { name: "Seated Leg Curls", muscleGroup: "Hamstrings", isCompound: false },
  { name: "Barbell Hip Thrust", muscleGroup: "Glutes", isCompound: true },
  { name: "Standing Calf Raises", muscleGroup: "Calves", isCompound: false },
  { name: "Seated Calf Raises", muscleGroup: "Calves", isCompound: false },

  // Core & Abs
  { name: "Hanging Leg Raises", muscleGroup: "Core", isCompound: false },
  { name: "Cable Woodchoppers", muscleGroup: "Core", isCompound: false },
  { name: "Ab Wheel Rollouts", muscleGroup: "Core", isCompound: false },
  { name: "Plank / Weighted Plank", muscleGroup: "Core", isCompound: false },
  { name: "Decline Weighted Crunches", muscleGroup: "Core", isCompound: false },

  // Cardio
  { name: "Incline Treadmill Walk", muscleGroup: "Cardio", isCompound: false },
  { name: "HIIT Sprint Intervals", muscleGroup: "Cardio", isCompound: false },
  { name: "Jump Rope", muscleGroup: "Cardio", isCompound: false },
  { name: "Stationary Bike", muscleGroup: "Cardio", isCompound: false },
];

// ============================================================================
// Routine Templates
// ============================================================================

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: "push-day",
    name: "Push Day (Chest, Shoulders, Triceps)",
    splitType: "push",
    description: "Compound horizontal and vertical pressing targeting chest, front/side delts, and triceps.",
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    defaultExercises: [
      { exerciseName: "Barbell Flat Bench Press", muscleGroup: "Chest", suggestedSets: 4, suggestedReps: 8 },
      { exerciseName: "Incline Dumbbell Press", muscleGroup: "Chest", suggestedSets: 3, suggestedReps: 10 },
      { exerciseName: "Overhead Barbell Press (OHP)", muscleGroup: "Shoulders", suggestedSets: 3, suggestedReps: 8 },
      { exerciseName: "Dumbbell Lateral Raises", muscleGroup: "Shoulders", suggestedSets: 4, suggestedReps: 12 },
      { exerciseName: "Tricep Rope Pushdowns", muscleGroup: "Triceps", suggestedSets: 3, suggestedReps: 12 },
      { exerciseName: "Chest Dips", muscleGroup: "Chest", suggestedSets: 3, suggestedReps: 10 },
    ],
  },
  {
    id: "pull-day",
    name: "Pull Day (Back, Rear Delts, Biceps)",
    splitType: "pull",
    description: "Vertical and horizontal pulling to build lat width, upper back thickness, and bicep peaks.",
    muscleGroups: ["Back", "Biceps", "Shoulders"],
    defaultExercises: [
      { exerciseName: "Barbell Bent-Over Row", muscleGroup: "Back", suggestedSets: 4, suggestedReps: 8 },
      { exerciseName: "Pull-ups / Chin-ups", muscleGroup: "Back", suggestedSets: 3, suggestedReps: 8 },
      { exerciseName: "Lat Pulldown", muscleGroup: "Back", suggestedSets: 3, suggestedReps: 10 },
      { exerciseName: "Face Pulls", muscleGroup: "Back", suggestedSets: 4, suggestedReps: 15 },
      { exerciseName: "Incline Dumbbell Curl", muscleGroup: "Biceps", suggestedSets: 3, suggestedReps: 12 },
      { exerciseName: "Hammer Curls", muscleGroup: "Biceps", suggestedSets: 3, suggestedReps: 10 },
    ],
  },
  {
    id: "legs-day",
    name: "Leg Day (Quads, Hamstrings, Glutes, Calves)",
    splitType: "legs",
    description: "High-intensity lower body hypertrophy focusing on knee flexion and hip hinge.",
    muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],
    defaultExercises: [
      { exerciseName: "Barbell Back Squat", muscleGroup: "Quads", suggestedSets: 4, suggestedReps: 8 },
      { exerciseName: "Romanian Deadlift (RDL)", muscleGroup: "Hamstrings", suggestedSets: 3, suggestedReps: 10 },
      { exerciseName: "Leg Press", muscleGroup: "Quads", suggestedSets: 3, suggestedReps: 12 },
      { exerciseName: "Lying Leg Curls", muscleGroup: "Hamstrings", suggestedSets: 3, suggestedReps: 12 },
      { exerciseName: "Standing Calf Raises", muscleGroup: "Calves", suggestedSets: 4, suggestedReps: 15 },
    ],
  },
  {
    id: "upper-body",
    name: "Upper Body Hypertrophy",
    splitType: "upper",
    description: "Balanced upper torso routine hitting chest, back, shoulders, and arms.",
    muscleGroups: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
    defaultExercises: [
      { exerciseName: "Incline Dumbbell Press", muscleGroup: "Chest", suggestedSets: 4, suggestedReps: 10 },
      { exerciseName: "Seated Cable Row", muscleGroup: "Back", suggestedSets: 4, suggestedReps: 10 },
      { exerciseName: "Dumbbell Lateral Raises", muscleGroup: "Shoulders", suggestedSets: 4, suggestedReps: 15 },
      { exerciseName: "Barbell Bicep Curl", muscleGroup: "Biceps", suggestedSets: 3, suggestedReps: 10 },
      { exerciseName: "Skull Crushers (EZ Bar)", muscleGroup: "Triceps", suggestedSets: 3, suggestedReps: 12 },
    ],
  },
  {
    id: "lower-body",
    name: "Lower Body & Core",
    splitType: "lower",
    description: "Quad, posterior chain, and trunk stability development.",
    muscleGroups: ["Quads", "Hamstrings", "Glutes", "Core"],
    defaultExercises: [
      { exerciseName: "Conventional Deadlift", muscleGroup: "Back", suggestedSets: 3, suggestedReps: 6 },
      { exerciseName: "Bulgarian Split Squats", muscleGroup: "Quads", suggestedSets: 3, suggestedReps: 10 },
      { exerciseName: "Barbell Hip Thrust", muscleGroup: "Glutes", suggestedSets: 3, suggestedReps: 10 },
      { exerciseName: "Hanging Leg Raises", muscleGroup: "Core", suggestedSets: 3, suggestedReps: 15 },
    ],
  },
  {
    id: "full-body",
    name: "Full Body Functional",
    splitType: "full_body",
    description: "Full body workout maximizing athletic power and compound volume.",
    muscleGroups: ["Chest", "Back", "Quads", "Shoulders", "Core"],
    defaultExercises: [
      { exerciseName: "Barbell Back Squat", muscleGroup: "Quads", suggestedSets: 3, suggestedReps: 8 },
      { exerciseName: "Barbell Flat Bench Press", muscleGroup: "Chest", suggestedSets: 3, suggestedReps: 8 },
      { exerciseName: "Pull-ups / Chin-ups", muscleGroup: "Back", suggestedSets: 3, suggestedReps: 8 },
      { exerciseName: "Overhead Barbell Press (OHP)", muscleGroup: "Shoulders", suggestedSets: 3, suggestedReps: 10 },
      { exerciseName: "Ab Wheel Rollouts", muscleGroup: "Core", suggestedSets: 3, suggestedReps: 12 },
    ],
  },
];

// ============================================================================
// Motivational Quotes Engine
// ============================================================================

export const MOTIVATION_QUOTES = [
  {
    quote: "The resistance that you fight physically in the gym and the resistance that you fight in life can only build a strong character.",
    author: "Arnold Schwarzenegger",
  },
  {
    quote: "We don't rise to the level of our expectations, we fall to the level of our training.",
    author: "Archilochus",
  },
  {
    quote: "Discipline is doing what you hate to do, but doing it like you love it.",
    author: "Mike Tyson",
  },
  {
    quote: "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success.",
    author: "Dwayne Johnson",
  },
  {
    quote: "Small daily improvements over time lead to stunning results. Put the reps in.",
    author: "Robin Sharma",
  },
  {
    quote: "The only bad workout is the one that didn't happen. Step onto your shore and lift.",
    author: "Shore Fitness",
  },
];

export function getDailyMotivationQuote(dateIST: string = todayIST()) {
  const hash = dateIST.split("-").reduce((acc, part) => acc + parseInt(part, 10), 0);
  return MOTIVATION_QUOTES[hash % MOTIVATION_QUOTES.length];
}

// ============================================================================
// Calculation Utilities
// ============================================================================

export function calculateSetVolume(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return Math.round(weightKg * reps * 100) / 100;
}

export function calculateSessionVolume(exercises: WorkoutExercise[]): { totalVolumeKg: number; totalSets: number } {
  let totalVolumeKg = 0;
  let totalSets = 0;

  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.completed && set.weightKg > 0 && set.reps > 0) {
        totalVolumeKg += set.weightKg * set.reps;
        totalSets++;
      }
    }
  }

  return {
    totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
    totalSets,
  };
}

/**
 * 1-Rep Max estimation using Brzycki & Epley formulas.
 * Brzycki: weight * (36 / (37 - reps))
 * Epley: weight * (1 + reps / 30)
 */
export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;

  // Average of Brzycki and Epley
  const brzycki = reps < 37 ? weightKg * (36 / (37 - reps)) : weightKg;
  const epley = weightKg * (1 + reps / 30);
  const avg = (brzycki + epley) / 2;

  return Math.round(avg * 10) / 10;
}

/**
 * Workout streak calculation in IST.
 * Returns current consecutive day streak.
 */
export function calculateWorkoutStreak(sessions: WorkoutSession[], currentDateIST: string = todayIST()): number {
  if (sessions.length === 0) return 0;

  const datesWithWorkouts = new Set(sessions.map((s) => s.workoutDate));

  let streak = 0;
  let cursor = new Date(currentDateIST + "T00:00:00Z");

  // If no workout today, check if yesterday was logged to preserve streak
  const todayStr = currentDateIST;
  const yesterday = new Date(cursor);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (!datesWithWorkouts.has(todayStr) && !datesWithWorkouts.has(yesterdayStr)) {
    return 0;
  }

  if (!datesWithWorkouts.has(todayStr) && datesWithWorkouts.has(yesterdayStr)) {
    cursor = yesterday;
  }

  while (true) {
    const dStr = cursor.toISOString().slice(0, 10);
    if (datesWithWorkouts.has(dStr)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ============================================================================
// Data Persistence (Supabase + localStorage dual sync)
// ============================================================================

const LOCAL_STORAGE_SESSIONS_KEY = "shore_workout_sessions_cache";
const LOCAL_STORAGE_PHOTOS_KEY = "shore_workout_photos_cache";
const LOCAL_STORAGE_PRS_KEY = "shore_workout_prs_cache";

function getLocalSessions(): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: WorkoutSession[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save local workout sessions", e);
  }
}

function getLocalPhotos(): PhysiquePhoto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPhotos(photos: PhysiquePhoto[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(photos));
  } catch (e) {
    console.error("Failed to save local physique photos", e);
  }
}

function getLocalPRs(): WorkoutPR[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPRs(prs: WorkoutPR[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PRS_KEY, JSON.stringify(prs));
  } catch (e) {
    console.error("Failed to save local PRs", e);
  }
}

// ============================================================================
// Public API Methods
// ============================================================================

export async function getWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
  const local = getLocalSessions();
  try {
    const supabase = createClient();
    const { data: sessions, error } = await (supabase as any)
      .from("workout_sessions")
      .select("*, exercises:workout_exercises(*)")
      .eq("user_id", userId)
      .order("workout_date", { ascending: false });

    if (error || !sessions) {
      return local;
    }

    const mapped: WorkoutSession[] = sessions.map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      workoutDate: s.workout_date,
      routineName: s.routine_name,
      splitType: s.split_type || "custom",
      muscleGroups: s.muscle_groups || [],
      durationMinutes: s.duration_minutes || 0,
      totalVolumeKg: Number(s.total_volume_kg || 0),
      totalSets: s.total_sets || 0,
      intensityRating: s.intensity_rating || 3,
      notes: s.notes || "",
      exercises: (s.exercises || [])
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((ex: any) => ({
          id: ex.id,
          exerciseName: ex.exercise_name,
          muscleGroup: ex.muscle_group,
          orderIndex: ex.order_index,
          sets: ex.sets || [],
          notes: ex.notes || "",
        })),
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    saveLocalSessions(mapped);
    return mapped;
  } catch (e) {
    return local;
  }
}

export async function saveWorkoutSession(
  userId: string,
  sessionInput: {
    id?: string;
    workoutDate: string;
    routineName: string;
    splitType: SplitType;
    muscleGroups: MuscleGroup[];
    durationMinutes: number;
    intensityRating: number;
    notes?: string;
    exercises: WorkoutExercise[];
  }
): Promise<WorkoutSession> {
  const { totalVolumeKg, totalSets } = calculateSessionVolume(sessionInput.exercises);
  const sessionId = sessionInput.id || crypto.randomUUID();
  const now = new Date().toISOString();

  const sessionObj: WorkoutSession = {
    id: sessionId,
    userId,
    workoutDate: sessionInput.workoutDate,
    routineName: sessionInput.routineName,
    splitType: sessionInput.splitType,
    muscleGroups: sessionInput.muscleGroups,
    durationMinutes: sessionInput.durationMinutes,
    totalVolumeKg,
    totalSets,
    intensityRating: sessionInput.intensityRating,
    notes: sessionInput.notes,
    exercises: sessionInput.exercises,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Update local cache
  const local = getLocalSessions().filter((s) => s.id !== sessionId);
  local.unshift(sessionObj);
  local.sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
  saveLocalSessions(local);

  // 2. Persist to Supabase
  try {
    const supabase = createClient();

    // Upsert session
    const { error: sessionError } = await (supabase as any).from("workout_sessions").upsert({
      id: sessionId,
      user_id: userId,
      workout_date: sessionInput.workoutDate,
      routine_name: sessionInput.routineName,
      split_type: sessionInput.splitType,
      muscle_groups: sessionInput.muscleGroups,
      duration_minutes: sessionInput.durationMinutes,
      total_volume_kg: totalVolumeKg,
      total_sets: totalSets,
      intensity_rating: sessionInput.intensityRating,
      notes: sessionInput.notes,
      updated_at: now,
    });

    if (!sessionError) {
      // Delete old exercises if updating
      await (supabase as any).from("workout_exercises").delete().eq("session_id", sessionId);

      // Insert exercises
      if (sessionInput.exercises.length > 0) {
        const exPayload = sessionInput.exercises.map((ex, idx) => ({
          session_id: sessionId,
          user_id: userId,
          exercise_name: ex.exerciseName,
          muscle_group: ex.muscleGroup,
          order_index: idx,
          sets: ex.sets,
          notes: ex.notes || null,
        }));
        await (supabase as any).from("workout_exercises").insert(exPayload);
      }
    }
  } catch (err) {
    console.warn("Supabase workout session sync error, preserved in local cache:", err);
  }

  // 3. Check for new PRs
  try {
    for (const ex of sessionInput.exercises) {
      for (const set of ex.sets) {
        if (set.completed && set.weightKg > 0 && set.reps > 0) {
          const estimated1rm = calculateEstimated1RM(set.weightKg, set.reps);
          await checkAndUpdatePR(userId, ex.exerciseName, set.weightKg, set.reps, estimated1rm, sessionInput.workoutDate);
        }
      }
    }
  } catch (prErr) {
    console.warn("PR check error:", prErr);
  }

  // 4. Write to timeline_events
  try {
    const supabase = createClient();
    const volumeFormatted =
      totalVolumeKg >= 1000
        ? `${(totalVolumeKg / 1000).toFixed(1)} tons`
        : `${Math.round(totalVolumeKg)} kg`;

    await writeTimelineEvent(supabase as any, {
      userId,
      type: "health_workout",
      summary: `Workout: ${sessionInput.routineName} (${sessionInput.exercises.length} exercises, ${totalSets} sets, ${volumeFormatted})`,
      occurredAt: new Date().toISOString(),
      refTable: "workout_sessions",
      refId: sessionId,
      meta: {
        routine_name: sessionInput.routineName,
        split_type: sessionInput.splitType,
        muscle_groups: sessionInput.muscleGroups,
        duration_minutes: sessionInput.durationMinutes,
        total_volume_kg: totalVolumeKg,
        total_sets: totalSets,
      },
    });
  } catch (tErr) {
    console.warn("Timeline workout event error:", tErr);
  }

  // 5. Sync to health_logs (workout_minutes, workout_type, workout_notes)
  try {
    const supabase = createClient();
    const { data: existingHealth } = await supabase
      .from("health_logs")
      .select("workout_minutes")
      .eq("user_id", userId)
      .eq("logged_date", sessionInput.workoutDate)
      .maybeSingle();

    const currentMinutes = existingHealth?.workout_minutes || 0;
    const combinedMinutes = Math.max(currentMinutes, sessionInput.durationMinutes);

    await supabase.from("health_logs").upsert(
      {
        user_id: userId,
        logged_date: sessionInput.workoutDate,
        workout_minutes: combinedMinutes,
        workout_type: sessionInput.routineName,
        workout_notes: sessionInput.notes || `Completed ${sessionInput.exercises.length} exercises, ${totalSets} sets.`,
        updated_at: now,
      },
      { onConflict: "user_id,logged_date" }
    );
  } catch (hErr) {
    console.warn("Health log workout sync error:", hErr);
  }

  return sessionObj;
}

export async function deleteWorkoutSession(userId: string, sessionId: string): Promise<boolean> {
  // Update local cache
  const local = getLocalSessions().filter((s) => s.id !== sessionId);
  saveLocalSessions(local);

  try {
    const supabase = createClient();
    const { error } = await (supabase as any).from("workout_sessions").delete().eq("id", sessionId).eq("user_id", userId);
    return !error;
  } catch {
    return true;
  }
}

// ============================================================================
// Physique Photos
// ============================================================================

export async function getPhysiquePhotos(userId: string): Promise<PhysiquePhoto[]> {
  const local = getLocalPhotos();
  try {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("workout_physique_photos")
      .select("*")
      .eq("user_id", userId)
      .order("photo_date", { ascending: false });

    if (error || !data) return local;

    const mapped: PhysiquePhoto[] = data.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      photoDate: p.photo_date,
      photoUrl: p.photo_url,
      driveFileId: p.drive_file_id || null,
      syncStatus: p.sync_status || "synced",
      poseType: p.pose_type,
      weightKg: p.weight_kg ? Number(p.weight_kg) : undefined,
      notes: p.notes,
      createdAt: p.created_at,
    }));

    saveLocalPhotos(mapped);
    return mapped;
  } catch {
    return local;
  }
}

export async function uploadPhysiquePhotoToDrive(
  userId: string,
  file: File,
  photoDate: string,
  poseType: string,
  weightKg?: number
): Promise<{ driveFileId: string | null; syncStatus: "synced" | "pending" }> {
  try {
    const sessionRes = await fetch("/api/drive/upload-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: `Physique_${photoDate}_${poseType}_${Date.now()}.jpg`,
        mimeType: file.type || "image/jpeg",
        size: file.size,
        folderType: "photos",
        date: photoDate,
      }),
    });

    if (!sessionRes.ok) {
      return { driveFileId: null, syncStatus: "pending" };
    }

    const sessionData = await sessionRes.json();
    let driveFileId: string | null = sessionData.fileId || null;

    if (sessionData.uploadUrl) {
      const putRes = await fetch(sessionData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (putRes.ok) {
        const driveData = await putRes.json().catch(() => ({}));
        driveFileId = driveData.id || driveFileId;
      }
    }

    // Also link to media_items table (Media Vault)
    try {
      const supabase = createClient();
      await (supabase as any).from("media_items").insert({
        user_id: userId,
        file_name: file.name,
        mime_type: file.type || "image/jpeg",
        media_type: "photo",
        drive_file_id: driveFileId,
        sync_status: driveFileId ? "synced" : "pending",
        metadata: {
          type: "workout_physique",
          photo_date: photoDate,
          pose_type: poseType,
          weight_kg: weightKg || null,
        },
      });
    } catch (mErr) {
      console.warn("Media items link warning:", mErr);
    }

    return {
      driveFileId,
      syncStatus: driveFileId ? "synced" : "pending",
    };
  } catch (err) {
    console.warn("[uploadPhysiquePhotoToDrive] Drive upload skipped or failed, fallback to local:", err);
    return { driveFileId: null, syncStatus: "pending" };
  }
}

export async function savePhysiquePhoto(
  userId: string,
  input: {
    photoDate: string;
    photoUrl: string;
    driveFileId?: string | null;
    syncStatus?: "synced" | "pending" | "failed";
    poseType: PhysiquePhoto["poseType"];
    weightKg?: number;
    notes?: string;
  }
): Promise<PhysiquePhoto> {
  const photoId = crypto.randomUUID();
  const now = new Date().toISOString();

  const photoObj: PhysiquePhoto = {
    id: photoId,
    userId,
    photoDate: input.photoDate,
    photoUrl: input.photoUrl,
    driveFileId: input.driveFileId || null,
    syncStatus: input.syncStatus || "synced",
    poseType: input.poseType,
    weightKg: input.weightKg,
    notes: input.notes,
    createdAt: now,
  };

  const local = getLocalPhotos().filter((p) => p.id !== photoId);
  local.unshift(photoObj);
  local.sort((a, b) => b.photoDate.localeCompare(a.photoDate));
  saveLocalPhotos(local);

  try {
    const supabase = createClient();
    await (supabase as any).from("workout_physique_photos").insert({
      id: photoId,
      user_id: userId,
      photo_date: input.photoDate,
      photo_url: input.photoUrl,
      drive_file_id: input.driveFileId || null,
      sync_status: input.syncStatus || "synced",
      pose_type: input.poseType,
      weight_kg: input.weightKg || null,
      notes: input.notes || null,
    });
  } catch (err) {
    console.warn("Physique photo sync error, preserved in local cache:", err);
  }

  return photoObj;
}

export async function deletePhysiquePhoto(userId: string, photoId: string): Promise<boolean> {
  const local = getLocalPhotos().filter((p) => p.id !== photoId);
  saveLocalPhotos(local);

  try {
    const supabase = createClient();
    const { error } = await (supabase as any).from("workout_physique_photos").delete().eq("id", photoId).eq("user_id", userId);
    return !error;
  } catch {
    return true;
  }
}

// ============================================================================
// Personal Records (PRs)
// ============================================================================

export async function getWorkoutPRs(userId: string): Promise<WorkoutPR[]> {
  const local = getLocalPRs();
  try {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("workout_prs")
      .select("*")
      .eq("user_id", userId)
      .order("weight_kg", { ascending: false });

    if (error || !data) return local;

    const mapped: WorkoutPR[] = data.map((pr: any) => ({
      id: pr.id,
      userId: pr.user_id,
      exerciseName: pr.exercise_name,
      weightKg: Number(pr.weight_kg),
      reps: pr.reps,
      estimated1rm: Number(pr.estimated_1rm),
      achievedDate: pr.achieved_date,
      notes: pr.notes,
    }));

    saveLocalPRs(mapped);
    return mapped;
  } catch {
    return local;
  }
}

export async function checkAndUpdatePR(
  userId: string,
  exerciseName: string,
  weightKg: number,
  reps: number,
  estimated1rm: number,
  achievedDate: string
): Promise<WorkoutPR | null> {
  const existingPRs = getLocalPRs();
  const currentPR = existingPRs.find((p) => p.exerciseName.toLowerCase() === exerciseName.toLowerCase());

  // A new PR is achieved if 1RM is strictly higher or higher weight lifted
  const isNewPR = !currentPR || estimated1rm > currentPR.estimated1rm;

  if (!isNewPR) return null;

  const prId = currentPR?.id || crypto.randomUUID();
  const updatedPR: WorkoutPR = {
    id: prId,
    userId,
    exerciseName,
    weightKg,
    reps,
    estimated1rm,
    achievedDate,
  };

  const newPRList = existingPRs.filter((p) => p.exerciseName.toLowerCase() !== exerciseName.toLowerCase());
  newPRList.push(updatedPR);
  saveLocalPRs(newPRList);

  try {
    const supabase = createClient();
    await (supabase as any).from("workout_prs").upsert(
      {
        id: prId,
        user_id: userId,
        exercise_name: exerciseName,
        weight_kg: weightKg,
        reps,
        estimated_1rm: estimated1rm,
        achieved_date: achievedDate,
      },
      { onConflict: "user_id,exercise_name" }
    );
  } catch (err) {
    console.warn("PR upsert error:", err);
  }

  return updatedPR;
}
