// ============================================================================
// Sahil's Shore: Exportable Monthly Report Engine
// Markdown, CSV, and Print-optimized retrospective generation
// ============================================================================

import type { AnalyticsBundle } from "./types";
import { formatINR as formatRupeesFromPaise } from "../expenses/index.ts";

/**
 * Generates a clean, comprehensive Markdown report ready for Notion, Obsidian, or Archival.
 */
export function generateMonthlyMarkdownReport(bundle: AnalyticsBundle): string {
  const { dateRange, productivity, skills, money, life } = bundle;
  const nowStr = new Date().toISOString().slice(0, 10);

  const topCategories = money.byCategory
    .slice(0, 5)
    .map((c) => `- **${c.name}**: ${formatRupeesFromPaise(c.paise)} (${c.percentage}%)`)
    .join("\n");

  const skillLines = skills.breakdown
    .map((s) => `- **${s.skill}**: ${s.hours} hrs (${s.percentage}% of total focus)`)
    .join("\n");

  const topPlaces = life.places.topPlaces
    .map((p) => `- **${p.name}** (${p.category}): ${p.visits} visits`)
    .join("\n");

  const topEateries = life.meals.topEateries
    .map((e) => `- **${e.name}**: ${e.count} visits (${formatRupeesFromPaise(e.spendPaise)})`)
    .join("\n");

  return `# Sahil's Shore: Monthly Executive Report
**Period:** ${dateRange.startDate} to ${dateRange.endDate} (${dateRange.label})  
**Generated on:** ${nowStr} (IST)  
**App:** Sahil's Shore — Personal Life OS  

---

## 1. Executive Summary & Productivity
- **Overall Productivity Score:** ${productivity.overallScore} / 100
- **Tasks Completion:** ${productivity.tasksCompleted} / ${productivity.tasksTotal} (${productivity.taskScore}%)
- **Total Focus Study Time:** ${Math.round((skills.totalFocusMinutes / 60) * 10) / 10} hours (${productivity.focusScore}% target adherence)
- **Habit Consistency:** ${productivity.habitsCompleted} / ${productivity.habitsScheduled} (${productivity.habitScore}%)
- *Formula:* ${productivity.formulaExplanation.description}

---

## 2. Learning & Skill Allocation
${skillLines || "- No focus hours logged in this period."}

### Focus Streaks & Consistency
${skills.streaks.map((st) => `- **${st.name}**: Current streak ${st.currentStreak} days | Longest ${st.longestStreak} days`).join("\n") || "- None"}

---

## 3. Financial Statement (INR)
- **Total Expenditure:** ${formatRupeesFromPaise(money.totalPaise)}
- **Daily Average Spend:** ${formatRupeesFromPaise(money.dailyAveragePaise)} / day
- **Projected 30-Day Burn:** ${formatRupeesFromPaise(money.projectedMonthPaise)}

### Top Spending Categories
${topCategories || "- No expenses recorded in this period."}

### Budget Adherence
${money.budgetAdherence.map((b) => `- **${b.categoryName}**: Spent ${formatRupeesFromPaise(b.spentPaise)} of ${formatRupeesFromPaise(b.budgetPaise)} (${b.percentage}%) [${b.status.toUpperCase()}]`).join("\n") || "- No active category budgets."}

---

## 4. Life, Health & Dining
- **Dining Breakdown:** ${life.meals.homeMeals} home-cooked meals vs ${life.meals.restaurantMeals} restaurant meals
- **Outside Food Spend:** ${formatRupeesFromPaise(life.meals.outsideFoodPaise)}
- **Places Visited:** ${life.places.totalVisits} visits across ${life.places.uniquePlacesCount} unique spots

### Top Eateries
${topEateries || "- No outside meals logged."}

### Top Places Visited
${topPlaces || "- No places logged."}

---

## 5. Correlations & Observations
> [!NOTE]
> Correlation is not causation. These patterns are reflective observations.

- **Mood vs. Productivity:** ${life.moodVsProductivity.label} — ${life.moodVsProductivity.interpretation}
- **Mood vs. Spending:** ${life.moodVsSpending.label} — ${life.moodVsSpending.interpretation}
- **Productivity vs. Spending:** ${life.productivityVsSpending.label} — ${life.productivityVsSpending.interpretation}

---
*Report exported from Sahil's Shore.*
`;
}

/**
 * Generates daily rollup CSV for spreadsheet analysis (Excel, Google Sheets).
 */
export function generateDailyAnalyticsCsv(bundle: AnalyticsBundle): string {
  const headers = [
    "Date (IST)",
    "Productivity Score",
    "Focus Minutes",
    "Tasks Completed",
    "Habits Completed",
    "Spend (Paise)",
    "Spend (INR)",
    "Mood (1-5)",
    "Energy (1-5)",
  ];

  const rows = bundle.life.dailyPoints.map((pt) => [
    pt.date,
    pt.productivityScore,
    pt.focusMinutes,
    "", // tasks completed for day
    "", // habits completed for day
    pt.spendPaise,
    pt.spendRupees.toFixed(2),
    pt.mood !== null ? pt.mood : "",
    pt.energy !== null ? pt.energy : "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
