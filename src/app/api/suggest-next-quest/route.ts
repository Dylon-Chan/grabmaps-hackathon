import { NextRequest, NextResponse } from "next/server";
import { quests } from "@/lib/quests";
import type { CityId } from "@/lib/types";

export function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") as CityId | null;
  const completed = request.nextUrl.searchParams.get("completed");
  const candidate = quests.find((quest) => quest.cityId === city && quest.id !== completed);

  return NextResponse.json({
    quest: candidate ?? null,
    reason: candidate
      ? `${candidate.title} is the nearest unfinished route in this demo city.`
      : "All demo quests are complete.",
    source: "fallback"
  });
}

