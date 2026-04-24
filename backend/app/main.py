from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

logger = logging.getLogger(__name__)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.data import cities, get_country_code_for_place_id, get_stop_by_place_id, quests
from app.grabmaps_client import GrabMapsClient
from app.map_style import browser_safe_map_style
from app.models import (
    Coordinates,
    PhotoScoreRequest,
    PhotoVerifyRequest,
    PlaceDetails,
    RouteLeg,
    RouteRequest,
    RouteResponse,
    TrimRequest,
)
from app.photo_scoring import score_photo, verify_photo
from app.route_trimming import trim_quest_to_budget
from app.routing import align_polyline_to_stops, build_route_legs, route_totals

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(title="SEA-GO Backend", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "grabmapsConfigured": bool(settings.grabmaps_api_key),
    }


@app.get("/api/cities")
async def list_cities() -> dict[str, Any]:
    return {"cities": [city.model_dump(by_alias=True) for city in cities]}


@app.get("/api/quests")
async def list_quests(city: str | None = None) -> dict[str, Any]:
    filtered = [quest for quest in quests if city is None or quest.city_id == city]
    return {"quests": [quest.model_dump(by_alias=True) for quest in filtered]}


@app.post("/api/quests/trim")
async def trim_quest(request: TrimRequest) -> dict[str, Any]:
    try:
        result = trim_quest_to_budget(request.city_id, request.quest_id, request.minutes)
        return result.model_dump(by_alias=True)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.post("/api/routes")
async def route_stops(request: RouteRequest) -> dict[str, Any]:
    fallback_legs = build_route_legs(request.stops)
    stop_minutes, walk_minutes, total_minutes = route_totals(request.stops)
    source = "fallback"
    legs = fallback_legs

    if settings.grabmaps_api_key and len(request.stops) > 1:
        live_legs = await _live_legs(request.stops)
        if live_legs:
            legs = live_legs
            walk_minutes = sum(leg.minutes for leg in live_legs)
            total_minutes = stop_minutes + walk_minutes
            source = "live"

    return RouteResponse(
        legs=legs,
        totalMinutes=total_minutes,
        walkMinutes=walk_minutes,
        stopMinutes=stop_minutes,
        source=source,
    ).model_dump(by_alias=True)


@app.get("/api/place/{place_id:path}")
async def place_details(place_id: str) -> dict[str, Any]:
    stop = get_stop_by_place_id(place_id)
    if not stop:
        raise HTTPException(status_code=404, detail=f"Unknown place id: {place_id}")

    source = "fallback"
    address = None
    rating = 4.7 if place_id == "grab:sg:maxwell" else 4.4
    if settings.grabmaps_api_key:
        live = await _search_live_place(
            stop.name,
            stop.coordinates,
            get_country_code_for_place_id(place_id),
        )
        if live:
            source = "live"
            address = live.get("address")
            rating = live.get("rating", rating)

    return PlaceDetails(
        placeId=place_id,
        name=stop.name,
        openNow=True,
        rating=rating,
        priceLevel="$" if "hawker" in place_id or "maxwell" in place_id else "$$",
        photoLabel=f"{stop.name} street view",
        address=address,
        source=source,
    ).model_dump(by_alias=True)


@app.get("/api/map/style")
async def map_style() -> dict[str, Any]:
    if not settings.grabmaps_api_key:
        return {"source": "fallback", "style": None, "apiKey": None}

    client = GrabMapsClient(api_key=settings.grabmaps_api_key, base_url=settings.grabmaps_base_url)
    try:
        style = browser_safe_map_style(await client.get_map_style())
        return {"source": "live", "style": style, "apiKey": settings.grabmaps_api_key}
    finally:
        await client.close()


@app.post("/api/photo/verify")
async def verify_photo_endpoint(request: PhotoVerifyRequest) -> dict[str, Any]:
    try:
        result = await verify_photo(request.stop_id, request.image_name)
        return result.model_dump(by_alias=True)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.post("/api/photo/score")
async def score_photo_endpoint(request: PhotoScoreRequest) -> dict[str, Any]:
    try:
        result = await score_photo(request.stop_id, request.verification)
        return result.model_dump(by_alias=True)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.get("/api/suggest-next-quest")
async def suggest_next_quest(city: str, completed: str | None = None) -> dict[str, Any]:
    candidate = next((quest for quest in quests if quest.city_id == city and quest.id != completed), None)
    return {
        "quest": candidate.model_dump(by_alias=True) if candidate else None,
        "reason": (
            f"{candidate.title} is the nearest unfinished route in this demo city."
            if candidate
            else "All demo quests are complete."
        ),
        "source": "fallback",
    }


@app.get("/api/grabmaps/search")
async def search_places(keyword: str, country: str, lat: float | None = None, lng: float | None = None, limit: int = 10):
    if not settings.grabmaps_api_key:
        raise HTTPException(status_code=503, detail="GRABMAPS_API_KEY is not configured.")

    client = GrabMapsClient(api_key=settings.grabmaps_api_key, base_url=settings.grabmaps_base_url)
    try:
        location = Coordinates(lat=lat, lng=lng) if lat is not None and lng is not None else None
        result = await client.search_places(keyword=keyword, country=country, location=location, limit=limit)
        return {"source": "live", "raw": result.raw}
    finally:
        await client.close()


@app.get("/api/grabmaps/nearby")
async def nearby_places(lat: float, lng: float, radius_km: float = 1, limit: int = 10):
    if not settings.grabmaps_api_key:
        raise HTTPException(status_code=503, detail="GRABMAPS_API_KEY is not configured.")

    client = GrabMapsClient(api_key=settings.grabmaps_api_key, base_url=settings.grabmaps_base_url)
    try:
        result = await client.nearby_search(
            location=Coordinates(lat=lat, lng=lng),
            radius_km=radius_km,
            limit=limit,
        )
        return {"source": "live", "raw": result.raw}
    finally:
        await client.close()


@app.get("/api/geocode/reverse")
async def reverse_geocode(lat: float, lng: float):
    if not settings.grabmaps_api_key:
        return {"source": "fallback", "label": "Demo neighbourhood"}

    client = GrabMapsClient(api_key=settings.grabmaps_api_key, base_url=settings.grabmaps_base_url)
    try:
        result = await client.reverse_geocode(location=Coordinates(lat=lat, lng=lng))
        return {"source": "live", "raw": result.raw}
    finally:
        await client.close()


async def _live_legs(stops: list) -> list[RouteLeg] | None:
    client = GrabMapsClient(api_key=settings.grabmaps_api_key or "", base_url=settings.grabmaps_base_url)
    try:
        tasks = [
            client.get_directions(
                [source.coordinates, target.coordinates],
                profile=settings.grabmaps_profile,
            )
            for source, target in zip(stops, stops[1:])
        ]
        routes = await asyncio.gather(*tasks)
    except Exception as exc:
        logger.warning("GrabMaps directions request failed: %s", exc)
        return None
    finally:
        await client.close()

    legs: list[RouteLeg] = []
    for index, route in enumerate(routes):
        source = stops[index]
        target = stops[index + 1]
        legs.append(
            RouteLeg(
                fromStopId=source.id,
                toStopId=target.id,
                minutes=max(1, round(route.duration_seconds / 60)),
                distanceMeters=route.distance_meters,
                polyline=align_polyline_to_stops(source, target, route.geometry),
            )
        )
    return legs


async def _search_live_place(name: str, location: Coordinates, country: str) -> dict[str, Any] | None:
    client = GrabMapsClient(api_key=settings.grabmaps_api_key or "", base_url=settings.grabmaps_base_url)
    try:
        result = await client.search_places(keyword=name, country=country, location=location, limit=1)
    except Exception as exc:
        logger.warning("GrabMaps place search failed: %s", exc)
        return None
    finally:
        await client.close()

    places = result.raw.get("places") or result.raw.get("results") or result.raw.get("data") or []
    if not places:
        return None
    first = places[0]
    return {
        "address": first.get("address") or first.get("formattedAddress") or first.get("description"),
        "rating": first.get("rating") or 4.4,
    }
