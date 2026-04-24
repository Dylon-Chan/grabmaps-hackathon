# GrabMaps Tile And Route Proxy Design

## Goal

Integrate GrabMaps map tiles and route geometry so the frontend renders the real map style and live walking routes while keeping `GRABMAPS_API_KEY` server-side.

## Decision

Use FastAPI as the browser-facing gateway for protected GrabMaps resources. The frontend will fetch `/api/map/style`, receive a MapLibre style object whose vector tile URLs point back to the backend, and initialize MapLibre without any GrabMaps API key. When MapLibre requests a tile, FastAPI will fetch the matching GrabMaps tile with `Authorization: Bearer <GRABMAPS_API_KEY>` and stream the bytes back to the browser.

Routes continue to flow through `POST /api/routes`. The backend already calls GrabMaps directions with repeated `coordinates=lng,lat` and `overview=full`, then returns route legs with decoded geometry. The frontend already draws those legs through `syncRouteLayer`, so the route work should focus on preserving and testing that live geometry contract.

## Scope

This change covers:

- Rewriting GrabMaps vector tile URLs in style JSON to backend proxy URLs.
- Adding a backend route for proxied vector tile requests.
- Removing `apiKey` from the style response contract.
- Updating `GrabMap` to stop attaching Bearer headers in the browser.
- Adding tests that prove style rewriting, tile proxying, and frontend route rendering behavior.

This change does not add turn-by-turn navigation, route alternatives, map issue reporting, or a new map library.

## Backend Design

`backend/app/map_style.py` remains responsible for adapting upstream style JSON for browser use. It will rewrite legacy and API GrabMaps vector tile URLs into relative backend paths:

`/api/map/tiles/v2/vector/{tileset}/{z}/{x}/{y}.pbf`

The rewrite should handle both:

- `https://maps.grab.com/maps/tiles/v2/vector/...`
- `https://maps.grab.com/api/maps/tiles/v2/vector/...`

`backend/app/main.py` will expose:

`GET /api/map/tiles/v2/vector/{tileset}/{z}/{x}/{y}.pbf`

When `GRABMAPS_API_KEY` is missing, this endpoint returns `503`. When configured, it requests:

`GET {GRABMAPS_BASE_URL}/api/maps/tiles/v2/vector/{tileset}/{z}/{x}/{y}.pbf`

with Bearer auth. It returns the raw tile bytes with the upstream content type, defaulting to `application/x-protobuf`.

`GET /api/map/style` will return:

```json
{
  "source": "live",
  "style": { "version": 8, "sources": {}, "layers": [] }
}
```

or fallback:

```json
{
  "source": "fallback",
  "style": null
}
```

It will not include `apiKey`.

## Frontend Design

`frontend/src/components/GrabMap.tsx` will initialize MapLibre with the returned style object or the demo style fallback. It will not read an `apiKey` property and will not attach `Authorization` headers via `transformRequest`.

The existing marker and route effects stay intact:

- Markers are rebuilt when stops change.
- Active marker class updates when selection changes.
- `syncRouteLayer` draws the polyline from backend route legs.

## Error Handling

If style fetching fails, the frontend keeps using the demo MapLibre style. If individual proxied tile requests fail, MapLibre will surface missing tiles but the app shell remains usable. If live directions fail, `/api/routes` continues returning deterministic fallback legs with `source: "fallback"`.

## Testing

Backend tests will cover:

- Style tile URL rewriting for legacy and API GrabMaps tile URL forms.
- `/api/map/style` does not return `apiKey`.
- Tile proxy forwards the correct upstream path with Bearer auth and returns tile bytes.

Frontend tests will cover:

- `GrabMap` does not configure browser Bearer token forwarding.
- `syncRouteLayer` continues to render route geometry from route legs.

## Manual Verification

With `GRABMAPS_API_KEY` configured:

1. Start backend and frontend.
2. Open the app.
3. Confirm the map renders real GrabMaps tiles.
4. Start a quest and confirm the route line follows returned route geometry.
5. Inspect browser-visible network payloads and confirm the key is not exposed by `/api/map/style`.
