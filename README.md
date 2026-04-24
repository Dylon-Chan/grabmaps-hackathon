# SEA-GO

SEA-GO is split into:

- `frontend/`: Next.js app UI.
- `backend/`: FastAPI API server with GrabMaps gateway integration.

## Local Setup

Fast path:

```bash
make init
make dev
```

Backend only:

```bash
make backend-init
# Put your GrabMaps `bm_...` key in backend/.env.
make backend
```

Frontend only:

```bash
make frontend-init
make frontend
```

The frontend calls FastAPI through `NEXT_PUBLIC_API_BASE_URL`.

## GrabMaps Endpoints Used

Per the local `SKILL.md`, the FastAPI backend uses:

- `GET https://maps.grab.com/api/style.json`
- `GET https://maps.grab.com/api/v1/maps/eta/v1/direction`
- `GET https://maps.grab.com/api/v1/maps/poi/v1/search`
- `GET https://maps.grab.com/api/v1/maps/place/v2/nearby`
- `GET https://maps.grab.com/api/v1/maps/poi/v1/reverse-geo`

All protected calls use `Authorization: Bearer <GRABMAPS_API_KEY>`.
