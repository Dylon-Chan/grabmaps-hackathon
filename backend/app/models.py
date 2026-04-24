from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


Source = Literal["live", "fallback"]


class Coordinates(ApiModel):
    lat: float
    lng: float


class MapPosition(ApiModel):
    x: float
    y: float


class City(ApiModel):
    id: str
    name: str
    country: str
    neighbourhood: str
    center: Coordinates
    zoom: int


class QuestStop(ApiModel):
    id: str
    place_id: str = Field(alias="placeId")
    name: str
    coordinates: Coordinates
    visit_minutes: int = Field(alias="visitMinutes")
    walk_minutes_to_next: int | None = Field(default=None, alias="walkMinutesToNext")
    lore: str
    bonus_lore: str = Field(alias="bonusLore")
    prompt: str
    demo_photo_name: str = Field(alias="demoPhotoName")
    map_position: MapPosition = Field(alias="mapPosition")


class Quest(ApiModel):
    id: str
    city_id: str = Field(alias="cityId")
    type: str
    title: str
    emoji: str
    summary: str
    zone_label: str = Field(alias="zoneLabel")
    color: str
    stops: list[QuestStop]


class RouteLeg(ApiModel):
    from_stop_id: str = Field(alias="fromStopId")
    to_stop_id: str = Field(alias="toStopId")
    minutes: int
    distance_meters: int = Field(alias="distanceMeters")
    polyline: list[Coordinates]


class TrimRequest(ApiModel):
    city_id: str = Field(alias="cityId")
    quest_id: str = Field(alias="questId")
    minutes: int


class TrimmedQuest(ApiModel):
    city: City
    quest: Quest
    stops: list[QuestStop]
    total_minutes: int = Field(alias="totalMinutes")
    stop_minutes: int = Field(alias="stopMinutes")
    walk_minutes: int = Field(alias="walkMinutes")
    skipped_stops: int = Field(alias="skippedStops")
    source: Source


class RouteRequest(ApiModel):
    stops: list[QuestStop]


class RouteResponse(ApiModel):
    legs: list[RouteLeg]
    total_minutes: int = Field(alias="totalMinutes")
    walk_minutes: int = Field(alias="walkMinutes")
    stop_minutes: int = Field(alias="stopMinutes")
    source: Source


class PlaceDetails(ApiModel):
    place_id: str = Field(alias="placeId")
    name: str
    open_now: bool = Field(alias="openNow")
    rating: float
    price_level: str = Field(alias="priceLevel")
    photo_label: str = Field(alias="photoLabel")
    address: str | None = None
    source: Source


class PhotoVerifyRequest(ApiModel):
    stop_id: str = Field(alias="stopId")
    image_name: str = Field(alias="imageName")


class VerificationResult(ApiModel):
    passed: bool
    confidence: float
    reason: str
    source: Source


class PhotoScoreRequest(ApiModel):
    stop_id: str = Field(alias="stopId")
    verification: VerificationResult


class PhotoScore(ApiModel):
    score: int
    tier: Literal["Gold", "Silver", "Bronze"]
    categories: dict[str, int]
    feedback: str
    unlocked_lore: str = Field(alias="unlockedLore")
    source: Source


class GrabMapsRoute(ApiModel):
    distance_meters: int = Field(alias="distanceMeters")
    duration_seconds: int = Field(alias="durationSeconds")
    geometry: list[Coordinates]
    raw: dict[str, Any]


class GrabMapsSearchResults(ApiModel):
    raw: dict[str, Any]

