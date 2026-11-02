// ============================================================================
// Sahil's Shore: Full-Stack Learning Hub Domain Logic & Data Access Layer
// Tracks, Roadmaps, Concepts Log, Projects, Interview Q&A, Mock Interview,
// Mini-Project Ideas, Resources, and Activity Timer Integration
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../types/database.ts";
import type {
  LearningTrack,
  LearningItem,
  LearningConcept,
  Project,
  InterviewQa,
  MiniProjectIdea,
  ResourceLink,
  ActivityLog,
} from "../../types/index.ts";
import { writeTimelineEvent } from "../timeline/index.ts";
import { getActivities, logActivityTime } from "../tracker/index.ts";
import { SPRING_TRACK_SEED, MERN_TRACK_SEED, type SeedTrackData } from "./seeds.ts";

export interface RoadmapProgress {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  percentage: number;
}

export interface CreateConceptInput {
  track_id?: string | null;
  title: string;
  notes: string;
  learned_at?: string;
}

export interface CreateProjectInput {
  track_id?: string | null;
  title: string;
  description?: string | null;
  tech_stack: string[];
  status: "idea" | "in_progress" | "completed" | "deployed";
  repo_url?: string | null;
  deployed_url?: string | null;
  readme_notes?: string | null;
}

export interface CreateInterviewQaInput {
  track_id?: string | null;
  technology: string;
  question: string;
  answer: string;
  difficulty?: string;
  tags: string[];
  confidence?: number;
}

export interface CreateResourceLinkInput {
  track_id?: string | null;
  title: string;
  url: string;
  category?: string;
  description?: string | null;
}

// ----------------------------------------------------------------------------
// Domain Calculations
// ----------------------------------------------------------------------------

export function calculateRoadmapProgress(items: LearningItem[]): RoadmapProgress {
  if (!items || items.length === 0) {
    return { total: 0, completed: 0, inProgress: 0, planned: 0, percentage: 0 };
  }

  let completed = 0;
  let inProgress = 0;
  let planned = 0;

  items.forEach((item) => {
    if (item.status === "completed") completed++;
    else if (item.status === "in_progress") inProgress++;
    else planned++;
  });

  const percentage = Math.round((completed / items.length) * 100);

  return {
    total: items.length,
    completed,
    inProgress,
    planned,
    percentage,
  };
}

/**
 * Selects mock interview questions, prioritizing lower confidence (<= 3)
 * to target areas needing practice, while randomly shuffling.
 */
export function selectMockInterviewQuestions(
  questions: InterviewQa[],
  count: number = 5
): InterviewQa[] {
  if (!questions || questions.length === 0) return [];

  // Sort with weighted randomization: lower confidence gets higher priority
  const scored = questions.map((q) => {
    const confWeight = (6 - (q.confidence || 3)) * 2; // conf 1 => 10, conf 5 => 2
    const randomNoise = Math.random() * 5;
    return { item: q, score: confWeight + randomNoise };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.item);
}

// ----------------------------------------------------------------------------
// Supabase Data Access Functions
// ----------------------------------------------------------------------------

export async function getLearningTracks(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<LearningTrack[]> {
  const { data, error } = await supabase
    .from("learning_tracks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getLearningTracks] Error:", error);
    return [];
  }

  return (data || []) as LearningTrack[];
}

/**
 * Ensures user has the two core tracks ("Java and Spring Boot" and "MERN and TypeScript")
 * along with their seeded roadmaps, interview Q&As, and mini-project ideas.
 */
export async function ensureDefaultLearningTracks(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<LearningTrack[]> {
  let tracks = await getLearningTracks(supabase, userId);

  const seedTrack = async (seedData: SeedTrackData) => {
    // Check if track exists by title or slug
    let existing = tracks.find(
      (t) =>
        t.slug === seedData.slug ||
        t.title.toLowerCase().includes(seedData.slug === "spring" ? "java" : "mern")
    );

    let trackId: string;

    if (!existing) {
      const { data: newTrack, error: trackErr } = await supabase
        .from("learning_tracks")
        .insert({
          user_id: userId,
          title: seedData.title,
          description: seedData.description,
          icon: seedData.icon,
          color: seedData.color,
          slug: seedData.slug,
        })
        .select()
        .single();

      if (trackErr || !newTrack) {
        console.error("[seedTrack] Error creating track:", trackErr);
        return;
      }
      existing = newTrack as LearningTrack;
      trackId = existing.id;
    } else {
      trackId = existing.id;
      // Ensure slug is set
      if (!existing.slug) {
        await supabase
          .from("learning_tracks")
          .update({ slug: seedData.slug })
          .eq("id", trackId);
      }
    }

    // Check if learning items already seeded for this track
    const { count: itemsCount } = await supabase
      .from("learning_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("track_id", trackId);

    if (!itemsCount || itemsCount === 0) {
      // Seed Roadmap Items
      const roadmapInserts = seedData.roadmap.map((item, index) => ({
        user_id: userId,
        track_id: trackId,
        topic: item.topic,
        category: item.category,
        notes: item.notes || null,
        resources: (item.resources || [{ category: item.category }]) as unknown as Json,
        status: "planned" as const,
        order_index: index,
      }));

      const { error: insErr } = await supabase.from("learning_items").insert(roadmapInserts);
      if (insErr) {
        // Fallback for base schema without category/order_index columns
        const baseInserts = seedData.roadmap.map((item) => ({
          user_id: userId,
          track_id: trackId,
          topic: item.topic,
          notes: item.notes || null,
          resources: [{ category: item.category }] as unknown as Json,
          status: "planned" as const,
        }));
        await supabase.from("learning_items").insert(baseInserts);
      }
    }

    // Check if Interview Q&As seeded
    const { count: qaCount } = await supabase
      .from("interview_qa")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("track_id", trackId);

    if (!qaCount || qaCount === 0) {
      const qaInserts = seedData.interviewQa.map((qa) => ({
        user_id: userId,
        track_id: trackId,
        technology: qa.technology,
        question: qa.question,
        answer: qa.answer,
        difficulty: qa.difficulty,
        confidence: qa.confidence,
        tags: qa.tags,
      }));
      const { error: qaErr } = await supabase.from("interview_qa").insert(qaInserts);
      if (qaErr) {
        const baseQa = seedData.interviewQa.map((qa) => ({
          user_id: userId,
          track_id: trackId,
          technology: qa.technology,
          question: qa.question,
          answer: qa.answer,
          difficulty: qa.difficulty,
          tags: qa.tags,
        }));
        await supabase.from("interview_qa").insert(baseQa);
      }
    }

    // Check if Mini Projects seeded
    const { count: ideasCount } = await supabase
      .from("mini_project_ideas")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("track_id", trackId);

    if (!ideasCount || ideasCount === 0) {
      const ideaInserts = seedData.miniProjects.map((idea) => ({
        user_id: userId,
        track_id: trackId,
        title: idea.title,
        description: idea.description,
        difficulty: idea.difficulty,
        suggested_tech: idea.suggested_tech,
        is_completed: false,
      }));
      await supabase.from("mini_project_ideas").insert(ideaInserts);
    }

    // Check if Resources seeded
    const { count: resCount } = await supabase
      .from("resource_links")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("track_id", trackId);

    if (!resCount || resCount === 0) {
      const resInserts = seedData.resources.map((res) => ({
        user_id: userId,
        track_id: trackId,
        title: res.title,
        url: res.url,
        category: res.category,
        description: res.description,
      }));
      await supabase.from("resource_links").insert(resInserts);
    }
  };

  await seedTrack(SPRING_TRACK_SEED);
  await seedTrack(MERN_TRACK_SEED);

  // Return fresh tracks
  tracks = await getLearningTracks(supabase, userId);
  return tracks;
}

// ----------------------------------------------------------------------------
// Roadmap Checklist CRUD
// ----------------------------------------------------------------------------

export async function getRoadmapItems(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId: string
): Promise<LearningItem[]> {
  const { data, error } = await supabase
    .from("learning_items")
    .select("*")
    .eq("user_id", userId)
    .eq("track_id", trackId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getRoadmapItems] Error:", error);
    return [];
  }

  return (data || []) as LearningItem[];
}

export async function toggleRoadmapStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string,
  newStatus: "planned" | "in_progress" | "completed",
  trackTitle?: string
): Promise<LearningItem | null> {
  const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

  const { data: updated, error } = await supabase
    .from("learning_items")
    .update({
      status: newStatus,
      completed_at: completedAt,
    })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !updated) {
    console.error("[toggleRoadmapStatus] Error:", error);
    return null;
  }

  // If completed, record a timeline event
  if (newStatus === "completed") {
    await writeTimelineEvent(supabase, {
      userId,
      type: "study_session",
      summary: `Completed topic: ${updated.topic}${trackTitle ? ` (${trackTitle})` : ""}`,
      refTable: "learning_items",
      refId: updated.id,
      meta: {
        track_id: updated.track_id,
        topic: updated.topic,
        category: updated.category,
      },
    });
  }

  return updated as LearningItem;
}

export async function updateRoadmapItemNotes(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string,
  notes: string
): Promise<LearningItem | null> {
  const { data, error } = await supabase
    .from("learning_items")
    .update({ notes })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[updateRoadmapItemNotes] Error:", error);
    return null;
  }

  return data as LearningItem;
}

// ----------------------------------------------------------------------------
// Concepts-Learned Log CRUD
// ----------------------------------------------------------------------------

export async function getLearningConcepts(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<LearningConcept[]> {
  let query = supabase
    .from("learning_concepts")
    .select("*")
    .eq("user_id", userId);

  if (trackId) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("learned_at", { ascending: false });

  if (error) {
    console.error("[getLearningConcepts] Error:", error);
    return [];
  }

  return (data || []) as LearningConcept[];
}

export async function createLearningConcept(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateConceptInput,
  trackTitle?: string
): Promise<LearningConcept | null> {
  const learnedAt = input.learned_at || new Date().toISOString();

  const { data, error } = await supabase
    .from("learning_concepts")
    .insert({
      user_id: userId,
      track_id: input.track_id || null,
      title: input.title,
      notes: input.notes,
      learned_at: learnedAt,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createLearningConcept] Error:", error);
    return null;
  }

  // Write timeline event
  await writeTimelineEvent(supabase, {
    userId,
    type: "study_session",
    summary: `Logged concept: ${input.title}${trackTitle ? ` (${trackTitle})` : ""}`,
    refTable: "learning_concepts",
    refId: data.id,
    occurredAt: learnedAt,
    meta: {
      track_id: input.track_id,
      title: input.title,
    },
  });

  return data as LearningConcept;
}

export async function deleteLearningConcept(
  supabase: SupabaseClient<Database>,
  userId: string,
  conceptId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("learning_concepts")
    .delete()
    .eq("id", conceptId)
    .eq("user_id", userId);

  return !error;
}

// ----------------------------------------------------------------------------
// Project Tracker CRUD
// ----------------------------------------------------------------------------

export async function getProjects(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<Project[]> {
  let query = supabase.from("projects").select("*").eq("user_id", userId);

  if (trackId) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[getProjects] Error:", error);
    return [];
  }

  return (data || []) as Project[];
}

export async function createProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateProjectInput
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      track_id: input.track_id || null,
      title: input.title,
      description: input.description || null,
      tech_stack: input.tech_stack || [],
      status: input.status,
      repo_url: input.repo_url || null,
      deployed_url: input.deployed_url || null,
      readme_notes: input.readme_notes || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createProject] Error:", error);
    return null;
  }

  await writeTimelineEvent(supabase, {
    userId,
    type: "study_session",
    summary: `Created project: ${input.title} [${input.status}]`,
    refTable: "projects",
    refId: data.id,
    meta: {
      tech_stack: input.tech_stack,
      status: input.status,
      repo_url: input.repo_url,
    },
  });

  return data as Project;
}

export async function updateProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  projectId: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[updateProject] Error:", error);
    return null;
  }

  return data as Project;
}

export async function deleteProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  projectId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  return !error;
}

// ----------------------------------------------------------------------------
// Interview Q&A Bank CRUD
// ----------------------------------------------------------------------------

export async function getInterviewQa(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<InterviewQa[]> {
  let query = supabase.from("interview_qa").select("*").eq("user_id", userId);

  if (trackId) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[getInterviewQa] Error:", error);
    return [];
  }

  return (data || []) as InterviewQa[];
}

export async function createInterviewQa(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateInterviewQaInput
): Promise<InterviewQa | null> {
  const { data, error } = await supabase
    .from("interview_qa")
    .insert({
      user_id: userId,
      track_id: input.track_id || null,
      technology: input.technology,
      question: input.question,
      answer: input.answer,
      difficulty: input.difficulty || "Medium",
      tags: input.tags || [],
      confidence: input.confidence ?? 3,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createInterviewQa] Error:", error);
    return null;
  }

  return data as InterviewQa;
}

export async function updateInterviewQaConfidence(
  supabase: SupabaseClient<Database>,
  userId: string,
  qaId: string,
  confidence: number
): Promise<InterviewQa | null> {
  const { data, error } = await supabase
    .from("interview_qa")
    .update({
      confidence,
      last_practiced_at: new Date().toISOString(),
    })
    .eq("id", qaId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[updateInterviewQaConfidence] Error:", error);
    return null;
  }

  return data as InterviewQa;
}

export async function deleteInterviewQa(
  supabase: SupabaseClient<Database>,
  userId: string,
  qaId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("interview_qa")
    .delete()
    .eq("id", qaId)
    .eq("user_id", userId);

  return !error;
}

// ----------------------------------------------------------------------------
// Mini-Project Ideas & Resources CRUD
// ----------------------------------------------------------------------------

export async function getMiniProjectIdeas(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<MiniProjectIdea[]> {
  let query = supabase.from("mini_project_ideas").select("*").eq("user_id", userId);

  if (trackId) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    console.error("[getMiniProjectIdeas] Error:", error);
    return [];
  }

  return (data || []) as MiniProjectIdea[];
}

export async function convertIdeaToProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  idea: MiniProjectIdea
): Promise<Project | null> {
  const newProject = await createProject(supabase, userId, {
    track_id: idea.track_id,
    title: idea.title,
    description: idea.description,
    tech_stack: idea.suggested_tech,
    status: "in_progress",
    readme_notes: `Started from mini-project idea: ${idea.title}`,
  });

  if (newProject) {
    await supabase
      .from("mini_project_ideas")
      .update({ is_completed: true })
      .eq("id", idea.id)
      .eq("user_id", userId);
  }

  return newProject;
}

export async function getResourceLinks(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<ResourceLink[]> {
  let query = supabase.from("resource_links").select("*").eq("user_id", userId);

  if (trackId) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("category", { ascending: true });

  if (error) {
    console.error("[getResourceLinks] Error:", error);
    return [];
  }

  return (data || []) as ResourceLink[];
}

export async function createResourceLink(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateResourceLinkInput
): Promise<ResourceLink | null> {
  const { data, error } = await supabase
    .from("resource_links")
    .insert({
      user_id: userId,
      track_id: input.track_id || null,
      title: input.title,
      url: input.url,
      category: input.category || "Documentation",
      description: input.description || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[createResourceLink] Error:", error);
    return null;
  }

  return data as ResourceLink;
}

export async function deleteResourceLink(
  supabase: SupabaseClient<Database>,
  userId: string,
  linkId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("resource_links")
    .delete()
    .eq("id", linkId)
    .eq("user_id", userId);

  return !error;
}

// ----------------------------------------------------------------------------
// Activity Timer Study Session Logger
// ----------------------------------------------------------------------------

/**
 * Reuses the daily tracker activity session logger to log study time for
 * Spring Boot or MERN directly into `activity_logs` and `timeline_events`.
 */
export async function logStudySession(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackSlug: "spring" | "mern" | string,
  durationSeconds: number,
  notes?: string
): Promise<ActivityLog | null> {
  const activities = await getActivities(supabase, userId);
  const targetName = trackSlug === "spring" ? "spring boot" : "mern";
  const activity = activities.find((a) =>
    a.name.toLowerCase().includes(targetName)
  );

  if (!activity) {
    console.warn("[logStudySession] Could not find matching activity for track:", trackSlug);
    return null;
  }

  return await logActivityTime(
    supabase,
    userId,
    {
      activity_id: activity.id,
      duration_seconds: durationSeconds,
      notes: notes || `Studied ${activity.name}`,
    },
    activity.name
  );
}
