from __future__ import annotations

from typing import Any

import httpx

from app.models import Coordinates, GrabMapsRoute, GrabMapsSearchResults


class GrabMapsError(RuntimeError):
    pass


class GrabMapsClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://maps.grab.com",
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self._owns_client = http_client is None
        self.http_client = http_client or httpx.AsyncClient(base_url=self.base_url, timeout=8.0)

    async def close(self) -> None:
        if self._owns_client:
            await self.http_client.aclose()

    async def get_map_style(self) -> dict[str, Any]:
        response = await self.http_client.get("/api/style.json", headers=self._headers())
        response.raise_for_status()
        return response.json()

    async def get_directions(
        self,
        points: list[Coordinates],
        profile: str = "walking",
    ) -> GrabMapsRoute:
        if len(points) < 2:
            raise ValueError("At least two coordinates are required for directions.")

        params = [("coordinates", self._coordinate(point)) for point in points]
        params.extend([("profile", profile), ("overview", "full")])
        response = await self.http_client.get(
            "/api/v1/maps/eta/v1/direction",
            params=params,
            headers=self._headers(),
        )
        response.raise_for_status()
        data = response.json()
        first = (data.get("routes") or [{}])[0]
        return GrabMapsRoute(
            distanceMeters=round(first.get("distance") or 0),
            durationSeconds=round(first.get("duration") or 0),
            geometry=self._parse_geometry(first),
            raw=data,
        )

    async def search_places(
        self,
        keyword: str,
        country: str,
        location: Coordinates | None = None,
        limit: int = 10,
    ) -> GrabMapsSearchResults:
        params: dict[str, str] = {
            "keyword": keyword,
            "country": country,
            "limit": str(limit),
        }
        if location:
            params["location"] = f"{location.lat},{location.lng}"

        response = await self.http_client.get(
            "/api/v1/maps/poi/v1/search",
            params=params,
            headers=self._headers(),
        )
        response.raise_for_status()
        return GrabMapsSearchResults(raw=response.json())

    async def nearby_search(
        self,
        location: Coordinates,
        radius_km: float = 1,
        limit: int = 10,
        rank_by: str = "distance",
    ) -> GrabMapsSearchResults:
        response = await self.http_client.get(
            "/api/v1/maps/place/v2/nearby",
            params={
                "location": f"{location.lat},{location.lng}",
                "radius": str(radius_km),
                "limit": str(limit),
                "rankBy": rank_by,
            },
            headers=self._headers(),
        )
        response.raise_for_status()
        return GrabMapsSearchResults(raw=response.json())

    async def reverse_geocode(self, location: Coordinates) -> GrabMapsSearchResults:
        response = await self.http_client.get(
            "/api/v1/maps/poi/v1/reverse-geo",
            params={"location": f"{location.lat},{location.lng}"},
            headers=self._headers(),
        )
        response.raise_for_status()
        return GrabMapsSearchResults(raw=response.json())

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"}

    def _coordinate(self, point: Coordinates) -> str:
        return f"{point.lng},{point.lat}"

    def _parse_geometry(self, route: dict[str, Any]) -> list[Coordinates]:
        geometry = route.get("geometry")
        if isinstance(geometry, dict):
            coordinates = geometry.get("coordinates") or []
        else:
            coordinates = geometry or []

        parsed: list[Coordinates] = []
        for item in coordinates:
            if isinstance(item, list | tuple) and len(item) >= 2:
                parsed.append(Coordinates(lat=float(item[1]), lng=float(item[0])))
        return parsed

