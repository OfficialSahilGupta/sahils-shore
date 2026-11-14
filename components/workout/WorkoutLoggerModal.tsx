"use client";

// ============================================================================
// Sahil's Shore: Workout Logger Modal
// Interactive session logger with routine templates, sets & volume calculator,
// custom dropdown exercise selection, rest countdown timer, and optimistic save.
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Clock,
  Dumbbell,
  CheckCircle2,
  Flame,
  Sparkles,
  Layers,
  ChevronDown,
  RotateCcw,
  Timer,
  Play,
  Pause,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { todayIST } from "@/lib/date-utils";
import {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  MuscleGroup,
  SplitType,
  EXERCISE_BANK,
  ROUTINE_TEMPLATES,
  calculateSetVolume,
  calculateSessionVolume,
  calculateEstimated1RM,
} from "@/lib/workout";

interface WorkoutLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: {
    id?: string;
    workoutDate: string;
    routineName: string;
    splitType: SplitType;
    muscleGroups: MuscleGroup[];
    durationMinutes: number;
    intensityRating: number;
    notes?: string;
    exercises: WorkoutExercise[];
  }) => Promise<void>;
  editingSession?: WorkoutSession | null;
  defaultDateIST?: string;
}

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Cardio",
];

const SPLIT_OPTIONS: Array<{ value: SplitType; label: string }> = [
  { value: "push", label: "Push (Chest / Delts / Triceps)" },
  { value: "pull", label: "Pull (Back / Traps / Biceps)" },
  { value: "legs", label: "Legs & Calves" },
  { value: "upper", label: "Upper Body" },
  { value: "lower", label: "Lower Body & Core" },
  { value: "full_body", label: "Full Body Functional" },
  { value: "cardio_core", label: "Cardio & Core" },
  { value: "custom", label: "Custom Routine" },
];

export function WorkoutLoggerModal({
  isOpen,
  onClose,
  onSave,
  editingSession,
  defaultDateIST,
}: WorkoutLoggerModalProps) {
  const currentTodayIST = todayIST();

  // Form states
  const [workoutDate, setWorkoutDate] = useState<string>(defaultDateIST || currentTodayIST);
  const [routineName, setRoutineName] = useState<string>("Push Day");
  const [splitType, setSplitType] = useState<SplitType>("push");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>(["Chest", "Shoulders", "Triceps"]);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [intensityRating, setIntensityRating] = useState<number>(4);
  const [notes, setNotes] = useState<string>("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Exercise picker states
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>("all");
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>("");
  const [customExerciseName, setCustomExerciseName] = useState<string>("");

  // Built-in Rest Timer states
  const [timerSeconds, setTimerSeconds] = useState<number>(90);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerInitial, setTimerInitial] = useState<number>(90);

  // Countdown effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Reset or populate form
  useEffect(() => {
    if (!isOpen) return;

    if (editingSession) {
      setWorkoutDate(editingSession.workoutDate);
      setRoutineName(editingSession.routineName);
      setSplitType(editingSession.splitType);
      setMuscleGroups(editingSession.muscleGroups || []);
      setDurationMinutes(editingSession.durationMinutes);
      setIntensityRating(editingSession.intensityRating || 4);
      setNotes(editingSession.notes || "");
      setExercises(
        editingSession.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) => ({ ...s })),
        }))
      );
    } else {
      // New workout default
      setWorkoutDate(defaultDateIST || currentTodayIST);
      loadTemplate(ROUTINE_TEMPLATES[0]); // default to Push Day
    }
  }, [isOpen, editingSession, defaultDateIST, currentTodayIST]);

  const loadTemplate = (template: (typeof ROUTINE_TEMPLATES)[0]) => {
    setRoutineName(template.name.split(" (")[0]);
    setSplitType(template.splitType);
    setMuscleGroups([...template.muscleGroups]);
    setExercises(
      template.defaultExercises.map((def, idx) => ({
        exerciseName: def.exerciseName,
        muscleGroup: def.muscleGroup,
        orderIndex: idx,
        sets: Array.from({ length: def.suggestedSets }, (_, sIdx) => ({
          setNumber: sIdx + 1,
          weightKg: 40,
          reps: def.suggestedReps,
          completed: true,
        })),
      }))
    );
  };

  // Toggle muscle group
  const handleToggleMuscleGroup = (mg: MuscleGroup) => {
    if (muscleGroups.includes(mg)) {
      setMuscleGroups(muscleGroups.filter((g) => g !== mg));
    } else {
      setMuscleGroups([...muscleGroups, mg]);
    }
  };

  // Exercise management
  const handleAddExerciseFromBank = () => {
    const nameToAdd = customExerciseName.trim() || selectedExerciseName;
    if (!nameToAdd) return;

    // Detect muscle group
    const bankItem = EXERCISE_BANK.find((b) => b.name === nameToAdd);
    const mg = bankItem ? bankItem.muscleGroup : muscleGroups[0] || "Chest";

    const newEx: WorkoutExercise = {
      exerciseName: nameToAdd,
      muscleGroup: mg,
      orderIndex: exercises.length,
      sets: [
        { setNumber: 1, weightKg: 50, reps: 10, completed: true },
        { setNumber: 2, weightKg: 50, reps: 10, completed: true },
        { setNumber: 3, weightKg: 50, reps: 10, completed: true },
      ],
    };

    setExercises([...exercises, newEx]);
    setSelectedExerciseName("");
    setCustomExerciseName("");
  };

  const handleRemoveExercise = (exIdx: number) => {
    setExercises(exercises.filter((_, idx) => idx !== exIdx));
  };

  // Set management inside an exercise
  const handleAddSet = (exIdx: number) => {
    const ex = exercises[exIdx];
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet: WorkoutSet = {
      setNumber: ex.sets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 40,
      reps: lastSet ? lastSet.reps : 10,
      completed: true,
    };

    const updated = [...exercises];
    updated[exIdx].sets.push(newSet);
    setExercises(updated);
  };

  const handleDuplicateSet = (exIdx: number, setIdx: number) => {
    const ex = exercises[exIdx];
    const targetSet = ex.sets[setIdx];
    const clonedSet: WorkoutSet = {
      setNumber: ex.sets.length + 1,
      weightKg: targetSet.weightKg,
      reps: targetSet.reps,
      completed: true,
    };

    const updated = [...exercises];
    updated[exIdx].sets.push(clonedSet);
    setExercises(updated);
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    updated[exIdx].sets = updated[exIdx].sets
      .filter((_, idx) => idx !== setIdx)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    setExercises(updated);
  };

  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    val: any
  ) => {
    const updated = [...exercises];
    (updated[exIdx].sets[setIdx] as any)[field] = val;
    setExercises(updated);
  };

  // Calculated totals
  const sessionStats = useMemo(() => {
    return calculateSessionVolume(exercises);
  }, [exercises]);

  // Filtered exercises for dropdown
  const filteredBankOptions = useMemo(() => {
    const list =
      selectedMuscleFilter === "all"
        ? EXERCISE_BANK
        : EXERCISE_BANK.filter((e) => e.muscleGroup === selectedMuscleFilter);

    return [
      { value: "", label: "Choose an exercise from bank..." },
      ...list.map((e) => ({ value: e.name, label: `${e.name} (${e.muscleGroup})` })),
    ];
  }, [selectedMuscleFilter]);

  const muscleFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "All Muscle Groups" },
      ...ALL_MUSCLE_GROUPS.map((mg) => ({ value: mg, label: mg })),
    ];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: editingSession?.id,
        workoutDate,
        routineName: routineName.trim(),
        splitType,
        muscleGroups,
        durationMinutes,
        intensityRating,
        notes: notes.trim() || undefined,
        exercises,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4 bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-text">
                {editingSession ? "Edit Workout Session" : "Log Daily Workout"}
              </h3>
              <p className="text-xs text-text-muted">
                {sessionStats.totalSets} sets •{" "}
                {sessionStats.totalVolumeKg >= 1000
                  ? `${(sessionStats.totalVolumeKg / 1000).toFixed(1)}t`
                  : `${Math.round(sessionStats.totalVolumeKg)}kg`}{" "}
                total volume
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Routine Template Loader (if creating new) */}
          {!editingSession && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
                <span>Quick-Start Routine Templates:</span>
                <span className="text-[11px] text-primary">1-tap autofill</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {ROUTINE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => loadTemplate(tmpl)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-border bg-surface-muted/50 text-text hover:border-primary/60 hover:text-primary transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                  >
                    {tmpl.name.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Routine Name & Split Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Routine Name</label>
              <input
                type="text"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g. Push Day (Chest & Triceps)"
                required
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Split Category</label>
              <Select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as SplitType)}
                options={SPLIT_OPTIONS}
              />
            </div>
          </div>

          {/* Date, Duration & Effort */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Workout Date</label>
              <input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Intensity Rating</label>
              <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-surface">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setIntensityRating(lvl)}
                    className="p-1 text-text-muted hover:text-amber-500 transition-colors"
                  >
                    <Flame
                      className={`h-4 w-4 ${
                        lvl <= intensityRating
                          ? "fill-amber-500 text-amber-500"
                          : "text-text-muted/40"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-text ml-auto font-mono">
                  {intensityRating}/5
                </span>
              </div>
            </div>
          </div>

          {/* Muscle Groups Selection Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text">Targeted Muscle Groups</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ALL_MUSCLE_GROUPS.map((mg) => {
                const isSelected = muscleGroups.includes(mg);
                return (
                  <button
                    key={mg}
                    type="button"
                    onClick={() => handleToggleMuscleGroup(mg)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-surface-muted/40 text-text-muted border-border hover:bg-surface-muted hover:text-text"
                    }`}
                  >
                    {mg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Built-in Rest Timer Bar */}
          <div className="p-3 rounded-xl border border-border bg-surface-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Timer className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-text">Set Rest Timer</span>
                <span className="text-[10px] text-text-muted block">
                  Keep rest intervals strict between sets
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[60, 90, 120, 180].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setTimerInitial(sec);
                      setTimerSeconds(sec);
                      setTimerRunning(false);
                    }}
                    className={`px-2 py-1 text-[11px] font-mono font-semibold rounded-lg border ${
                      timerInitial === sec
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface border-border text-text-muted hover:text-text"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 bg-surface border border-border px-2.5 py-1 rounded-xl font-mono text-xs font-bold text-text">
                <span>
                  {Math.floor(timerSeconds / 60)}:
                  {String(timerSeconds % 60).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="p-1 text-primary hover:text-primary-foreground hover:bg-primary rounded transition-colors ml-1"
                >
                  {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerSeconds(timerInitial);
                    setTimerRunning(false);
                  }}
                  className="p-1 text-text-muted hover:text-text rounded transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Exercise Builder Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h4 className="text-sm font-bold text-text">Exercises & Sets</h4>
                <p className="text-xs text-text-muted">
                  Log your working sets, weights (kg), reps, and personal bests.
                </p>
              </div>
            </div>

            {/* Exercise List */}
            {exercises.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface-muted/20">
                <Dumbbell className="h-6 w-6 text-text-muted/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-text">No exercises added yet</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Choose from the exercise bank below or create a custom exercise.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((ex, exIdx) => {
                  const exVolume = ex.sets.reduce((sum, s) => {
                    return s.completed && s.weightKg > 0 && s.reps > 0
                      ? sum + s.weightKg * s.reps
                      : sum;
                  }, 0);

                  return (
                    <Card
                      key={exIdx}
                      className="p-3.5 sm:p-4 rounded-xl border border-border bg-surface space-y-3 shadow-2xs"
                    >
                      {/* Exercise Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                            {exIdx + 1}
                          </span>
                          <span className="font-bold text-sm text-text truncate">
                            {ex.exerciseName}
                          </span>
                          <span className="text-[10px] font-semibold text-text-muted px-1.5 py-0.5 rounded-md bg-surface-muted border border-border/60 shrink-0">
                            {ex.muscleGroup}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-primary font-semibold">
                            {Math.round(exVolume)} kg
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exIdx)}
                            className="p-1 rounded text-text-muted hover:text-danger hover:bg-surface-muted transition-colors"
                            title="Remove exercise"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sets Table */}
                      <div className="space-y-1.5 overflow-x-auto scrollbar-none">
                        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
                          <span className="col-span-2 text-center">Set</span>
                          <span className="col-span-3">Weight (kg)</span>
                          <span className="col-span-3">Reps</span>
                          <span className="col-span-2 text-right">Vol (kg)</span>
                          <span className="col-span-2 text-center">Actions</span>
                        </div>

                        {ex.sets.map((set, setIdx) => {
                          const setVol = calculateSetVolume(set.weightKg, set.reps);

                          return (
                            <div
                              key={setIdx}
                              className={`grid grid-cols-12 gap-1.5 sm:gap-2 items-center p-1.5 rounded-lg border ${
                                set.completed
                                  ? "bg-surface-muted/30 border-border/60"
                                  : "bg-surface-muted/10 border-border/30 opacity-60"
                              }`}
                            >
                              {/* Set Number */}
                              <div className="col-span-2 flex items-center justify-center gap-1">
                                <span className="text-xs font-bold font-mono text-text">
                                  #{set.setNumber}
                                </span>
                              </div>

                              {/* Weight Input */}
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  step="0.5"
                                  min={0}
                                  value={set.weightKg || ""}
                                  onChange={(e) =>
                                    handleUpdateSet(
                                      exIdx,
                                      setIdx,
                                      "weightKg",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  placeholder="kg"
                                  className="w-full px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-border text-text text-center focus:ring-1 focus:ring-primary"
                                />
                              </div>

                              {/* Reps Input */}
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={set.reps || ""}
                                  onChange={(e) =>
                                    handleUpdateSet(
                                      exIdx,
                                      setIdx,
                                      "reps",
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  placeholder="reps"
                                  className="w-full px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-border text-text text-center focus:ring-1 focus:ring-primary"
                                />
                              </div>

                              {/* Set Volume */}
                              <div className="col-span-2 text-right font-mono text-[11px] font-semibold text-text truncate">
                                {setVol > 0 ? `${setVol}` : "-"}
                              </div>

                              {/* Actions */}
                              <div className="col-span-2 flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateSet(exIdx, setIdx)}
                                  className="p-1 rounded text-text-muted hover:text-text hover:bg-surface"
                                  title="Duplicate set"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={ex.sets.length <= 1}
                                  onClick={() => handleRemoveSet(exIdx, setIdx)}
                                  className="p-1 rounded text-text-muted hover:text-danger disabled:opacity-20 hover:bg-surface"
                                  title="Delete set"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Set Button */}
                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        className="w-full py-1.5 rounded-lg border border-dashed border-border bg-surface text-xs font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Set</span>
                      </button>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Exercise Adder Bar */}
            <div className="p-4 rounded-xl border border-border bg-surface-muted/30 space-y-3">
              <span className="text-xs font-bold text-text block">Add Exercise to Workout:</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-4">
                  <Select
                    value={selectedMuscleFilter}
                    onChange={(e) => setSelectedMuscleFilter(e.target.value)}
                    options={muscleFilterOptions}
                  />
                </div>
                <div className="sm:col-span-6">
                  <Select
                    value={selectedExerciseName}
                    onChange={(e) => {
                      setSelectedExerciseName(e.target.value);
                      setCustomExerciseName("");
                    }}
                    options={filteredBankOptions}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    disabled={!selectedExerciseName && !customExerciseName.trim()}
                    onClick={handleAddExerciseFromBank}
                    className="w-full h-10 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Or custom name input */}
              <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                <span className="text-[11px] text-text-muted shrink-0">Or custom name:</span>
                <input
                  type="text"
                  value={customExerciseName}
                  onChange={(e) => {
                    setCustomExerciseName(e.target.value);
                    if (e.target.value) setSelectedExerciseName("");
                  }}
                  placeholder="e.g. Meadows Row, Hatfield Squat..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Workout Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text">Session Notes & PR Highlights</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Felt explosive on bench, hit 80kg PR! Great pump, high energy."
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary shadow-2xs resize-none"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-surface text-text hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !routineName.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : "Save Workout"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
