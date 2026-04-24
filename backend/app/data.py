from __future__ import annotations

from app.models import City, Coordinates, MapPosition, Quest, QuestStop

grabmaps_country_codes = {
    "singapore": "SGP",
    "bangkok": "THA",
}


def stop(
    id: str,
    place_id: str,
    name: str,
    lat: float,
    lng: float,
    visit_minutes: int,
    walk_minutes_to_next: int | None,
    x: float,
    y: float,
    lore: str,
    bonus_lore: str,
    prompt: str,
    demo_photo_name: str,
) -> QuestStop:
    return QuestStop(
        id=id,
        placeId=place_id,
        name=name,
        coordinates=Coordinates(lat=lat, lng=lng),
        visitMinutes=visit_minutes,
        walkMinutesToNext=walk_minutes_to_next,
        lore=lore,
        bonusLore=bonus_lore,
        prompt=prompt,
        demoPhotoName=demo_photo_name,
        mapPosition=MapPosition(x=x, y=y),
    )


def simple_quest(
    id: str,
    city_id: str,
    quest_type: str,
    emoji: str,
    title: str,
    summary: str,
    color: str,
    names: list[tuple[str, float, float]],
) -> Quest:
    stops = [
        stop(
            id=f"{id}-stop-{index + 1}",
            place_id=f"grab:{city_id}:{id}:{index + 1}",
            name=name,
            lat=lat,
            lng=lng,
            visit_minutes=10 + (index % 2) * 3,
            walk_minutes_to_next=None if index == len(names) - 1 else 8 + (index % 3) * 2,
            x=20 + index * 11,
            y=35 + ((index * 9) % 32),
            lore=f"{name} reveals a small local detail that most maps flatten into a pin.",
            bonus_lore=(
                f"{name} rewards slower looking: signage, shade, and the way people move "
                "through the place tell the deeper story."
            ),
            prompt="Capture the place with one human detail and one environmental clue.",
            demo_photo_name=f"{id}-{index + 1}.jpg",
        )
        for index, (name, lat, lng) in enumerate(names)
    ]
    return Quest(
        id=id,
        cityId=city_id,
        type=quest_type,
        title=title,
        emoji=emoji,
        summary=summary,
        zoneLabel=f"{title.split(' ')[0]} zone",
        color=color,
        stops=stops,
    )


cities: list[City] = [
    City(
        id="singapore",
        name="Singapore",
        country="Singapore",
        neighbourhood="Chinatown",
        center=Coordinates(lat=1.2803, lng=103.8448),
        zoom=15,
    ),
    City(
        id="bangkok",
        name="Bangkok",
        country="Thailand",
        neighbourhood="Bang Rak",
        center=Coordinates(lat=13.7246, lng=100.5134),
        zoom=14,
    ),
]

quests: list[Quest] = [
    Quest(
        id="sg-hidden-hawker-gems",
        cityId="singapore",
        type="hawker",
        title="Hidden Hawker Gems",
        emoji="🍜",
        summary="Old-school stalls, queue lore, and the plates locals plan around.",
        zoneLabel="Chinatown food orbit",
        color="#d94b2b",
        stops=[
            stop(
                "sg-maxwell",
                "grab:sg:maxwell",
                "Maxwell Food Centre",
                1.2804,
                103.8449,
                12,
                10,
                20,
                55,
                "A lunchtime institution where smoke, steel counters, and patient queues turn everyday meals into civic ritual.",
                "Maxwell grew from a wet market into one of Singapore's most photographed hawker centres, but locals still judge it by rhythm: queue speed, wok timing, and who gets the last plate.",
                "Capture the stall life without blocking the queue.",
                "maxwell-demo.jpg",
            ),
            stop(
                "sg-tong-ah",
                "grab:sg:tong-ah",
                "Tong Ah Eating House",
                1.2791,
                103.8428,
                12,
                11,
                33,
                45,
                "Kaya toast, kopi, and triangular shophouse geometry make this corner feel like a morning postcard.",
                "Its sharp shophouse profile survived waves of redevelopment, becoming a shorthand for old Chinatown breakfasts.",
                "Frame the facade with a cup or breakfast detail.",
                "tong-ah-demo.jpg",
            ),
            stop(
                "sg-chinatown-complex",
                "grab:sg:chinatown-complex",
                "Chinatown Complex Market",
                1.2823,
                103.8439,
                12,
                9,
                47,
                39,
                "A maze of market stalls and hawker legends where the best route is often guided by steam.",
                "The complex is one of the largest hawker centres in Singapore, compressing groceries, food, craft, and neighbourhood gossip into one vertical town square.",
                "Show the human scale of the market.",
                "chinatown-complex-demo.jpg",
            ),
            stop(
                "sg-peoples-park",
                "grab:sg:peoples-park",
                "People's Park Food Centre",
                1.2851,
                103.8421,
                12,
                10,
                58,
                53,
                "Brutalist colour, herbal aromas, and quick lunches give this stop a distinctly local pulse.",
                "People's Park helped define mixed-use urban life in post-independence Singapore: shop, eat, meet, repeat.",
                "Use the building colour as context.",
                "peoples-park-demo.jpg",
            ),
            stop(
                "sg-amoy",
                "grab:sg:amoy",
                "Amoy Street Food Centre",
                1.2794,
                103.8469,
                12,
                8,
                68,
                62,
                "Office workers, heritage walls, and serious lunch strategy meet behind Telok Ayer.",
                "Amoy sits between temples, offices, and conservation streets, making it a delicious shortcut through Singapore's layers.",
                "Catch the transition from street to stall.",
                "amoy-demo.jpg",
            ),
            stop(
                "sg-lau-pa-sat",
                "grab:sg:lau-pa-sat",
                "Lau Pa Sat Satay Street",
                1.2807,
                103.8504,
                12,
                None,
                77,
                71,
                "Victorian ironwork by day, satay smoke by night: a finale with theatrical appetite.",
                "The market's cast-iron structure was shipped from Glasgow and reassembled as one of the city's most recognizable food halls.",
                "Frame the skewers with the old ironwork.",
                "lau-pa-sat-demo.jpg",
            ),
        ],
    ),
    simple_quest(
        "sg-heritage-shophouse-walk",
        "singapore",
        "heritage",
        "🏛️",
        "Heritage Shophouse Walk",
        "Peranakan colour, clan halls, and layered street history.",
        "#b85c38",
        [
            ("Buddha Tooth Relic Temple", 1.2815, 103.8442),
            ("Sago Street", 1.2811, 103.8431),
            ("Ann Siang Hill", 1.2805, 103.8455),
            ("Thian Hock Keng", 1.2813, 103.8474),
            ("Telok Ayer Street", 1.2819, 103.8486),
            ("Emerald Hill Facades", 1.3014, 103.8394),
        ],
    ),
    simple_quest(
        "sg-neighbourhood-drift",
        "singapore",
        "neighbourhood",
        "🌿",
        "Local Neighbourhood Drift",
        "Wet markets, daily errands, and the poetry of routine.",
        "#4d8a6f",
        [
            ("Tiong Bahru Market", 1.2852, 103.8327),
            ("Tiong Bahru Air Raid Shelter", 1.2846, 103.8337),
            ("Seng Poh Garden", 1.2849, 103.8316),
            ("Kim Pong Road", 1.2837, 103.8312),
            ("BooksActually Corner", 1.2828, 103.8309),
            ("Outram Park Edge", 1.2807, 103.8396),
        ],
    ),
    simple_quest(
        "sg-natural-scene-trail",
        "singapore",
        "nature",
        "🌳",
        "Natural Scene Trail",
        "Green pauses and waterfront views just beyond the busy grid.",
        "#2f8f6b",
        [
            ("Fort Canning Green", 1.2944, 103.8465),
            ("Armenian Street Trees", 1.294, 103.8492),
            ("Singapore River Steps", 1.2902, 103.8494),
            ("Esplanade Waterfront", 1.2897, 103.8557),
            ("Marina Promenade", 1.2858, 103.8589),
            ("Gardens Bay Edge", 1.2816, 103.8636),
        ],
    ),
    simple_quest(
        "bkk-hidden-hawker-gems",
        "bangkok",
        "hawker",
        "🍜",
        "Hidden Hawker Gems",
        "Street-side noodles, charcoal grills, and market snacks.",
        "#d94b2b",
        [
            ("Charoen Krung Noodle Stall", 13.7217, 100.5142),
            ("Bang Rak Market Bites", 13.7227, 100.5161),
            ("Saphan Taksin Snacks", 13.7188, 100.5144),
            ("Talat Noi Dessert Cart", 13.7322, 100.5125),
            ("Yaowarat Side Lane", 13.7401, 100.5101),
            ("Odeon Circle Supper", 13.7377, 100.5138),
        ],
    ),
    simple_quest(
        "bkk-heritage-shophouse-walk",
        "bangkok",
        "heritage",
        "🏛️",
        "Heritage Shophouse Walk",
        "River trade, old warehouses, and temple-side facades.",
        "#b85c38",
        [
            ("Holy Rosary Church", 13.7302, 100.5137),
            ("Talat Noi Murals", 13.7332, 100.5121),
            ("River City Bangkok", 13.729, 100.5132),
            ("Assumption Cathedral", 13.7232, 100.5146),
            ("Old Customs House", 13.7199, 100.5139),
            ("Warehouse 30", 13.7285, 100.5154),
        ],
    ),
    simple_quest(
        "bkk-neighbourhood-drift",
        "bangkok",
        "neighbourhood",
        "🌿",
        "Local Neighbourhood Drift",
        "Ferries, flower sellers, alleys, and everyday errands.",
        "#4d8a6f",
        [
            ("Si Phraya Pier", 13.7297, 100.512),
            ("Captain Bush Lane", 13.7243, 100.5151),
            ("Bang Rak Bazaar", 13.7219, 100.516),
            ("Wat Suan Phlu", 13.7222, 100.5152),
            ("Soi Charoen Krung 32", 13.7289, 100.5167),
            ("Postal Heritage Corner", 13.7293, 100.5145),
        ],
    ),
    simple_quest(
        "bkk-natural-scene-trail",
        "bangkok",
        "nature",
        "🌳",
        "Natural Scene Trail",
        "River breezes, pocket parks, and shade between busy streets.",
        "#2f8f6b",
        [
            ("Chao Phraya Riverside", 13.7247, 100.5125),
            ("Saranrom Pocket Garden", 13.7515, 100.4952),
            ("Santichaiprakarn Park", 13.7637, 100.4931),
            ("Lumphini Lake Edge", 13.7308, 100.5418),
            ("Benjakitti Forest Path", 13.7256, 100.5603),
            ("Bang Krachao Viewpoint", 13.6818, 100.5722),
        ],
    ),
]


def get_city(city_id: str) -> City:
    for city in cities:
        if city.id == city_id:
            return city
    raise KeyError(f"Unknown city: {city_id}")


def get_quest(city_id: str, quest_id: str) -> Quest:
    for quest in quests:
        if quest.city_id == city_id and quest.id == quest_id:
            return quest
    raise KeyError(f"Unknown quest: {quest_id}")


def get_stop(stop_id: str) -> QuestStop:
    for quest in quests:
        for quest_stop in quest.stops:
            if quest_stop.id == stop_id:
                return quest_stop
    raise KeyError(f"Unknown stop: {stop_id}")


def get_stop_by_place_id(place_id: str) -> QuestStop | None:
    for quest in quests:
        for quest_stop in quest.stops:
            if quest_stop.place_id == place_id:
                return quest_stop
    return None


def get_country_code_for_place_id(place_id: str) -> str:
    for quest in quests:
        for quest_stop in quest.stops:
            if quest_stop.place_id == place_id:
                return grabmaps_country_codes[quest.city_id]
    raise KeyError(f"Unknown place id: {place_id}")
