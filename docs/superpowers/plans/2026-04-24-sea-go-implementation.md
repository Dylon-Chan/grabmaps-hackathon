# SEA-GO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Next.js hackathon demo for SEA-GO with API-backed route trimming, route/place/photo endpoints, hardcoded Singapore and Bangkok quests, and a polished Image Gen-led frontend.

**Architecture:** A single Next.js app hosts both the frontend and API routes. Domain logic lives in focused TypeScript modules under `src/lib`, while `src/app/api` exposes backend endpoints. External service adapters return live data when env vars are configured and deterministic fallback data otherwise.

**Tech Stack:** Next.js, React, TypeScript, CSS Modules/global CSS, Vitest, local JSON/TypeScript quest data, server-side integration adapters.

---

## File Structure

- `package.json`: scripts and dependencies.
- `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`: project configuration.
- `src/app/page.tsx`: main SEA-GO product screen.
- `src/app/layout.tsx`, `src/app/globals.css`: app shell and styling.
- `src/app/api/*/route.ts`: API endpoints.
- `src/lib/quests.ts`: hardcoded city and quest data.
- `src/lib/types.ts`: shared domain types.
- `src/lib/route-trimming.ts`: time-fit trimming logic.
- `src/lib/routing.ts`: fallback route and polyline logic.
- `src/lib/place-details.ts`: live/fallback place metadata.
- `src/lib/photo-scoring.ts`: verification and scoring logic.
- `src/lib/integrations/grabmaps.ts`: live provider boundary for map/routing/place calls.
- `src/components/*`: focused UI components for map, quest rail, stop drawer, score card, and memory card.
- `src/lib/*.test.ts`: unit tests for trimming and scoring.
- `public/assets/*`: Image Gen frontend concept and any project-bound visual assets.

## Tasks

### Task 1: Scaffold The App

- [ ] Create the Next.js project files listed above with TypeScript enabled.
- [ ] Add scripts: `dev`, `build`, `lint`, `test`.
- [ ] Add a minimal root page that renders "SEA-GO".
- [ ] Run `npm install`.
- [ ] Run `npm run build` and confirm the starter app compiles.

### Task 2: Domain Data And Types

- [ ] Define city, quest, stop, route, place, and badge types.
- [ ] Add Singapore and Bangkok city records.
- [ ] Add four quests per city with six ordered POI stops each.
- [ ] Include demo-specific durations so Singapore Hidden Hawker Gems trims to 4 stops at 90 minutes and 6 stops at 120 minutes.
- [ ] Add unit tests that assert the quest data has two cities, four quests per city, and six stops per quest.

### Task 3: Route Trimming And Routing APIs

- [ ] Implement `trimQuestToBudget(cityId, questId, minutes)`.
- [ ] Implement fallback walking-leg estimates and polyline generation.
- [ ] Add `POST /api/quests/trim`.
- [ ] Add `POST /api/routes`.
- [ ] Add tests for 90-minute and 120-minute Singapore Hidden Hawker behavior.

### Task 4: Place And Suggestion APIs

- [ ] Implement `getPlaceDetails(placeId)` with live-provider hook and fallback metadata.
- [ ] Add `GET /api/place/[placeId]`.
- [ ] Add `GET /api/suggest-next-quest`.
- [ ] Keep responses shaped for the frontend with explicit `source` fields.

### Task 5: Photo Verification And Scoring APIs

- [ ] Implement `verifyPhoto(stopId, imageName)` with deterministic prepared-photo behavior.
- [ ] Implement `scorePhoto(stopId, verification)` with Gold/Silver/Bronze tier rules.
- [ ] Add `POST /api/photo/verify`.
- [ ] Add `POST /api/photo/score`.
- [ ] Add tests for wrong-location fail-fast and Gold 85/100 success.

### Task 6: Image Gen Concept And Assets

- [ ] Generate a polished SEA-GO app concept with Image Gen.
- [ ] Save the accepted concept under `public/assets/sea-go-concept.png`.
- [ ] Extract palette, spacing, panel topology, and visual hierarchy from the concept.
- [ ] Use any final project-bound generated assets from `public/assets`.

### Task 7: Frontend Product Flow

- [ ] Build the map-first app screen.
- [ ] Build city switching.
- [ ] Build quest rail and quest zone overlays.
- [ ] Build time budget input and trim interaction.
- [ ] Build route rendering, stop selection, and stop drawer.
- [ ] Build collect/photo upload flow that calls verify then score.
- [ ] Build badge state, auto-advance, and memory card completion.

### Task 8: Verification And Polish

- [ ] Run unit tests.
- [ ] Run production build.
- [ ] Start the dev server.
- [ ] Verify the 90-second demo path in browser.
- [ ] Check desktop and mobile layouts for overlap.
- [ ] Fix visible mismatches from the Image Gen concept before final.

## Self-Review

The plan covers all spec requirements: map-first UI, city/quest data, trimming, route/place/suggestion endpoints, photo verification/scoring, fallback integration behavior, Image Gen visual concept, and browser verification. No placeholders remain. Type ownership is centralized in `src/lib/types.ts` and used consistently by API and UI code.

