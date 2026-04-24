from fastapi.testclient import TestClient

from app import data as quest_data
from app.main import app


client = TestClient(app)


def test_cities_endpoint_returns_demo_cities():
    response = client.get("/api/cities")

    assert response.status_code == 200
    assert [city["id"] for city in response.json()["cities"]] == ["singapore", "bangkok"]


def test_trim_endpoint_returns_four_singapore_hawker_stops_for_ninety_minutes():
    response = client.post(
        "/api/quests/trim",
        json={"cityId": "singapore", "questId": "sg-hidden-hawker-gems", "minutes": 90},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["quest"]["id"] == "sg-hidden-hawker-gems"
    assert len(data["stops"]) == 4
    assert data["skippedStops"] == 2


def test_routes_endpoint_returns_legs_for_stop_sequence():
    trim = client.post(
        "/api/quests/trim",
        json={"cityId": "singapore", "questId": "sg-hidden-hawker-gems", "minutes": 90},
    ).json()

    response = client.post("/api/routes", json={"stops": trim["stops"]})

    assert response.status_code == 200
    data = response.json()
    assert len(data["legs"]) == 3
    assert data["totalMinutes"] == 78


def test_photo_verify_then_score_awards_gold_for_maxwell_demo():
    verification = client.post(
        "/api/photo/verify",
        json={"stopId": "sg-maxwell", "imageName": "maxwell-demo.jpg"},
    )

    assert verification.status_code == 200
    assert verification.json()["passed"] is True

    score = client.post(
        "/api/photo/score",
        json={"stopId": "sg-maxwell", "verification": verification.json()},
    )

    assert score.status_code == 200
    assert score.json()["score"] == 85
    assert score.json()["tier"] == "Gold"


def test_place_country_code_matches_demo_city():
    country_for_place_id = getattr(quest_data, "get_country_code_for_place_id", None)

    assert country_for_place_id is not None
    assert country_for_place_id("grab:sg:maxwell") == "SGP"
    assert country_for_place_id("grab:bangkok:bkk-hidden-hawker-gems:1") == "THA"
