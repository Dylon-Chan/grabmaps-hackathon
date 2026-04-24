# SEA-GO Design Spec

## Goal

Build a full-stack hackathon demo for SEA-GO: guided city quests that trim to the tourist's available time, route across real POI stops, collect AI-scored photo badges, and showcase Singapore and Bangkok.

## Product Scope

The demo opens directly into a map-led product surface. Tourists choose a city, select a quest zone, enter available time, start a trimmed route, inspect stop lore and place metadata, upload a prepared photo, receive verification and scoring, then advance through the route. Completing the trimmed route produces a shareable memory card.

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

## Architecture

Use a single Next.js app with API routes. The frontend owns interaction state and presentation. Backend routes own integration with GrabMaps/Amazon Location-style services and AI scoring. All external API keys stay server-side. When required env vars are missing, endpoints return deterministic mocked responses shaped like live responses so the demo remains reliable.

## Frontend

The first viewport is the app itself, not a marketing page. It contains:

- Full-bleed stylized map canvas.
- Top HUD with SEA-GO brand, city switcher, time budget, progress, and badge count.
- Left quest rail listing four quest types for the selected city.
- Map quest zones as glowing overlays.
- Active route polyline and sequenced stop markers.
- Right stop drawer with live place metadata, lore, route controls, and photo collection.
- Score modal/card with verification status, category scores, tier, coaching feedback, and unlocked lore.
- Completion memory card with collected stop photos and badges.

Image Gen will create the visual concept before implementation. The implemented frontend should preserve the concept's hierarchy, palette, density, map-first composition, and premium travel-product feel.

## Data Model

Quest data is hardcoded in JSON/TypeScript assets for Singapore and Bangkok. Each city has four quests:

- Hidden Hawker Gems
- Heritage Shophouse Walk
- Local Neighbourhood Drift
- Natural Scene Trail

Each quest has 6 ordered stops. Each stop includes id, name, coordinates, place id, visit duration, short lore, bonus lore, badge prompt, and demo photo metadata.

## Route Trimming

Route trimming uses the ordered quest sequence and a time budget. Total time is the sum of stop visit durations plus walking-leg durations. The backend returns the longest prefix that fits within the requested minutes, with a minimum of two stops when possible. For the core demo, Hidden Hawker Gems in Singapore must return 4 stops for 90 minutes and 6 stops for 120 minutes.

## Integrations

Use live integrations where possible through server adapters:

- Map tiles/style: client-configured map provider values when present.
- Directions/routes: backend route endpoint calls live provider when env vars are configured; otherwise returns generated walking legs and polylines.
- Distance matrix: backend trim endpoint calls live matrix provider when configured; otherwise uses local haversine walking estimates with quest-specific demo overrides.
- Place details: backend place endpoint calls live provider when configured; otherwise returns deterministic open status, rating, and photo labels.
- Places suggestions: backend suggestion endpoint returns nearest incomplete quest using local city data and can call live search later.
- Geocoding: city detection is represented by city switcher and local reverse-geocode labels in the demo.
- AI photo verification/scoring: backend performs two sequential calls when an AI key is configured; otherwise returns deterministic demo verification and scoring.

## Backend Endpoints

- `GET /api/cities`: return available cities and default map viewport.
- `GET /api/quests?city=<id>`: return quests for a city.
- `POST /api/quests/trim`: accept city id, quest id, and minutes; return trimmed stops, estimates, and route summary.
- `POST /api/routes`: accept ordered stops; return route legs and polyline.
- `GET /api/place/:placeId`: return place metadata for a stop card.
- `POST /api/photo/verify`: accept stop id and image metadata; return pass/fail and reason.
- `POST /api/photo/score`: accept verification result and image metadata; return score, tier, category breakdown, feedback, and unlocked lore.
- `GET /api/suggest-next-quest?city=<id>&completed=<questId>`: return next recommended incomplete quest.

## Error Handling

External integration failures must not block the demo. API routes catch provider errors, log a concise message server-side, and return fallback data with `source: "fallback"`. The UI surfaces this quietly as "Demo estimate" or "Live place data unavailable" only where useful.

Photo verification failure shows a clear failed state and does not call scoring. Scoring failures return a retryable error state. The happy path remains deterministic for prepared demo photos.

## Testing And Verification

Automated tests should cover route trimming and photo scoring tier logic. Manual browser verification must cover:

- Select Singapore Hidden Hawker Gems.
- Set 90 minutes and confirm 4 stops.
- Start route and inspect Stop 1.
- Upload a photo and receive Gold 85/100.
- Confirm auto-advance to Stop 2.
- Switch to Bangkok and confirm Bangkok quest zones.
- Check a mobile viewport for no text overlap.

