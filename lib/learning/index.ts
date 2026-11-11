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

export interface TrackTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  slug: string;
  roadmap: Array<{ topic: string; category: string; notes?: string }>;
}

/**
 * Validates if a string is a valid UUID format (standard 8-4-4-4-12 hex).
 */
export function isValidUUID(id?: string | null): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export interface CreateTrackInput {
  title: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  slug?: string | null;
  templateId?: string | null;
  initialRoadmap?: Array<{ topic: string; category?: string; notes?: string }>;
}

export interface TrackMasteryBreakdown {
  overallScore: number; // 0 - 100
  curriculumScore: number;
  projectsScore: number;
  conceptsScore: number;
  interviewScore: number;
  topicsTotal: number;
  topicsMastered: number;
  topicsInProgress: number;
  topicsNoted: number;
  conceptsCount: number;
  projectsCount: number;
  interviewCount: number;
  masteryTier: "Beginner" | "Apprentice" | "Practitioner" | "Advanced" | "Staff Ready";
}

export const PRESET_TRACK_TEMPLATES: TrackTemplate[] = [
  {
    id: "system-design",
    title: "System Design & Distributed Systems",
    description: "High-level architecture, scalability, consistency, microservices, and design patterns",
    icon: "Server",
    color: "#E0A458",
    slug: "system-design",
    roadmap: [
      { topic: "HLD Fundamentals & Requirement Gathering", category: "Core Principles", notes: "Functional vs non-functional requirements, back-of-the-envelope estimations." },
      { topic: "CAP & PACELC Theorems", category: "Distributed Theory", notes: "Consistency vs Availability under network partitions. Trade-offs in Cassandra vs MongoDB." },
      { topic: "Caching Strategies (Redis & Memcached)", category: "Data Tier", notes: "Cache-Aside, Write-Through, Write-Behind, Eviction policies (LRU/LFU), Cache Stampede prevention." },
      { topic: "Load Balancing & Consistent Hashing", category: "Networking", notes: "L4 vs L7 load balancing, health checks, virtual nodes in consistent hashing rings." },
      { topic: "Message Queues & Event Streaming (Kafka)", category: "Asynchronous Architecture", notes: "Producers, Consumer Groups, partitions, exactly-once semantics vs at-least-once." },
      { topic: "Database Sharding & Replication", category: "Data Tier", notes: "Horizontal partitioning, master-replica sync/async replication, split-brain resolution." },
      { topic: "Rate Limiting & API Gateways", category: "Traffic & Security", notes: "Token bucket, Leaky bucket, sliding window counter algorithms. Reverse proxying." },
      { topic: "Microservices Resiliency & Circuit Breakers", category: "Resilience", notes: "Resilience4j / Istio, timeout, retry with exponential backoff, bulkheads." },
    ],
  },
  {
    id: "devops-cloud",
    title: "DevOps & Cloud Architecture",
    description: "Docker, Kubernetes, CI/CD, Terraform, AWS, and enterprise observability",
    icon: "Cloud",
    color: "#BFDBF7",
    slug: "devops-cloud",
    roadmap: [
      { topic: "Docker Multi-stage Builds & Optimization", category: "Containers", notes: "Minimizing image size, layer caching, non-root users, security scanning." },
      { topic: "Docker Compose & Local Microservices Mesh", category: "Containers", notes: "Service orchestration, named networks, persistent volumes, environment configs." },
      { topic: "Kubernetes Core: Pods, Services & Deployments", category: "Kubernetes", notes: "Rolling updates, readiness/liveness probes, ClusterIP vs NodePort vs LoadBalancer." },
      { topic: "Kubernetes ConfigMaps, Secrets & Ingress", category: "Kubernetes", notes: "Decoupling config from pods, secret encryption at rest, NGINX Ingress Controller." },
      { topic: "CI/CD Automation with GitHub Actions", category: "Pipelines", notes: "Automated linting, test runners, Docker build-and-push, semantic release workflows." },
      { topic: "Terraform Infrastructure as Code (IaC)", category: "Cloud & IaC", notes: "HCL syntax, state management, remote backends (S3/GCS), plan/apply cycles." },
      { topic: "AWS Core: EC2, S3, RDS & VPCs", category: "Cloud & IaC", notes: "Subnets, Security Groups, IAM least-privilege policies, managed databases." },
      { topic: "Observability: Prometheus, Grafana & Logs", category: "Monitoring", notes: "RED & USE metrics, log aggregation, alerting thresholds, distributed tracing." },
    ],
  },
  {
    id: "golang-backend",
    title: "Golang Backend Engineering",
    description: "High-concurrency servers, goroutines, channels, interfaces, and microservices in Go",
    icon: "Terminal",
    color: "#2E9E6B",
    slug: "golang-backend",
    roadmap: [
      { topic: "Go Fundamentals, Pointers & Memory Model", category: "Go Core", notes: "Stack vs Heap allocations, escape analysis, value vs pointer semantics." },
      { topic: "Interfaces & Implicit Composition", category: "Go Core", notes: "Duck typing, empty interface (any), type assertions and type switches." },
      { topic: "Goroutines, Channels & Select", category: "Concurrency", notes: "CSP concurrency model, buffered vs unbuffered channels, closing channels safely." },
      { topic: "Sync Package: Mutex, RWMutex & WaitGroup", category: "Concurrency", notes: "Preventing race conditions, go test -race, sync.Once for singleton instances." },
      { topic: "High-Performance REST APIs (Gin / Chi)", category: "Web Services", notes: "Middleware chaining, routing performance, request validation, structured JSON errors." },
      { topic: "Database Persistence (GORM & pgx)", category: "Data Tier", notes: "Connection pooling, context cancellation propagation in SQL queries, migrations." },
      { topic: "gRPC & Protocol Buffers in Go", category: "Microservices", notes: "Defining .proto schemas, streaming RPCs, binary serialization vs JSON." },
    ],
  },
];

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
// Topic Sub-Section Structures & Serializers
// Allows multiple modular sub-sections per topic with dedicated notes, code, and doc links
// ----------------------------------------------------------------------------

export interface TopicSubSectionResource {
  title: string;
  url: string;
  category?: string;
}

export interface TopicSubSection {
  id: string;
  title: string;
  notes: string;
  codeSnippet: string;
  codeLanguage: string;
  resources: TopicSubSectionResource[];
  isCompleted?: boolean;
}

/**
 * Parses all sub-sections for a topic from stored JSON or synthesizes from legacy fields.
 */
export function parseTopicSubSections(
  item: { notes?: string | null; resources?: Json; status?: string } | null | undefined
): TopicSubSection[] {
  if (!item) return [];

  const resourcesData = item.resources as any;

  // 1. Direct subsections array inside object
  if (resourcesData && typeof resourcesData === "object" && !Array.isArray(resourcesData)) {
    if (Array.isArray(resourcesData.subsections) && resourcesData.subsections.length > 0) {
      return resourcesData.subsections.map((sub: any, idx: number) => ({
        id: sub.id || `sub-${idx + 1}-${Date.now()}`,
        title: sub.title || `Sub-Section ${idx + 1}`,
        notes: typeof sub.notes === "string" ? sub.notes : "",
        codeSnippet:
          typeof (sub.codeSnippet || sub.code_snippet) === "string"
            ? sub.codeSnippet || sub.code_snippet
            : "",
        codeLanguage: sub.codeLanguage || sub.language || "java",
        resources: Array.isArray(sub.resources)
          ? sub.resources.map((r: any) => ({
              title: r.title || r.category || "Documentation",
              url: r.url || "",
              category: r.category || "Docs",
            }))
          : [],
        isCompleted: Boolean(sub.isCompleted),
      }));
    }
  }

  // 2. Fallback: Parse from legacy flat item.notes and item.resources
  const parsedLinks: TopicSubSectionResource[] = [];
  let parsedSnippet = "";
  let parsedLang = "java";

  if (Array.isArray(resourcesData)) {
    resourcesData.forEach((r: any) => {
      if (r && r.url) {
        parsedLinks.push({
          title: r.title || r.category || "Documentation",
          url: r.url,
          category: r.category || "Docs",
        });
      } else if (r && (r.code_snippet || r.codeSnippet)) {
        parsedSnippet = r.code_snippet || r.codeSnippet;
        parsedLang = r.language || r.codeLanguage || "java";
      }
    });
  }

  return [
    {
      id: "sub-default-1",
      title: "Overview & Core Architecture",
      notes: item.notes || "",
      codeSnippet: parsedSnippet,
      codeLanguage: parsedLang,
      resources: parsedLinks,
      isCompleted: item.status === "completed",
    },
  ];
}

/**
 * Packs multiple sub-sections into synthesized markdown notes and packed JSON resources.
 */
export function packTopicSubSections(
  subSections: TopicSubSection[],
  primaryCategory?: string | null
): { notes: string; resources: Json } {
  const formattedSections = subSections.map((s, idx) => {
    const header = `### ${s.title || `Sub-Section ${idx + 1}`}`;
    const statusNote = s.isCompleted ? "*(Status: Completed)*" : "";
    const notesContent = s.notes?.trim() || "";
    const codeBlock = s.codeSnippet?.trim()
      ? `\`\`\`${s.codeLanguage || "text"}\n${s.codeSnippet.trim()}\n\`\`\``
      : "";
    const linksList = s.resources?.length
      ? `**Resources:**\n` +
        s.resources
          .filter((r) => r.url)
          .map((r) => `- [${r.title || "Link"}](${r.url})`)
          .join("\n")
      : "";

    return [header, statusNote, notesContent, codeBlock, linksList]
      .filter(Boolean)
      .join("\n\n");
  });

  const combinedNotes = formattedSections.join("\n\n---\n\n");

  const packedData = {
    category: primaryCategory || "General",
    subsections: subSections,
    links: subSections.flatMap((s) => s.resources || []),
  };

  return {
    notes: combinedNotes,
    resources: packedData as unknown as Json,
  };
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
 * Calculates holistic Track Mastery Score across:
 * - 40% Curriculum progression (status + notes depth)
 * - 25% Hands-on projects implementation
 * - 20% Logged knowledge concepts
 * - 15% Interview Q&A confidence & readiness
 */
export function calculateDynamicTrackMastery(
  items: LearningItem[] = [],
  concepts: LearningConcept[] = [],
  projects: Project[] = [],
  questions: InterviewQa[] = []
): TrackMasteryBreakdown {
  const topicsTotal = items.length;
  let topicsMastered = 0;
  let topicsInProgress = 0;
  let topicsNoted = 0;
  let curriculumPoints = 0;

  items.forEach((item) => {
    const subSections = parseTopicSubSections(item);
    const totalSubSections = subSections.length;
    const completedSubSections = subSections.filter((s) => s.isCompleted).length;
    const hasAnyNotes =
      subSections.some((s) => s.notes && s.notes.trim().length > 15) ||
      Boolean(item.notes && item.notes.trim().length > 20);
    const hasRichNotes =
      subSections.some((s) => s.notes && s.notes.trim().length > 50) ||
      Boolean(item.notes && item.notes.trim().length > 60);
    const hasCodeSnippet = subSections.some(
      (s) => s.codeSnippet && s.codeSnippet.trim().length > 10
    );

    if (hasAnyNotes || hasCodeSnippet) topicsNoted++;

    if (item.status === "completed") {
      topicsMastered++;
      curriculumPoints += 100;
    } else if (item.status === "in_progress") {
      topicsInProgress++;
      if (completedSubSections > 0 && totalSubSections > 1) {
        const subRatio = completedSubSections / totalSubSections;
        curriculumPoints += Math.min(95, Math.round(50 + subRatio * 45));
      } else {
        curriculumPoints += hasRichNotes ? 75 : hasAnyNotes ? 50 : 35;
      }
    } else {
      // Planned: Only award points if the user has actively worked on and completed sub-sections
      if (completedSubSections > 0 && totalSubSections > 1) {
        const subRatio = completedSubSections / totalSubSections;
        curriculumPoints += Math.min(60, Math.round(subRatio * 50));
      } else {
        curriculumPoints += 0;
      }
    }
  });

  const curriculumScore =
    topicsTotal > 0 ? Math.round(curriculumPoints / topicsTotal) : 0;

  // Projects points: up to 100 (deployed = 60, completed = 40, in_progress = 25)
  const projectPoints = projects.reduce((acc, p) => {
    if (p.status === "deployed") return acc + 60;
    if (p.status === "completed") return acc + 40;
    if (p.status === "in_progress") return acc + 25;
    return acc;
  }, 0);
  const projectsScore = Math.min(100, projectPoints);

  // Concepts points: 5 concepts = 100% density (20 points per concept)
  const conceptsScore = Math.min(100, concepts.length * 20);

  // Interview readiness points: only count questions the user has actively practiced
  const practicedQuestions = questions.filter((q) => q.last_practiced_at != null);
  const interviewScore =
    practicedQuestions.length > 0
      ? Math.round(
          (practicedQuestions.reduce((acc, q) => acc + (q.confidence || 3), 0) /
            (practicedQuestions.length * 5)) *
            100
        )
      : 0;

  // Weighted overall score:
  // If user only has curriculum so far, dynamically weight to reward early studying
  const hasAuxiliaryContent =
    projects.some((p) => p.status !== "idea") ||
    concepts.length > 0 ||
    practicedQuestions.length > 0;

  let overallScore = 0;
  if (!hasAuxiliaryContent) {
    overallScore = curriculumScore;
  } else {
    overallScore = Math.round(
      curriculumScore * 0.4 +
        projectsScore * 0.25 +
        conceptsScore * 0.2 +
        interviewScore * 0.15
    );
    // Smooth floor: curriculum progress should never be excessively degraded
    overallScore = Math.max(overallScore, Math.round(curriculumScore * 0.65));
  }

  overallScore = Math.min(100, Math.max(0, overallScore));

  let masteryTier: TrackMasteryBreakdown["masteryTier"] = "Beginner";
  if (overallScore >= 85) masteryTier = "Staff Ready";
  else if (overallScore >= 65) masteryTier = "Advanced";
  else if (overallScore >= 40) masteryTier = "Practitioner";
  else if (overallScore >= 15) masteryTier = "Apprentice";

  return {
    overallScore,
    curriculumScore,
    projectsScore,
    conceptsScore,
    interviewScore,
    topicsTotal,
    topicsMastered,
    topicsInProgress,
    topicsNoted,
    conceptsCount: concepts.length,
    projectsCount: projects.length,
    interviewCount: questions.length,
    masteryTier,
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

export async function createLearningTrack(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateTrackInput
): Promise<LearningTrack | null> {
  const slug =
    input.slug ||
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  let track: LearningTrack | null = null;

  try {
    // 1. Primary insert with slug column
    const { data, error } = await supabase
      .from("learning_tracks")
      .insert({
        user_id: userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        icon: input.icon || "Layers",
        color: input.color || "var(--primary)",
        slug,
      })
      .select()
      .single();

    if (!error && data) {
      track = data as LearningTrack;
    } else {
      console.warn("[createLearningTrack] Primary insert error:", error?.message);
      // 2. Fallback insert without slug (for base schema compatibility)
      const fallbackRes = await supabase
        .from("learning_tracks")
        .insert({
          user_id: userId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          icon: input.icon || "Layers",
          color: input.color || "var(--primary)",
        })
        .select()
        .single();

      if (!fallbackRes.error && fallbackRes.data) {
        track = fallbackRes.data as LearningTrack;
      } else {
        console.warn("[createLearningTrack] Fallback insert error:", fallbackRes.error?.message);
      }
    }
  } catch (err) {
    console.warn("[createLearningTrack] Exception during Supabase insert:", err);
  }

  // 3. Guaranteed local fallback if Supabase insert failed (e.g. offline, auth or schema issue)
  if (!track) {
    track = {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || "preview",
      title: input.title.trim(),
      description: input.description?.trim() || null,
      icon: input.icon || "Layers",
      color: input.color || "var(--primary)",
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // If a preset template was selected or initial roadmap provided, seed topics
  let roadmapToSeed = input.initialRoadmap;
  if (!roadmapToSeed && input.templateId) {
    const template = PRESET_TRACK_TEMPLATES.find((t) => t.id === input.templateId);
    if (template) roadmapToSeed = template.roadmap;
  }

  if (roadmapToSeed && roadmapToSeed.length > 0 && userId && !track.id.startsWith("track-")) {
    const items = roadmapToSeed.map((item, idx) => {
      const initialSub = [
        {
          id: `sub-init-${idx + 1}`,
          title: "Overview & Core Architecture",
          notes: item.notes || "",
          codeSnippet: "",
          codeLanguage: "java",
          resources: [],
          isCompleted: false,
        },
      ];

      return {
        user_id: userId,
        track_id: track.id,
        topic: item.topic,
        category: item.category || "Core",
        notes: item.notes || null,
        status: "planned" as const,
        order_index: idx,
        resources: {
          category: item.category || "Core",
          subsections: initialSub,
        } as unknown as Json,
      };
    });

    try {
      const { error: insErr } = await supabase.from("learning_items").insert(items);
      if (insErr) {
        console.warn("[createLearningTrack] Primary items insert warning:", insErr.message);
        // Fallback for base schema without category / order_index columns
        const baseItems = items.map((it) => ({
          user_id: userId,
          track_id: track.id,
          topic: it.topic,
          notes: it.notes,
          resources: it.resources,
          status: it.status,
        }));
        await supabase.from("learning_items").insert(baseItems);
      }
    } catch (e) {
      console.warn("[createLearningTrack] Could not seed items to DB:", e);
    }
  }

  if (userId && !track.id.startsWith("track-")) {
    try {
      await writeTimelineEvent(supabase, {
        userId,
        type: "study_session",
        summary: `Started learning track: ${track.title}`,
        refTable: "learning_tracks",
        refId: track.id,
        meta: { title: track.title, slug: track.slug },
      });
    } catch (tlErr) {
      console.warn("[createLearningTrack] Timeline event write error:", tlErr);
    }
  }

  return track;
}

export async function updateLearningTrack(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId: string,
  updates: Database["public"]["Tables"]["learning_tracks"]["Update"]
): Promise<LearningTrack | null> {
  const { data, error } = await supabase
    .from("learning_tracks")
    .update(updates)
    .eq("id", trackId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    console.error("[updateLearningTrack] Error:", error);
    return null;
  }
  return data as LearningTrack;
}

export async function deleteLearningTrack(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("learning_tracks")
    .delete()
    .eq("id", trackId)
    .eq("user_id", userId);

  return !error;
}

// ----------------------------------------------------------------------------
// Roadmap Checklist CRUD (Resilient & Schema-Adaptive)
// ----------------------------------------------------------------------------

export async function createRoadmapItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: {
    track_id: string;
    topic: string;
    category?: string | null;
    notes?: string | null;
    status?: "planned" | "in_progress" | "completed";
    resources?: Json;
    order_index?: number;
  }
): Promise<LearningItem> {
  const trimmedTopic = input.topic.trim();
  const trimmedCategory = input.category?.trim() || "Core";
  const status = input.status || "planned";
  const orderIndex = input.order_index ?? 0;
  const completedAt = status === "completed" ? new Date().toISOString() : null;

  // Ensure standard packed resources with initial sub-section if not already packed
  let resourcesPayload = input.resources;
  if (!resourcesPayload || (Array.isArray(resourcesPayload) && resourcesPayload.length === 0)) {
    const initialSub: TopicSubSection[] = [
      {
        id: `sub-init-1`,
        title: "Overview & Core Architecture",
        notes: input.notes?.trim() || "",
        codeSnippet: "",
        codeLanguage: "java",
        resources: [],
        isCompleted: status === "completed",
      },
    ];
    resourcesPayload = packTopicSubSections(initialSub, trimmedCategory).resources;
  }

  let item: LearningItem | null = null;
  const hasValidTrackUUID = isValidUUID(input.track_id);
  const isRealUser = Boolean(userId && userId !== "preview");

  if (hasValidTrackUUID && isRealUser) {
    try {
      // 1. Primary insert with enhanced columns (order_index, category)
      const { data, error } = await supabase
        .from("learning_items")
        .insert({
          user_id: userId,
          track_id: input.track_id,
          topic: trimmedTopic,
          category: trimmedCategory,
          notes: input.notes?.trim() || null,
          status,
          resources: resourcesPayload,
          order_index: orderIndex,
          completed_at: completedAt,
        })
        .select()
        .single();

      if (!error && data) {
        item = data as LearningItem;
      } else {
        console.warn("[createRoadmapItem] Primary insert warning:", error?.message);
        // 2. Fallback insert without order_index and category (for base schema compatibility)
        const fallbackRes = await supabase
          .from("learning_items")
          .insert({
            user_id: userId,
            track_id: input.track_id,
            topic: trimmedTopic,
            notes: input.notes?.trim() || null,
            status,
            resources: resourcesPayload,
            completed_at: completedAt,
          })
          .select()
          .single();

        if (!fallbackRes.error && fallbackRes.data) {
          item = {
            ...fallbackRes.data,
            category: trimmedCategory,
            order_index: orderIndex,
          } as LearningItem;
        } else {
          console.warn("[createRoadmapItem] Fallback insert warning:", fallbackRes.error?.message);
        }
      }
    } catch (err) {
      console.warn("[createRoadmapItem] Exception during Supabase insert:", err);
    }
  }

  // 3. Guaranteed local fallback if database insert failed or track is preview/custom
  if (!item) {
    item = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || "preview",
      track_id: input.track_id,
      topic: trimmedTopic,
      category: trimmedCategory,
      notes: input.notes?.trim() || null,
      status,
      resources: resourcesPayload,
      order_index: orderIndex,
      completed_at: completedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // 4. Record timeline event if mastered upon creation
  if (status === "completed" && isRealUser && hasValidTrackUUID && !item.id.startsWith("item-")) {
    try {
      await writeTimelineEvent(supabase, {
        userId,
        type: "study_session",
        summary: `Completed topic: ${item.topic}`,
        refTable: "learning_items",
        refId: item.id,
        meta: {
          track_id: item.track_id,
          topic: item.topic,
          category: item.category,
        },
      });
    } catch (tlErr) {
      console.warn("[createRoadmapItem] Timeline event error:", tlErr);
    }
  }

  return item;
}

export async function updateRoadmapItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string,
  updates: Database["public"]["Tables"]["learning_items"]["Update"]
): Promise<LearningItem | null> {
  const payload: any = { ...updates };
  if (updates.status === "completed" && !updates.completed_at) {
    payload.completed_at = new Date().toISOString();
  } else if (updates.status && updates.status !== "completed") {
    payload.completed_at = null;
  }

  // If itemId is not a UUID, return local representation directly
  if (!isValidUUID(itemId) || !userId || userId === "preview") {
    return {
      id: itemId,
      user_id: userId || "preview",
      track_id: "",
      topic: updates.topic || "Topic",
      category: updates.category || "Core",
      status: updates.status || "planned",
      notes: updates.notes || null,
      resources: updates.resources || ([] as unknown as Json),
      order_index: updates.order_index ?? 0,
      completed_at: payload.completed_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  let updatedItem: LearningItem | null = null;

  try {
    // 1. Primary update
    const { data, error } = await supabase
      .from("learning_items")
      .update(payload)
      .eq("id", itemId)
      .eq("user_id", userId)
      .select()
      .single();

    if (!error && data) {
      updatedItem = data as LearningItem;
    } else {
      console.warn("[updateRoadmapItem] Primary update warning:", error?.message);
      // 2. Fallback update stripping category and order_index
      const { category, order_index, ...strippedPayload } = payload;
      const fallbackRes = await supabase
        .from("learning_items")
        .update(strippedPayload)
        .eq("id", itemId)
        .eq("user_id", userId)
        .select()
        .single();

      if (!fallbackRes.error && fallbackRes.data) {
        updatedItem = {
          ...fallbackRes.data,
          category: updates.category !== undefined ? updates.category : (fallbackRes.data as any).category,
          order_index: updates.order_index !== undefined ? updates.order_index : (fallbackRes.data as any).order_index,
        } as LearningItem;
      }
    }
  } catch (err) {
    console.warn("[updateRoadmapItem] Exception during update:", err);
  }

  if (!updatedItem) {
    updatedItem = {
      id: itemId,
      user_id: userId,
      track_id: "",
      topic: updates.topic || "Topic",
      category: updates.category || "Core",
      status: updates.status || "planned",
      notes: updates.notes || null,
      resources: updates.resources || ([] as unknown as Json),
      order_index: updates.order_index ?? 0,
      completed_at: payload.completed_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return updatedItem;
}

export async function deleteRoadmapItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string
): Promise<boolean> {
  if (!isValidUUID(itemId) || !userId || userId === "preview") {
    return true;
  }

  try {
    const { error } = await supabase
      .from("learning_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", userId);

    return !error;
  } catch (e) {
    console.warn("[deleteRoadmapItem] Exception:", e);
    return true;
  }
}

export async function getRoadmapItems(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId: string
): Promise<LearningItem[]> {
  if (!isValidUUID(trackId) || !userId || userId === "preview") {
    return [];
  }

  try {
    // 1. Try ordering by order_index, created_at
    const { data, error } = await supabase
      .from("learning_items")
      .select("*")
      .eq("user_id", userId)
      .eq("track_id", trackId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data as LearningItem[];
    }

    // 2. Fallback ordering by created_at only (base schema)
    const fallbackRes = await supabase
      .from("learning_items")
      .select("*")
      .eq("user_id", userId)
      .eq("track_id", trackId)
      .order("created_at", { ascending: true });

    if (!fallbackRes.error && fallbackRes.data) {
      return fallbackRes.data as LearningItem[];
    }
  } catch (err) {
    console.warn("[getRoadmapItems] Exception:", err);
  }

  return [];
}

export async function toggleRoadmapStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string,
  newStatus: "planned" | "in_progress" | "completed",
  trackTitle?: string
): Promise<LearningItem | null> {
  const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

  if (!isValidUUID(itemId) || !userId || userId === "preview") {
    return {
      id: itemId,
      user_id: userId || "preview",
      track_id: "",
      topic: "Topic",
      category: "Core",
      status: newStatus,
      completed_at: completedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as LearningItem;
  }

  try {
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
      console.warn("[toggleRoadmapStatus] Warning:", error?.message);
      return null;
    }

    // If completed, record a timeline event
    if (newStatus === "completed") {
      try {
        await writeTimelineEvent(supabase, {
          userId,
          type: "study_session",
          summary: `Completed topic: ${updated.topic}${trackTitle ? ` (${trackTitle})` : ""}`,
          refTable: "learning_items",
          refId: updated.id,
          meta: {
            track_id: updated.track_id,
            topic: updated.topic,
            category: (updated as any).category,
          },
        });
      } catch (e) {
        console.warn("[toggleRoadmapStatus] Timeline write error:", e);
      }
    }

    return updated as LearningItem;
  } catch (e) {
    console.warn("[toggleRoadmapStatus] Exception:", e);
    return null;
  }
}

export async function updateRoadmapItemNotes(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string,
  notes: string
): Promise<LearningItem | null> {
  if (!isValidUUID(itemId) || !userId || userId === "preview") {
    return {
      id: itemId,
      user_id: userId || "preview",
      track_id: "",
      topic: "Topic",
      category: "Core",
      status: "in_progress",
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as LearningItem;
  }

  try {
    const { data, error } = await supabase
      .from("learning_items")
      .update({ notes })
      .eq("id", itemId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      console.warn("[updateRoadmapItemNotes] Warning:", error?.message);
      return null;
    }

    return data as LearningItem;
  } catch (e) {
    console.warn("[updateRoadmapItemNotes] Exception:", e);
    return null;
  }
}

// ----------------------------------------------------------------------------
// Concepts-Learned Log CRUD
// ----------------------------------------------------------------------------

export async function getLearningConcepts(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<LearningConcept[]> {
  if (!userId || userId === "preview") return [];

  let query = supabase
    .from("learning_concepts")
    .select("*")
    .eq("user_id", userId);

  if (trackId && isValidUUID(trackId)) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("learned_at", { ascending: false });

  if (error) {
    console.warn("[getLearningConcepts] Warning:", error.message);
    return [];
  }

  return (data || []) as LearningConcept[];
}

export async function createLearningConcept(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateConceptInput,
  trackTitle?: string
): Promise<LearningConcept> {
  const learnedAt = input.learned_at || new Date().toISOString();
  const trackIdUUID = isValidUUID(input.track_id) ? input.track_id : null;
  let concept: LearningConcept | null = null;
  const isRealUser = Boolean(userId && userId !== "preview");

  if (isRealUser) {
    try {
      const { data, error } = await supabase
        .from("learning_concepts")
        .insert({
          user_id: userId,
          track_id: trackIdUUID,
          title: input.title,
          notes: input.notes,
          learned_at: learnedAt,
        })
        .select()
        .single();

      if (!error && data) {
        concept = data as LearningConcept;
      } else {
        console.warn("[createLearningConcept] Insert warning:", error?.message);
      }
    } catch (e) {
      console.warn("[createLearningConcept] Exception:", e);
    }
  }

  if (!concept) {
    concept = {
      id: `concept-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || "preview",
      track_id: input.track_id || null,
      title: input.title,
      notes: input.notes,
      learned_at: learnedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Write timeline event
  if (isRealUser && !concept.id.startsWith("concept-")) {
    try {
      await writeTimelineEvent(supabase, {
        userId,
        type: "study_session",
        summary: `Logged concept: ${input.title}${trackTitle ? ` (${trackTitle})` : ""}`,
        refTable: "learning_concepts",
        refId: concept.id,
        occurredAt: learnedAt,
        meta: {
          track_id: input.track_id,
          title: input.title,
        },
      });
    } catch (e) {
      console.warn("[createLearningConcept] Timeline event warning:", e);
    }
  }

  return concept;
}

export async function deleteLearningConcept(
  supabase: SupabaseClient<Database>,
  userId: string,
  conceptId: string
): Promise<boolean> {
  if (!isValidUUID(conceptId) || !userId || userId === "preview") {
    return true;
  }

  try {
    const { error } = await supabase
      .from("learning_concepts")
      .delete()
      .eq("id", conceptId)
      .eq("user_id", userId);

    return !error;
  } catch (e) {
    console.warn("[deleteLearningConcept] Exception:", e);
    return true;
  }
}

// ----------------------------------------------------------------------------
// Project Tracker CRUD
// ----------------------------------------------------------------------------

export async function getProjects(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<Project[]> {
  if (!userId || userId === "preview") return [];

  let query = supabase.from("projects").select("*").eq("user_id", userId);

  if (trackId && isValidUUID(trackId)) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.warn("[getProjects] Warning:", error.message);
    return [];
  }

  return (data || []) as Project[];
}

export async function createProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateProjectInput
): Promise<Project> {
  const trackIdUUID = isValidUUID(input.track_id) ? input.track_id : null;
  let project: Project | null = null;
  const isRealUser = Boolean(userId && userId !== "preview");

  if (isRealUser) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          track_id: trackIdUUID,
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

      if (!error && data) {
        project = data as Project;
      } else {
        console.warn("[createProject] Insert warning:", error?.message);
      }
    } catch (e) {
      console.warn("[createProject] Exception:", e);
    }
  }

  if (!project) {
    project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || "preview",
      track_id: input.track_id || null,
      title: input.title,
      description: input.description || null,
      tech_stack: input.tech_stack || [],
      status: input.status,
      repo_url: input.repo_url || null,
      deployed_url: input.deployed_url || null,
      readme_notes: input.readme_notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (isRealUser && !project.id.startsWith("proj-")) {
    try {
      await writeTimelineEvent(supabase, {
        userId,
        type: "study_session",
        summary: `Created project: ${input.title} [${input.status}]`,
        refTable: "projects",
        refId: project.id,
        meta: {
          tech_stack: input.tech_stack,
          status: input.status,
          repo_url: input.repo_url,
        },
      });
    } catch (e) {
      console.warn("[createProject] Timeline event warning:", e);
    }
  }

  return project;
}

export async function updateProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  projectId: string,
  updates: Database["public"]["Tables"]["projects"]["Update"]
): Promise<Project | null> {
  if (!isValidUUID(projectId) || !userId || userId === "preview") {
    return {
      id: projectId,
      user_id: userId || "preview",
      track_id: null,
      title: updates.title || "Project",
      description: updates.description || null,
      tech_stack: updates.tech_stack || [],
      status: (updates.status as any) || "in_progress",
      repo_url: updates.repo_url || null,
      deployed_url: updates.deployed_url || null,
      readme_notes: updates.readme_notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      console.warn("[updateProject] Warning:", error?.message);
      return null;
    }

    return data as Project;
  } catch (e) {
    console.warn("[updateProject] Exception:", e);
    return null;
  }
}

export async function deleteProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  projectId: string
): Promise<boolean> {
  if (!isValidUUID(projectId) || !userId || userId === "preview") {
    return true;
  }

  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId);

    return !error;
  } catch (e) {
    console.warn("[deleteProject] Exception:", e);
    return true;
  }
}

// ----------------------------------------------------------------------------
// Interview Q&A Bank CRUD
// ----------------------------------------------------------------------------

export async function getInterviewQa(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<InterviewQa[]> {
  if (!userId || userId === "preview") return [];

  let query = supabase.from("interview_qa").select("*").eq("user_id", userId);

  if (trackId && isValidUUID(trackId)) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.warn("[getInterviewQa] Warning:", error.message);
    return [];
  }

  return (data || []) as InterviewQa[];
}

export async function createInterviewQa(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateInterviewQaInput
): Promise<InterviewQa> {
  const trackIdUUID = isValidUUID(input.track_id) ? input.track_id : null;
  let qa: InterviewQa | null = null;
  const isRealUser = Boolean(userId && userId !== "preview");

  if (isRealUser) {
    try {
      const { data, error } = await supabase
        .from("interview_qa")
        .insert({
          user_id: userId,
          track_id: trackIdUUID,
          technology: input.technology,
          question: input.question,
          answer: input.answer,
          difficulty: input.difficulty || "Medium",
          tags: input.tags || [],
          confidence: input.confidence ?? 3,
        })
        .select()
        .single();

      if (!error && data) {
        qa = data as InterviewQa;
      } else {
        console.warn("[createInterviewQa] Insert warning:", error?.message);
      }
    } catch (e) {
      console.warn("[createInterviewQa] Exception:", e);
    }
  }

  if (!qa) {
    qa = {
      id: `qa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || "preview",
      track_id: input.track_id || null,
      technology: input.technology,
      question: input.question,
      answer: input.answer,
      difficulty: input.difficulty || "Medium",
      tags: input.tags || [],
      confidence: input.confidence ?? 3,
      last_practiced_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return qa;
}

export async function updateInterviewQaConfidence(
  supabase: SupabaseClient<Database>,
  userId: string,
  qaId: string,
  confidence: number
): Promise<InterviewQa | null> {
  if (!isValidUUID(qaId) || !userId || userId === "preview") {
    return {
      id: qaId,
      user_id: userId || "preview",
      track_id: null,
      technology: "General",
      question: "",
      answer: "",
      difficulty: "Medium",
      tags: [],
      confidence,
      last_practiced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
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
      console.warn("[updateInterviewQaConfidence] Warning:", error?.message);
      return null;
    }

    return data as InterviewQa;
  } catch (e) {
    console.warn("[updateInterviewQaConfidence] Exception:", e);
    return null;
  }
}

export async function deleteInterviewQa(
  supabase: SupabaseClient<Database>,
  userId: string,
  qaId: string
): Promise<boolean> {
  if (!isValidUUID(qaId) || !userId || userId === "preview") {
    return true;
  }

  try {
    const { error } = await supabase
      .from("interview_qa")
      .delete()
      .eq("id", qaId)
      .eq("user_id", userId);

    return !error;
  } catch (e) {
    console.warn("[deleteInterviewQa] Exception:", e);
    return true;
  }
}

// ----------------------------------------------------------------------------
// Mini-Project Ideas & Resources CRUD
// ----------------------------------------------------------------------------

export async function getMiniProjectIdeas(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<MiniProjectIdea[]> {
  if (!userId || userId === "preview") return [];

  let query = supabase.from("mini_project_ideas").select("*").eq("user_id", userId);

  if (trackId && isValidUUID(trackId)) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    console.warn("[getMiniProjectIdeas] Warning:", error.message);
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

  if (newProject && isValidUUID(idea.id) && userId && userId !== "preview") {
    try {
      await supabase
        .from("mini_project_ideas")
        .update({ is_completed: true })
        .eq("id", idea.id)
        .eq("user_id", userId);
    } catch (e) {
      console.warn("[convertIdeaToProject] Idea update warning:", e);
    }
  }

  return newProject;
}

export async function getResourceLinks(
  supabase: SupabaseClient<Database>,
  userId: string,
  trackId?: string
): Promise<ResourceLink[]> {
  if (!userId || userId === "preview") return [];

  let query = supabase.from("resource_links").select("*").eq("user_id", userId);

  if (trackId && isValidUUID(trackId)) {
    query = query.eq("track_id", trackId);
  }

  const { data, error } = await query.order("category", { ascending: true });

  if (error) {
    console.warn("[getResourceLinks] Warning:", error.message);
    return [];
  }

  return (data || []) as ResourceLink[];
}

export async function createResourceLink(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateResourceLinkInput
): Promise<ResourceLink> {
  const trackIdUUID = isValidUUID(input.track_id) ? input.track_id : null;
  let resLink: ResourceLink | null = null;
  const isRealUser = Boolean(userId && userId !== "preview");

  if (isRealUser) {
    try {
      const { data, error } = await supabase
        .from("resource_links")
        .insert({
          user_id: userId,
          track_id: trackIdUUID,
          title: input.title,
          url: input.url,
          category: input.category || "Documentation",
          description: input.description || null,
        })
        .select()
        .single();

      if (!error && data) {
        resLink = data as ResourceLink;
      } else {
        console.warn("[createResourceLink] Insert warning:", error?.message);
      }
    } catch (e) {
      console.warn("[createResourceLink] Exception:", e);
    }
  }

  if (!resLink) {
    resLink = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || "preview",
      track_id: input.track_id || null,
      title: input.title,
      url: input.url,
      category: input.category || "Documentation",
      description: input.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return resLink;
}

export async function deleteResourceLink(
  supabase: SupabaseClient<Database>,
  userId: string,
  linkId: string
): Promise<boolean> {
  if (!isValidUUID(linkId) || !userId || userId === "preview") {
    return true;
  }

  try {
    const { error } = await supabase
      .from("resource_links")
      .delete()
      .eq("id", linkId)
      .eq("user_id", userId);

    return !error;
  } catch (e) {
    console.warn("[deleteResourceLink] Exception:", e);
    return true;
  }
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
  if (!userId || userId === "preview") return null;

  try {
    const activities = await getActivities(supabase, userId);
    const targetName = trackSlug === "spring" ? "spring boot" : trackSlug === "mern" ? "mern" : trackSlug.toLowerCase();
    let activity = activities.find((a) =>
      a.name.toLowerCase().includes(targetName)
    );

    if (!activity) {
      // Fallback to first study-related activity or first activity
      activity = activities.find((a) =>
        a.name.toLowerCase().includes("spring") ||
        a.name.toLowerCase().includes("mern") ||
        a.name.toLowerCase().includes("study")
      ) || activities[0];
    }

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
  } catch (e) {
    console.warn("[logStudySession] Exception:", e);
    return null;
  }
}
