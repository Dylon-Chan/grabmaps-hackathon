import { NextRequest, NextResponse } from "next/server";
import { quests } from "@/lib/quests";
import type { CityId } from "@/lib/types";

export function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") as CityId | null;
  const filtered = city ? quests.filter((quest) => quest.cityId === city) : quests;
  return NextResponse.json({ quests: filtered });
}

