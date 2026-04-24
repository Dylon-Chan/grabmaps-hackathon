import { NextRequest, NextResponse } from "next/server";
import { buildRouteLegs, routeTotals } from "@/lib/routing";
import type { QuestStop } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { stops: QuestStop[] };
    const legs = buildRouteLegs(body.stops);
    return NextResponse.json({
      legs,
      ...routeTotals(body.stops),
      source: "fallback"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to calculate route" },
      { status: 400 }
    );
  }
}

