from __future__ import annotations

import copy
from typing import Any

LEGACY_VECTOR_TILE_PREFIX = "https://maps.grab.com/maps/tiles/v2/vector/"
API_VECTOR_TILE_PREFIX = "https://maps.grab.com/api/maps/tiles/v2/vector/"


def browser_safe_map_style(style: dict[str, Any]) -> dict[str, Any]:
    rewritten = copy.deepcopy(style)
    for source in rewritten.get("sources", {}).values():
        if not isinstance(source, dict):
            continue
        tiles = source.get("tiles")
        if not isinstance(tiles, list):
            continue
        source["tiles"] = [_browser_safe_tile_url(tile) for tile in tiles]
    return rewritten


def _browser_safe_tile_url(tile: Any) -> Any:
    if isinstance(tile, str) and tile.startswith(LEGACY_VECTOR_TILE_PREFIX):
        return f"{API_VECTOR_TILE_PREFIX}{tile.removeprefix(LEGACY_VECTOR_TILE_PREFIX)}"
    return tile
