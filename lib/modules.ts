export type ModuleCategory = "core" | "growth" | "life" | "insights";

export interface AppModule {
  id: string;
  name: string;
  shortName: string;
  description: string;
  tagline: string;
  iconName: string;
  route: string;
  enabled: boolean;
  order: number;
  category: ModuleCategory;
  inMobileNav?: boolean;
  phase: number;
}

export const MODULES: AppModule[] = [
  // 1. Today Dashboard
  {
    id: "today",
    name: "Today Dashboard",
    shortName: "Today",
    description:
      "Daily overview, top 3 priorities, habits, focus timer, and unified timeline.",
    tagline: "Your day at a glance",
    iconName: "Compass",
    route: "/",
    enabled: true,
    order: 1,
    category: "core",
    inMobileNav: true,
    phase: 5,
  },
  // 2. Todos & Planner
  {
    id: "todos",
    name: "Todos & Planner",
    shortName: "Tasks",
    description:
      "Priority tasks, tags, recurring schedules, Kanban drag & drop, and day planner.",
    tagline: "Organize actions with clarity",
    iconName: "CheckSquare",
    route: "/todos",
    enabled: true,
    order: 2,
    category: "core",
    inMobileNav: true,
    phase: 3,
  },
  // 3. Daily Tracker
  {
    id: "tracker",
    name: "Daily Tracker",
    shortName: "Track",
    description:
      "Habits, Pomodoro timer, activity streaks, and GitHub-style activity heatmaps.",
    tagline: "Build unbreakable consistency",
    iconName: "Activity",
    route: "/tracker",
    enabled: true,
    order: 3,
    category: "core",
    inMobileNav: true,
    phase: 3,
  },
  // 4. Expense Tracker
  {
    id: "expenses",
    name: "Expense Tracker",
    shortName: "Money",
    description:
      "Quick-add expenses in paise (INR), category budgets, income, and cashflow charts.",
    tagline: "Master your finances down to the rupee",
    iconName: "Wallet",
    route: "/expenses",
    enabled: true,
    order: 4,
    category: "life",
    inMobileNav: true,
    phase: 4,
  },
  // 5. DSA Tracker
  {
    id: "dsa",
    name: "DSA Tracker",
    shortName: "DSA",
    description:
      "LeetCode & problem bank, difficulty breakdown, and spaced-repetition revision queue.",
    tagline: "Sharpen algorithms daily",
    iconName: "Code2",
    route: "/dsa",
    enabled: true,
    order: 5,
    category: "growth",
    phase: 6,
  },
  // 6. Full-Stack Learning Hub
  {
    id: "learning",
    name: "Full-Stack Learning Hub",
    shortName: "Learning",
    description:
      "Spring Boot & MERN roadmaps, concept logs, projects portfolio, and interview Q&A.",
    tagline: "Java, Spring, Next.js & MERN mastery",
    iconName: "Layers",
    route: "/learning",
    enabled: true,
    order: 6,
    category: "growth",
    phase: 6,
  },
  // 7. German Learning Hub
  {
    id: "german",
    name: "German Learning Hub",
    shortName: "German",
    description:
      "SM-2 vocabulary flashcards, daily words, CEFR (A1-B2) goals, and Pronunciation Lab.",
    tagline: "Sprechen Sie Deutsch mit Vertrauen",
    iconName: "Languages",
    route: "/german",
    enabled: true,
    order: 7,
    category: "growth",
    phase: 8,
  },
  // 8. Resume & Career Hub
  {
    id: "career",
    name: "Resume & Career Hub",
    shortName: "Career",
    description:
      "Resume versions, skill bullet bank, job applications Kanban, and STAR interview stories.",
    tagline: "Land your dream engineering role",
    iconName: "Briefcase",
    route: "/career",
    enabled: true,
    order: 8,
    category: "growth",
    phase: 9,
  },
  // 9. Food Diary
  {
    id: "food",
    name: "Food Diary",
    shortName: "Food",
    description:
      "Meals logged with photos, taste/health notes, restaurant ratings, and linked expenses.",
    tagline: "Mindful eating and culinary memories",
    iconName: "Utensils",
    route: "/food",
    enabled: true,
    order: 9,
    category: "life",
    phase: 4,
  },
  // 10. Places & Map
  {
    id: "places",
    name: "Places & Map",
    shortName: "Places",
    description:
      "Interactive Leaflet & OpenStreetMap pins, visited locations, and travel timelines.",
    tagline: "Pin every spot you explore",
    iconName: "MapPin",
    route: "/places",
    enabled: true,
    order: 10,
    category: "life",
    phase: 7,
  },
  // 11. Life Log / Media Vault
  {
    id: "media",
    name: "Life Log / Media Vault",
    shortName: "Media",
    description:
      "Photo/video capture synced with Google Drive, masonry gallery, and 'On This Day' memories.",
    tagline: "Preserve every milestone and memory",
    iconName: "Image",
    route: "/media",
    enabled: true,
    order: 11,
    category: "life",
    phase: 7,
  },
  // 12. Journal & Reflection
  {
    id: "journal",
    name: "Journal & Reflection",
    shortName: "Journal",
    description:
      "Daily mood & energy tracking, gratitude prompts, weekly reflections, and wins log.",
    tagline: "Pause, reflect, and center yourself",
    iconName: "BookOpen",
    route: "/journal",
    enabled: true,
    order: 12,
    category: "life",
    phase: 10,
  },
  // 13. Notes / Second Brain
  {
    id: "notes",
    name: "Notes / Second Brain",
    shortName: "Notes",
    description:
      "Markdown knowledge base with tags, [[backlinks]], full-text search, and quick pinning.",
    tagline: "Capture thoughts at lightspeed",
    iconName: "FileText",
    route: "/notes",
    enabled: true,
    order: 13,
    category: "life",
    phase: 10,
  },
  // 14. Goals
  {
    id: "goals",
    name: "Goals",
    shortName: "Goals",
    description:
      "Long-term aspirations, milestones, and direct linkage to daily tasks and habits.",
    tagline: "Turn ambitious visions into milestones",
    iconName: "Target",
    route: "/goals",
    enabled: true,
    order: 14,
    category: "core",
    phase: 10,
  },
  // 15. Health Mini-Trackers
  {
    id: "health",
    name: "Health Mini-Trackers",
    shortName: "Health",
    description:
      "Toggleable trackers for water hydration, sleep quality, workout logs, and weight.",
    tagline: "Keep mind and body in balance",
    iconName: "HeartPulse",
    route: "/health",
    enabled: true,
    order: 15,
    category: "life",
    phase: 10,
  },
  // 16. Analytics
  {
    id: "analytics",
    name: "Analytics",
    shortName: "Analytics",
    description:
      "Productivity score, skill time breakdown, spending trends, and correlations.",
    tagline: "Insights powered by your daily data",
    iconName: "BarChart3",
    route: "/analytics",
    enabled: true,
    order: 16,
    category: "insights",
    phase: 11,
  },
];

export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  core: "Daily & Core",
  growth: "Skills & Career",
  life: "Life & Logging",
  insights: "System & Insights",
};

export function getModules(): AppModule[] {
  return [...MODULES].sort((a, b) => a.order - b.order);
}

export function getEnabledModules(): AppModule[] {
  return getModules().filter((m) => m.enabled);
}

export function getMobileNavModules(): AppModule[] {
  return getModules().filter((m) => m.enabled && m.inMobileNav);
}

export function getModuleByRoute(route: string): AppModule | undefined {
  return MODULES.find((m) => m.route === route);
}
