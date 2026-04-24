from pathlib import Path

import httpx
import pytest

from app.grabmaps_client import GrabMapsClient
from app.models import Coordinates


@pytest.mark.asyncio
async def test_get_map_style_uses_bearer_auth_and_style_path():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert request.url.path == "/api/style.json"
        assert request.headers["authorization"] == "Bearer test-key"
        return httpx.Response(200, json={"version": 8, "sources": {}, "layers": []})

    client = GrabMapsClient(
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://maps.grab.com"),
    )

    style = await client.get_map_style()

    assert style["version"] == 8


@pytest.mark.asyncio
async def test_get_directions_uses_gateway_direction_endpoint_with_lng_lat_coordinates():
    seen_query: dict[str, list[str]] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert request.url.path == "/api/v1/maps/eta/v1/direction"
        assert request.headers["authorization"] == "Bearer test-key"
        seen_query.update(dict(request.url.params.multi_items()))
        coordinates = [value for key, value in request.url.params.multi_items() if key == "coordinates"]
        assert coordinates == ["103.8449,1.2804", "103.8428,1.2791"]
        assert request.url.params["profile"] == "walking"
        assert request.url.params["overview"] == "full"
        return httpx.Response(
            200,
            json={
                "routes": [
                    {
                        "distance": 850,
                        "duration": 660,
                        "geometry": {
                            "coordinates": [[103.8449, 1.2804], [103.8428, 1.2791]]
                        },
                        "legs": [{"distance": 850, "duration": 660}],
                    }
                ]
            },
        )

    client = GrabMapsClient(
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://maps.grab.com"),
    )

    route = await client.get_directions(
        [Coordinates(lat=1.2804, lng=103.8449), Coordinates(lat=1.2791, lng=103.8428)],
        profile="walking",
    )

    assert seen_query["profile"] == "walking"
    assert route.distance_meters == 850
    assert route.duration_seconds == 660
    assert route.geometry[0] == Coordinates(lat=1.2804, lng=103.8449)


@pytest.mark.asyncio
async def test_search_places_uses_keyword_country_location_and_limit():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/v1/maps/poi/v1/search"
        assert request.headers["authorization"] == "Bearer test-key"
        assert request.url.params["keyword"] == "Maxwell Food Centre"
        assert request.url.params["country"] == "SGP"
        assert request.url.params["location"] == "1.2803,103.8448"
        assert request.url.params["limit"] == "3"
        return httpx.Response(
            200,
            json={
                "places": [
                    {
                        "placeID": "live-maxwell",
                        "name": "Maxwell Food Centre",
                        "location": {"latitude": 1.2804, "longitude": 103.8449},
                    }
                ]
            },
        )

    client = GrabMapsClient(
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://maps.grab.com"),
    )

    results = await client.search_places(
        keyword="Maxwell Food Centre",
        country="SGP",
        location=Coordinates(lat=1.2803, lng=103.8448),
        limit=3,
    )

    assert results.raw["places"][0]["placeID"] == "live-maxwell"


def test_grabmaps_skill_fixture_does_not_contain_real_user_secret():
    text = Path(".env.example").read_text()

    assert "your_bm_key_here" in text
