# SEA-GO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans when making further multi-step implementation changes. Update this file when architecture, commands, or integration boundaries change.

**Current state:** SEA-GO is a split Next.js + FastAPI app. The original single Next.js API-route plan is obsolete.

**Goal:** Maintain a real API-backed hackathon demo with a polished Next.js frontend, FastAPI backend endpoints, hardcoded Singapore/Bangkok quest data, GrabMaps live integrations where configured, deterministic fallbacks where not configured, and Makefile-driven local workflows.

**Architecture:** `frontend/` owns the user experience and calls FastAPI through `NEXT_PUBLIC_API_BASE_URL`. `backend/` owns quest data, route trimming, GrabMaps client calls, fallback routing, place metadata, and photo verification/scoring. The root `Makefile` orchestrates common setup, server, test, and build commands.

**Tech Stack:** Next.js, React, TypeScript, MapLibre/GrabMaps frontend map surface, FastAPI, Python 3.12, httpx, Pydantic, pytest, ruff, Vitest, Make.

---

## File Structure

- `README.md`: setup, Makefile commands, and GrabMaps endpoint summary.
- `SKILL.md`: local GrabMaps API/library reference used by this project.
- `Makefile`: root orchestration for both apps.
- `backend/Makefile`: FastAPI init, dev, test, and lint commands.
- `backend/.env.example`: placeholder GrabMaps backend environment.
- `backend/app/main.py`: FastAPI app and HTTP endpoints.
- `backend/app/config.py`: Pydantic settings loaded from backend `.env`.
- `backend/app/data.py`: hardcoded cities, quests, stops, and country code mapping.
- `backend/app/grabmaps_client.py`: authenticated GrabMaps HTTP client.
- `backend/app/routing.py`: fallback route legs, totals, and polyline generation.
- `backend/app/route_trimming.py`: time-budget trimming logic.
- `backend/app/photo_scoring.py`: deterministic photo verification/scoring behavior.
- `backend/app/models.py`: backend API response/request models.
- `backend/tests/*`: API, GrabMaps client, and Makefile contract tests.
- `frontend/Makefile`: Next.js init, dev, build, and test commands.
- `frontend/.env.example`: frontend API base URL placeholder.
- `frontend/src/app/page.tsx`: app entry point.
- `frontend/src/components/SeaGoApp.tsx`: main product flow.
- `frontend/src/components/GrabMap.tsx`: map component.
- `frontend/src/app/globals.css`: app styling.
- `frontend/src/lib/types.ts`: frontend domain/API types.
- `frontend/public/assets/*`: project-bound visual assets.

## Completed Tasks

### 1. Split App Structure

- [x] Move Next.js app into `frontend/`.
- [x] Add FastAPI app under `backend/`.
- [x] Remove obsolete Next.js API routes.
- [x] Keep frontend/backend env examples separate.
- [x] Keep secrets out of tracked files.

### 2. Backend Domain And API

- [x] Define city, quest, stop, route, place, photo, and badge models.
- [x] Add Singapore and Bangkok city data.
- [x] Add four quests per city with six ordered POI stops each.
- [x] Implement `POST /api/quests/trim`.
- [x] Implement `POST /api/routes`.
- [x] Implement `GET /api/place/{place_id}`.
- [x] Implement `GET /api/suggest-next-quest`.
- [x] Implement `POST /api/photo/verify`.
- [x] Implement `POST /api/photo/score`.
- [x] Preserve deterministic demo behavior for prepared photos.

### 3. GrabMaps Integration

- [x] Implement bearer-authenticated style fetch at `/api/map/style`.
- [x] Implement directions via `/api/v1/maps/eta/v1/direction`.
- [x] Implement POI search via `/api/v1/maps/poi/v1/search`.
- [x] Implement nearby search via `/api/v1/maps/place/v2/nearby`.
- [x] Implement reverse geocode via `/api/v1/maps/poi/v1/reverse-geo`.
- [x] Use `SGP` for Singapore stops and `THA` for Bangkok stops.
- [x] Return fallback route/place data when GrabMaps is unavailable.

### 4. Frontend Product Flow

- [x] Load cities and quests from FastAPI.
- [x] Build city switching.
- [x] Build quest selection and time-budget trimming.
- [x] Build route rendering and stop selection.
- [x] Build stop drawer and lore display.
- [x] Build collect/photo verify/score flow.
- [x] Build badge state, auto-advance, and memory card completion.
- [x] Show a backend status panel when FastAPI is unreachable.

### 5. Makefile Workflow

- [x] Add root `make init`.
- [x] Add root `make dev`.
- [x] Add root `make backend`.
- [x] Add root `make frontend`.
- [x] Add root `make test`.
- [x] Add root `make build`.
- [x] Add backend `make init`, `make dev`, `make test`, `make lint`.
- [x] Add frontend `make init`, `make dev`, `make build`, `make test`.

## Current Commands

Install dependencies and create local env files:

```bash
make init
```

Run both apps:

```bash
make dev
```

Run only the backend:

```bash
make backend
```

Run only the frontend:

```bash
make frontend
```

When port 8000 is already in use:

```bash
make backend BACKEND_PORT=8010
make frontend API_BASE_URL=http://localhost:8010
```

When both default ports are busy:

```bash
make dev BACKEND_PORT=8010 FRONTEND_PORT=3001 API_BASE_URL=http://localhost:8010
```

## Verification

Before claiming implementation work is complete, run the relevant commands:

```bash
make -C backend test
make -C backend lint
make -C frontend test
make build
make test
```

Manual demo check:

- [ ] Singapore Hidden Hawker Gems trims to 4 stops at 90 minutes.
- [ ] Singapore Hidden Hawker Gems trims to 6 stops at 120 minutes.
- [ ] Stop 1 Maxwell photo awards Gold 85/100.
- [ ] Route advances to Stop 2 after scoring.
- [ ] Bangkok switch shows Bangkok quests and zones.
- [ ] Backend unreachable state is readable.
- [ ] Desktop and mobile layouts do not overlap.

## Future Work

- [ ] Add a live Distance Matrix integration if the available GrabMaps deployment exposes a documented endpoint.
- [ ] Replace deterministic photo scoring with the requested two-call AI verification/scoring flow.
- [ ] Add richer frontend tests for the 90-second demo path.
- [ ] Decide whether `make stop` should become part of the committed root Makefile workflow.
- [ ] Add browser smoke screenshots to docs only when they are intentionally curated assets.

## Self-Review

This plan now reflects the current split app, current file locations, FastAPI endpoint ownership, GrabMaps endpoint usage, Makefile commands, fallback behavior, and known next work. It no longer references obsolete `src/app/api` routes or TypeScript-only backend modules.
