"use client";

// ============================================================================
// Sahil's Shore: Full-Stack Learning Hub Main Container
// Dynamic multi-track management, custom track creation,
// multi-pillar mastery scoring, deep topic study notes, and roadmap editor.
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  BookOpen,
  Lightbulb,
  FolderGit2,
  HelpCircle,
  Sparkles,
  Bookmark,
  RefreshCw,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  LearningTrack,
  LearningItem,
  LearningConcept,
  Project,
  InterviewQa,
  MiniProjectIdea,
  ResourceLink,
  Json,
} from "@/types";
import {
  ensureDefaultLearningTracks,
  getRoadmapItems,
  toggleRoadmapStatus,
  createRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  createLearningTrack,
  deleteLearningTrack,
  getLearningConcepts,
  createLearningConcept,
  deleteLearningConcept,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getInterviewQa,
  createInterviewQa,
  updateInterviewQaConfidence,
  deleteInterviewQa,
  getMiniProjectIdeas,
  convertIdeaToProject,
  getResourceLinks,
  createResourceLink,
  deleteResourceLink,
  logStudySession,
  calculateDynamicTrackMastery,
  packTopicSubSections,
  PRESET_TRACK_TEMPLATES,
  type CreateTrackInput,
  type CreateConceptInput,
  type CreateProjectInput,
  type CreateInterviewQaInput,
  type CreateResourceLinkInput,
} from "@/lib/learning";
import { SPRING_TRACK_SEED, MERN_TRACK_SEED } from "@/lib/learning/seeds";
import { TrackSelector } from "./TrackSelector";
import { StudyTimerBar } from "./StudyTimerBar";
import { RoadmapChecklist } from "./RoadmapChecklist";
import { ConceptsLog } from "./ConceptsLog";
import { ProjectTracker } from "./ProjectTracker";
import { InterviewQaBank } from "./InterviewQaBank";
import { MiniProjectIdeas } from "./MiniProjectIdeas";
import { ResourceLinksList } from "./ResourceLinksList";
import { CreateTrackModal } from "./CreateTrackModal";

type LearningTab =
  | "roadmap"
  | "concepts"
  | "projects"
  | "interview"
  | "mini_projects"
  | "resources";

export function LearningContainer() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LearningTab>("roadmap");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateTrackOpen, setIsCreateTrackOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Track data
  const [roadmapItems, setRoadmapItems] = useState<LearningItem[]>([]);
  const [concepts, setConcepts] = useState<LearningConcept[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQa[]>([]);
  const [miniProjectIdeas, setMiniProjectIdeas] = useState<MiniProjectIdea[]>([]);
  const [resourceLinks, setResourceLinks] = useState<ResourceLink[]>([]);

  // Dynamic mastery map per track (trackId -> score 0-100)
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initialize user and ensure default tracks
  useEffect(() => {
    async function initUserAndTracks() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const loadedTracks = await ensureDefaultLearningTracks(supabase, user.id);
          // Also load any custom tracks saved locally that might not be in DB yet
          let customTracks: LearningTrack[] = [];
          if (typeof window !== "undefined") {
            try {
              const raw = localStorage.getItem("shore_custom_tracks") || localStorage.getItem("shore_preview_tracks");
              if (raw) customTracks = JSON.parse(raw);
            } catch (e) {
              console.warn("Failed reading custom tracks", e);
            }
          }
          const merged = [...loadedTracks];
          for (const ct of customTracks) {
            if (!merged.some((t) => t.id === ct.id || t.title.toLowerCase() === ct.title.toLowerCase())) {
              merged.push(ct);
            }
          }
          setTracks(merged);
          if (merged.length > 0) {
            setActiveTrackId(merged[0].id);
          }
        } else {
          // Preview mode: display default seeded tracks + saved custom tracks from localStorage
          const defaultTracks: LearningTrack[] = [
            {
              id: "preview-spring",
              user_id: "preview",
              title: SPRING_TRACK_SEED.title,
              description: SPRING_TRACK_SEED.description,
              icon: SPRING_TRACK_SEED.icon,
              color: SPRING_TRACK_SEED.color,
              slug: SPRING_TRACK_SEED.slug,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "preview-mern",
              user_id: "preview",
              title: MERN_TRACK_SEED.title,
              description: MERN_TRACK_SEED.description,
              icon: MERN_TRACK_SEED.icon,
              color: MERN_TRACK_SEED.color,
              slug: MERN_TRACK_SEED.slug,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];

          let customTracks: LearningTrack[] = [];
          if (typeof window !== "undefined") {
            try {
              const raw = localStorage.getItem("shore_custom_tracks") || localStorage.getItem("shore_preview_tracks");
              if (raw) customTracks = JSON.parse(raw);
            } catch (e) {
              console.warn("Failed reading preview tracks", e);
            }
          }

          const combined = [...defaultTracks];
          for (const ct of customTracks) {
            if (!combined.some((t) => t.id === ct.id || t.title.toLowerCase() === ct.title.toLowerCase())) {
              combined.push(ct);
            }
          }
          setTracks(combined);
          setActiveTrackId(combined[0]?.id || "preview-spring");
        }
      } catch (err) {
        console.error("[LearningContainer] Error initializing tracks:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initUserAndTracks();
  }, [supabase]);

  // 2. Load active track data
  const fetchTrackData = useCallback(async () => {
    if (!activeTrackId) return;

    if (!userId) {
      // Check if custom roadmap exists in localStorage for this active track
      let savedItems: LearningItem[] | null = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`shore_preview_roadmap_${activeTrackId}`);
          if (raw) savedItems = JSON.parse(raw);
        } catch (e) {
          console.warn("Failed reading preview roadmap from localStorage", e);
        }
      }

      let items: LearningItem[] = [];
      if (savedItems && savedItems.length > 0) {
        items = savedItems;
      } else {
        const isSpring = activeTrackId.includes("spring");
        const seed = isSpring ? SPRING_TRACK_SEED : MERN_TRACK_SEED;

        items = seed.roadmap.map((item, idx) => ({
          id: `preview-item-${idx}`,
          user_id: "preview",
          track_id: activeTrackId,
          topic: item.topic,
          status: "planned",
          notes: item.notes || null,
          resources: (item.resources || [{ category: item.category }]) as unknown as Json,
          category: item.category,
          order_index: idx,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`shore_preview_roadmap_${activeTrackId}`, JSON.stringify(items));
          } catch (e) {}
        }
      }

      const isSpring = activeTrackId.includes("spring");
      const seed = isSpring ? SPRING_TRACK_SEED : MERN_TRACK_SEED;

      const qList: InterviewQa[] = seed.interviewQa.map((qa, idx) => ({
        id: `preview-qa-${idx}`,
        user_id: "preview",
        track_id: activeTrackId,
        technology: qa.technology,
        question: qa.question,
        answer: qa.answer,
        difficulty: qa.difficulty,
        confidence: qa.confidence,
        tags: qa.tags,
        last_practiced_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const ideas: MiniProjectIdea[] = seed.miniProjects.map((idea, idx) => ({
        id: `preview-idea-${idx}`,
        user_id: "preview",
        track_id: activeTrackId,
        title: idea.title,
        description: idea.description,
        difficulty: idea.difficulty,
        suggested_tech: idea.suggested_tech,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const rLinks: ResourceLink[] = seed.resources.map((res, idx) => ({
        id: `preview-res-${idx}`,
        user_id: "preview",
        track_id: activeTrackId,
        title: res.title,
        url: res.url,
        category: res.category,
        description: res.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setRoadmapItems(items);
      setInterviewQuestions(qList);
      setMiniProjectIdeas(ideas);
      setResourceLinks(rLinks);

      const mastery = calculateDynamicTrackMastery(items, [], [], qList);
      setProgressMap((prev) => ({ ...prev, [activeTrackId]: mastery.overallScore }));
      return;
    }

    try {
      const [rItems, cLogs, pList, qList, ideas, rLinks] = await Promise.all([
        getRoadmapItems(supabase, userId, activeTrackId),
        getLearningConcepts(supabase, userId, activeTrackId),
        getProjects(supabase, userId, activeTrackId),
        getInterviewQa(supabase, userId, activeTrackId),
        getMiniProjectIdeas(supabase, userId, activeTrackId),
        getResourceLinks(supabase, userId, activeTrackId),
      ]);

      // Check if there are local offline roadmap items not yet in Supabase
      let finalRoadmap = rItems;
      if (typeof window !== "undefined") {
        try {
          const localRaw = localStorage.getItem(`shore_roadmap_${activeTrackId}`);
          if (localRaw) {
            const localItems: LearningItem[] = JSON.parse(localRaw);
            if (Array.isArray(localItems) && localItems.length > 0) {
              const existingIds = new Set(rItems.map((i) => i.id));
              const existingTopics = new Set(rItems.map((i) => i.topic.toLowerCase().trim()));
              const merged = [...rItems];
              for (const loc of localItems) {
                if (!existingIds.has(loc.id) && !existingTopics.has(loc.topic.toLowerCase().trim())) {
                  merged.push(loc);
                }
              }
              finalRoadmap = merged;
            }
          }
        } catch (e) {}
      }

      setRoadmapItems(finalRoadmap);
      setConcepts(cLogs);
      setProjects(pList);
      setInterviewQuestions(qList);
      setMiniProjectIdeas(ideas);
      setResourceLinks(rLinks);

      // Update dynamic mastery score for active track
      const mastery = calculateDynamicTrackMastery(finalRoadmap, cLogs, pList, qList);
      setProgressMap((prev) => ({ ...prev, [activeTrackId]: mastery.overallScore }));
    } catch (err) {
      console.error("[LearningContainer] Error loading track data:", err);
    }
  }, [supabase, userId, activeTrackId]);

  useEffect(() => {
    if (activeTrackId) {
      fetchTrackData();
    }
  }, [activeTrackId, fetchTrackData]);

  const activeTrack = useMemo(() => {
    return tracks.find((t) => t.id === activeTrackId) || null;
  }, [tracks, activeTrackId]);

  // Dynamic holistic mastery score breakdown for currently active track
  const currentTrackMastery = useMemo(() => {
    return calculateDynamicTrackMastery(
      roadmapItems,
      concepts,
      projects,
      interviewQuestions
    );
  }, [roadmapItems, concepts, projects, interviewQuestions]);

  // Keep progressMap synced whenever currentTrackMastery recomputes
  useEffect(() => {
    if (activeTrackId) {
      setProgressMap((prev) => ({
        ...prev,
        [activeTrackId]: currentTrackMastery.overallScore,
      }));
    }
  }, [activeTrackId, currentTrackMastery]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  // Track Creation & Deletion
  const handleCreateTrack = async (input: CreateTrackInput) => {
    try {
      let created: LearningTrack | null = null;
      let seeded: LearningItem[] = [];

      // Find roadmap from template if applicable
      let roadmapToSeed = input.initialRoadmap;
      if (!roadmapToSeed && input.templateId) {
        const template = PRESET_TRACK_TEMPLATES.find((t) => t.id === input.templateId);
        if (template) roadmapToSeed = template.roadmap;
      }

      if (userId) {
        created = await createLearningTrack(supabase, userId, input);
      }

      if (!created) {
        const tempId = `custom-${Date.now()}`;
        created = {
          id: tempId,
          user_id: userId || "preview",
          title: input.title.trim(),
          description: input.description?.trim() || null,
          icon: input.icon || "Layers",
          color: input.color || "var(--primary)",
          slug: input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Build initial seeded roadmap items
      if (roadmapToSeed && roadmapToSeed.length > 0) {
        seeded = roadmapToSeed.map((item, idx) => ({
          id: `item-${created!.id}-${idx}`,
          user_id: userId || "preview",
          track_id: created!.id,
          topic: item.topic,
          category: item.category || "Core",
          notes: item.notes || null,
          status: "planned",
          resources: {
            category: item.category || "Core",
            subsections: [
              {
                id: `sub-init-${idx + 1}`,
                title: "Overview & Core Architecture",
                notes: item.notes || "",
                codeSnippet: "",
                codeLanguage: "java",
                resources: [],
                isCompleted: false,
              },
            ],
          } as unknown as Json,
          order_index: idx,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      }

      // Save to localStorage for resilient offline/refresh support
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("shore_custom_tracks");
          const existingCustom: LearningTrack[] = raw ? JSON.parse(raw) : [];
          const nextCustom = [...existingCustom.filter((t) => t.id !== created!.id), created!];
          localStorage.setItem("shore_custom_tracks", JSON.stringify(nextCustom));
          localStorage.setItem("shore_preview_tracks", JSON.stringify(nextCustom));
          localStorage.setItem(`shore_preview_roadmap_${created!.id}`, JSON.stringify(seeded));
        } catch (e) {
          console.warn("Failed saving custom track to localStorage", e);
        }
      }

      // Query DB items if persisted, otherwise use seeded
      let activeItems = seeded;
      if (userId && !created.id.startsWith("custom-") && !created.id.startsWith("track-")) {
        try {
          const dbItems = await getRoadmapItems(supabase, userId, created.id);
          if (dbItems && dbItems.length > 0) {
            activeItems = dbItems;
          }
        } catch (err) {
          console.warn("Error loading db roadmap items for created track:", err);
        }
      }

      setTracks((prev) => {
        const filtered = prev.filter((t) => t.id !== created!.id);
        return [...filtered, created!];
      });
      setRoadmapItems(activeItems);
      setActiveTrackId(created.id);
      showToast(`Created track: "${created.title}" with ${activeItems.length} topics!`);
    } catch (err: any) {
      console.error("[handleCreateTrack] Error:", err);
      showToast(err?.message || "Failed to create track.");
      throw err;
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    setTracks((prev) => {
      const remaining = prev.filter((t) => t.id !== trackId);
      if (activeTrackId === trackId && remaining.length > 0) {
        setActiveTrackId(remaining[0].id);
      }
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("shore_custom_tracks");
          if (raw) {
            const list: LearningTrack[] = JSON.parse(raw);
            localStorage.setItem("shore_custom_tracks", JSON.stringify(list.filter((t) => t.id !== trackId)));
          }
          const rawPrev = localStorage.getItem("shore_preview_tracks");
          if (rawPrev) {
            const list: LearningTrack[] = JSON.parse(rawPrev);
            localStorage.setItem("shore_preview_tracks", JSON.stringify(list.filter((t) => t.id !== trackId)));
          }
          localStorage.removeItem(`shore_preview_roadmap_${trackId}`);
        } catch (e) {
          console.warn("Failed removing custom track", e);
        }
      }
      return remaining;
    });
    showToast("Track deleted.");

    if (userId && !trackId.startsWith("custom-") && !trackId.startsWith("track-")) {
      try {
        await deleteLearningTrack(supabase, userId, trackId);
      } catch (e) {
        console.warn("Delete track error:", e);
      }
    }
  };

  // Study Timer Session Logging
  const handleSaveStudySession = async (
    durationSeconds: number,
    notes?: string
  ) => {
    if (!userId || !activeTrack) return;
    const slug = activeTrack.slug || "spring";
    const log = await logStudySession(
      supabase,
      userId,
      slug,
      durationSeconds,
      notes
    );
    if (log) {
      const mins = Math.round(durationSeconds / 60);
      showToast(`Logged ${mins}m study session to Daily Tracker & Timeline!`);
    }
  };

  // Roadmap Items
  const handleToggleRoadmapStatus = async (
    itemId: string,
    newStatus: "planned" | "in_progress" | "completed"
  ) => {
    setRoadmapItems((prev) => {
      const next = prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: newStatus,
              completed_at: newStatus === "completed" ? new Date().toISOString() : null,
            }
          : item
      );
      if (typeof window !== "undefined" && activeTrackId) {
        try {
          const key = userId ? `shore_roadmap_${activeTrackId}` : `shore_preview_roadmap_${activeTrackId}`;
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    const targetItem = roadmapItems.find((i) => i.id === itemId);
    showToast(
      newStatus === "completed"
        ? `Mastered "${targetItem?.topic || "Topic"}"! Added to timeline.`
        : `Updated status to ${newStatus.replace("_", " ")}`
    );

    if (userId) {
      try {
        await toggleRoadmapStatus(
          supabase,
          userId,
          itemId,
          newStatus,
          activeTrack?.title
        );
      } catch (e) {
        console.warn("Toggle roadmap status warning:", e);
      }
    }
  };

  const handleUpdateTopic = async (
    itemId: string,
    updates: {
      topic?: string;
      category?: string | null;
      status?: "planned" | "in_progress" | "completed";
      notes?: string | null;
      resources?: Json;
    }
  ) => {
    setRoadmapItems((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item));
      if (typeof window !== "undefined" && activeTrackId) {
        try {
          const key = userId ? `shore_roadmap_${activeTrackId}` : `shore_preview_roadmap_${activeTrackId}`;
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    showToast("Saved study notes & topic progress!");

    if (userId) {
      try {
        const updated = await updateRoadmapItem(supabase, userId, itemId, updates);
        if (updated) {
          setRoadmapItems((prev) =>
            prev.map((item) => (item.id === itemId ? updated : item))
          );
        }
      } catch (e) {
        console.warn("Update topic warning:", e);
      }
    }
  };

  const handleAddTopic = async (input: {
    topic: string;
    category: string;
    notes?: string;
    status: "planned" | "in_progress" | "completed";
  }) => {
    if (!activeTrackId) return;

    const trimmedTopic = input.topic.trim();
    if (!trimmedTopic) return;

    const trimmedCategory = input.category.trim() || "Core Principles";

    // 1. Pack standard resources with initial sub-section
    const initialSub = [
      {
        id: `sub-init-${Date.now()}`,
        title: "Overview & Core Architecture",
        notes: input.notes?.trim() || "",
        codeSnippet: "",
        codeLanguage: "java",
        resources: [],
        isCompleted: input.status === "completed",
      },
    ];
    const packed = packTopicSubSections(initialSub, trimmedCategory);

    // 2. Generate optimistic item
    const tempId = `topic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticItem: LearningItem = {
      id: tempId,
      user_id: userId || "preview",
      track_id: activeTrackId,
      topic: trimmedTopic,
      category: trimmedCategory,
      notes: input.notes?.trim() || null,
      status: input.status,
      resources: packed.resources,
      order_index: roadmapItems.length,
      completed_at: input.status === "completed" ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 3. Immediately update UI state & localStorage
    setRoadmapItems((prev) => {
      const next = [...prev, optimisticItem];
      if (typeof window !== "undefined") {
        try {
          const key = userId ? `shore_roadmap_${activeTrackId}` : `shore_preview_roadmap_${activeTrackId}`;
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    showToast(`Added topic "${trimmedTopic}" to roadmap!`);

    // 4. If logged in, persist to database & reconcile permanent ID
    if (userId) {
      try {
        const created = await createRoadmapItem(supabase, userId, {
          track_id: activeTrackId,
          topic: trimmedTopic,
          category: trimmedCategory,
          notes: input.notes,
          status: input.status,
          resources: packed.resources,
          order_index: roadmapItems.length,
        });

        if (created && created.id !== tempId) {
          setRoadmapItems((prev) => {
            const next = prev.map((item) => (item.id === tempId ? created : item));
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(`shore_roadmap_${activeTrackId}`, JSON.stringify(next));
              } catch (e) {}
            }
            return next;
          });
        }
      } catch (err: any) {
        console.warn("[handleAddTopic] Supabase insert warning, safely retained locally:", err);
      }
    }
  };

  const handleDeleteTopic = async (itemId: string) => {
    setRoadmapItems((prev) => {
      const next = prev.filter((item) => item.id !== itemId);
      if (typeof window !== "undefined" && activeTrackId) {
        try {
          const key = userId ? `shore_roadmap_${activeTrackId}` : `shore_preview_roadmap_${activeTrackId}`;
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    showToast("Topic removed from roadmap.");

    if (userId) {
      try {
        await deleteRoadmapItem(supabase, userId, itemId);
      } catch (e) {
        console.warn("Delete topic warning:", e);
      }
    }
  };

  // Concepts
  const handleAddConcept = async (input: CreateConceptInput) => {
    if (!userId) {
      const newConcept: LearningConcept = {
        id: `concept-${Date.now()}`,
        user_id: "preview",
        track_id: activeTrackId,
        title: input.title,
        notes: input.notes,
        learned_at: input.learned_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConcepts((prev) => [newConcept, ...prev]);
      showToast(`Logged concept "${input.title}"`);
      return;
    }

    const created = await createLearningConcept(
      supabase,
      userId,
      { ...input, track_id: activeTrackId },
      activeTrack?.title
    );
    if (created) {
      setConcepts((prev) => [created, ...prev]);
      showToast(`Logged concept "${created.title}"`);
    }
  };

  const handleDeleteConcept = async (conceptId: string) => {
    if (!userId) {
      setConcepts((prev) => prev.filter((c) => c.id !== conceptId));
      showToast("Concept deleted");
      return;
    }
    const success = await deleteLearningConcept(supabase, userId, conceptId);
    if (success) {
      setConcepts((prev) => prev.filter((c) => c.id !== conceptId));
      showToast("Concept deleted");
    }
  };

  // Projects
  const handleSaveProject = async (
    input: CreateProjectInput,
    projectId?: string
  ) => {
    if (!userId) {
      if (projectId) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? ({ ...p, ...input, updated_at: new Date().toISOString() } as Project)
              : p
          )
        );
        showToast("Project updated");
      } else {
        const newProj: Project = {
          id: `proj-${Date.now()}`,
          user_id: "preview",
          track_id: activeTrackId,
          title: input.title,
          description: input.description || null,
          tech_stack: input.tech_stack,
          status: input.status,
          repo_url: input.repo_url || null,
          deployed_url: input.deployed_url || null,
          readme_notes: input.readme_notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProjects((prev) => [newProj, ...prev]);
        showToast(`Logged project "${newProj.title}"`);
      }
      return;
    }

    if (projectId) {
      const updated = await updateProject(supabase, userId, projectId, input);
      if (updated) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? updated : p))
        );
        showToast("Project updated");
      }
    } else {
      const created = await createProject(supabase, userId, {
        ...input,
        track_id: activeTrackId,
      });
      if (created) {
        setProjects((prev) => [created, ...prev]);
        showToast(`Logged project "${created.title}"!`);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!userId) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      showToast("Project deleted");
      return;
    }
    const success = await deleteProject(supabase, userId, projectId);
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      showToast("Project deleted");
    }
  };

  // Interview Q&A
  const handleAddInterviewQa = async (input: CreateInterviewQaInput) => {
    if (!userId) {
      const newQa: InterviewQa = {
        id: `qa-${Date.now()}`,
        user_id: "preview",
        track_id: activeTrackId,
        technology: input.technology,
        question: input.question,
        answer: input.answer,
        difficulty: input.difficulty || "Medium",
        tags: input.tags,
        confidence: input.confidence || 3,
        last_practiced_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setInterviewQuestions((prev) => [newQa, ...prev]);
      showToast("Interview question added");
      return;
    }

    const created = await createInterviewQa(supabase, userId, {
      ...input,
      track_id: activeTrackId,
    });
    if (created) {
      setInterviewQuestions((prev) => [created, ...prev]);
      showToast("Interview question added");
    }
  };

  const handleUpdateConfidence = async (qaId: string, confidence: number) => {
    setInterviewQuestions((prev) =>
      prev.map((q) => (q.id === qaId ? { ...q, confidence } : q))
    );
    if (userId) {
      await updateInterviewQaConfidence(supabase, userId, qaId, confidence);
    }
  };

  const handleDeleteInterviewQa = async (qaId: string) => {
    if (!userId) {
      setInterviewQuestions((prev) => prev.filter((q) => q.id !== qaId));
      showToast("Question deleted");
      return;
    }
    const success = await deleteInterviewQa(supabase, userId, qaId);
    if (success) {
      setInterviewQuestions((prev) => prev.filter((q) => q.id !== qaId));
      showToast("Question deleted");
    }
  };

  // Mini Projects
  const handleStartMiniProject = async (idea: MiniProjectIdea) => {
    if (!userId) {
      const project: Project = {
        id: `proj-${Date.now()}`,
        user_id: "preview",
        track_id: activeTrackId,
        title: idea.title,
        description: idea.description,
        tech_stack: idea.suggested_tech || [],
        status: "in_progress",
        repo_url: null,
        deployed_url: null,
        readme_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) => [project, ...prev]);
      setMiniProjectIdeas((prev) =>
        prev.map((i) => (i.id === idea.id ? { ...i, is_completed: true } : i))
      );
      setActiveTab("projects");
      showToast(`Promoted "${idea.title}" to active projects!`);
      return;
    }
    const project = await convertIdeaToProject(supabase, userId, idea);
    if (project) {
      setProjects((prev) => [project, ...prev]);
      setMiniProjectIdeas((prev) =>
        prev.map((i) => (i.id === idea.id ? { ...i, is_completed: true } : i))
      );
      setActiveTab("projects");
      showToast(`Promoted "${idea.title}" to active projects!`);
    }
  };

  // Resources
  const handleAddResource = async (input: CreateResourceLinkInput) => {
    if (!userId) {
      const newRes: ResourceLink = {
        id: `res-${Date.now()}`,
        user_id: "preview",
        track_id: activeTrackId,
        title: input.title,
        url: input.url,
        category: input.category || "Documentation",
        description: input.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setResourceLinks((prev) => [newRes, ...prev]);
      showToast("Resource link saved");
      return;
    }
    const created = await createResourceLink(supabase, userId, {
      ...input,
      track_id: activeTrackId,
    });
    if (created) {
      setResourceLinks((prev) => [created, ...prev]);
      showToast("Resource link saved");
    }
  };

  const handleDeleteResource = async (linkId: string) => {
    if (!userId) {
      setResourceLinks((prev) => prev.filter((r) => r.id !== linkId));
      showToast("Resource link deleted");
      return;
    }
    const success = await deleteResourceLink(supabase, userId, linkId);
    if (success) {
      setResourceLinks((prev) => prev.filter((r) => r.id !== linkId));
      showToast("Resource link deleted");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 pt-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[var(--text)] px-4 py-2.5 text-xs font-semibold text-[var(--surface)] shadow-lg animate-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-[var(--primary)]" />
            Full-Stack Learning Hub
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Master Spring Boot, MERN, System Design, DevOps, and custom tracks with deep study notes, code implementations, and project milestones
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchTrackData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateTrackOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            <span>New Track</span>
          </button>
        </div>
      </div>

      {/* 1. Track Selector */}
      <TrackSelector
        tracks={tracks}
        activeTrackId={activeTrackId}
        onSelectTrack={(id) => setActiveTrackId(id)}
        progressMap={progressMap}
        onOpenCreateTrack={() => setIsCreateTrackOpen(true)}
        onDeleteTrack={handleDeleteTrack}
      />

      {/* 2. Study Session Timer Bar */}
      <StudyTimerBar
        track={activeTrack}
        onSaveSession={handleSaveStudySession}
      />

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] overflow-x-auto pb-1 text-xs font-semibold w-full">
        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
            activeTab === "roadmap"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)]"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Roadmap & Notes ({roadmapItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("concepts")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
            activeTab === "concepts"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)]"
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          <span>Concepts Log ({concepts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
            activeTab === "projects"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)]"
          }`}
        >
          <FolderGit2 className="h-4 w-4" />
          <span>Projects ({projects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("interview")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
            activeTab === "interview"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)]"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Interview Q&A ({interviewQuestions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mini_projects")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
            activeTab === "mini_projects"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)]"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Mini-Projects ({miniProjectIdeas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resources")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
            activeTab === "resources"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/50 hover:text-[var(--text)]"
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Resources ({resourceLinks.length})</span>
        </button>
      </div>

      {/* 4. Active Tab Content */}
      <div className="pt-1">
        {activeTab === "roadmap" && (
          <RoadmapChecklist
            items={roadmapItems}
            trackTitle={activeTrack?.title || "Track"}
            masteryBreakdown={currentTrackMastery}
            onToggleStatus={handleToggleRoadmapStatus}
            onUpdateTopic={handleUpdateTopic}
            onAddTopic={handleAddTopic}
            onDeleteTopic={handleDeleteTopic}
          />
        )}

        {activeTab === "concepts" && (
          <ConceptsLog
            concepts={concepts}
            trackTitle={activeTrack?.title}
            availableAreas={roadmapItems.map((item) => item.topic)}
            onAddConcept={handleAddConcept}
            onDeleteConcept={handleDeleteConcept}
          />
        )}

        {activeTab === "projects" && (
          <ProjectTracker
            projects={projects}
            activeTrackId={activeTrackId}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeTab === "interview" && (
          <InterviewQaBank
            questions={interviewQuestions}
            activeTrackId={activeTrackId}
            onAddQuestion={handleAddInterviewQa}
            onUpdateConfidence={handleUpdateConfidence}
            onDeleteQuestion={handleDeleteInterviewQa}
          />
        )}

        {activeTab === "mini_projects" && (
          <MiniProjectIdeas
            ideas={miniProjectIdeas}
            onStartProject={handleStartMiniProject}
          />
        )}

        {activeTab === "resources" && (
          <ResourceLinksList
            resources={resourceLinks}
            activeTrackId={activeTrackId}
            onAddResource={handleAddResource}
            onDeleteResource={handleDeleteResource}
          />
        )}
      </div>

      {/* Create Track Modal */}
      <CreateTrackModal
        isOpen={isCreateTrackOpen}
        onClose={() => setIsCreateTrackOpen(false)}
        onCreateTrack={handleCreateTrack}
      />
    </div>
  );
}
