# Himalayan Learning Grid

Offline-first AI education platform for remote Himalayan communities.

**Story:** OFFLINE AI LEARNING → EARTH/MOUNTAIN MISSION → PERSONALIZED QUIZ → LOCAL SAVE → SMART SATELLITE SYNC → CONTINUE LEARNING OFFLINE

This repo is a real, separated full-stack app:

```
himalayan-learning-grid/
├── backend/    Node + Express + SQLite — the "Local Hub" API
└── frontend/   React + Vite PWA — the student & teacher app
```

It implements the three-owner architecture from the team plan:
- **Bhavay** — frontend / PWA / dashboards → `frontend/`
- **Nipun** — backend / database / AI tutor / APIs → `backend/`
- **Shagun** — satellite adapter / smart sync / priority engine → `backend/src/services/{satelliteAdapter,priorityEngine,syncEngine}.js`

---

## 1. Quick start

You need Node.js 18+ installed. Two terminals:

```bash
# Terminal 1 — backend (Local Hub API + SQLite)
cd backend
cp .env.example .env       # optional: add ANTHROPIC_API_KEY for the cloud AI Tutor
npm install
npm run dev                 # http://localhost:4000

# Terminal 2 — frontend (student/teacher PWA)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the backend automatically (see `frontend/vite.config.js`), so you never need to hardcode a host.

The backend auto-creates and seeds a SQLite database at `backend/data/hlg.sqlite` on first run — nothing to configure.

### AI Tutor cloud mode
If `ANTHROPIC_API_KEY` is unset, the AI Tutor automatically and silently runs in **Local Tutor** (deterministic offline knowledge pack) mode — this is not an error state, it's the intended offline behavior. Set the key in `backend/.env` to enable the cloud model when "Satellite / Internet" is toggled on in the UI.

---

## 2. What was already present

The backend (Express + SQLite, all routes/services) and a working frontend already existed from an earlier build. This round was a **frontend visual redesign only** — the backend, database schema, and REST API were reused as-is (one additive field was added to a response; see below).

## 2a. Redesign summary (latest round)

Goal: replace the earlier dark "AI-dashboard" look with a light, restrained, professional EdTech UI closer to Google Classroom / Khan Academy / school-management software, while preserving every existing feature.

**Files changed**
- `frontend/src/styles.css` — full rewrite: light neutral surfaces, single restrained brand color, real type scale, tables, badges, skeletons, empty states (no gradients/glow/neon/glassmorphism).
- `frontend/src/components/ui.jsx` — rebuilt component kit: `Button`, `Badge`, `ConnectionBadge`, `ProgressBar`, `EmptyState`, `SectionHead`, `StatRow`, `Skeleton`/`SkeletonLines`, `PriorityBadge`, `SyncStatusBadge`.
- `frontend/src/constants.js` — grouped, realistic sidebar navigation (`Learning / Connectivity / Management / Account`).
- `frontend/src/App.jsx` — new application shell: light sidebar with icons (lucide-react), header with connection/role indicators, restructured routing.
- `frontend/src/pages/*.jsx` — every page redesigned: `Dashboard`, `Quiz` (rebuilt as a real one-question-at-a-time exam flow with a question palette, mark-for-review, and a results/review screen), `AITutor` (subdued assistant panel, no longer a dominant chatbot), `Sync.jsx` (now a professional Sync Center: stat row, priority table, upload/download tables, conflict list), `Teacher.jsx` (real `<table>` layouts), `Mission.jsx`, `Progress.jsx`.
- **New pages**: `Courses.jsx` (catalog/browse, replaces the old `Lessons.jsx`), `MyLearning.jsx` (a proper LMS learning page: course/chapter navigation, current lesson, progress bar, previous/next, resources, quiz CTA — replaces the old `LessonDetail.jsx`), `Downloads.jsx` (offline content management), `SettingsPage.jsx` (profile, offline storage, a real "clear offline cache" action, and a link to Demo Mode).
- `backend/src/routes/quiz.js` — **one additive change**: `POST /api/quiz/submit` now also returns a `review` array (per-question chosen/correct answers) so the redesigned results screen can show a correct/incorrect breakdown. No existing field was removed or renamed, so old consumers of this endpoint are unaffected.

**Existing functionality preserved**
- All REST endpoints, the SQLite schema, the Smart Priority Engine, the Mock Satellite Gateway, the AI Tutor's cloud/local fallback, offline IndexedDB caching, and the sync/conflict-resolution flow are unchanged and reused by the new UI exactly as before.
- Hackathon Demo Mode still exists (moved to a subtle secondary sidebar link + a shortcut in Settings) rather than being deleted, since it's the primary way to demo Smart Sync end-to-end.
- The Mountain Mission feature still exists (reachable from the Dashboard "Today's mission" card and from Demo Mode) even though it isn't one of the primary sidebar sections requested.

**New dependency added**: `lucide-react` (small, tree-shakeable icon set) — used for sidebar/status icons so the UI doesn't rely on emoji. No other dependencies were added; there was no existing TypeScript setup in this project, so this redesign was done in the existing plain JS/JSX + Vite stack rather than introducing TypeScript or a heavier component library (e.g. shadcn/ui), per the instruction to avoid unnecessary dependencies.

**Verification performed**
- `npm install` (both projects) and `npx vite build` — clean, no errors.
- An `esbuild` bundle check across every frontend module (catches syntax/import errors without needing a browser).
- Backend + frontend dev server run together with the Vite `/api` proxy, and every endpoint used by the new pages (`students`, `lessons`, `quiz/generate`, `quiz/submit` incl. the new `review` field, `sync/catalog`, `sync/queue`, `sync/run`, `mission`, `teacher/dashboard`, `students/:id/progress`) exercised with `curl` through the proxy to confirm the redesigned UI is wired to real data, not mocks.

**Known remaining issue**: PWA manifest icons (`icon-192.png` / `icon-512.png`) are still placeholders-only (referenced in `vite.config.js` but not included) — add real artwork before shipping an installable build. Everything else in this file's "Known limitations" (below) still applies.

## 2b. Redesign summary (Explorer / child-first round)

Goal: transform the platform into a gamified, child-friendly exploration experience — an interactive Himalayan map, Explore mode, learning missions with XP/badges, a child profile, story-based learning, and a kid-friendly satellite explainer — while keeping the academic/offline/sync/teacher backend from earlier rounds fully intact.

**New content model & backend (additive only)**
- `topics`, `missions`, `topic_progress`, `saved_topics` tables (`backend/src/db/schema.sql`), plus a guarded migration adding `xp` / `badges` / `streak` / `last_active_date` to `students` for pre-existing databases.
- 20 seeded topics across Mountains, Rivers, Animals, Forests, Weather/Science, History, Culture, Space and Satellites (Everest, Kanchenjunga, Brahmaputra, Ganga, Himalayan glaciers, snow leopard, red panda, Himalayan monal, Great Himalayan National Park, Valley of Flowers, Sikkim culture, Ladakh geography, satellite communication, and more), and 8 missions (Mountain Explorer, River Detective, Wildlife Guardian, History Explorer, Culture Keeper, Climate Guardian, Stargazer, Satellite Scientist) — each with a badge and XP reward.
- `backend/src/services/gamificationService.js` — XP, daily streaks, and mission/badge evaluation, deliberately kept separate from the existing weak-topic/quiz engine so grade-level academic personalization is untouched.
- New routes: `backend/src/routes/topics.js` (`GET /api/topics`, `GET /api/topics/:id`, `POST /api/topics/:id/explore`, `POST /api/topics/:id/quiz`, `POST /api/topics/:id/save`) and `backend/src/routes/missions.js` (`GET /api/missions`). One additive endpoint on the existing students route: `GET /api/students/:id/gamification`.

**New frontend experience**
- `Home.jsx` — "Welcome back, Explorer" with a visual **My Learning Journey** path (Mountains → Forests → Rivers → Culture → History → Science → Satellites), a **Today's Adventure** card, and **Recommended for you**.
- `HimalayanMap.jsx` — an interactive map with six teaching modes (Geography / History / Environment / Culture / Science / Satellite), rendered as an original offline-first SVG illustration with clickable location pins — deliberately **not** built on a tile-server map library, so the map works with zero network access rather than depending on external map tiles (see "Map technology" note below).
- `Explore.jsx` — free-browse topic cards by category.
- `TopicDetail.jsx` — the "Did you know?" panel → mini quiz → XP/badge celebration flow (the hackathon "wow moment").
- `Missions.jsx` / `Profile.jsx` — mission progress, badges, journey, saved topics, downloads, and academic progress in one tabbed profile.
- `AskAGuide.jsx` — a child-friendly reframing of the AI Tutor with suggested questions and "Explain simply / Give an example / Quiz me" quick actions (superseded the previous round's `AITutor.jsx`).
- `StoryMode.jsx` — four short illustrated stories ("Journey of a Water Drop," "Journey of a Himalayan Seed," "How a Mountain Forms," "How a Satellite Sees Earth").
- `LearningSatellite.jsx` — the child-facing satellite explainer (satellite → mountain region → local hub → student, plus a 5-step "how it works"), with a link through to the existing technical Sync Center for anyone who wants the real mechanics.
- `Onboarding.jsx` — an illustrated-avatar-only onboarding screen (no password/photo collection) that stands in for login/signup, since the backend has no user-authentication system to extend. This was a deliberate scope decision: building a fake password-based auth system for a single-demo-student hackathon backend would add risk without adding real functionality; a safe, honest, child-appropriate profile picker was implemented instead.

**Existing functionality preserved**
- The academic curriculum (Fractions / Water Cycle / Contour Map lessons and quizzes, weak-topic personalization) is unchanged and still reachable via a "Classwork" nav group (`Courses`, `My Learning`, `Class Progress`).
- The professional Sync Center, Teacher Dashboard, Mountain Mission, and Demo Mode from earlier rounds are all unchanged and still reachable (Sync Center via Settings or the Learning Satellite page; Demo Mode via a sidebar shortcut).
- All offline caching, the sync queue, the Smart Priority Engine, and the Mock Satellite Gateway are untouched.

**Bug found and fixed during verification**: `POST /api/topics/:id/explore` checked whether a topic was "already explored" *after* writing the upsert that had just set `explored = 1`, so first-time exploration XP was silently never awarded (the response claimed success regardless). Fixed to check prior state before writing, and re-verified: first explore now awards 10 XP, repeat exploration correctly awards 0, and completing all 3 Mountain Explorer topics correctly awards the "Mountain Explorer" badge and updates the mission's `complete` flag.

**New dependency**: none beyond `lucide-react` (already added in the previous round).

**Map technology note**: per the brief's own guidance to prefer offline capability over an external mapping dependency, the map is a custom, original SVG illustration with data-driven location pins (topic `mapX`/`mapY` fields from the content model) rather than Leaflet/MapLibre + tile servers — this sandbox has no reliable access to public tile CDNs, and a "works with the network off" map is core to the product's identity. The architecture keeps the same `topics` table used everywhere else, so swapping in a real tile-based map (e.g., MapLibre with an offline vector tile pack) later only touches `HimalayanMap.jsx`.

**Known remaining gaps**: only one of the several "quiz modes" from the brief exists in full (the per-topic mini quiz); map/picture/true-false/match-the-pair quiz variants were not built. No real photo/audio assets are used (icons are emoji, per the "no photo uploads" child-safety guidance, but this also means the "photographs" requirement from the visual-learning section isn't literally met). Onboarding stands in for login/signup rather than real authentication, as noted above.

**Verification performed**
- Careful code review of all pre-existing new files (this content was already present in the project when I started this round) before trusting or extending it.
- `npx esbuild` bundle check across every frontend module (compiles clean).
- `npx vite build` production build (clean).
- Backend + frontend run together with the Vite proxy; every route (old and new) exercised via `curl`, including the full topic-explore → topic-quiz → mission-complete → badge-award chain.
- Found and fixed the explore-XP-award ordering bug described above, then re-verified the fix.

## 3. What was implemented (original build, round 1)
**Backend (`backend/`)**
- SQLite schema + auto-seed (`src/db/schema.sql`, `src/db/index.js`)
- REST API across students, lessons, quiz, AI tutor, sync, teacher, mission (`src/routes/*.js`)
- Smart Priority Engine (`src/services/priorityEngine.js`)
- SatelliteAdapter interface + MockSatelliteAdapter + RealSatelliteAdapter boundary (`src/services/satelliteAdapter.js`)
- AI Tutor context retriever + cloud/local model adapter with graceful fallback (`src/services/aiService.js`)
- Sync engine: upload/download queues, retries, deterministic conflict resolution (`src/services/syncEngine.js`)

**Frontend (`frontend/`)**
- React + Vite PWA (service worker via `vite-plugin-pwa`, `manifest.webmanifest`)
- IndexedDB-backed offline store for the student profile, cached lessons, quiz attempts, and a queue of learning events recorded with zero connectivity (`src/services/offlineStore.js`)
- API client with offline fallback to local cache on every read (`src/services/apiClient.js`)
- Full student experience (as of round 1): Dashboard, Courses, My Learning, AI Tutor, Quizzes, Mountain Mission, Progress, Downloads, Sync Center, Teacher Dashboard, Settings, Hackathon Demo Mode (`src/pages/*.jsx`). **Superseded/extended by the Explorer round above** — see §2b for the current page list and nav structure.

---

## 4. Architecture

```
Browser (React PWA)                    Local Hub (Express + SQLite)
+--------------------------+           +-------------------------------+
| Service Worker           |  /api/*   | REST routes                   |
| IndexedDB (offline store)|---------->|  students - lessons - quiz    |
| apiClient.js             |<----------|  ai - sync - teacher - mission|
+--------------------------+   fetch   |                                |
                                        | Services                      |
                                        |  priorityEngine                |
                                        |  satelliteAdapter (Mock/Real)  |
                                        |  aiService (cloud/local)       |
                                        |  syncEngine                    |
                                        +---------------+----------------+
                                                        |
                                              SQLite (hlg.sqlite)
```

The frontend never talks to the satellite/cloud AI directly — it always goes through the Local Hub API, which is the same pattern a real deployment would use (a physical local-hub server in the village, syncing to a satellite ground station periodically).

## 5. Offline strategy

- **Service worker** precaches the app shell; API GETs are cached network-first with a 3s timeout, so screens keep rendering from cache when the Local Hub is unreachable.
- **IndexedDB** (`offlineStore.js`) persists the student profile, lesson content, quiz attempts, and a `learning_events` queue whenever a request fails outright (device has no connection to the Local Hub at all, e.g. student is truly standalone).
- **Local Hub SQLite** is the source of truth once a device *can* reach the hub over Local Wi-Fi, even with the satellite/internet link down — this is the `LOCAL_HUB` connection state.
- Nothing is ever faked: lesson completion, quiz submission, and mission completion always write a real row before the UI shows success.

## 6. AI architecture

```
Student Question
  -> Context Retriever (grade, language, weak topics, mission state)
  -> Model Adapter
      |- Cloud: Anthropic API (claude-sonnet-4-6), used when "online" is true and ANTHROPIC_API_KEY is set
      \- Local: deterministic keyword-matched knowledge pack (always available)
  -> Response Validation (non-empty, else fall back to Local)
  -> Answer + learning_events row (ai-question-answered / ai-question-unanswered)
```

Unanswered questions are logged to `unanswered_questions` and feed the Smart Priority Engine's `unanswered-question match` factor on the next sync.

## 7. Smart Sync algorithm

```
priority = weakTopicMatch*5 + teacherRequest*4 + unansweredQuestionMatch*4
         + newCurriculum*3 + languageMatch*3 + missionRelevance*2
         - largeFilePenalty*2   (2 points per 50MB over the 50MB threshold)
```

Ranked in `GET /api/sync/catalog`, and re-applied on every `POST /api/sync/run`. Packages scoring <=0 are labeled `SKIPPED` and never downloaded — this is how the 300MB "Cultural Documentary" video is deliberately never synced in the demo.

## 8. Satellite mock architecture

`SatelliteAdapter` (interface) -> `connect / disconnect / getStatus / uploadPackage / downloadPackage / getAvailablePackages / getSatelliteData`.

- `MockSatelliteAdapter` — the MVP implementation. Real, timed async behavior (`setTimeout`-based), with a deterministic failure hook used by the "Simulate a package validation failure" toggle in the Satellite Sync screen.
- `RealSatelliteAdapter` — a documented boundary only. It throws on `connect()` by design, so it can never be mistaken for a live satellite link. A future real integration swaps this class in behind the same interface; no route or UI code changes.

The UI is labeled **"SIMULATED SATELLITE GATEWAY — HACKATHON MVP"** wherever the sync panel appears.

## 9. Database / data model

SQLite (`backend/src/db/schema.sql`): `students`, `lessons`, `quiz_questions`, `quiz_attempts`, `learning_events`, `content_catalog`, `sync_downloads`, `teacher_requests`, `unanswered_questions`, `sync_history`, `conflicts`.

`learning_events` and `quiz_attempts` carry `synced` / `sync_status` columns so the sync engine can track upload state per row without a separate outbox table.

## 10. API endpoints

```
GET    /api/health

GET    /api/students/:id
GET    /api/students/:id/progress
PUT    /api/students/:id/profile

GET    /api/lessons
GET    /api/lessons/:id

POST   /api/quiz/generate     { studentId, topic? }
POST   /api/quiz/submit       { studentId, topic, answers[], questionIds[] }
GET    /api/quiz/history      ?studentId=

POST   /api/ai/ask            { studentId, question, online, missionDone }
POST   /api/ai/explain        { studentId, topic }
POST   /api/ai/generate-quiz  { topic }
POST   /api/ai/recommend      { studentId }

GET    /api/sync/status
GET    /api/sync/catalog      ?studentId=      (Smart Priority Engine ranking)
POST   /api/sync/run          { studentId, simulateFailure }
GET    /api/sync/queue
POST   /api/sync/downloads/:id/retry
GET    /api/sync/history
GET    /api/sync/gateway-log
GET    /api/sync/conflicts
POST   /api/sync/conflicts/:id/resolve
POST   /api/sync/events       { studentId, type, payload }

GET    /api/teacher/dashboard
POST   /api/teacher/requests  { topic | packageId, note? }

GET    /api/mission
POST   /api/mission/complete  { studentId, answers }

GET    /api/topics            ?category=&studentId=   (content model shared by Map/Explore/Missions)
GET    /api/topics/:id        ?studentId=
POST   /api/topics/:id/explore  { studentId }          (+10 XP first time, updates streak)
POST   /api/topics/:id/quiz     { studentId, answers[] } (mini quiz, +XP and mission/badge check on pass)
POST   /api/topics/:id/save     { studentId }          (toggle saved-for-later)

GET    /api/missions          ?studentId=              (progress + badge status per mission)
GET    /api/students/:id/gamification                   (xp, streak, badges, exploration %)
```

## 11. Demo instructions

1. Start both servers (`backend` on :4000, `frontend` on :5173) as in Quick Start.
2. Open the app — you'll land on **Onboarding** the first time (pick an explorer avatar, no password/photo needed), then the **Home** screen.
3. The "wow moment" flow: **Home** → click a topic on **Today's Adventure** or the **Himalayan Map** → read the "Did you know?" panel → **Take mini quiz** → on a passing score, watch the XP counter and (once a mission's topics are all complete) the badge-unlock celebration fire in `TopicDetail.jsx`.
4. For the original satellite-sync story, use **Demo Mode** (sidebar shortcut, or Settings → Developer & technical tools) → **Play full demo** — this still runs the full offline lesson → mission → quiz → sync flow from round 1 against the real backend.

## 12. How to simulate network-off mode

Top bar has two independent toggles, mirroring the plan's `ONLINE -> LOCAL HUB -> OFFLINE -> SYNCING -> SYNC ERROR` states:
- **Local Wi-Fi Hub** — on by default; talking to the Express API over the local network.
- **Satellite / Internet** — off by default; required for `POST /api/sync/run` and the cloud AI Tutor.
- **Force Network OFF** button — turns both off at once for a clean offline demo moment.

## 13. How to demonstrate Smart Sync to judges

Open **Satellite Sync**. The ranked list shows every catalog package with its live score and the exact reasons it scored that way (weak-topic match, teacher request, etc.), and the 300MB video visibly lands on `SKIPPED`. Toggle **"Simulate a package validation failure"** and re-run the sync to show a `SYNC ERROR` state and its retry flow. Submitting a quiz attempt right before syncing also surfaces the deterministic conflict-resolution card (local score kept, nothing silently overwritten).

## 14. Known limitations

- Single hardcoded demo student (`std-001`) and a static teacher roster — no multi-user accounts; Onboarding is an avatar picker, not real authentication (see §2b).
- `RealSatelliteAdapter` is a boundary stub only; there is no real satellite integration.
- PWA icons in `frontend/vite.config.js` (`icon-192.png`, `icon-512.png`) are referenced but not included — add real artwork before shipping an installable build.
- Conflict resolution demo is a one-shot deterministic scenario, not a general-purpose merge algorithm.
- Map/picture/true-false/match-the-pair quiz variants from the brief were not built — only the per-topic mini quiz exists.
- The interactive map is an original SVG illustration, not a real geospatial/tile-based map (see §2b for why).
- No automated test suite — validated manually via the endpoints in this README and the demo script.

## 15. Future real-satellite integration path

1. Implement a new class extending `SatelliteAdapter` in `backend/src/services/satelliteAdapter.js` (e.g. `IridiumAdapter`, `StarlinkAdapter`) that talks to the real provider's SDK/API.
2. Swap the adapter instance created in `backend/src/services/syncEngine.js` — everything else (priority engine, routes, frontend) is unchanged because it only depends on the `SatelliteAdapter` interface.
3. Replace simulated latency/failure with real link telemetry, and extend `getStatus()` to report real signal/pass-window data to the UI's connection badge.
