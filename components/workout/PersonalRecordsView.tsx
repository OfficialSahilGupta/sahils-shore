"use client";

// ============================================================================
// Sahil's Shore: Personal Records & 1RM Calculator Component
// Strength milestone cards, PR history, and interactive 1-Rep Max calculator.
// ============================================================================

import React, { useState } from "react";
import {
  Trophy,
  Plus,
  Flame,
  Award,
  TrendingUp,
  Calculator,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { todayIST, formatFriendlyISTDate } from "@/lib/date-utils";
import {
  WorkoutPR,
  calculateEstimated1RM,
  EXERCISE_BANK,
} from "@/lib/workout";

interface PersonalRecordsViewProps {
  prs: WorkoutPR[];
  onSavePR: (exerciseName: string, weightKg: number, reps: number, dateIST: string) => Promise<void>;
}

export function PersonalRecordsView({ prs, onSavePR }: PersonalRecordsViewProps) {
  const currentTodayIST = todayIST();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [selectedExercise, setSelectedExercise] = useState<string>("Barbell Flat Bench Press");
  const [customExercise, setCustomExercise] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("80");
  const [reps, setReps] = useState<number>(5);
  const [achievedDate, setAchievedDate] = useState<string>(currentTodayIST);

  // 1RM Calculator states
  const [calcWeight, setCalcWeight] = useState<number>(80);
  const [calcReps, setCalcReps] = useState<number>(5);

  const calculated1RM = calculateEstimated1RM(calcWeight, calcReps);

  // Percentage breakdown
  const percentages = [
    { pct: 100, reps: "1 rep", goal: "Absolute 1RM" },
    { pct: 95, reps: "2 reps", goal: "Maximal Strength" },
    { pct: 90, reps: "3-4 reps", goal: "Strength" },
    { pct: 85, reps: "5-6 reps", goal: "Strength & Size" },
    { pct: 80, reps: "7-8 reps", goal: "Hypertrophy" },
    { pct: 75, reps: "9-10 reps", goal: "Hypertrophy" },
    { pct: 70, reps: "11-12 reps", goal: "Hypertrophy / Pump" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customExercise.trim() || selectedExercise;
    const w = parseFloat(weightKg);
    if (!finalName || isNaN(w) || w <= 0 || reps <= 0) return;

    await onSavePR(finalName, w, reps, achievedDate);
    setModalOpen(false);
    setCustomExercise("");
  };

  const exerciseOptions = [
    { value: "Barbell Flat Bench Press", label: "Barbell Flat Bench Press" },
    { value: "Barbell Back Squat", label: "Barbell Back Squat" },
    { value: "Conventional Deadlift", label: "Conventional Deadlift" },
    { value: "Overhead Barbell Press (OHP)", label: "Overhead Barbell Press (OHP)" },
    { value: "Incline Dumbbell Press", label: "Incline Dumbbell Press" },
    { value: "Barbell Bent-Over Row", label: "Barbell Bent-Over Row" },
    { value: "Pull-ups / Chin-ups", label: "Pull-ups / Chin-ups" },
    { value: "Leg Press", label: "Leg Press" },
    { value: "Romanian Deadlift (RDL)", label: "Romanian Deadlift (RDL)" },
    ...EXERCISE_BANK.map((e) => ({ value: e.name, label: e.name })),
  ];

  // Remove duplicates
  const uniqueOptions = Array.from(new Map(exerciseOptions.map((o) => [o.value, o])).values());

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Strength Milestones & Personal Records</h2>
            <p className="text-xs text-text-muted">
              {prs.length} personal bests registered across compound & isolation lifts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-xs self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add / Update PR</span>
        </button>
      </div>

      {/* 2. Interactive 1-Rep Max (1RM) Calculator Tool */}
      <Card className="p-4 sm:p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-text">Interactive 1-Rep Max (1RM) Calculator</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Lifted Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min={1}
                value={calcWeight}
                onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Completed Reps (1-30)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={calcReps}
                onChange={(e) => setCalcReps(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            {/* Computed 1RM Callout */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center space-y-1">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Estimated 1-Rep Max
              </span>
              <span className="text-3xl font-extrabold font-mono text-primary block">
                {calculated1RM} kg
              </span>
              <span className="text-[10px] text-text-muted">
                Based on Brzycki & Epley scientific formulas
              </span>
            </div>
          </div>

          {/* Percentage Target Table */}
          <div className="lg:col-span-8 overflow-x-auto">
            <span className="text-xs font-bold text-text mb-2 block">
              Calculated Training Percentages & Rep Ranges:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {percentages.map((p) => {
                const targetWeight = Math.round((calculated1RM * (p.pct / 100)) * 10) / 10;
                return (
                  <div
                    key={p.pct}
                    className="p-2.5 rounded-xl border border-border bg-surface-muted/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text font-mono">{p.pct}%</span>
                      <span className="text-[10px] text-text-muted font-medium">{p.reps}</span>
                    </div>
                    <div className="text-base font-extrabold font-mono text-primary">
                      {targetWeight} kg
                    </div>
                    <span className="text-[10px] text-text-muted block truncate">{p.goal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Personal Records Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-text">Your All-Time Best Lifts</h3>

        {prs.length === 0 ? (
          <Card className="p-10 text-center rounded-2xl border border-dashed border-border bg-surface">
            <Trophy className="h-8 w-8 text-amber-500/40 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-text">No PRs registered yet</h4>
            <p className="text-xs text-text-muted mt-0.5">
              Log your workout sessions or tap &ldquo;Add / Update PR&rdquo; to celebrate your best lifts.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {prs.map((pr) => (
              <Card
                key={pr.id}
                className="p-4 rounded-2xl border border-border bg-surface shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Personal Record
                    </span>
                    <h4 className="text-sm font-bold text-text truncate mt-0.5">
                      {pr.exerciseName}
                    </h4>
                  </div>
                  <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                    <Flame className="h-4 w-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-text-muted block">Best Set</span>
                    <span className="text-base font-bold font-mono text-text">
                      {pr.weightKg}kg × {pr.reps}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Estimated 1RM</span>
                    <span className="text-base font-bold font-mono text-primary">
                      {pr.estimated1rm} kg
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-text-muted pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatFriendlyISTDate(pr.achievedDate)}
                  </span>
                  <span className="text-primary font-medium">Verified PR</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 4. Add / Update PR Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-text">Add / Update Personal Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">Exercise</label>
                <Select
                  value={selectedExercise}
                  onChange={(e) => {
                    setSelectedExercise(e.target.value);
                    setCustomExercise("");
                  }}
                  options={uniqueOptions}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-text-muted">Or custom exercise name:</label>
                <input
                  type="text"
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  placeholder="e.g. Weighted Neutral Pull-up"
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text">Weight Lifted (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text">Reps</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value, 10) || 1)}
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">Date Achieved</label>
                <input
                  type="date"
                  value={achievedDate}
                  onChange={(e) => setAchievedDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-surface text-text hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-xs"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
