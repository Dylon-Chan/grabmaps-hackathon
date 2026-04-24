# QuestPass SG UI Integration Design Spec

## Goal

Integrate the teammate UI from `https://github.com/estherwyl/questpass-sg-grabmaps` into this codebase as the primary frontend experience.

The integrated app should preserve the teammate prototype's QuestPass SG mobile journey and visual identity while using this repo's existing Next.js, TypeScript, FastAPI, GrabMaps, route trimming, place details, and photo verification/scoring infrastructure.

## Approved Direction

Replace the current SEA-GO desktop-style map dashboard with a mobile-first QuestPass SG flow.

Use the teammate design as the product and visual reference:

- Flight setup and demo-mode entry.
- QuestPass SG home map with XP, flight countdown, time-window selection, and passport access.
- Quest selection cards with filters, ETA/safety chips, badges, quest stats, and theme styling.
- Active quest screen with airport buffer, progress timeline, clue card, location/demo CTA states, hint reveal, and route trail.
- Stop-unlocked reveal with story, local tip, photo challenge, route CTA, and collectible reward.
- Quest completion screen with earned badge and XP.
- Passport screen with earned badges, XP progress, city tabs, and locked future-city teasers.

Keep this repo's backend as the source of truth for cities, quests, stops, route totals, place metadata, and photo scoring.

## Source Repositories

Current repo:

- `frontend/`: Next.js app, React 19, TypeScript, global CSS, MapLibre component, Vitest.
- `backend/`: FastAPI API server with hardcoded city/quest data, GrabMaps live integrations, deterministic fallback behavior, and photo verification/scoring.

Teammate design repo:

- Standalone React/Babel prototype with files such as `App.jsx`, `FlightSetup.jsx`, `QuestMap.jsx`, `QuestSelect.jsx`, `ActiveQuest.jsx`, `StopUnlocked.jsx`, `Passport.jsx`, `data.js`, and `grabmaps.js`.
- Uses global `window.*` state/data, inline style objects, emoji/icon glyphs, demo GrabMaps stubs, and local quest data.

## Product Flow

The Next.js entry point should render a `QuestPassApp`-style shell instead of the current `SeaGoApp` map dashboard.

Screen states:

1. `setup`: traveler enters flight date/time and desired airport buffer, or starts demo mode.
2. `home`: traveler sees the QuestPass SG landing map, XP, flight countdown, time-window choices, and passport entry.
3. `select`: traveler filters and chooses a quest that fits the selected window.
4. `quest`: traveler solves clues and advances through ordered stops.
5. `unlocked`: stop reveal after location/demo unlock and photo verification/scoring.
6. `complete`: quest completion summary and badge award.
7. `passport`: earned badges, XP, city collection progress, and future city teasers.

Screen transitions can use the teammate prototype's short slide/fade motion, with reduced-motion support.

## Backend Integration

The frontend should call the existing FastAPI endpoints through `NEXT_PUBLIC_API_BASE_URL`.

Use these existing endpoints:

- `GET /api/cities`
- `GET /api/quests`
- `POST /api/quests/trim`
- `POST /api/routes`
- `GET /api/place/{place_id}`
- `POST /api/photo/verify`
- `POST /api/photo/score`

The teammate prototype's `window.GrabMaps` stub should not be copied as an app dependency. Equivalent behavior should be implemented as typed frontend helpers:

- Browser geolocation wrapper for optional physical-location state.
- Haversine distance helper for unlock radius checks.
- API-backed route summary helper using `/api/routes`.
- API-backed place details helper using `/api/place/{place_id}`.
- Deterministic demo fallback when geolocation is denied or unavailable.

The existing `GrabMap` component remains available for future use, but this integration should prioritize the teammate's stylized mobile map/timeline surfaces for visual fidelity and speed.

## Data Mapping

Backend `Quest` objects map into QuestPass cards:

- `id` -> quest id.
- `title` -> display name.
- `summary` -> tagline/subtitle.
- `type` -> theme/filter bucket.
- `emoji` -> theme icon.
- `color` -> quest accent color.
- `zoneLabel` -> neighborhood.
- `stops.length` -> stop count.
- Trimmed route total minutes -> duration and fit status.
- Score completion -> earned badge state.

Backend `QuestStop` objects map into clue and unlock screens:

- `name` -> place title.
- `coordinates` -> unlock distance and external route CTA.
- `lore` -> story text.
- `bonusLore` -> local tip or reveal copy.
- `prompt` -> clue/photo challenge.
- `demoPhotoName` -> default demo photo verification input.
- `mapPosition` -> stylized mini-map/timeline position.
- `visitMinutes` and route leg data -> duration summaries.

Where the teammate design expects fields not present in the backend, the frontend should derive conservative defaults rather than expand backend schema immediately. Examples include difficulty, persona tags, rarity labels, and XP. If a field becomes central to UI clarity, add it deliberately in a later implementation step.

## Visual System

Preserve the teammate design's dark QuestPass SG identity:

- Background: near-black layered surfaces (`#060810`, `#0b0d1a`, `#141626`).
- Accents: pink `#e040a0`, gold `#f0bc42`, green `#2ecb82`, blue `#3d8ff5`, purple `#7c4dcc`, orange `#f57c30`.
- Typography: use system sans-serif with clear type scales; optionally add CSS font-family fallbacks named for `DM Sans` and `Space Grotesk` without requiring remote font downloads.
- Geometry: mobile cards around 12-20px radius inside the phone shell; avoid nesting cards inside cards beyond modal/screen card structures already present in the prototype.
- Motion: subtle slide/fade transitions, pulse dots, progress fills, and unlock reveal animation.

Implementation should move inline prototype style objects into maintainable CSS classes in `frontend/src/app/globals.css` or co-located CSS if the repo adds a convention for it.

## Component Boundaries

Suggested frontend structure:

- `frontend/src/components/QuestPassApp.tsx`: app-level state machine, backend data loading, flight state, XP/badges, screen transitions.
- `frontend/src/components/questpass/FlightSetup.tsx`: flight activation form and safety timeline.
- `frontend/src/components/questpass/QuestHome.tsx`: landing map, time selection, XP, airport countdown.
- `frontend/src/components/questpass/QuestSelect.tsx`: filters and quest cards.
- `frontend/src/components/questpass/ActiveQuest.tsx`: clue/progress/location state.
- `frontend/src/components/questpass/StopUnlocked.tsx`: unlock reveal and photo scoring result.
- `frontend/src/components/questpass/QuestComplete.tsx`: quest completion.
- `frontend/src/components/questpass/Passport.tsx`: badge collection.
- `frontend/src/lib/flightWindow.ts`: time-window math.
- `frontend/src/lib/location.ts`: geolocation and distance helpers.
- `frontend/src/lib/questPass.ts`: derived display data, badge/XP helpers, fit labels.

Existing files can be renamed or replaced where appropriate, but unrelated backend and map integration changes should be left intact.

## Error Handling

If the backend is unreachable, show a QuestPass-styled status panel that explains the FastAPI dependency and keeps the visual language consistent.

If route or place calls fail, show fallback/demo chips rather than breaking the flow.

If geolocation is unavailable or denied, keep demo mode enabled and expose "Simulate arrival" as the primary unlock path.

If photo verification fails, show a failed verification state and do not award the stop badge. The prepared demo photo path should remain deterministic.

## Testing

Add focused frontend tests where risk is highest:

- Flight-window calculations for past flights, short layovers, and plenty-of-time cases.
- Quest progress and badge award helpers.
- Data mapping from backend quest/stops to QuestPass card/stop display models.

Keep existing frontend and backend tests passing.

Manual browser verification should cover:

- Setup to demo mode.
- Time window selection to quest selection.
- Quest selection to active clue screen.
- Simulated arrival to stop unlock.
- Photo verification/scoring to badge award.
- Quest completion to passport.
- Backend unreachable state.
- Desktop shell and mobile viewport with no overlapping text.

## Non-Goals

- Do not copy the teammate repo's global `window.*` architecture.
- Do not duplicate backend quest data in frontend `data.js`.
- Do not introduce real user accounts, persistence, payments, or production flight APIs.
- Do not replace the FastAPI GrabMaps integration with frontend-only stubs.
- Do not require location permission for the demo path.

## Self-Review

This spec has no open gaps. It preserves the approved replacement direction, names the source UI and current backend boundaries, defines the screen flow, maps data without over-expanding the backend schema, and keeps implementation scope focused on integrating the teammate UI into the existing app.
