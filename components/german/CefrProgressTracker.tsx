"use client";

// ============================================================================
// Sahil's Shore: German CEFR Progress Tracker (A1 to B2)
// Competency checklist per level and self-assessed overall progress bars
// ============================================================================

import React, { useState } from "react";
import { Check, Award, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import type { GermanProgress } from "@/types";
import {
  CEFR_LEVELS,
  CEFR_COMPETENCIES,
  type CefrLevel,
} from "@/lib/german/constants";
import { calculateCefrLevelStats } from "@/lib/german";

interface CefrProgressTrackerProps {
  progressList: GermanProgress[];
  onToggleCompetency: (
    level: CefrLevel,
    competencyId: string,
    isCompleted: boolean
  ) => Promise<void>;
}

export function CefrProgressTracker({
  progressList,
  onToggleCompetency,
}: CefrProgressTrackerProps) {
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    A1: true,
    A2: true,
    B1: false,
    B2: false,
  });

  const toggleExpand = (level: string) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  // Overall statistics across A1-B2
  const totalAll = CEFR_COMPETENCIES.length;
  const completedAll = progressList.filter((p) => p.is_completed).length;
  const overallPercentage =
    totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Grammar":
        return "bg-blue-500/10 text-blue-500";
      case "Speaking":
        return "bg-rose-500/10 text-rose-500";
      case "Listening":
        return "bg-amber-500/10 text-amber-500";
      case "Reading":
        return "bg-emerald-500/10 text-emerald-500";
      case "Writing":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-surface-muted text-text-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Hero Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Common European Framework of Reference for Languages
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-text">
              German CEFR Mastery: {overallPercentage}%
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {completedAll} of {totalAll} competencies mastered from Beginner (A1) to Professional (B2).
            </p>
          </div>

          <div className="text-right self-start sm:self-auto">
            <span className="text-3xl font-mono font-bold text-primary">
              {overallPercentage}%
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-3 bg-surface-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>

        {/* Level Pills Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {CEFR_LEVELS.map((lvl) => {
            const stat = calculateCefrLevelStats(progressList, lvl);
            return (
              <div
                key={lvl}
                className="p-3 rounded-xl bg-surface-muted/50 border border-surface-muted flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-text">{lvl} Level</div>
                  <div className="text-[11px] text-text-muted">
                    {stat.completed}/{stat.total} skills
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-primary">
                  {stat.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Levels Detailed Checklists */}
      <div className="space-y-4">
        {CEFR_LEVELS.map((lvl) => {
          const isExpanded = !!expandedLevels[lvl];
          const stat = calculateCefrLevelStats(progressList, lvl);
          const competencies = CEFR_COMPETENCIES.filter((c) => c.level === lvl);

          return (
            <div
              key={lvl}
              className="rounded-2xl bg-surface border border-surface-muted shadow-sm overflow-hidden"
            >
              {/* Level Accordion Header */}
              <button
                onClick={() => toggleExpand(lvl)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-surface-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {lvl}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text">
                      {lvl === "A1" && "A1: Breakthrough Beginner"}
                      {lvl === "A2" && "A2: Waystage Elementary"}
                      {lvl === "B1" && "B1: Threshold Intermediate"}
                      {lvl === "B2" && "B2: Vantage Upper-Intermediate"}
                    </h4>
                    <p className="text-xs text-text-muted">
                      {stat.completed} of {stat.total} skills completed ({stat.percentage}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-surface-muted rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  )}
                </div>
              </button>

              {/* Checklist Items */}
              {isExpanded && (
                <div className="p-4 sm:p-5 pt-0 border-t border-surface-muted/60 space-y-2.5">
                  {competencies.map((comp) => {
                    const isChecked = progressList.some(
                      (p) => p.competency_id === comp.id && p.is_completed
                    );

                    return (
                      <div
                        key={comp.id}
                        onClick={() =>
                          onToggleCompetency(lvl, comp.id, !isChecked)
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? "bg-primary/5 border-primary/30"
                            : "bg-surface-muted/30 border-surface-muted hover:border-surface-muted/80"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-all ${
                            isChecked
                              ? "bg-primary border-primary text-white"
                              : "border-surface-muted bg-surface text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-semibold ${
                                isChecked
                                  ? "text-primary line-through opacity-85"
                                  : "text-text"
                              }`}
                            >
                              {comp.title}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${getCategoryColor(
                                comp.category
                              )}`}
                            >
                              {comp.category}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            {comp.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
