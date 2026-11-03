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
- [x] Phase 2: Theme engine and presets (Completed)
- [x] Phase 3: Todos + Daily Tracker + Habits (Completed)
- [x] Phase 4: Expenses + Food Diary (Completed)
- [x] Phase 5: Today Dashboard + Unified Timeline (Completed - MVP Complete)
- [x] Phase 6: DSA + Full-Stack Learning Hub (Completed)
- [x] Phase 7: Google Drive + Media Vault + Places/Map (Completed)
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
  - Implemented 7 theme presets (Shore, Midnight Tide, Sakura, Forest, Sunset, Mono, Ocean) with WCAG AA compliance.
  - Added dynamic accent color generator with relative luminance contrast checker (warning if < 4.5:1).
  - Built zero-FOUC anti-flash engine with inline pre-paint script, localStorage caching, and Supabase `settings.theme` synchronization.
  - Added module customizer supporting drag-and-drop reordering, inline renaming, and visibility toggles, directly driving `Sidebar` and `MobileNav`.
  - Added Settings > Privacy stub for PIN/Biometric module protection saving to `settings.privacy`.
  - Built full Todos & Planner module: List, Kanban (`@dnd-kit`), Month & Week Calendar, and 30-minute slot Day Planner.
  - Implemented natural language quick-add parsing (`title`, `!priority`, `#tags`, `time`, `date`).
  - Added recurring task engine generating next instances on completion (daily, weekly, custom days, monthly).
  - Built timer & Pomodoro widget surviving browser refresh by saving ISO start timestamps in `localStorage`.
  - Built IST day-boundary and streak calculations (including skip-day preservation for habits).
  - Built 52-week GitHub-style yearly activity heatmap, per-activity progress rings, and weekly/monthly Recharts charts.
  - Integrated optimistic updates with floating undo toast notifications for completions and deletions.
  - Persisted all completions and logs to Supabase tables (`tasks`, `subtasks`, `activities`, `activity_logs`, `habits`, `habit_logs`) and synced with `timeline_events`.
  - Implemented paise-accurate integer currency utilities with Indian digit grouping (`₹1,23,456.00`), conversion helpers (`rupeesToPaise`, `paiseToRupees`), and CSV export.
  - Built Expense Tracker with tactile numeric keypad, category chips, payment methods, place autocomplete, receipt attachment, and 1-tap quick logging (< 5s).
  - Implemented monthly category budget progress bars with automatic color transitions: calm primary/green below 80%, amber warning at 80% to 99.9%, and red danger at 100%+.
  - Created automated recurring expenses engine for subscriptions/rent with auto-creation for current month.
  - Built spending insights analyzing weekend vs. weekday expenditure, top category share, and projected month-end burn rate.
  - Added Recharts category donut, daily spend trend area chart, month-over-month comparison, and top places leaderboard.
  - Built Food Diary logging meal slots (breakfast, lunch, snack, dinner), location, restaurant, ratings (1-5 stars), photo, taste and health notes.
  - Built automated meal-expense synchronization: entering a meal cost auto-creates an expense in the "Food" category, syncing edits or deletions in real-time.
  - Built 7-day weekly meal matrix (Mon-Sun) with slot quick adds and total daily food spend, plus "Places to eat again" directory.
  - Wrote 17 unit tests for paise math, Indian grouping, budget thresholds, spending insights, and meal-expense sync logic (32 tests passing total).
  - Built responsive drag-and-drop, resizable widget grid powered by `react-grid-layout` with responsive breakpoints (`lg`, `md`, `sm`, `xs`, `xxs`).
  - Implemented all 11 core dashboard widgets: Greeting & Horizon with weather-free quote of the day, Top 3 Priorities with task pinning modal, Today's Tasks with inline adder, Habit Checklist with flame streaks and skip preservation, Focus Timer with stopwatch & Pomodoro (refresh-surviving via `localStorage`), Active Streaks leaderboard, Spent Today with budget remaining progress bar, Meals Logged with 4 slots and food spend, Mini Activity Chart with Recharts weekly focus bar visualization, Quick Note scratchpad with auto-save to `notes`, and embedded Unified Timeline.
  - Built Unified Timeline reading from `timeline_events` within exact 24-hour IST date boundary (`[startUTC, endUTC]`), with type-specific color/icon styling, metadata badges, and rich source record dialog with module deep links.
  - Built Day View at `/day/[date]` with date picker, prev/next arrows, daily totals (time studied, money spent, meals count, tasks completed), full vertical timeline, and day reflection notes.
  - Built Edit Layout Mode with widget library drawer to add/remove widgets, resize handles, reset defaults, and bidirectional persistence to `settings.layout` and localStorage.
  - Built Global Quick Capture bottom sheet/modal accessible via mobile floating `+` button, top bar `+` button, and `q` keyboard shortcut with 5 tabs (Task, Expense, Meal, Note, Timer).
  - Built DSA Tracker with CodeMirror syntax editor (Java, JS, TS, Python), 17 standard topics, difficulty split, complexity chips, and IST solving streak counter.
  - Implemented SM-2 spaced repetition revision queue (1, 3, 7, 14, 30 days) with 1-click Easy/Hard rescheduling, peek view, and automatic `activity_logs` & `timeline_events` sync.
  - Built weak-topic detection flagging topics with solve rate < 50% or repeated 'Needs revision' / 'Stuck' problems.
  - Built Full-Stack Learning Hub supporting two curated tracks ("Java and Spring Boot" with 16 topics & "MERN and TypeScript" with 13 topics), concepts-learned log, project showcase with README drawers, interview Q&A bank with 1-5 star ratings, and 1-click mini-project promotion.
  - Integrated mock technical interview mode with 2-minute countdown timer, answer reveal, and instant confidence scoring.
  - Integrated study session stopwatch syncing directly into Daily Tracker (`activity_logs`) under Spring Boot / MERN and `timeline_events`.
  - Wrote 10 unit tests for Phase 6 covering SM-2 intervals, weak-topic detection, DSA streaks, roadmap progress, and mock interview randomizer (55 tests passing total).
  - Implemented Google Drive v3 OAuth 2.0 integration with minimal `drive.file` scope, offline access, and AES-256-GCM server-side encryption for refresh tokens stored in `public.drive_credentials`.
  - Added automatic Google Drive folder hierarchy creation on first connect: `Shore/` root with `Photos/YYYY/MM/`, `Videos/YYYY/MM/`, `Receipts/`, `Voice-Recordings/`, and `Backups/`.
  - Implemented direct-to-Drive resumable upload sessions (`/api/drive/upload-session`), enabling large videos and high-res photos to stream directly from browser to Google Drive with byte progress, completely bypassing Vercel serverless function size limits.
  - Built client-side Canvas thumbnail generator (`lib/media/thumbnail.ts`) for photos and `<video>` frame extraction for videos, with optimistic UI previews.
  - Integrated EXIF metadata extraction (`lib/media/exif.ts` via `exifr`) automatically parsing `DateTimeOriginal` / `CreateDate` for `taken_at` and GPS latitude/longitude.
  - Implemented sync retry queue (`sync_queue`) with automatic background retry endpoints and manual per-item/bulk retry triggers.
  - Built Media Vault UI (`/media`) with responsive masonry layout grouped by IST calendar day, swipeable Lightbox with video player and "Open in Drive" links, bidirectional entity link picker (Place, Meal, Expense, Journal), and album management.
  - Built "On This Day" memories widget querying media taken on today's calendar date in past years.
  - Added one-time "Import existing Drive photos" notice and multi-file importer explaining privacy isolation of `drive.file` scope.
  - Built Places & Map module (`/places` and `/places/[id]`) with dynamic Leaflet + OpenStreetMap client rendering, Shore-themed SVG pins with category colors, interactive pin click popups, and click-to-pick coordinate dropping.
  - Built "Places this month" carousel and vertical Travel Timeline connecting place visits over time.
  - Built Place Detail Page uniting "Everything from this visit" (linked photos, meals, expenses, and total spend in paise/INR).
  - Enhanced Expense Tracker receipt capture to upload receipts directly into Google Drive `Shore/Receipts/` with instant preview.
  - All media and place creations write to `public.timeline_events`.
  - Enhanced Media Vault Albums: added horizontal album pill tabs (`All Media`, custom albums with count badges, `+ New Album`), album selection dropdown during upload in `MediaUploader`, visual album badges on photo cards, inline album assignment in Lightbox, and dual-mode album deletion ("Keep photos in gallery" vs "Delete album AND all photos inside").
  - Google Drive Album Folder Synchronization: album folders in Shore are nested strictly under Year -> Month Name -> Folder Name (`Shore/Photos/YYYY/<MonthName>/<Album Title>`, e.g. `Shore/Photos/2026/November/Mahabalipuram Nov 1`). Photos uploaded without an album stay directly in the month folder (`Shore/Photos/2026/November/`).
  - Added Keyless Place Search & Geocoding via OpenStreetMap Nominatim: `/api/places/geocode` resolves coordinates and place metadata for any query (e.g. "Mahabalipuram beach") with 1-hour caching, auto-suggests categories, drops the map pin automatically, and provides a 1-click fallback banner when saved place search returns 0 results.
  - Built Bulk Entity Linking & Multi-Select Media Hub: added hover selection checkboxes to media thumbnails, date-group "Select Day" toggle, "Select All" / "Deselect All" controls, floating bulk action bar with primary "Link Entity" (🔗) button, unified 4-tab Link Picker (Place, Album, Meal, Expense) supporting batch updates with partial merges, and clickable cyan badges (`📍 Place Name`) navigating directly into the Place Detail Page.
  - Wrote 18 unit tests for Phase 7 covering AES-256-GCM encryption/decryption, folder routing, full month naming, album vs month fallback routing, memories date matching, places monthly filtering, visit spend aggregation, geocoded coordinate parsing, and bulk entity link merging (73 tests passing total).
- Known issues / TODOs: _(none yet)_
