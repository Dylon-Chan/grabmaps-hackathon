import { NextRequest, NextResponse } from "next/server";
import { trimQuestToBudget } from "@/lib/route-trimming";
import type { CityId } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { cityId: CityId; questId: string; minutes: number };
    const result = trimQuestToBudget(body.cityId, body.questId, body.minutes);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to trim quest" },
      { status: 400 }
    );
  }
}

