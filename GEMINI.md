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
16. **Workout & Fitness Hub (dedicated first-class module):** daily exercises, muscle group splits (Push, Pull, Legs, Upper, Lower, Full Body), multi-set weight & reps tracking, live session volume (tons/kg), built-in rest countdown timer, daily physique photo progression with interactive Before/After comparison slider, strength Personal Records (PRs), and interactive 1-Rep Max (1RM) calculator. Synchronizes to `timeline_events`, `health_logs`, and `activity_logs`.
17. **Analytics:** productivity score, time per skill, streaks, best focus hours, spending insights, mood vs productivity vs spending correlations.

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

- **No Emojis (Mandatory Zero-Tolerance Rule):** NEVER use system/OS default emojis anywhere in the app (no emoji characters like 🔥, ✨, 🎉, 💡, 📍, ★, ☕, ⚡, 🍽️, 💳, 📁, 😞, 😐, 🙂, 😊, 🌟, 🪫, 🔋, 🚀, etc.). Always use crisp, accessible SVGs (Lucide React icons or inline SVGs). This applies across all UI components, toast notifications, badges, headers, modals, markdown templates, and copy.
- **Custom Dropdown Menus Only (Zero OS Default Selects):** NEVER use default or raw browser `<select>` dropdowns anywhere in the app. Dropdowns must ALWAYS use the custom, theme-aware `Select` component (`components/ui/select.tsx`) designed with real-time search filtering, active checkmark indicators, Lucide React SVG chevrons, luxury popover styling, and click-outside dismissal — identical to the custom dropdown menus crafted in the DSA module for difficulty, topic, and platform filters.
- **Strict Responsive Design & Zero-Overflow Guarantee (Mandatory Universal Screen Adaptability):**
  Every page, segment, component, modal, drawer, toolbar, table, card, icon, and text string MUST be fully adaptable and visually pristine across all screen sizes — from compact mobile displays (360px–430px) and tablets (768px–1024px) to mid-size laptops with open sidebars (1280px–1440px) and high-resolution monitors (1920px+). On any new feature, layout change, or upgrade, the following checks MUST be performed and strictly satisfied:
  1. **Zero Viewport Horizontal Scroll:** The page viewport must NEVER develop horizontal scrollbars (`overflow-x: hidden` on root, containers constrained with `max-w-full min-w-0`).
  2. **Flexbox Child Containment (`min-w-0`):** Flex children containing text, inputs, or badges must ALWAYS specify `min-w-0` (or `w-full min-w-0`). Never let flex items default to `min-width: auto` when containing dynamic or long text strings.
  3. **Grid Column Elasticity:** Always ensure grid definitions use elastic column tracks (e.g., `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-w-0`) and nested grid cards have `min-w-0` so code blocks, tables, or non-breaking text cannot force columns wider than the screen.
  4. **Universal Word & Text Wrapping:** All dynamic and user-generated text (titles, headlines, notes, URLs, code snippets, German compound words, descriptions) must use `break-words` (`overflow-wrap: break-word`) or `break-all` where applicable, or intentional text truncation (`truncate`, `line-clamp-1`, `line-clamp-2`) with accessible tooltips (`title="..."`). Never let unbroken text push container bounds.
  5. **Responsive Action Bars & Button Groups:** Button clusters (such as edit, study notes, delete, status cycles) must NEVER be placed in a rigid `shrink-0` horizontal strip that collides with content on lower or medium desktop screens. Always use responsive wrapping (`flex-col lg:flex-row`, `flex-wrap`, or responsive text visibility: `<span className="hidden sm:inline">...</span>`).
  6. **Touch-Screen Accessibility (No Hover-Only Controls):** Never hide critical action icons (like delete or edit) completely behind `opacity-0 group-hover:opacity-100` on mobile/touch screens where hover doesn't exist. Use `opacity-70 sm:opacity-0 sm:group-hover:opacity-100` or permanent touch-friendly tap targets (minimum 44x44px touch area).
  7. **Modal & Drawer Screen Boundaries:** All modal dialogs and drawers must use `max-h-[92vh] sm:max-h-[90vh] overflow-y-auto`, responsive internal padding (`p-3 sm:p-6`), and elastic headers/toolbars with `overflow-x-auto scrollbar-none` so modals remain 100% contained within the viewport.
  8. **Filter Strips & Tab Navigation:** Horizontal category filters, status chips, and tab selectors must ALWAYS have `overflow-x-auto scrollbar-none sm:scrollbar-thin min-w-0` or `flex-wrap` so chips never push out beyond the screen.
  9. **Icons & Badges Shrinking Safeguard:** Always attach `shrink-0` to SVG icons and status badges when placed next to flexible text, preventing icons from being deformed or squished.
  10. **Pre-Merge Responsive Verification:** Before marking any feature or upgrade complete, test the interface across mobile (360px–414px), tablet/sidebar-collapsed desktop (768px–1024px), standard laptop (1366px), and full HD (1920px) to verify zero horizontal overflow, zero text overlap, and complete readability of every segment.
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
- [x] Phase 8: German Hub + Pronunciation Lab (Completed)
- [x] Phase 9: Career Hub (Completed)
- [x] Phase 10: Journal, Notes, Goals, Health (Completed)
- [x] Phase 11: Analytics + AI Coach (Completed)
- [x] Phase 12: Backups/restore, PWA offline queue, polish, deploy (Completed — All 12 Phases Complete!)
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
  - Implemented pure SuperMemo-2 (SM-2) spaced repetition algorithm (`lib/german/sm2.ts`) calculating repetition count, ease factor (min 1.3 floor), interval ladder, and live button previews (`<1d`, `Hard`, `Good`, `Easy`).
  - Built German Flashcard Review Session modal with front/back flip, de-DE audio playback, keyboard shortcuts (Space, 1-4), and review completion screen.
  - Built 60-day visual Review Heatmap tracking daily flashcard review intensity and streak continuity.
  - Built German Vocab Card Manager with color-coded articles (`der` blue, `die` rose, `das` emerald), plural forms, CEFR level badges, search, gender and level filters, and full CRUD.
  - Built deterministic Daily German Word and Sentence of the Day rotating on day-of-year in IST, with de-DE audio and 1-click "Add to Flashcards".
  - Built CEFR Progress Tracker (A1 to B2) with 17 competency checklists across Grammar, Speaking, Listening, Reading, and Writing, with level and global mastery percentages.
  - Built German Grammar Notes Hub with markdown formatting, categorized by CEFR level and topic (Cases, Separable Verbs, Perfekt Tense, Konjunktiv II), with rule-example pairs.
  - Built Pronunciation Lab with cross-browser MediaRecorder (Safari/iOS compatible), Web Audio API live animated `<canvas>` waveform visualizer, side-by-side comparison with de-DE reference audio with adjustable speed slider (0.5x to 1.25x), and microphone permission error handling.
  - Implemented 1-5 star self-rating, toggleable tricky German sound chips (`ü`, `ö`, `ä`, `ch`, `r`, `sch`, `ß`), and direct audio upload to Google Drive `Shore/Voice-Recordings/` with metadata stored in `pronunciation_recordings`.
  - Built Shadowing Mode loop: plays native phrase, counts down (3.. 2.. 1..), auto-starts recording, loops over user-configured repeats (1x-5x), and presents attempts side-by-side for rating.
  - Built Tricky Words directory ranking phrases by lowest average score and hard sounds frequency, plus Recharts pronunciation improvement trend chart over time.
  - Built German Listening Practice log (Podcasts, Easy German, DW, YouTube) with 1-click study time synchronization into Daily Tracker (`activity_logs` under "German") and `timeline_events`.
  - Built German Writing Prompts workspace with live word counter and past submissions bank.
  - Built built-in German Hub stopwatch timer widget persisting start timestamp in `localStorage` and syncing study sessions directly into Daily Tracker and Unified Timeline.
  - Wrote 17 unit tests for Phase 8 covering pure SM-2 calculations, minimum ease factor clamping, interval previews, CEFR level progress stats, tricky words ranking, improvement analytics, and deterministic daily rotation (90 tests passing total).
  - Built Resume Version Manager supporting PDF uploads streaming directly to Google Drive `Shore/Resumes/` with version labels, target role tags, file metadata, and a 1-click toggle to set the master/default resume.
  - Linked resumes bidirectionally to job applications, tracking exactly which resume version was sent to which company with direct PDF and Drive preview links.
  - Built Achievement Bullet-Point Bank with real-time Action-Verb and Quantifiable Metric impact analyzer, calculating word counts, strength scores, and 1-click clipboard copy.
  - Built 5-stage Application Kanban pipeline (Wishlist, Applied, Interview, Offer, Rejected) powered by `@dnd-kit/core` with drag overlays, Indian Rupee salary ranges stored in integer paise (`salary_min_paise`, `salary_max_paise`), source tags, contacts list, and automatic `timeline_events` logging for every stage advance.
  - Built Follow-Up Reminders engine categorizing pending follow-ups into Overdue, Due Today, and Upcoming (next 7 days), with a prominent top alert banner and a 1-click resolution modal to log follow-up messages and reschedule.
  - Built STAR Interview Story Bank structuring behavioral scenarios into Situation, Task, Action, and Result, tagged by Leadership, Conflict, Failure, High Impact, Technical, and Teamwork.
  - Built interactive STAR Practice Mode with live countdown timer (1m, 2m, 3m, 5m presets), random behavioral prompt picker, interactive speaking checklist (S, T, A, R), notes peeker, 1-5 star self-rating, and automatic logging to `timeline_events`.
  - Built Company Intelligence & Notes hub documenting engineering culture, known tech stacks, interview stages, questions asked bank, and interactive checkable prep checklists.
  - Built Career Analytics & Stage Funnel visualizing weekly/monthly applications velocity, response rates, active interview pipeline, and drop-off conversion rates across all stages.
  - Wrote 11 unit tests for Phase 9 covering action verb detection, metric regex, paise salary math, follow-up categorizer, career stats & funnel math, and STAR question bank (101 tests passing total).
  - Built Journal & Reflection module (`/journal`): one entry per IST calendar day with mood and energy ratings (1-5), 3 gratitude prompts, wins, lessons, and free-write markdown with live preview.
  - Implemented 1-click "Auto-fill from Timeline" pulling that day's tasks completed, study sessions, DSA solved, meals logged, and expenses into the journal reflection.
  - Built auto-aggregated Weekly Review generator calculating total study time, DSA solved, money spent in integer paise (INR), tasks completed, and habit logs into an editable synthesis markdown template.
  - Built Mood & Energy Trajectory Recharts chart over 7, 14, and 30 days with average mood and energy indicators.
  - Built Notes / Second Brain module (`/notes`): markdown editor with split/live preview, folder categorization, tags, pinning, and instant full-text search across titles, contents, folders, and tags.
  - Implemented bidirectional `[[backlinks]]` engine automatically extracting linked note titles, syncing to `public.note_links`, and providing a Backlinks Panel with context excerpts and 1-click navigation.
  - Built interactive 2D SVG Notes Knowledge Graph visualizer mapping notes as nodes with folder colors and backlink connection lines.
  - Built Long-Term Goals module (`/goals`): goals with milestones, deadlines, category badges, dynamic progress calculations weighted from milestones (70%) and linked tasks (30%), and a Quarterly View grouping goals into Q1-Q4 horizon cards.
  - Built Health Mini-Trackers module (`/health`): toggleable trackers for Water hydration (+/- glasses, 250ml per glass, 8-glass goal), Sleep recovery (duration slider + 1-5 quality), Workouts (type chips, duration presets, notes), and Body Weight (fine adjustments with trend indicator).
  - Built 7-day and 30-day Recharts trends for water hydration, sleep duration, workout minutes, and weight progression.
  - All journal reflections and health logs (water, sleep, workouts, weight) write to `public.timeline_events`.
  - Built Privacy & Vault Protection System (`lib/privacy`): SHA-256 PIN hashing with cryptographic salts, WebAuthn biometric passkey integration (Touch ID / Face ID / Windows Hello), configurable inactivity auto-lock timeouts (Immediate, 5m, 15m, 30m), and reusable `VaultProtectionGate` securing Journal, Expenses, and Media Vault.
  - Wrote 16 unit tests for Phase 10 covering weekly review markdown aggregation, backlink extraction and excerpt parsing, goal progress math, quarterly date mapping, health conversions and averages, and PIN hashing/verification (117 tests passing total).
  - Built Analytics module (`/analytics`): real data aggregation across tasks, activities, habits, expenses, budgets, meals, places, and journal reflections with IST date range selector (7D, 30D, 90D, Month MTD, Year YTD, Custom).
  - Implemented transparent Productivity Score formula combining Tasks (40%), Focus Target Adherence (35%), and Habit Consistency (25%), with an interactive formula breakdown modal.
  - Built Skills & Focus tracking: time per skill breakdown (DSA, Spring Boot, MERN, German, Other) with Recharts daily trend stacked bars, skill streaks, and an interactive 24-hour x 7-day IST focus heatmap.
  - Built Money Analytics: total spend, daily average, projected monthly burn rate, spend by category/place/weekday, budget adherence progress bars with amber (80%) and danger (100%) thresholds, and month-over-month percentage changes.
  - Built Life & Correlations: Pearson correlation coefficients for Mood vs. Productivity, Mood vs. Spending, and Productivity vs. Spending, accompanied by a scientific non-causation disclaimer, places visited directory, and home-cooked vs. restaurant dining breakdown.
  - Built Exportable Monthly Report with 1-click Markdown (.md) download, CSV (.csv) metrics export, and print/PDF-optimized styling.
  - Built AI Coach system: server-side route (`/api/coach`) supporting Gemini and Anthropic LLM connectors with an offline heuristic synthesizer fallback, reading daily timeline events plus 14-day stats to return a 3-line summary, pattern noticed, 3 suggested priorities for tomorrow, and a gentle nudge.
  - Implemented strict privacy sanitization (`lib/coach/sanitizer.ts`) automatically stripping GPS coordinates, receipt/image URLs, and private journal notes (unless opted in).
  - Cached AI Coach insights in `public.ai_coach_insights` table with single-user RLS and automated `timeline_events` writes.
  - Embedded AI Coach Horizon card on Today Dashboard with 1-click "Add to Tasks", Weekly Review modal, and toggleable settings under Settings > AI Coach.
  - Wrote 17 unit tests for Phase 11 covering productivity score math, skill normalization and 24x7 heatmap, paise budget thresholds, Pearson correlation, privacy scrubber, heuristic coach generator, and report export (134 tests passing total).
  - Built full Google Drive automated backup and retention system exporting all 37 database tables to `backup.json` and key tables to CSV inside `Shore/Backups/YYYY-MM-DD/`.
  - Automated weekly Vercel Cron job at path `/api/cron/backup` protected by `CRON_SECRET` and scheduled via `vercel.json` (`0 2 * * 0`).
  - Implemented automated retention pruning keeping the 12 most recent backups in Google Drive and trashing older ones.
  - Built database Restore Tool with drag-and-drop JSON upload, row count previews across all tables, and dual restoration strategies: Merge (upsert) and Replace (clean wipe & rebuild) with confirmation modal.
  - Built 1-click "Download Backup Archive (.zip)" bundling full JSON and key RFC-4180 CSV tables.
  - Built Service Worker (`public/sw.js`) with shell pre-caching, runtime stale-while-revalidate, offline fallback page (`public/offline.html`), and background sync message dispatch.
  - Built IndexedDB offline queue (`shore_offline_db`) caching tasks, expenses, meals, notes, and photos with UUID idempotency keys to prevent duplicate syncs.
  - Built PWA Web Share Target (`/share-target`) to capture links, texts, and notes from mobile OS share sheets directly into Shore.
  - Built Command Palette powered by `cmdk` with navigation to all 16 modules, quick creation actions, and unified global search querying across Tasks, Notes, DSA problems, German Vocab, Places, Expenses, and Journal entries.
  - Built single-key global shortcuts (`n`, `e`, `m`, `/`, `?`, and `g` + letter navigation sequence) with interactive keyboard shortcuts cheat sheet.
  - Added `components/ui/skeleton.tsx`, `app/error.tsx`, and `app/not-found.tsx` for error boundaries and empty states.
  - Documented production setup in `README.md`, including architecture diagram (Mermaid), Google OAuth "In production" consent guide, Supabase migration instructions, and `.env.example`.
  - Wrote 14 unit tests for Phase 12 covering RFC-4180 CSV escaping, backup manifest and key CSV tables, JSON previewing and warning flags, restoration dependency order, 12-backup retention pruning, and offline queue mutation idempotency (148 tests passing total).
  - Built design-system `Select` component (`components/ui/select.tsx`) with custom chevron, container-constrained truncation, and dark-mode styling, standardizing dropdowns across Todos, Tracker, Expenses, German, Career, Learning, and Dashboard.
  - Enhanced AI Coach configuration and settings persistence (`lib/coach/service.ts`, `CoachSettings.tsx`, `AICoachCard.tsx`, `/api/coach` PATCH) with localStorage caching, real-time custom event syncing across views, boolean/string state parsing, and Supabase dual-persistence fallback.
  - Implemented Blind 150 / NeetCode 150 curated problem roadmap (`lib/dsa/blind150.ts`, `Blind150Tracker.tsx`) spanning 18 core algorithmic patterns with problem hints, time/space complexity, LeetCode links, interactive progress rings, and 1-click batch import.
  - Built resilient DSA problem creation & spaced-repetition rating with graceful offline local fallback objects to guarantee zero data loss during network/auth disruptions.
  - Wrote 12 new unit tests covering AI Coach toggle parsing, Blind 150 dataset integrity, title fuzzy normalization, and completion statistics (160 tests passing total).
  - Upgraded `Select` component (`components/ui/select.tsx`) into a luxury custom dropdown popover with search filtering, active checkmark indicators, zero OS default styling, and click-outside dismissal.
  - Added comprehensive DSA topic canonicalization (`canonicalDsaTopic` and `isSameDsaTopic`) properly mapping `HashMap`, `hashmap`, `Hash Table`, and `Hashing` into unified progress stats and filters.
  - Re-engineered Blind 150 matching engine (`lib/dsa/blind150.ts`) with LeetCode slug extraction (`extractLeetCodeSlug`), problem number stripping (`stripProblemNumber`), and solved status detection (`isBlindProblemSolved`) recognizing reviewed/scheduled problems so solved medium problems are accurately captured.
  - Completed project-wide emoji purge: eliminated 100% of default OS/system emojis and replaced them with accessible, crisp Lucide React SVG icons, enforcing the zero-tolerance emoji rule.
  - Built Full-Stack Learning Hub interactive inline sub-topic drawer in `RoadmapChecklist.tsx` enabling direct sub-topic creation, individual completion checkmarks, indicators for Architecture & Notes, Code Implementations, and Doc links, and one-click launch into focused study mode.
  - Added full background scroll locking across all modals (`TopicStudyModal`, `CreateTrackModal`, `AddTopicModal`, `SafeDeleteModal`) via `document.body.style.overflow = "hidden"`, completely eliminating background jitter and scroll bleed.
  - Refactored `calculateDynamicTrackMastery` so unstarted tracks start strictly at a clean 0% baseline (Beginner tier), earning mastery points as topics, sub-topics, questions, concepts, and projects are completed.
  - Created deliberate `SafeDeleteModal.tsx` protecting tracks, topics, sub-topics, concepts, and projects with blast radius warnings and mandatory typed confirmation for high-impact entities, replacing all 1-click and native `window.confirm` calls.
  - Enhanced Concepts Log with Engineering Area / Topic association dropdown, horizontal Area filter tabs, and area badges.
  - Upgraded track creation with isolated localStorage persistence (`shore_preview_tracks`, `shore_preview_roadmap_${trackId}`) and instant state hydration, supporting unlimited custom tracks (e.g. System Design, DevOps, Go) without overwriting.
  - Wrote 12 new unit tests covering 0% starting mastery baseline, sub-topic multi-section persistence, safe deletion safeguards, and custom track state hydration (177 tests passing total).
  - Overhauled Food Diary module: Added first-class 'amrita_mess' location alongside 'home', 'restaurant', 'office', and 'other'; enforced logical zero-cost policy for Amrita Mess and Home (auto-zeroing cost and skipping/deleting linked expenses); solved disappearing photos bug by replacing transient blob URLs with permanent canvas-compressed data URLs and direct Google Drive resumable upload linking; added multi-photo support (up to 5 photos) with thumbnail strip, full-screen image lightbox, and Media Vault photo linker ('FoodMediaPickerModal'); strictly decoupled 'is_favorite' from 4/5 star ratings with 1-click optimistic heart toggling and 'Log this again today' shortcut; excluded Amrita Mess and Home from 'Places to Eat Again' directory; added 4-slot daily progress bar (Breakfast, Lunch, Snack, Dinner) and custom Select dropdowns adhering to zero-emoji and zero-default-select rules; wrote 8 new unit tests (185 tests passing total).
  - Enhanced Media Vault & Google Drive Sync: Added `album_date` to `public.albums` with migration `20261106000000_album_date_and_media_drive.sql`, enabling retroactive albums for past vacations/events; created `AddPastMediaModal.tsx` for 1-click assignment of past photos/videos into albums with same-day smart filtering; implemented date-accurate Google Drive folder hierarchy (`ensureVideosMonthFolder` and `ensurePhotosMonthFolder`) placing media and albums into `Shore/Photos/YYYY/<MonthName>/` and `Shore/Videos/YYYY/<MonthName>/` matching their upload/EXIF date instead of forcing current month; redesigned album pill tabs and active album banner to use calm, luxurious deep sea teal (`bg-primary text-primary-foreground`) replacing bright jarring yellow-orange tokens; replaced all raw `<option>` elements with custom `Select` dropdowns; added universal photo and video entity linking in `PlaceDetailView.tsx` with '+ Add / Link Media' modal and direct Drive links; updated `MealDialog.tsx` to support both photos and videos from Media Vault; wrote 3 new unit tests (188 tests passing total).
  - Fixed Theme Toggle Blinking & Revert Bug & Added Radiant Bio-Glow: Resolved the issue where clicking the top-bar theme toggle icon blinked and immediately reverted to the previous mode. Fixed `ThemeConfigProvider` (`lib/theme/ThemeContext.tsx`) by replacing the unstable `setTheme` hook dependency loop with an `initialLoadDone` ref guard ensuring initial storage/Supabase loading runs strictly once on mount. Rewired `ThemeToggle` (`components/layout/ThemeToggle.tsx`) and `CommandPalette` (`components/common/CommandPalette.tsx`) to `useThemeConfig().setMode` to guarantee bidirectional synchronization between `next-themes`, `ThemeConfig`, `localStorage`, and DOM CSS variables. Added Shore-branded bio-glow atmospheric lighting (warm sunset amber in dark mode, calm sea teal in light mode), glowing drop-shadows on SVG icons, hover halo effects, and tactile Framer Motion spring interactions.
  - Overhauled Full-Stack Learning Hub Topic Creation & Resilient Architecture: Resolved the issue where adding new topics beyond the default 16 (e.g., in Spring Boot) failed silently. Identified and fixed root cause where `createRoadmapItem` lacked fallback for legacy schemas missing `category` or `order_index` columns and failed on non-UUID track IDs. Implemented self-healing tiered persistence (`createRoadmapItem`, `updateRoadmapItem`, `deleteRoadmapItem`, `getRoadmapItems`) with schema column fallback, standard packed sub-section resources, and guaranteed deterministic local fallbacks; added `isValidUUID` guards across concepts, projects, interview Q&A, and resources; upgraded `LearningContainer.tsx` with instant optimistic UI state updates and automatic dual-mode local caching (`shore_roadmap_${trackId}` & `shore_preview_roadmap_${trackId}`); added an inline quick-add topic input bar at the bottom of the curriculum list in `RoadmapChecklist.tsx` for 1-click addition of topic #17, #18, etc.; replaced browser `alert()` in `StudyTimerBar.tsx` with inline warning; replaced `window.confirm` in `ResourceLinksList.tsx` with `SafeDeleteModal`; wrote 5 new unit tests (213 tests passing total).
  - Built First-Class Topic Editing & Full-Screen Modal Backdrop Blur Architecture:
    - Created dedicated `EditTopicModal.tsx` allowing fast, 2-click edits to existing roadmap topics (topic title, category, status, and overview architecture notes) with category suggestions, direct link into the deep study workspace, safe deletion integration, zero emojis, and custom `Select` dropdowns.
    - Wired "Edit" button (`Edit3` icon) into each topic row in `RoadmapChecklist.tsx`, making topic updates immediately discoverable and accessible on desktop and mobile.
    - Fixed the critical UI bug where opening any popup/modal left the upper part of the background (TopBar header and top edge) unblurred and visible. Identified root cause: ancestor CSS transforms in `PageTransition` created a new CSS containing block for `fixed inset-0` descendants, trapping dialogs inside `<main>` below the sticky `TopBar`.
    - Created universal SSR-safe `ModalPortal` (`components/ui/modal-portal.tsx`) mounting modal dialogs directly to `document.body` with `z-[100] bg-black/75 backdrop-blur-md`, completely freeing modals from ancestor transforms and guaranteeing 100% full-screen coverage from `(0,0)` to `(100vw, 100vh)` across `AddTopicModal`, `EditTopicModal`, `TopicStudyModal`, `CreateTrackModal`, `SafeDeleteModal`, `MockInterviewModal`, `ProjectTracker`, `InterviewQaBank`, `ResourceLinksList`, `DsaProblemModal`, `QuickCaptureSheet`, `CommandPalette`, and `dialog.tsx`.
  - Standardized Learning Hub Upper Section & Module Identity:
    - Renamed module from rigid "Full-Stack Learning Hub" to standardized **"Learning Hub"** across `LearningContainer.tsx`, `modules.ts`, `app/learning/page.tsx`, `CommandPalette.tsx`, and `README.md`.
    - Modernized header subtitle to general, future-proof copy: "Master your core engineering tracks and technical approaches with structured roadmaps, architecture notes, code implementations, and project milestones."
    - Added interactive "Active Approaches" track pills directly in the page header allowing one-click track toggling across Java Full-Stack, MERN, and custom technical tracks.
  - Built Comprehensive Topic Positioning & Reordering Architecture:
    - Implemented `reorderLearningItems` pure array movement utility and `persistRoadmapOrder` in `lib/learning/index.ts` automatically re-indexing `order_index` (0, 1, 2, ...) and syncing to Supabase and localStorage.
    - Added dedicated Up/Down step toggling buttons (`ArrowUp`, `ArrowDown`) next to each topic row's position badge (`#1`, `#2`, ...) in `RoadmapChecklist.tsx` for fast 1-slot adjustments.
    - Added 1-click **"To Top"** quick-action button (`ArrowUpToLine`) on every topic row, immediately elevating any topic (e.g. newly added topics) to Position #1 while automatically shifting all existing topics down.
    - Enhanced `EditTopicModal.tsx` with a custom `Select` dropdown for exact Curriculum Position selection (Positions 1 through N), complete with "Top (#1)" and "Bottom" quick jump chips.
    - Enhanced `AddTopicModal.tsx` with a "Curriculum Placement & Order" selector, allowing new topics (such as "Spring Intro") to be placed directly at Position #1 on creation, shifting all other topics down automatically.
    - Wrote 4 new unit tests covering moving topics to position #1, shifting down, swapping up/down slots, and out-of-bounds boundary safety (217 tests passing total).
  - Enforced Universal Responsive Architecture & Zero-Overflow Guarantee:
    - Added mandatory zero-tolerance rule in `GEMINI.md` Conventions requiring all new features, components, modals, and updates to be tested and responsive across mobile (360px–430px), tablet (768px–1024px), laptop with open sidebar (1280px–1440px), and wide desktop displays (1920px+).
    - Fixed root causes of text and boxes reaching out of the screen:
      - Resolved horizontal screen blowout in `app/globals.css` by constraining `html` and `body` to `max-width: 100vw; overflow-x: hidden;` and making base font sizing responsive (`15px` on small phones, `16px` default, `16.5px` on 1536px+), replacing rigid global `17px` scaling that bloated mobile cards.
      - Guarded `<main>` in `AppShell.tsx` and `PageTransition.tsx` with `overflow-x-hidden min-w-0 w-full max-w-full`, and reduced mobile outer padding from `p-4` to `p-3` (`p-3 sm:p-6 md:pb-8 lg:p-8`) to prevent layout stretching.
      - Refactored `MarkdownView.tsx` with `w-full max-w-full min-w-0 break-words overflow-hidden`, adding `break-all` to hyperlinks and inline code, `break-words` to headings and paragraphs, and `overflow-x-auto scrollbar-thin` to tables and code blocks.
      - Fixed topic card blowout in `RoadmapChecklist.tsx`: converted the rigid `flex items-start justify-between` layout into a responsive `flex flex-col lg:flex-row lg:items-center` arrangement, allowing the topic title and badges to span full width on mobile/tablet without colliding with the 5-button action strip, and enabled responsive button labels (`hidden sm:inline`).
      - Refactored sub-topic drawer in `RoadmapChecklist.tsx`: converted rows to `flex flex-col sm:flex-row sm:items-center` with `min-w-0 flex-1 truncate` so sub-topic titles never get squished into zero width on mobile devices, and made delete icons visible (`opacity-70 sm:opacity-0 sm:group-hover:opacity-100`) for touch devices without hover.
      - Re-architected `TrackSelector.tsx`: replaced fixed absolute top-right overlay (`pr-16`) with natural flex alignment (`justify-between`), eliminating artificial title clipping and card overflow.
      - Fixed modal navigation headers: made `FullPageNoteModal.tsx`, `TopicStudyModal.tsx`, and `AttachConceptMapModal.tsx` top toolbars responsive with `overflow-x-auto scrollbar-none`, `shrink-0` safeguards, and responsive text labels (`hidden md:inline`).
      - Fixed filter button strips across `ProjectTracker.tsx` and `ResourceLinksList.tsx` with `overflow-x-auto scrollbar-none sm:scrollbar-thin min-w-0` to eliminate mobile horizontal pushout.
  - Stabilized Desktop Sidebar & Unified Viewport Scrolling:
    - Fixed root cause of the sidebar "flowing" or drifting upon scrolling: `AppShell.tsx` had `min-h-screen`, causing the entire `window` to scroll while ancestor `overflow-x: hidden` in `globals.css` broke standard `position: sticky`.
    - Locked root container with `h-screen h-[100dvh] w-full overflow-hidden` and anchored desktop `Sidebar.tsx` as `h-full shrink-0`, ensuring the sidebar is 100% rock-solid and never moves during scrolling, with `<main>` independently handling vertical scrolling (`overflow-y-auto`).
  - Upgraded Food Diary Calendar & Weekly Grid for Lower Screens:
    - Fixed cramped, multi-line wrapping in `FoodCalendarView.tsx`: replaced large, squashed 7-column desktop text cells with responsive mobile cells (`min-h-[50px] sm:min-h-[86px] p-1 sm:p-2`) featuring 4 clean colored micro-dots for Breakfast, Lunch, Snack, and Dinner (eaten, skipped, empty) and amber dot indicators for spend, while retaining full badge details on larger screens.
    - Upgraded `WeeklyMealGrid.tsx` with an interactive mobile Day Strip Switcher (`md:hidden`) allowing 1-tap switching between Mon-Sun and displaying a focused, touch-friendly single-day view with 4 meal cards and spend breakdown, completely eliminating mobile vertical sprawl and sideways overflow.
  - Built First-Class Workout & Fitness Hub (`/workout`):
    - Added dedicated module to `lib/modules.ts` under `growth` (ID `workout`, name "Workout & Fitness", shortName "Workout", tagline "Forge your strength and discipline", icon `Dumbbell`) and shortcut `g w`.
    - Built motivating hero header featuring rotating daily athlete/lifter quotes, active workout streak counter (with flame icon), monthly session totals, total volume in tons/kg, and active training hours.
    - Implemented interactive `WorkoutCalendar.tsx` with month view, week strip, split-specific color badges (Push, Pull, Legs, Upper, Lower, Full Body), and rich Day Inspector.
    - Built comprehensive `WorkoutLoggerModal.tsx` with routine template autofill (Push, Pull, Legs, etc.), 40+ exercise bank with custom dropdown filtering, dynamic sets table (weight in kg, reps, volume, duplicate set), live rest countdown timer (60s, 90s, 120s, 180s), and real-time total volume ticker.
    - Built `DailyPhysiqueGallery.tsx` supporting photo uploads with pose tags (Front, Back, Side, Flex, Scale), body weight in kg, and an interactive **Before & After Transformation Comparison Slider** to visually inspect muscle progression across dates.
    - Built `PersonalRecordsView.tsx` tracking all-time personal bests on compound lifts and an interactive scientific 1-Rep Max (1RM) calculator with percentage breakdowns (100% to 70%).
    - Created database schema `supabase/migrations/20261106030000_workout_hub.sql` for `workout_sessions`, `workout_exercises`, `workout_physique_photos`, and `workout_prs` with strict RLS and automated synchronization to `timeline_events`, `health_logs`, and `activity_logs`.
    - Wrote 12 new unit tests in `tests/workout.test.ts` (249 total unit tests passing).
- Known issues / TODOs: _(none yet)_
