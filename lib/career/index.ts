// ============================================================================
// Sahil's Shore: Career Hub Business Logic & Data Access Layer
// Resumes, Bullet-Point Bank (Action-Verb & Metric Checker),
// Application Kanban, Follow-up Reminders, STAR Story Bank, Company Notes, Stats
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.ts";
import type {
  Application,
  ApplicationStage,
  BulletPoint,
  BulletAnalysis,
  CareerWeeklyStats,
  CompanyNote,
  CreateApplicationInput,
  CreateBulletInput,
  CreateCompanyNoteInput,
  CreateResumeInput,
  CreateStoryInput,
  FollowUpSummary,
  InterviewStory,
  PrepChecklistItem,
  Resume,
} from "../../types/career.ts";
import { formatINR } from "../expenses/index.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { todayIST, toISTDateString, getISTDayOfWeek, isTodayIST } from "../date-utils.ts";

// ============================================================================
// 1. ACTION-VERB & METRIC QUALITY CHECKER (Bullet-Point Bank)
// ============================================================================

export const STRONG_ACTION_VERBS = new Set([
  // Engineering & Architecture
  "architected", "engineered", "developed", "built", "designed", "implemented",
  "deployed", "programmed", "automated", "constructed", "formulated", "configured",
  "integrated", "migrated", "refactored", "overhauled", "containerized", "scaled",
  "orchestrated", "spearheaded", "authored", "pioneered", "devised", "modeled",
  "benchmarked", "profiled", "virtualized", "instantiated", "centralized",

  // Optimization & Performance
  "optimized", "accelerated", "streamlined", "reduced", "minimized", "maximized",
  "enhanced", "boosted", "standardized", "revamped", "debugged", "hardened",
  "resolved", "doubled", "decreased", "condensed", "eliminated", "reengineered",

  // Leadership & Delivery
  "directed", "guided", "headed", "championed", "mentored", "supervised", "led",
  "executed", "managed", "delivered", "coordinated", "aligned", "facilitated",
  "established", "launched", "shipped", "navigated", "mobilized", "empowered",

  // Analysis & Impact
  "analyzed", "identified", "diagnosed", "audited", "discovered", "evaluated",
  "quantified", "negotiated", "secured", "expanded", "generated", "yielded",
]);

export const WEAK_START_PHRASES = [
  "responsible for",
  "worked on",
  "helped with",
  "helped to",
  "assisted with",
  "assisted in",
  "was involved in",
  "participated in",
  "contributed to",
  "handled",
  "tried to",
  "attempted to",
  "tasked with",
  "did",
  "worked with",
];

// Regex detecting numbers, currency, percentages, scale multipliers, time units, scale indicators
const METRIC_PATTERNS = [
  /\b\d+(\.\d+)?%/g, // 25%, 99.9%
  /[₹$€£]\s*\d+([,\d]*)(\.\d+)?\s*(k|l|lakh|cr|crore|m|b)?\b/gi, // ₹50L, $100k
  /\b\d+([,\d]*)(\.\d+)?\s*(k|l|lakh|cr|crore|m|b|million|billion)\b/gi, // 10k, 5M
  /\b\d+x\b/gi, // 10x, 3x
  /\b\d+\s*(ms|milliseconds?|seconds?|mins?|minutes?|hrs?|hours?|days?|weeks?|months?)\b/gi, // 200ms, 4 hours
  /\b\d+\s*(users?|qps|rps|req\/s|requests|queries|tps|dau|mau)\b/gi, // 50k users, 2000 rps
  /\b\d+\s*(gb|tb|pb|mb)\b/gi, // 500GB
  /\b\d{2,}\b/g, // standalone multi-digit numbers (e.g. 15, 200)
];

/**
 * Analyzes an achievement bullet point for strong action verbs and quantifiable metrics.
 */
export function analyzeBulletPoint(content: string): BulletAnalysis {
  const trimmed = (content || "").trim();
  const suggestions: string[] = [];

  if (!trimmed) {
    return {
      hasActionVerb: false,
      hasMetric: false,
      metricsFound: [],
      wordCount: 0,
      strength: "needs-work",
      suggestions: ["Write an achievement statement starting with an action verb."],
    };
  }

  const words = trimmed.split(/\s+/);
  const wordCount = words.length;

  // 1. Action Verb Check
  const lowerContent = trimmed.toLowerCase();
  let startsWithWeak = false;
  for (const weak of WEAK_START_PHRASES) {
    if (lowerContent.startsWith(weak)) {
      startsWithWeak = true;
      suggestions.push(`Avoid starting with "${weak}". Start directly with a strong power verb (e.g., "Architected", "Optimized", "Engineered").`);
      break;
    }
  }

  const firstWord = words[0]?.replace(/[^a-zA-Z]/g, "").toLowerCase() || "";
  const hasActionVerb = STRONG_ACTION_VERBS.has(firstWord) && !startsWithWeak;

  if (!hasActionVerb && !startsWithWeak) {
    suggestions.push(`Start with a strong past-tense action verb (e.g., "Architected", "Engineered", "Reduced", "Accelerated"). Current first word: "${words[0]}".`);
  }

  // 2. Metric / Quantifiable Impact Check
  const metricsFound: string[] = [];
  for (const pattern of METRIC_PATTERNS) {
    const matches = trimmed.match(pattern);
    if (matches) {
      metricsFound.push(...matches);
    }
  }
  const uniqueMetrics = Array.from(new Set(metricsFound));
  const hasMetric = uniqueMetrics.length > 0;

  if (!hasMetric) {
    suggestions.push("Add a number or measurable metric (e.g. latency reduced by 40%, supported 50k DAU, saved ₹1.5L, improved throughput 3x).");
  }

  // 3. Word Count Check
  if (wordCount < 10) {
    suggestions.push("Bullet is a bit brief. Expand on the context, technical implementation, and resulting business impact (ideal: 12-28 words).");
  } else if (wordCount > 35) {
    suggestions.push("Bullet is long. Consider tightening or splitting it into two crisp achievements.");
  }

  // 4. Overall Strength Determination
  let strength: "strong" | "good" | "needs-work" = "needs-work";
  if (hasActionVerb && hasMetric && wordCount >= 10 && wordCount <= 35) {
    strength = "strong";
  } else if (hasActionVerb || hasMetric) {
    strength = "good";
  }

  return {
    hasActionVerb,
    actionVerb: hasActionVerb ? words[0] : undefined,
    hasMetric,
    metricsFound: uniqueMetrics,
    wordCount,
    strength,
    suggestions,
  };
}

// ============================================================================
// 2. MONEY IN PAISE & INR FORMATTING
// ============================================================================

export function salaryPaiseToRupees(paise?: number | null): number {
  if (!paise || isNaN(paise)) return 0;
  return Math.round(paise / 100);
}

export function rupeesToSalaryPaise(rupees?: number | null): number {
  if (!rupees || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Formats salary range as Indian Rupees (INR) using Indian grouping (e.g., "₹18,00,000 - ₹24,00,000")
 */
export function formatSalaryRange(
  minPaise?: number | null,
  maxPaise?: number | null,
  fallbackText?: string | null
): string {
  if (minPaise && maxPaise) {
    if (minPaise === maxPaise) {
      return formatINR(minPaise, { showPaise: false });
    }
    return `${formatINR(minPaise, { showPaise: false })} – ${formatINR(maxPaise, { showPaise: false })}`;
  }
  if (minPaise) {
    return `From ${formatINR(minPaise, { showPaise: false })}`;
  }
  if (maxPaise) {
    return `Up to ${formatINR(maxPaise, { showPaise: false })}`;
  }
  return fallbackText || "Not specified";
}

// ============================================================================
// 3. APPLICATION KANBAN & STAGE MANAGEMENT
// ============================================================================

export const APPLICATION_STAGES: { id: ApplicationStage; label: string; color: string; bg: string; border: string }[] = [
  { id: "wishlist", label: "Wishlist", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  { id: "applied", label: "Applied", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "interview", label: "Interview", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "offer", label: "Offer", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "rejected", label: "Rejected", color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
];

export async function getApplications(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, resume:resumes(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return [];
  }

  return (data || []).map((app: any) => ({
    ...app,
    contacts: Array.isArray(app.contacts) ? app.contacts : [],
  })) as Application[];
}

export async function createApplication(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateApplicationInput
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      company: input.company.trim(),
      role: input.role.trim(),
      location: input.location?.trim() || null,
      stage: input.stage || "wishlist",
      applied_at: input.applied_at || (input.stage === "applied" ? new Date().toISOString() : null),
      salary_min_paise: input.salary_min_paise ?? null,
      salary_max_paise: input.salary_max_paise ?? null,
      salary_range: input.salary_range || null,
      job_url: input.job_url?.trim() || null,
      source: input.source?.trim() || "LinkedIn",
      resume_id: input.resume_id || null,
      contacts: (input.contacts || []) as any,
      notes: input.notes?.trim() || null,
      next_follow_up: input.next_follow_up || null,
    })
    .select("*, resume:resumes(*)")
    .single();

  if (error) {
    console.error("Error creating application:", error);
    return null;
  }

  // Write timeline event
  await writeTimelineEvent(supabase, {
    userId,
    type: "career_application",
    summary: `Added job application: ${input.role} at ${input.company}`,
    refTable: "applications",
    refId: data.id,
    meta: {
      company: input.company,
      role: input.role,
      stage: input.stage || "wishlist",
    },
  });

  return {
    ...data,
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
  } as unknown as Application;
}

export async function updateApplicationStage(
  supabase: SupabaseClient<Database>,
  userId: string,
  applicationId: string,
  newStage: ApplicationStage,
  company: string,
  role: string
): Promise<boolean> {
  const updatePayload: Record<string, any> = {
    stage: newStage,
    updated_at: new Date().toISOString(),
  };

  // If moving from wishlist to applied, set applied_at timestamp if empty
  if (newStage === "applied") {
    updatePayload.applied_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("applications")
    .update(updatePayload as any)
    .eq("id", applicationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating application stage:", error);
    return false;
  }

  // Log stage change to timeline_events
  await writeTimelineEvent(supabase, {
    userId,
    type: "career_stage_change",
    summary: `Advanced application for ${role} at ${company} to ${newStage.toUpperCase()} stage`,
    refTable: "applications",
    refId: applicationId,
    meta: {
      company,
      role,
      stage: newStage,
    },
  });

  return true;
}

export async function updateApplication(
  supabase: SupabaseClient<Database>,
  userId: string,
  applicationId: string,
  input: Partial<CreateApplicationInput>
): Promise<Application | null> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.company !== undefined) updateData.company = input.company.trim();
  if (input.role !== undefined) updateData.role = input.role.trim();
  if (input.location !== undefined) updateData.location = input.location?.trim() || null;
  if (input.stage !== undefined) updateData.stage = input.stage;
  if (input.applied_at !== undefined) updateData.applied_at = input.applied_at;
  if (input.salary_min_paise !== undefined) updateData.salary_min_paise = input.salary_min_paise;
  if (input.salary_max_paise !== undefined) updateData.salary_max_paise = input.salary_max_paise;
  if (input.salary_range !== undefined) updateData.salary_range = input.salary_range;
  if (input.job_url !== undefined) updateData.job_url = input.job_url?.trim() || null;
  if (input.source !== undefined) updateData.source = input.source?.trim() || null;
  if (input.resume_id !== undefined) updateData.resume_id = input.resume_id || null;
  if (input.contacts !== undefined) updateData.contacts = input.contacts as any;
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
  if (input.next_follow_up !== undefined) updateData.next_follow_up = input.next_follow_up || null;

  const { data, error } = await supabase
    .from("applications")
    .update(updateData as any)
    .eq("id", applicationId)
    .eq("user_id", userId)
    .select("*, resume:resumes(*)")
    .single();

  if (error) {
    console.error("Error updating application:", error);
    return null;
  }

  return {
    ...data,
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
  } as unknown as Application;
}

export async function deleteApplication(
  supabase: SupabaseClient<Database>,
  userId: string,
  applicationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", userId);

  return !error;
}

// ============================================================================
// 4. FOLLOW-UP REMINDERS
// ============================================================================

export function categorizeFollowUps(applications: Application[]): FollowUpSummary {
  const today = todayIST();
  const summary: FollowUpSummary = {
    overdue: [],
    today: [],
    upcoming: [],
  };

  for (const app of applications) {
    if (!app.next_follow_up || app.stage === "rejected" || app.stage === "offer") {
      continue;
    }

    const followUpDateStr = toISTDateString(app.next_follow_up);
    if (!followUpDateStr) continue;

    if (followUpDateStr < today) {
      summary.overdue.push(app);
    } else if (followUpDateStr === today) {
      summary.today.push(app);
    } else {
      // Within the next 7 days
      summary.upcoming.push(app);
    }
  }

  // Sort by follow-up date ascending
  const sortByDate = (a: Application, b: Application) =>
    (a.next_follow_up || "").localeCompare(b.next_follow_up || "");

  summary.overdue.sort(sortByDate);
  summary.today.sort(sortByDate);
  summary.upcoming.sort(sortByDate);

  return summary;
}

export async function markFollowedUp(
  supabase: SupabaseClient<Database>,
  userId: string,
  application: Application,
  nextFollowUpDate: string | null = null,
  note: string = ""
): Promise<boolean> {
  const updatedNotes = note
    ? `${application.notes ? application.notes + "\n" : ""}[Followed up on ${todayIST()}]: ${note}`
    : application.notes;

  const { error } = await supabase
    .from("applications")
    .update({
      next_follow_up: nextFollowUpDate,
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", application.id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error marking follow-up:", error);
    return false;
  }

  await writeTimelineEvent(supabase, {
    userId,
    type: "career_follow_up",
    summary: `Sent follow-up for ${application.role} at ${application.company}`,
    refTable: "applications",
    refId: application.id,
    meta: {
      company: application.company,
      role: application.role,
      next_follow_up: nextFollowUpDate,
    },
  });

  return true;
}

// ============================================================================
// 5. RESUMES & VERSION TRACKING
// ============================================================================

export async function getResumes(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Resume[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching resumes:", error);
    return [];
  }

  return (data || []).map((r: any) => ({
    ...r,
    content: (r.content as Record<string, unknown>) || {},
  })) as Resume[];
}

export async function createResume(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateResumeInput
): Promise<Resume | null> {
  // If marked as primary, unmark others first
  if (input.is_primary) {
    await supabase
      .from("resumes")
      .update({ is_primary: false })
      .eq("user_id", userId);
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      version_label: input.version_label.trim(),
      target_role: input.target_role?.trim() || null,
      file_url: input.file_url || null,
      drive_file_id: input.drive_file_id || null,
      is_primary: !!input.is_primary,
      notes: input.notes?.trim() || null,
      file_size: input.file_size || 0,
      uploaded_date: input.uploaded_date || todayIST(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating resume:", error);
    return null;
  }

  await writeTimelineEvent(supabase, {
    userId,
    type: "career_resume",
    summary: `Uploaded resume version: ${input.version_label} (${input.target_role || input.title})`,
    refTable: "resumes",
    refId: data.id,
    meta: {
      title: input.title,
      version_label: input.version_label,
      target_role: input.target_role,
      drive_file_id: input.drive_file_id,
    },
  });

  return {
    ...data,
    content: (data.content as Record<string, unknown>) || {},
  } as Resume;
}

export async function setMasterResume(
  supabase: SupabaseClient<Database>,
  userId: string,
  resumeId: string
): Promise<boolean> {
  // 1. Unmark all
  await supabase
    .from("resumes")
    .update({ is_primary: false })
    .eq("user_id", userId);

  // 2. Mark target
  const { error } = await supabase
    .from("resumes")
    .update({ is_primary: true })
    .eq("id", resumeId)
    .eq("user_id", userId);

  return !error;
}

export async function deleteResume(
  supabase: SupabaseClient<Database>,
  userId: string,
  resumeId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", userId);

  return !error;
}

// ============================================================================
// 6. BULLET-POINT BANK
// ============================================================================

export async function getBulletPoints(
  supabase: SupabaseClient<Database>,
  userId: string,
  filter?: { category?: string; skill?: string; search?: string }
): Promise<BulletPoint[]> {
  let query = supabase
    .from("bullet_bank")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filter?.category) {
    query = query.eq("category", filter.category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching bullets:", error);
    return [];
  }

  let bullets = (data || []) as BulletPoint[];

  if (filter?.skill) {
    const s = filter.skill.toLowerCase();
    bullets = bullets.filter((b) => b.skills.some((sk) => sk.toLowerCase().includes(s)));
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    bullets = bullets.filter(
      (b) =>
        b.content.toLowerCase().includes(q) ||
        (b.role && b.role.toLowerCase().includes(q)) ||
        (b.project && b.project.toLowerCase().includes(q))
    );
  }

  return bullets;
}

export async function createBulletPoint(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateBulletInput
): Promise<BulletPoint | null> {
  const { data, error } = await supabase
    .from("bullet_bank")
    .insert({
      user_id: userId,
      content: input.content.trim(),
      category: input.category?.trim() || null,
      skills: input.skills || [],
      project: input.project?.trim() || null,
      role: input.role?.trim() || null,
      metrics: input.metrics?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating bullet point:", error);
    return null;
  }

  return data as BulletPoint;
}

export async function updateBulletPoint(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  input: Partial<CreateBulletInput>
): Promise<BulletPoint | null> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.content !== undefined) updateData.content = input.content.trim();
  if (input.category !== undefined) updateData.category = input.category?.trim() || null;
  if (input.skills !== undefined) updateData.skills = input.skills;
  if (input.project !== undefined) updateData.project = input.project?.trim() || null;
  if (input.role !== undefined) updateData.role = input.role?.trim() || null;
  if (input.metrics !== undefined) updateData.metrics = input.metrics?.trim() || null;

  const { data, error } = await supabase
    .from("bullet_bank")
    .update(updateData as any)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating bullet:", error);
    return null;
  }

  return data as BulletPoint;
}

export async function deleteBulletPoint(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("bullet_bank")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

// ============================================================================
// 7. STAR INTERVIEW STORY BANK & PRACTICE MODE
// ============================================================================

export const STAR_PROMPT_QUESTIONS = [
  {
    category: "Conflict",
    question: "Tell me about a time you had a technical disagreement with a teammate or senior engineer. How did you resolve it?",
  },
  {
    category: "Failure & Resilience",
    question: "Describe a production outage or mistake you made. How did you handle the pressure, communicate, and fix it permanently?",
  },
  {
    category: "Leadership",
    question: "Give an example of a project where you took ownership outside your direct scope to unblock the team or deliver a critical feature.",
  },
  {
    category: "High Impact",
    question: "What is the most impactful feature or architectural optimization you built? Walk me through the numbers and technical choices.",
  },
  {
    category: "Tight Deadlines",
    question: "Tell me about a time you had to deliver under an aggressive deadline with incomplete requirements. What trade-offs did you make?",
  },
  {
    category: "Learning Fast",
    question: "Describe a scenario where you had to learn a completely new framework, language, or system in days to solve a bottleneck.",
  },
  {
    category: "Cross-Functional",
    question: "How do you explain complex backend architecture or technical debt trade-offs to product managers and non-technical stakeholders?",
  },
];

export async function getStories(
  supabase: SupabaseClient<Database>,
  userId: string,
  tagFilter?: string
): Promise<InterviewStory[]> {
  const { data, error } = await supabase
    .from("interview_stories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching stories:", error);
    return [];
  }

  let stories = (data || []) as InterviewStory[];
  if (tagFilter) {
    const t = tagFilter.toLowerCase();
    stories = stories.filter((s) => s.tags?.some((tag) => tag.toLowerCase() === t));
  }

  return stories;
}

export async function createStory(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateStoryInput
): Promise<InterviewStory | null> {
  const { data, error } = await supabase
    .from("interview_stories")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      situation: input.situation.trim(),
      task: input.task.trim(),
      action: input.action.trim(),
      result: input.result.trim(),
      skills: input.skills || [],
      tags: input.tags || [],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating story:", error);
    return null;
  }

  return data as InterviewStory;
}

export async function updateStory(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  input: Partial<CreateStoryInput>
): Promise<InterviewStory | null> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.situation !== undefined) updateData.situation = input.situation.trim();
  if (input.task !== undefined) updateData.task = input.task.trim();
  if (input.action !== undefined) updateData.action = input.action.trim();
  if (input.result !== undefined) updateData.result = input.result.trim();
  if (input.skills !== undefined) updateData.skills = input.skills;
  if (input.tags !== undefined) updateData.tags = input.tags;

  const { data, error } = await supabase
    .from("interview_stories")
    .update(updateData as any)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating story:", error);
    return null;
  }

  return data as InterviewStory;
}

export async function deleteStory(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("interview_stories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

export async function recordPracticeSession(
  supabase: SupabaseClient<Database>,
  userId: string,
  storyTitle: string,
  durationSeconds: number,
  rating: number,
  notes?: string
): Promise<boolean> {
  const durationMins = Math.max(1, Math.round(durationSeconds / 60));

  await writeTimelineEvent(supabase, {
    userId,
    type: "career_practice",
    summary: `Practiced STAR behavioral story: "${storyTitle}" (${durationMins}m, ${rating}★)`,
    meta: {
      story_title: storyTitle,
      duration_seconds: durationSeconds,
      duration_minutes: durationMins,
      rating,
      notes: notes || null,
    },
  });

  return true;
}

// ============================================================================
// 8. COMPANY NOTES & PREP CHECKLIST
// ============================================================================

export async function getCompanyNotes(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CompanyNote[]> {
  const { data, error } = await supabase
    .from("company_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching company notes:", error);
    return [];
  }

  return (data || []).map((cn: any) => ({
    ...cn,
    tech_stack: cn.tech_stack || [],
    questions_asked: cn.questions_asked || [],
    prep_checklist: Array.isArray(cn.prep_checklist) ? cn.prep_checklist : [],
  })) as CompanyNote[];
}

export async function saveCompanyNote(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateCompanyNoteInput,
  existingId?: string
): Promise<CompanyNote | null> {
  const payload: any = {
    user_id: userId,
    company: input.company.trim(),
    culture: input.culture?.trim() || null,
    tech_stack: input.tech_stack || [],
    interview_process: input.interview_process?.trim() || null,
    questions_asked: input.questions_asked || [],
    prep_checklist: input.prep_checklist || [],
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    const { data, error } = await supabase
      .from("company_notes")
      .update(payload)
      .eq("id", existingId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return null;
    return {
      ...data,
      prep_checklist: Array.isArray(data.prep_checklist) ? data.prep_checklist : [],
    } as unknown as CompanyNote;
  }

  const { data, error } = await supabase
    .from("company_notes")
    .insert(payload)
    .select()
    .single();

  if (error) return null;
  return {
    ...data,
    prep_checklist: Array.isArray(data.prep_checklist) ? data.prep_checklist : [],
  } as unknown as CompanyNote;
}

export async function deleteCompanyNote(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("company_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

// ============================================================================
// 9. WEEKLY CAREER STATS & STAGE FUNNEL
// ============================================================================

export function calculateCareerStats(applications: Application[]): CareerWeeklyStats {
  const today = todayIST();
  const [currentYear, currentMonth] = today.split("-");
  const monthPrefix = `${currentYear}-${currentMonth}`;

  // Start of week in IST (Monday)
  const currentDayOfWeek = getISTDayOfWeek(today); // mon, tue, etc.
  const daysFromMonday = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(currentDayOfWeek);

  let thisWeekCount = 0;
  let thisMonthCount = 0;
  let activeInterviews = 0;
  let offersCount = 0;

  const stageCounts: Record<ApplicationStage, number> = {
    wishlist: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };

  for (const app of applications) {
    const stage = app.stage || "wishlist";
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    }

    if (stage === "interview") activeInterviews++;
    if (stage === "offer") offersCount++;

    // Calculate applied counts for week and month
    const appliedDateStr = app.applied_at ? toISTDateString(app.applied_at) : toISTDateString(app.created_at);

    if (appliedDateStr) {
      if (appliedDateStr.startsWith(monthPrefix)) {
        thisMonthCount++;
      }
      // Check if within current week (from this Monday to today)
      // If date difference in days is <= daysFromMonday and >= 0
      const diffMs = new Date(today).getTime() - new Date(appliedDateStr).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= daysFromMonday) {
        thisWeekCount++;
      }
    }
  }

  const nonWishlistTotal = applications.filter((a) => a.stage !== "wishlist").length;
  const positiveOutcomes = stageCounts.interview + stageCounts.offer;
  const responseRatePct = nonWishlistTotal > 0 ? Math.round((positiveOutcomes / nonWishlistTotal) * 100) : 0;

  const total = applications.length;

  const funnel = [
    {
      stage: "wishlist" as ApplicationStage,
      label: "Wishlist",
      count: stageCounts.wishlist,
      pct: total > 0 ? Math.round((stageCounts.wishlist / total) * 100) : 0,
    },
    {
      stage: "applied" as ApplicationStage,
      label: "Applied",
      count: stageCounts.applied,
      pct: total > 0 ? Math.round((stageCounts.applied / total) * 100) : 0,
    },
    {
      stage: "interview" as ApplicationStage,
      label: "Interviewing",
      count: stageCounts.interview,
      pct: total > 0 ? Math.round((stageCounts.interview / total) * 100) : 0,
    },
    {
      stage: "offer" as ApplicationStage,
      label: "Offer",
      count: stageCounts.offer,
      pct: total > 0 ? Math.round((stageCounts.offer / total) * 100) : 0,
    },
    {
      stage: "rejected" as ApplicationStage,
      label: "Rejected / Closed",
      count: stageCounts.rejected,
      pct: total > 0 ? Math.round((stageCounts.rejected / total) * 100) : 0,
    },
  ];

  return {
    applicationsThisWeek: thisWeekCount,
    applicationsThisMonth: thisMonthCount,
    totalApplications: total,
    responseRatePct,
    activeInterviews,
    offersCount,
    funnel,
  };
}
