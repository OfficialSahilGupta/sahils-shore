# Sahil's Shore: Project Brief for Gemini

You are a senior full-stack engineer and product designer. Help me build **Sahil's Shore**, a private, single-user personal Life OS that bundles my todos, daily tracking, learning, life-logging, finances, media, and career prep in one beautiful, customizable app.

## Naming

- **Full name** (login screen, About page, README, page titles): `Sahil's Shore`
- **Short name** (PWA home-screen label, sidebar, browser tab): `Shore`
- **Tagline:** "Your day, your shore."
- **Greeting copy:** "Good morning, Sahil. Welcome back to your shore." (vary by time of day)
- **Logo:** a simple horizon line or single wave, usable as a maskable PWA icon.
- PWA `name`: "Sahil's Shore", `short_name`: "Shore".

## About Me

I'm a full-stack developer in India (IST timezone, currency INR) preparing for jobs. I practice DSA daily and I'm learning both the Java/Spring Boot stack (Spring Boot, JPA/Hibernate, Spring Security, REST, microservices basics, SQL) and the MERN stack (MongoDB, Express, React, Node, plus Next.js/TypeScript). I'm also learning German (including pronunciation) and maintaining my resume. I also log my daily life: what I spend, what I eat, where I go, and the photos and videos I capture along the way. I want ONE place for all of it, with everything backed up to my Google Drive.

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- Supabase (Postgres + Auth + Storage)
- Google Drive API v3
- Leaflet + OpenStreetMap (maps, no paid key)
- Deployed on Vercel
- PWA, installable on my phone, with camera/share-target for quick capture

## Core Modules

1. **Today Dashboard (home):** greeting, date, top 3 priorities, today's todos, habit checklist, focus timer, quote, today's spend so far, meals logged, mini stats, and a unified "what I did today" timeline (tasks done, study sessions, expenses, meals, places, photos, in time order).
2. **Todos & Planner:** priority, tags, due dates, subtasks, recurring tasks; List, Kanban (drag-and-drop), Calendar views; time-blocking day planner.
3. **Daily Tracker:** custom activities (DSA, Spring Boot, MERN, German, Gym, Reading...) with time spent, notes, streaks, GitHub-style heatmap, weekly/monthly charts, built-in timer and Pomodoro.
4. **DSA Tracker:** problems (title, link, platform, topic, difficulty, status, time, approach notes, code snippet), topic-wise progress, spaced-repetition revision queue, weak-topic detection.
5. **Full-Stack Learning Hub:** two tracks (Java/Spring Boot and MERN/TypeScript), each with a roadmap checklist, concepts-learned log, project tracker (repo link, tech used, status, deployed URL), resource links, interview Q&A bank per technology, and mini-project ideas.
6. **German Learning Hub:** vocab cards with SM-2 spaced repetition, daily word, grammar notes, CEFR progress (A1 to B2), and a **Pronunciation Lab** (record in browser, play back vs. reference audio, waveform, self-rating, improvement chart, shadowing mode).
7. **Resume & Career Hub:** multiple resume versions, bullet-point bank tagged by skill, job application Kanban (Wishlist, Applied, Interview, Offer, Rejected), interview story bank (STAR), company notes, follow-up reminders.
8. **Expense Tracker:** quick-add expense (amount, category, payment method, place, note, optional receipt photo), recurring expenses, monthly budgets per category with progress bars, income entries, charts (category split, daily trend, month vs month), "spent today / this week / this month" widgets, CSV export. Default currency INR.
9. **Food Diary:** log meals (breakfast/lunch/snacks/dinner): what I ate, where (home/restaurant), cost (auto-creates a linked expense), rating, photo, notes on taste and health. Favorites and "places to eat again".
10. **Places & Map:** places visited with name, category, date, notes, rating, coordinates (current location or map-pick), linked photos/videos/expenses. Map view with pins and clusters, "places this month", travel timeline.
11. **Life Log / Media Vault:** upload or capture photos and videos; each item can link to a place, meal, expense, or journal entry. Two-way sync with a chosen Google Drive folder, albums/tags/dates, masonry gallery, lightbox, "On this day" memories, auto-organized by date.
12. **Journal & Reflection:** daily entry with mood/energy, gratitude, wins, lessons, weekly review template.
13. **Notes / Second Brain:** markdown notes, tags, [[backlinks]], search, pinning.
14. **Goals:** long-term goals with milestones linked to tasks and habits.
15. **Health mini-trackers (toggleable):** water, sleep, workouts, weight.
16. **Analytics:** productivity score, time per skill, streaks, best focus hours, spending insights, mood vs productivity vs spending correlations.

## Unified Timeline (signature feature)

Every record (task done, study session, expense, meal, place, photo/video, journal entry) writes a row to a shared `timeline_events` table (`type`, `timestamp`, `ref_id`, `summary`). The dashboard, a "Day View" for any past date, and full-text search all read from it. Picking a date shows my whole day: what I studied, spent, ate, where I went, and the media from that day.

## Google Drive Strategy

- OAuth with minimal `drive.file` scope; refresh tokens stored and used server-side only.
- On first use create `LifeOS/` (or `Shore/`) with subfolders: `Photos/YYYY/MM`, `Videos/YYYY/MM`, `Receipts/`, `Voice-Recordings/`, `Backups/`.
- Media: resumable uploads; store Drive `fileId` plus metadata in Postgres. Drive is the source of truth for large files; Supabase holds only thumbnails and metadata.
- Data backup: scheduled job (Vercel cron) exports all tables as JSON/CSV into `Backups/YYYY-MM-DD/` weekly, with a "Backup now" button and a restore tool.
- Sync handling: Drive file name plus `fileId` mapping, per-item sync status (synced / pending / failed), and a retry queue.
- Note: `drive.file` only sees files the app created, so photos already in my Drive need a one-time import flow.

## Customization (key requirement)

- Drag-and-drop, resizable dashboard widgets with saved layouts.
- Theme engine: light/dark/auto, accent color, font, radius, density, background (gradient/image/glass), 6+ presets.
- Toggle modules on/off, rename them, reorder the sidebar.
- Command palette (Ctrl/Cmd+K), keyboard shortcuts, global search.

## Design Direction

Clean, calm, modern "premium productivity app" (think Linear + Notion + Arc). Generous spacing, soft shadows, subtle motion, glass effects, great empty states, mobile-first (logging an expense or meal must take under 5 seconds on a phone), WCAG AA accessible.

**Brand feel:** coastal and calm. Sea blues, warm sand, a soft horizon line motif, gentle wave-like motion (slow, subtle, never distracting).

**Default palette (use as CSS variables so the theme engine can override):**

| Token                                  | Light                             | Dark ("Midnight Tide") |
| -------------------------------------- | --------------------------------- | ---------------------- |
| `--background`                         | `#FAF7F2` (warm sand-white)       | `#0B1620`              |
| `--surface`                            | `#FFFFFF`                         | `#122231`              |
| `--surface-muted`                      | `#F1EBE0` (sand)                  | `#1A2E40`              |
| `--primary` (accent)                   | `#1F7A8C` (deep sea teal)         | `#4FB3C8`              |
| `--primary-soft`                       | `#BFDBF7` (sea foam)              | `#1D4558`              |
| `--accent-warm`                        | `#E0A458` (sunset sand)           | `#E8B26A`              |
| `--text`                               | `#14232E`                         | `#E6EEF3`              |
| `--text-muted`                         | `#5B6B76`                         | `#8FA3B0`              |
| `--success` / `--warning` / `--danger` | `#2E9E6B` / `#D9922B` / `#D1495B` | adjust for contrast    |

Verify all text/background pairs meet WCAG AA (4.5:1 for body text).

**Theme presets to ship:** Shore (default), Midnight Tide, Sakura, Forest, Sunset, Mono, Ocean.

**Typography:** a clean sans (Inter or Geist) for UI, optional serif accent for journal and greeting.

## Non-Functional Requirements

- Single-user Supabase Auth (Google sign-in); row-level security on every table (`user_id = auth.uid()`).
- Optimistic updates and skeleton loaders.
- Offline queue for quick-add actions (expense, meal, photo) that syncs when back online.
- PWA, JSON/CSV export plus full backup.
- Typed schema, env-var secrets, clean folder structure, reusable components.
- Tests for tricky logic: SM-2 scheduler, streaks, recurring tasks, budget math, Drive sync retry.
- Privacy: never make storage buckets public; optional PIN/biometric lock for Journal, Expenses, and Media.

## Conventions (always follow)

- **Money:** store as integer paise (Rs 10.50 = 1050). Never use floats for money.
- **Time:** store timestamps in UTC (`timestamptz`); display in `Asia/Kolkata`. "Today" means the IST calendar day.
- **IDs:** UUIDs. Every table has `id`, `user_id`, `created_at`, `updated_at`.
- **Timeline:** every create/complete action on a trackable record also writes a `timeline_events` row.
- **Components:** keep them small and reusable; shared UI in `components/ui`, module code in `components/<module>`.
- **Data access:** one data layer per module in `lib/<module>`; no raw Supabase calls inside UI components.
- **Secrets:** never expose service keys or Drive tokens to the client.
- **Naming:** use "Sahil's Shore" in full-name contexts and "Shore" in compact UI.

## Folder Structure (target)

```
app/                  # routes (App Router), one folder per module
components/
  ui/                 # shadcn/ui primitives
  <module>/           # module-specific components
lib/
  supabase/           # clients, helpers
  drive/              # Google Drive helpers
  <module>/           # data access + logic per module
hooks/
types/
supabase/migrations/  # SQL migrations
docs/PHASES.md        # step-by-step build prompts
```

## Working Style

Build incrementally, one module at a time. Before each phase: briefly state the plan and the files you'll create. After each phase: list how to run and test it. Ask me only when truly blocked; otherwise make sensible choices and tell me what you chose. Explain non-obvious decisions in one or two lines, since I'm learning as I build.

## Build Order

| Phase | What                                                                                  |
| ----- | ------------------------------------------------------------------------------------- |
| 0     | Setup, app shell (collapsible sidebar, top bar, mobile bottom nav), placeholder pages |
| 1     | Supabase auth, schema (including `timeline_events`), RLS, generated types             |
| 2     | Theme engine and presets                                                              |
| 3     | Todos + Daily Tracker + Habits                                                        |
| 4     | Expenses + Food Diary                                                                 |
| 5     | Today Dashboard + Unified Timeline (**MVP ends here**)                                |
| 6     | DSA + Full-Stack Learning Hub                                                         |
| 7     | Google Drive + Media Vault + Places/Map                                               |
| 8     | German Hub + Pronunciation Lab                                                        |
| 9     | Career Hub                                                                            |
| 10    | Journal, Notes, Goals, Health                                                         |
| 11    | Analytics + AI Coach                                                                  |
| 12    | Backups/restore, PWA offline queue, polish, deploy                                    |

Detailed prompts for each phase live in `docs/PHASES.md`. I'll paste one at a time.

## Current Status

_Update this section after every phase so context survives between sessions._

- [x] Phase 0: Setup, app shell, placeholder pages, navigation, theme tokens, PWA basics (Completed)
- [x] Phase 1: Supabase auth, schema (including `timeline_events`), RLS, generated types (Completed)
- [ ] Phase 2: Theme engine and presets
- Decisions made so far:
  - Initialized Next.js 14 App Router + TypeScript with strict types, absolute imports (`@/`), and ESLint/Prettier.
  - Defined CSS variable palette in `globals.css` with 100% tokenized Tailwind mapping (no hard-coded colors).
  - Module registry (`lib/modules.ts`) as single source of truth for all 16 modules, supporting dynamic categorization, order, and toggleability.
  - IST timezone handling in `Greeting.tsx` via `Asia/Kolkata` with smooth client-side hydration.
  - Desktop collapsible sidebar (persists in `localStorage`), mobile bottom nav with 5 tabs + floating quick-add dock + full module drawer.
  - Generated PWA icons (`icon-192.png`, `icon-512.png`, `maskable-512.png`, `favicon.svg`) and `manifest.json`.
  - Installed `@supabase/ssr` and `@supabase/supabase-js`.
  - Created master schema `supabase/migrations/20261102000000_schema.sql` covering all 37 tables with `id`, `user_id`, `created_at`, `updated_at`, strict RLS policies (`auth.uid() = user_id`), `handle_updated_at` triggers, and composite indexes.
  - Implemented `public.seed_user_defaults` function seeding 8 expense categories and 6 core activities, wired to `on_auth_user_created` trigger on `auth.users`.
  - Stored money as integer paise (`amount_paise bigint`) and timestamps as ISO 8601 UTC with IST `Asia/Kolkata` presentation.
  - Added single-user lock in `/auth/callback` enforcing `ALLOWED_EMAIL` with immediate session termination and redirect on unauthorized attempts.
  - Protected routes via Next.js middleware using `@supabase/ssr` session refresh.
  - Added reusable `writeTimelineEvent()` in `lib/timeline/index.ts` and `/api/health` diagnostic endpoint.
- Known issues / TODOs: _(none yet)_
