// ============================================================================
// Sahil's Shore: AI Coach Multi-Provider Engine
// Gemini API, Anthropic API, and Offline Heuristic Intelligence Engine
// ============================================================================

import type {
  SanitizedCoachContext,
  CoachDailyInsight,
  CoachWeeklyReview,
} from "./types";

const SYSTEM_PROMPT = `
You are the AI Coach for "Sahil's Shore", a private personal Life OS for Sahil, a full-stack engineer in India (IST timezone).
Sahil is preparing for jobs, practicing DSA daily, learning Java/Spring Boot and MERN/Next.js, learning German, and tracking habits/expenses.

Your tone is calm, grounded, coastal, concise, encouraging, and highly specific to his actual data. Never sound generic or corporate.
Return STRICT valid JSON only without markdown code blocks, conforming to this schema:
{
  "summary": "Line 1: Today's main focus and accomplishment.\\nLine 2: Notable challenge, habit or financial observation.\\nLine 3: Calibrating tone heading into tomorrow.",
  "pattern": "One concrete pattern noticed across his last 14 days of stats.",
  "suggestedPriorities": [
    "Priority 1 for tomorrow (specific action)",
    "Priority 2 for tomorrow (specific action)",
    "Priority 3 for tomorrow (specific action)"
  ],
  "gentleNudge": "A brief, 1-2 sentence calm encouragement."
}
`.trim();

/**
 * Generates daily coach insight using the configured or available provider.
 */
export async function generateCoachInsight(
  context: SanitizedCoachContext,
  preferredProvider: "auto" | "gemini" | "anthropic" | "heuristic" = "auto"
): Promise<CoachDailyInsight> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (preferredProvider === "gemini" && geminiKey) {
    try {
      return await callGeminiApi(context, geminiKey);
    } catch (err) {
      console.warn("Gemini API call failed, falling back to heuristic engine:", err);
    }
  }

  if (preferredProvider === "anthropic" && anthropicKey) {
    try {
      return await callAnthropicApi(context, anthropicKey);
    } catch (err) {
      console.warn("Anthropic API call failed, falling back to heuristic engine:", err);
    }
  }

  // Auto provider resolution: Gemini > Anthropic > Heuristic
  if (preferredProvider === "auto") {
    if (geminiKey) {
      try {
        return await callGeminiApi(context, geminiKey);
      } catch (err) {
        console.warn("Gemini auto call failed, trying Anthropic or Heuristic:", err);
      }
    }
    if (anthropicKey) {
      try {
        return await callAnthropicApi(context, anthropicKey);
      } catch (err) {
        console.warn("Anthropic auto call failed, falling back to Heuristic:", err);
      }
    }
  }

  // Fallback / Zero-API intelligent heuristic engine
  return generateOfflineHeuristicInsight(context);
}

/**
 * Generates a Weekly Coach Review synthesizing the last 7 to 14 days.
 */
export async function generateWeeklyReview(
  context: SanitizedCoachContext,
  periodStart: string,
  periodEnd: string
): Promise<CoachWeeklyReview> {
  const daily = await generateCoachInsight(context, "auto");
  const stats = context.stats14Days;

  const topSkill = Object.entries(stats.skillHours).sort((a, b) => b[1] - a[1])[0];
  const skillName = topSkill ? topSkill[0].toUpperCase() : "DSA";

  const highlights = [
    `Logged ${stats.totalFocusHours} total hours of deep work, led by ${skillName} (${topSkill ? topSkill[1] : 0}h).`,
    `Completed ${stats.tasksCompletedCount} tasks with a habit adherence of ${stats.habitsCompletionRate}%.`,
    `Maintained average daily spend at ₹${stats.averageDailySpendRupees.toLocaleString("en-IN")}.`,
  ];

  return {
    periodStart,
    periodEnd,
    summary: daily.summary,
    highlights,
    focusAndHabitPace: `Focus pace was consistent with ${stats.averageProductivityScore}% average productivity. Habit consistency remained steady at ${stats.habitsCompletionRate}%.`,
    skillBalanceNotes: `Your primary momentum was in ${skillName}. Consider dedicating 30-45 minutes to German or secondary track to maintain balanced progress.`,
    suggestedPriorities: daily.suggestedPriorities,
    gentleNudge: daily.gentleNudge,
    provider: daily.provider,
  };
}

/**
 * Google Gemini REST API connector
 */
async function callGeminiApi(context: SanitizedCoachContext, apiKey: string): Promise<CoachDailyInsight> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const userContent = JSON.stringify({
    targetDate: context.targetDate,
    timelineToday: context.timelineEvents,
    last14DaysStats: context.stats14Days,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: `Here is Sahil's data for today and the past 14 days:\n${userContent}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Empty response from Gemini API");

  const parsed = JSON.parse(rawText);

  return {
    periodDate: context.targetDate,
    summary: cleanThreeLineSummary(parsed.summary),
    pattern: String(parsed.pattern || "Steady focus rhythm observed."),
    suggestedPriorities: Array.isArray(parsed.suggestedPriorities)
      ? parsed.suggestedPriorities.slice(0, 3)
      : ["Solve 1 Medium DSA problem", "30 mins Spring Boot revision", "Log daily expenses"],
    gentleNudge: String(parsed.gentleNudge || "Rest well tonight. Consistency is built day by day."),
    provider: "gemini",
  };
}

/**
 * Anthropic Claude REST API connector
 */
async function callAnthropicApi(context: SanitizedCoachContext, apiKey: string): Promise<CoachDailyInsight> {
  const url = "https://api.anthropic.com/v1/messages";

  const userContent = JSON.stringify({
    targetDate: context.targetDate,
    timelineToday: context.timelineEvents,
    last14DaysStats: context.stats14Days,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is Sahil's data for today and the past 14 days:\n${userContent}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.content?.[0]?.text;
  if (!rawText) throw new Error("Empty response from Anthropic API");

  const cleanJson = rawText.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(cleanJson);

  return {
    periodDate: context.targetDate,
    summary: cleanThreeLineSummary(parsed.summary),
    pattern: String(parsed.pattern || "Regular study pacing observed."),
    suggestedPriorities: Array.isArray(parsed.suggestedPriorities)
      ? parsed.suggestedPriorities.slice(0, 3)
      : ["Solve 1 Medium DSA problem", "Spring Boot microservices review", "German pronunciation practice"],
    gentleNudge: String(parsed.gentleNudge || "Steady tide builds the shore. Keep moving forward."),
    provider: "anthropic",
  };
}

/**
 * Offline Heuristic Intelligence Engine
 * Generates tailored insights directly from data heuristics when no cloud API key is configured.
 */
export function generateOfflineHeuristicInsight(context: SanitizedCoachContext): CoachDailyInsight {
  const { stats14Days: stats, timelineEvents } = context;

  // 1. Identify dominant skill and areas of focus
  const skillEntries = Object.entries(stats.skillHours).sort((a, b) => b[1] - a[1]);
  const primarySkill = skillEntries[0]?.[0] || "dsa";
  const primarySkillHours = skillEntries[0]?.[1] || 0;

  // 2. Determine today's specific achievements from timeline
  const todayTasksDone = timelineEvents.filter((e) => e.type === "task_completed" || e.type === "task").length;
  const todayStudyDone = timelineEvents.filter((e) => e.type === "study_session" || e.type === "activity").length;
  const todayExpensesDone = timelineEvents.filter((e) => e.type === "expense").length;

  // 3. Format 3-line summary
  const line1 =
    todayStudyDone > 0 || todayTasksDone > 0
      ? `Completed ${todayTasksDone} task${todayTasksDone === 1 ? "" : "s"} and logged ${todayStudyDone} focus session${todayStudyDone === 1 ? "" : "s"} today.`
      : `Rest and recharge day with steady foundational habit continuity.`;

  const line2 =
    primarySkillHours > 0
      ? `Strong 14-day momentum in ${formatSkillDisplayName(primarySkill)} (${primarySkillHours} hrs logged).`
      : `Balanced distribution across DSA, Full-Stack, and language study.`;

  const line3 =
    stats.habitsCompletionRate >= 80
      ? `Habit discipline is outstanding at ${stats.habitsCompletionRate}%, providing a solid platform for tomorrow.`
      : `Spending is controlled at ₹${stats.averageDailySpendRupees}/day; prepare a high-leverage start tomorrow morning.`;

  const summary = `${line1}\n${line2}\n${line3}`;

  // 4. Extract pattern noticed
  let pattern = "Your deepest study blocks reliably produce their best output when initiated in the morning.";
  if (stats.skillHours.dsa > stats.skillHours.springBoot + stats.skillHours.mern) {
    pattern = "High DSA solving concentration over the last 14 days; consider pairing with Spring Boot practical code.";
  } else if (stats.habitsCompletionRate >= 85) {
    pattern = "Remarkable habit streak consistency: keeping morning routines intact protects your evening energy.";
  } else if (stats.totalSpendRupees > 0 && stats.averageDailySpendRupees < 600) {
    pattern = "Financial discipline remains exceptionally lean with minimal unbudgeted impulse spend.";
  }

  // 5. Build 3 suggested priorities for tomorrow
  const suggestedPriorities: string[] = [];

  if (stats.skillHours.dsa < 3) {
    suggestedPriorities.push("Solve 1 LeetCode Medium problem (Arrays or Trees)");
  } else {
    suggestedPriorities.push("Revise spaced repetition queue in DSA Tracker");
  }

  if (stats.skillHours.springBoot < stats.skillHours.mern) {
    suggestedPriorities.push("Build Spring Security JWT filter or JPA entity relationship");
  } else {
    suggestedPriorities.push("Refactor Next.js API route or TypeScript interface");
  }

  if (stats.skillHours.german < 1.5) {
    suggestedPriorities.push("Review 15 German flashcards & practice pronunciation shadowing");
  } else {
    suggestedPriorities.push("Complete top priority task in Todos & Planner");
  }

  // 6. Gentle Nudge
  const gentleNudges = [
    "The tide does not hurry, yet it shapes the shore. Keep your pace steady.",
    "Small, focused blocks every day compound faster than sporadic marathon sprints.",
    "Honor both your drive to learn and your need for rest. You are on track.",
    "Every line of code and revision cycle brings you closer to your career goals.",
  ];
  const dayIndex = new Date(context.targetDate).getDate() % gentleNudges.length;
  const gentleNudge = gentleNudges[dayIndex];

  return {
    periodDate: context.targetDate,
    summary,
    pattern,
    suggestedPriorities,
    gentleNudge,
    provider: "heuristic",
  };
}

function cleanThreeLineSummary(summary: any): string {
  if (typeof summary !== "string") {
    return "Solid day of deliberate progress across core goals.\nMaintained steady discipline in daily routines.\nReady to tackle tomorrow's top priorities with clarity.";
  }
  const lines = summary.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length >= 3) {
    return lines.slice(0, 3).join("\n");
  }
  return summary;
}

function formatSkillDisplayName(key: string): string {
  switch (key.toLowerCase()) {
    case "dsa":
      return "DSA";
    case "springboot":
      return "Spring Boot";
    case "mern":
      return "MERN";
    case "german":
      return "German";
    default:
      return "Focus Tracks";
  }
}
