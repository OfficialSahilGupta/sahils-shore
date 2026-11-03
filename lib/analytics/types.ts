// ============================================================================
// Sahil's Shore: Analytics Types & Interfaces
// Productivity formula, skills & 24x7 heatmap, money analytics, correlations
// ============================================================================

export type DateRangePreset = "7d" | "30d" | "90d" | "month" | "year" | "custom";

export interface DateRange {
  startDate: string; // YYYY-MM-DD (IST)
  endDate: string;   // YYYY-MM-DD (IST)
  label: string;
  preset: DateRangePreset;
}

export interface ProductivityScoreBreakdown {
  overallScore: number;       // 0 - 100
  taskScore: number;          // 0 - 100 (weighted 40%)
  focusScore: number;         // 0 - 100 (weighted 35%)
  habitScore: number;         // 0 - 100 (weighted 25%)
  tasksCompleted: number;
  tasksTotal: number;
  focusMinutes: number;
  focusTargetMinutes: number;
  habitsCompleted: number;
  habitsScheduled: number;
  formulaExplanation: {
    taskWeight: number;    // 0.40
    focusWeight: number;   // 0.35
    habitWeight: number;   // 0.25
    description: string;
  };
}

export interface SkillTimeSummary {
  skill: string;             // e.g. "DSA", "Spring Boot", "MERN", "German", "Other"
  minutes: number;
  hours: number;
  percentage: number;        // 0 - 100% of total focus time
  color: string;
  sessionsCount: number;
}

export interface DailySkillTrend {
  date: string;              // YYYY-MM-DD
  DSA: number;
  SpringBoot: number;
  MERN: number;
  German: number;
  Other: number;
  total: number;
}

export interface FocusHeatmapCell {
  weekdayIndex: number;      // 0 = Sun, 1 = Mon ... 6 = Sat
  weekdayName: string;       // "Mon", "Tue", ...
  hour: number;              // 0 - 23 (IST)
  minutes: number;
  intensity: number;         // 0 to 4
}

export interface SkillStreak {
  name: string;
  currentStreak: number;
  longestStreak: number;
  totalMinutes: number;
  lastActiveDate: string | null;
}

export interface SpendCategoryItem {
  categoryId: string;
  name: string;
  paise: number;
  rupees: number;
  percentage: number;
  color?: string;
}

export interface SpendPlaceItem {
  place: string;
  paise: number;
  rupees: number;
  count: number;
}

export interface SpendWeekdayItem {
  weekday: string;           // "Mon", "Tue", ...
  paise: number;
  rupees: number;
  count: number;
}

export interface BudgetAdherenceItem {
  categoryId: string;
  categoryName: string;
  spentPaise: number;
  budgetPaise: number;
  percentage: number;
  status: "normal" | "amber" | "danger";
}

export interface MonthOverMonthSpend {
  currentMonthLabel: string;
  currentPaise: number;
  previousMonthLabel: string;
  previousPaise: number;
  differencePaise: number;
  percentageChange: number;   // positive = more spent, negative = saved
}

export interface MoneyAnalyticsSummary {
  totalPaise: number;
  totalRupees: number;
  dailyAveragePaise: number;
  dailyAverageRupees: number;
  projectedMonthPaise: number;
  projectedMonthRupees: number;
  byCategory: SpendCategoryItem[];
  byPlace: SpendPlaceItem[];
  byWeekday: SpendWeekdayItem[];
  budgetAdherence: BudgetAdherenceItem[];
  monthOverMonth: MonthOverMonthSpend;
}

export interface DailyCorrelationPoint {
  date: string;
  mood: number | null;        // 1 to 5
  energy: number | null;      // 1 to 5
  productivityScore: number;  // 0 to 100
  spendPaise: number;
  spendRupees: number;
  focusMinutes: number;
}

export interface CorrelationMetric {
  r: number;                  // Pearson r (-1 to +1)
  direction: "positive" | "negative" | "none";
  strength: "strong" | "moderate" | "weak" | "none";
  label: string;
  interpretation: string;
}

export interface PlacesAnalyticsSummary {
  totalVisits: number;
  uniquePlacesCount: number;
  topPlaces: { name: string; visits: number; category: string }[];
}

export interface MealsAnalyticsSummary {
  totalLogged: number;
  homeMeals: number;
  restaurantMeals: number;
  otherMeals: number;
  outsideFoodPaise: number;
  outsideFoodRupees: number;
  topEateries: { name: string; count: number; spendPaise: number }[];
}

export interface LifeCorrelationsSummary {
  dailyPoints: DailyCorrelationPoint[];
  moodVsProductivity: CorrelationMetric;
  moodVsSpending: CorrelationMetric;
  productivityVsSpending: CorrelationMetric;
  places: PlacesAnalyticsSummary;
  meals: MealsAnalyticsSummary;
}

export interface AnalyticsBundle {
  dateRange: DateRange;
  productivity: ProductivityScoreBreakdown;
  skills: {
    breakdown: SkillTimeSummary[];
    trends: DailySkillTrend[];
    heatmap: FocusHeatmapCell[];
    streaks: SkillStreak[];
    totalFocusMinutes: number;
  };
  money: MoneyAnalyticsSummary;
  life: LifeCorrelationsSummary;
}
