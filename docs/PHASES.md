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

### Phase 2: Theme Engine & Presets

- Preset selector: Shore, Midnight Tide, Sakura, Forest, Sunset, Mono, Ocean
- Dynamic CSS variable switching and persistent user preferences
- Font selection and layout density controls

---

### Phase 3: Todos + Daily Tracker + Habits

- Priority, tags, subtasks, recurring tasks
- Views: List, Kanban (drag & drop), Calendar, and IST time-blocking day planner
- Daily activity tracker with Pomodoro, streaks, and GitHub-style heatmap

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
