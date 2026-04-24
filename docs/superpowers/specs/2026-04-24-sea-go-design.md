# SEA-GO Design Spec

## Goal

Build a hackathon-ready SEA-GO demo: guided city quests that trim to a tourist's available time, route across real POI stops, collect photo-scored badges, and showcase Singapore and Bangkok.

## Product Scope

The app opens directly into a map-led product surface. Tourists choose a city, select a quest zone, enter available time, start a trimmed route, inspect stop lore and place metadata, upload a prepared photo, receive verification and scoring, then advance through the route. Completing the trimmed route produces a shareable memory card.

The 90-second demo path is:

1. Open in Chinatown Singapore.
2. Select Hidden Hawker Gems.
3. Enter 90 minutes.
4. Trim the quest from 6 stops to 4.
5. Start the quest and render the walking route.
6. Open Stop 1, Maxwell Food Centre.
7. Show place status and lore.
8. Upload a prepared photo.
9. Verify, score 85/100, award Gold, unlock bonus lore.
10. Auto-advance to Stop 2.
11. Switch to Bangkok and show new quest zones.

## Current Architecture

SEA-GO is now a split app, not a single Next.js app with API routes.

- `frontend/`: Next.js, React, TypeScript, MapLibre/GrabMaps UI, global CSS, Vitest.
- `backend/`: FastAPI, Python 3.12, httpx, Pydantic settings/models, pytest, ruff.
- Root `Makefile`: orchestration for init, dev, backend, frontend, test, and build commands.
- Backend `.env`: stores `GRABMAPS_API_KEY`; secrets are not committed.
- Frontend `.env.local`: stores `NEXT_PUBLIC_API_BASE_URL`; defaults to `http://localhost:8000`.

The frontend owns interaction state and presentation. The FastAPI backend owns quest data, route trimming, route/place/geocode integrations, and photo verification/scoring. External provider failures must return deterministic fallback responses so the demo stays reliable.

## Frontend

The first viewport is the app itself, not a marketing page. It contains:

- Full-bleed map surface using a real map component when available.
- Top HUD with SEA-GO brand, city switcher, time budget, progress, and badge count.
- Quest rail listing four quest types for the selected city.
- Quest zones and selected route visualization.
- Sequenced stop markers and per-leg route polylines.
- Stop drawer with place metadata, lore, route controls, and photo collection.
- Score card with verification status, category scores, tier, coaching feedback, and unlocked lore.
- Completion memory card with collected stop photos and badges.

If the FastAPI backend is unreachable, the UI shows a backend status panel rather than silently failing.

## Data Model

Quest data is hardcoded in `backend/app/data.py` for Singapore and Bangkok. Each city has four quests:

- Hidden Hawker Gems
- Heritage Shophouse Walk
- Local Neighbourhood Drift
- Natural Scene Trail

Each quest has 6 ordered stops. Each stop includes id, GrabMaps-like place id, name, coordinates, visit duration, walking duration to next stop, lore, bonus lore, badge prompt, demo photo name, and map display position.

Shared response shapes are defined in `backend/app/models.py` and mirrored by frontend TypeScript types in `frontend/src/lib/types.ts`.

## Route Trimming

Route trimming uses the ordered quest sequence and a time budget. Total time is the sum of stop visit durations plus walking-leg durations. The backend returns the longest prefix that fits within the requested minutes, with a minimum of two stops when possible.

For the core demo:

- Singapore Hidden Hawker Gems returns 4 stops for 90 minutes.
- Singapore Hidden Hawker Gems returns all 6 stops for 120 minutes.

## GrabMaps Integrations

The backend follows the local `SKILL.md` GrabMaps reference. Protected calls use `Authorization: Bearer <GRABMAPS_API_KEY>`.

Implemented endpoints:

- `GET https://maps.grab.com/api/style.json`
- `GET https://maps.grab.com/api/v1/maps/eta/v1/direction`
- `GET https://maps.grab.com/api/v1/maps/poi/v1/search`
- `GET https://maps.grab.com/api/v1/maps/place/v2/nearby`
- `GET https://maps.grab.com/api/v1/maps/poi/v1/reverse-geo`

Live behavior:

- Map style: backend proxy returns live style when a GrabMaps key is configured.
- Directions/routes: backend uses live GrabMaps direction legs when configured; otherwise fallback legs.
- Place details: backend searches GrabMaps by stop name and city country code (`SGP` or `THA`) when configured; otherwise fallback metadata.
- Nearby/search/geocode: backend exposes live passthrough endpoints when configured.
- Route trimming: currently uses deterministic quest durations; live Distance Matrix can be added if the available GrabMaps deployment exposes it.

## Backend Endpoints

- `GET /api/health`
- `GET /api/cities`
- `GET /api/quests?city=<id>`
- `POST /api/quests/trim`
- `POST /api/routes`
- `GET /api/place/{place_id}`
- `GET /api/map/style`
- `POST /api/photo/verify`
- `POST /api/photo/score`
- `GET /api/suggest-next-quest?city=<id>&completed=<questId>`
- `GET /api/grabmaps/search`
- `GET /api/grabmaps/nearby`
- `GET /api/geocode/reverse`

## Local Development

Primary flow:

```bash
make init
make dev
```

Run one side only:

```bash
make backend
make frontend
```

If the backend port is already occupied:

```bash
make backend BACKEND_PORT=8010
make frontend API_BASE_URL=http://localhost:8010
```

For the combined dev command:

```bash
make dev BACKEND_PORT=8010 FRONTEND_PORT=3001 API_BASE_URL=http://localhost:8010
```

## Error Handling

External integration failures must not block the demo. API routes catch provider errors, log concise server-side warnings, and return fallback data with `source: "fallback"`. The UI surfaces this quietly as demo or fallback data only where useful.

Photo verification failure shows a clear failed state and does not call scoring. Scoring failures return retryable errors. The happy path remains deterministic for prepared demo photos.

## Testing And Verification

Automated checks:

- `make -C backend test`
- `make -C backend lint`
- `make -C frontend test`
- `make build`
- `make test`

Manual browser verification:

- Select Singapore Hidden Hawker Gems.
- Set 90 minutes and confirm 4 stops.
- Start route and inspect Stop 1.
- Upload a photo and receive Gold 85/100.
- Confirm auto-advance to Stop 2.
- Switch to Bangkok and confirm Bangkok quest zones.
- Check desktop and mobile layouts for no text overlap.
