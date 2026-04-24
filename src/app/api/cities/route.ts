import { NextResponse } from "next/server";
import { cities } from "@/lib/quests";

export function GET() {
  return NextResponse.json({ cities });
}

