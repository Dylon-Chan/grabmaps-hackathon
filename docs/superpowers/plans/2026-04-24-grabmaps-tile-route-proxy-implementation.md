# GrabMaps Tile And Route Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render GrabMaps tiles and routes in the frontend while keeping the GrabMaps API key server-side.

**Architecture:** FastAPI rewrites GrabMaps vector tile URLs in the MapLibre style to backend proxy URLs. MapLibre requests those proxied URLs without credentials; FastAPI fetches upstream tiles with Bearer auth. Existing `/api/routes` continues to provide route legs and geometry for the frontend route layer.

**Tech Stack:** FastAPI, httpx, Pydantic settings, pytest, Next.js, React, MapLibre GL, Vitest.

---

## File Structure

- Modify `backend/app/map_style.py`: rewrite legacy and API tile URL forms to relative proxy URLs.
- Modify `backend/app/main.py`: remove `apiKey` from `/api/map/style`; add tile proxy endpoint.
- Modify `backend/tests/test_api.py`: cover style response and tile URL rewriting.
- Modify `backend/tests/test_grabmaps_client.py`: cover authenticated tile byte fetching.
- Modify `frontend/src/components/GrabMap.tsx`: remove browser Bearer `transformRequest`.
- Add `frontend/src/components/GrabMap.test.tsx`: assert the map receives no browser auth transform.
- Keep `frontend/src/lib/mapRoute.ts` and `frontend/src/lib/mapRoute.test.ts` as the route rendering contract.

---

### Task 1: Backend Style Rewriting

**Files:**
- Modify: `backend/app/map_style.py`
- Test: `backend/tests/test_api.py`

- [ ] **Step 1: Write failing tests**

Add assertions that both upstream URL forms become backend-relative proxy URLs:

```python
def test_map_style_rewrites_api_grabmaps_vector_tiles_to_backend_proxy_urls():
    style = {
        "version": 8,
        "sources": {
            "grabmaptiles": {
                "type": "vector",
                "tiles": ["https://maps.grab.com/api/maps/tiles/v2/vector/karta-v3/{z}/{x}/{y}.pbf"],
            },
        },
        "layers": [],
    }

    rewritten = browser_safe_map_style(style)

    assert rewritten["sources"]["grabmaptiles"]["tiles"] == [
        "/api/map/tiles/v2/vector/karta-v3/{z}/{x}/{y}.pbf"
    ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_api.py::test_map_style_rewrites_api_grabmaps_vector_tiles_to_backend_proxy_urls -v`

Expected: FAIL because the current rewrite leaves an absolute GrabMaps URL.

- [ ] **Step 3: Implement minimal rewrite**

Change `browser_safe_map_style()` so both GrabMaps vector prefixes map to `/api/map/tiles/v2/vector/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_api.py::test_map_style_rewrites_api_grabmaps_vector_tiles_to_backend_proxy_urls -v`

Expected: PASS.

---

### Task 2: Backend Tile Proxy And Style Contract

**Files:**
- Modify: `backend/app/grabmaps_client.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_grabmaps_client.py`
- Test: `backend/tests/test_api.py`

- [ ] **Step 1: Write failing tests**

Add a `GrabMapsClient.get_vector_tile()` test that asserts path `/api/maps/tiles/v2/vector/karta-v3/12/3456/7890.pbf`, Bearer auth, returned bytes, and content type.

Add an API test asserting `/api/map/style` response keys are `source` and `style`, with no `apiKey`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_grabmaps_client.py::test_get_vector_tile_uses_bearer_auth_and_api_tile_path tests/test_api.py::test_map_style_response_does_not_expose_api_key -v`

Expected: FAIL because `get_vector_tile()` does not exist and `/api/map/style` still exposes `apiKey`.

- [ ] **Step 3: Implement minimal backend changes**

Add `get_vector_tile(tileset: str, z: int, x: int, y: int)` to `GrabMapsClient`, returning `(bytes, content_type)`.

Add `GET /api/map/tiles/v2/vector/{tileset}/{z}/{x}/{y}.pbf` in `main.py`. Return `503` when no key is configured; otherwise return `Response(content=tile_bytes, media_type=content_type)`.

Remove `apiKey` from `/api/map/style`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_grabmaps_client.py tests/test_api.py -v`

Expected: PASS.

---

### Task 3: Frontend Auth Removal

**Files:**
- Modify: `frontend/src/components/GrabMap.tsx`
- Add: `frontend/src/components/GrabMap.test.tsx`

- [ ] **Step 1: Write failing test**

Mock `maplibre-gl`, mock `/api/map/style`, render `GrabMap`, and assert the `Map` constructor receives no `transformRequest`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- GrabMap.test.tsx`

Expected: FAIL because `GrabMap` still reads `apiKey` and configures `transformRequest` when present.

- [ ] **Step 3: Implement minimal frontend change**

Update the style fetch type to `{ style: maplibregl.StyleSpecification | null }`, remove `apiKey` handling, and remove the `transformRequest` block.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- GrabMap.test.tsx`

Expected: PASS.

---

### Task 4: Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run backend tests**

Run: `cd backend && uv run pytest`

Expected: all tests pass.

- [ ] **Step 2: Run frontend tests**

Run: `cd frontend && npm test`

Expected: all tests pass.

- [ ] **Step 3: Run combined build if feasible**

Run: `make build`

Expected: build completes without exposing the GrabMaps API key in frontend code.
