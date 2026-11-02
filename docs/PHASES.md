# Sahil's Shore: Implementation Phases & Prompts

## Overview

This document tracks the phased implementation roadmap for **Sahil's Shore**, a private single-user personal Life OS.

---

### Phase 0: Setup, App Shell & Foundations (Current)

- [x] Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion + Recharts + Lucide Icons
- [x] ESLint, Prettier, absolute imports (`@/`)
- [x] Design token CSS variables: Shore Light & Midnight Tide Dark palettes (WCAG AA compliant)
- [x] Responsive App Shell: Collapsible desktop sidebar, top bar with command palette, mobile bottom navigation, and floating quick-add dock
- [x] Module Registry (`lib/modules.ts`) configuring 16 core modules
- [x] 16 placeholder pages with specifications and empty states
- [x] IST time-of-day greeting component ("Good morning, Sahil. Welcome back to your shore.")
- [x] Wave/horizon logo and PWA manifest + icons

---

### Phase 1: Supabase Auth, Schema & Types (Current)

- [x] Supabase client helpers (SSR browser, server, and middleware)
- [x] PostgreSQL schema for all core modules + `timeline_events` (37 tables, paise integer, UTC timestamptz)
- [x] Row Level Security (RLS) policies on every table: `auth.uid() = user_id`
- [x] Generated TypeScript types matching Supabase Database interface
- [x] Single-user Google sign-in lock (`ALLOWED_EMAIL`) and branded `/login` page
- [x] Reusable `writeTimelineEvent()` and `/api/health` diagnostic endpoint

---

### Phase 2: Theme Engine & Presets (Current)

- [x] Preset selector: Shore, Midnight Tide, Sakura, Forest, Sunset, Mono, Ocean
- [x] Dynamic CSS variable switching with WCAG AA contrast ratio evaluator and accent color generator
- [x] Font selection (Inter, Geist, DM Sans, Lora), border radius slider, spatial density, and atmosphere backgrounds (gradient, glass, image)
- [x] Live interactive preview panel with Recharts metric visualizer
- [x] Module management: drag-and-drop reordering, inline renaming, and visibility toggles driving Sidebar and MobileNav
- [x] Settings > Privacy stub for PIN/Biometric lock preferences
- [x] Zero-flash hydration engine with localStorage pre-paint script and Supabase `settings.theme` sync

---

### Phase 3: Todos + Daily Tracker + Habits (Completed)

- [x] Full CRUD tasks with priority, tags, subtasks, notes, and recurrence (daily, weekly, custom days, monthly)
- [x] Recurrence engine auto-generating next task instance upon completion
- [x] Natural language quick-add parser (e.g. `revise graphs tomorrow 7pm !high #dsa`)
- [x] List, Kanban (`@dnd-kit` across Backlog/Today/Doing/Done), and Calendar (Month + Week) views
- [x] Time-blocking day planner with 30-minute slots (06:00 to 23:30 IST) and task drag & drop
- [x] Optimistic updates and floating undo toasts for deletions and completions
- [x] Customizable activities with target minutes, stopwatch, and configurable Pomodoro (25/5)
- [x] Refresh-surviving timer storing start timestamps in `localStorage`
- [x] IST day-boundary aware streak calculations with minimum thresholds
- [x] GitHub-style 52-week yearly heatmap (per-activity & combined) and Recharts weekly/monthly charts
- [x] Habits checklist widget with flame streaks and skip-day preservation
- [x] Automatic writes to `timeline_events` for every completed task, study session, and habit
- [x] 15 unit tests covering recurrence generation, IST day boundaries, and streak logic

---

### Phase 4: Expenses + Food Diary (Completed)

- [x] Paise-accurate integer storage (INR) & Indian numbering grouping (₹1,23,456.00)
- [x] Tactile numeric keypad quick-add modal (< 5 seconds on mobile) with 1-tap save
- [x] Category budgets with progress bars turning amber at 80% and red at 100%
- [x] Recurring expenses engine (rent, subscriptions) with auto-creation
- [x] Spending insights: Weekend vs. Weekday spend, Biggest category, Projected month-end spend
- [x] Recharts visualizations: Category Donut, Daily Trend Area, Month vs. Previous Month, Top Places
- [x] Food diary logging: meal slot, items, restaurant, ratings (1-5), photo, taste and health notes
- [x] Automated meal-expense link synchronization (create, update, delete)
- [x] 7-day weekly meal matrix, Favorites, and "Places to eat again"
- [x] Automatic writes to `timeline_events` for expenses, income, and meals
- [x] CSV export for expenses and income
- [x] 17 unit tests covering paise formatting, budget thresholds, spending insights, and sync math

---

### Phase 5: Today Dashboard + Unified Timeline (Completed - MVP Complete)

- [x] Responsive drag-and-drop, resizable widget grid powered by `react-grid-layout` with breakpoints for desktop (`lg`), tablet (`md`, `sm`), and mobile (`xs`, `xxs`)
- [x] All 11 core dashboard widgets: Greeting & Horizon, Top 3 Priorities, Today's Tasks, Habit Checklist, Focus Timer, Active Streaks, Spent Today, Meals Logged, Mini Activity Chart, Quick Note, and Unified Timeline
- [x] Unified Timeline reading `timeline_events` within 24-hour IST UTC bounds (`[startUTC, endUTC]`), with type-specific color/icon styling and tappable source modal
- [x] Day View at `/day/[date]` with date picker, prev/next arrows, daily totals (time studied, money spent, meals, tasks), and day reflection notes
- [x] Edit layout mode with widget library modal to add/remove widgets, resize handles, reset to default, and persistence in `settings.layout` & localStorage
- [x] Global Quick Capture: floating `+` button, top bar `+`, and `q` keyboard shortcut offering Task, Expense, Meal, Note, and Timer in one sheet
- [x] 13 unit tests covering IST range boundaries, timeline event parsing, daily totals calculation, quote deterministic selector, and layout defaults (45 tests passing total)

---

### Phase 6: DSA + Full-Stack Learning Hub (Completed)

- [x] DSA problem tracker: title, link, platform, 17 topic tags, difficulty, status, time spent, approach notes, complexity, and CodeMirror (Java, JS, TS, Python)
- [x] Spaced repetition revision queue (1, 3, 7, 14, 30 days) with "Revise today" and 1-click Easy/Hard rescheduling
- [x] Weak-topic detection algorithm based on low solve rate (< 50%) or recurring revision needs
- [x] Daily goal counter, flame streak tracker, topic progress rings, and difficulty split
- [x] Automatic writes to `activity_logs` (DSA activity) and `timeline_events`
- [x] Full-Stack Learning Hub with two curated tracks: "Java and Spring Boot" (16 topics) & "MERN and TypeScript" (13 topics)
- [x] Interactive roadmap checklist with % completion, category badges, and expandable notes
- [x] Concepts-learned log with IST date capture, search, and timeline integration
- [x] Project showcase tracker with status, tech stack chips, GitHub repo, Live Demo, and README notes
- [x] Interview Q&A bank with 1-5 star confidence rating and Mock Technical Interview mode with 2-minute countdown timer
- [x] Mini-project ideas list with 1-click promotion to active projects
- [x] Categorized resource links directory (Documentation, Tutorials, Practice, Videos)
- [x] Integrated study session timer bar syncing to Daily Tracker activities ("Spring Boot" / "MERN") and `timeline_events`
- [x] 10 unit tests for Phase 6 covering SM-2 intervals, weak-topic detection, DSA streaks, roadmap progress, and mock interview randomizer (55 total passing tests)

---

### Phase 7: Google Drive + Media Vault + Places/Map

- Google Drive v3 OAuth with `drive.file` scope
- Resumable media upload queue and Google Drive sync
- Leaflet + OpenStreetMap interactive pin map with photo and expense linkages

---

### Phase 8: German Hub + Pronunciation Lab

- SM-2 vocab flashcards, daily German word, CEFR levels (A1-B2)
- Browser microphone recording, audio waveform visualization, reference audio shadowing

---

### Phase 9: Career Hub

- Multiple resume versions and skill bullet bank
- Job application Kanban pipeline
- STAR interview story bank

---

### Phase 10: Journal, Notes, Goals, Health

- Daily journal with mood/energy rating and weekly reviews
- Markdown second brain with [[backlinks]] and search
- Long-term goals with milestone progress
- Health mini-trackers: water hydration, sleep, workouts, weight

---

### Phase 11: Analytics + AI Coach

- Daily productivity score calculation
- Time allocation per skill and spending insights
- Cross-correlations: mood vs. focus vs. expenses

---

### Phase 12: Backups/Restore, PWA Offline Queue, Deploy

- Automated and manual backup exports to Google Drive
- Offline sync queue for quick adds
- Vercel deployment and PWA install validation
