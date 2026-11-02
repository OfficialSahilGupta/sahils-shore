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

### Phase 4: Expenses + Food Diary

- Paise-accurate integer storage (INR)
- Quick-add modal (< 5 seconds on mobile)
- Category budgets and spending trends
- Food diary with meal ratings, photos, and auto-linked expenses

---

### Phase 5: Today Dashboard + Unified Timeline (MVP Complete)

- Real-time today overview, priorities, habits, and focus timer
- Unified timeline reading from `timeline_events` across all modules
- Day View for any historical IST date

---

### Phase 6: DSA + Full-Stack Learning Hub

- Problem bank, difficulty breakdown, approach notes, and code snippets
- SM-2 spaced repetition revision queue
- Java/Spring Boot & MERN learning roadmaps, concept notes, and project showcase

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
