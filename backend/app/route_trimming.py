from app.data import get_city, get_quest
from app.models import TrimmedQuest
from app.routing import route_totals


def trim_quest_to_budget(city_id: str, quest_id: str, minutes: int) -> TrimmedQuest:
    city = get_city(city_id)
    quest = get_quest(city_id, quest_id)
    budget = max(30, min(300, round(minutes)))
    selected = quest.stops[:2]

    for count in range(2, len(quest.stops) + 1):
        candidate = quest.stops[:count]
        _, _, total_minutes = route_totals(candidate)
        if total_minutes <= budget:
            selected = candidate

    stop_minutes, walk_minutes, total_minutes = route_totals(selected)
    return TrimmedQuest(
        city=city,
        quest=quest,
        stops=selected,
        totalMinutes=total_minutes,
        stopMinutes=stop_minutes,
        walkMinutes=walk_minutes,
        skippedStops=len(quest.stops) - len(selected),
        source="fallback",
    )

