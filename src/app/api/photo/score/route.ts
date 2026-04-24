import { NextRequest, NextResponse } from "next/server";
import { scorePhoto } from "@/lib/photo-scoring";
import type { VerificationResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { stopId: string; verification: VerificationResult };
    const result = await scorePhoto(body.stopId, body.verification);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to score photo" },
      { status: 400 }
    );
  }
}

