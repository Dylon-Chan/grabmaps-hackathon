from __future__ import annotations

import math

from app.models import Coordinates, QuestStop, RouteLeg

WALK_METERS_PER_MINUTE = 78


def get_walking_minutes(source: QuestStop, target: QuestStop) -> int:
    if source.walk_minutes_to_next:
        return source.walk_minutes_to_next
    return max(4, round(distance_meters(source.coordinates, target.coordinates) / WALK_METERS_PER_MINUTE))


def build_route_legs(stops: list[QuestStop]) -> list[RouteLeg]:
    legs: list[RouteLeg] = []
    for index, source in enumerate(stops[:-1]):
        target = stops[index + 1]
        minutes = get_walking_minutes(source, target)
        legs.append(
            RouteLeg(
                fromStopId=source.id,
                toStopId=target.id,
                minutes=minutes,
                distanceMeters=round(minutes * WALK_METERS_PER_MINUTE),
                polyline=interpolate_polyline(source.coordinates, target.coordinates),
            )
        )
    return legs


def route_totals(stops: list[QuestStop]) -> tuple[int, int, int]:
    stop_minutes = sum(stop.visit_minutes for stop in stops)
    walk_minutes = sum(leg.minutes for leg in build_route_legs(stops))
    return stop_minutes, walk_minutes, stop_minutes + walk_minutes


def distance_meters(source: Coordinates, target: Coordinates) -> float:
    radius = 6_371_000
    lat1 = math.radians(source.lat)
    lat2 = math.radians(target.lat)
    delta_lat = math.radians(target.lat - source.lat)
    delta_lng = math.radians(target.lng - source.lng)
    a = (
        math.sin(delta_lat / 2) * math.sin(delta_lat / 2)
        + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lng / 2) * math.sin(delta_lng / 2)
    )
    return 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def interpolate_polyline(source: Coordinates, target: Coordinates) -> list[Coordinates]:
    midpoint = Coordinates(
        lat=(source.lat + target.lat) / 2 + 0.0005,
        lng=(source.lng + target.lng) / 2 - 0.0004,
    )
    return [source, midpoint, target]

