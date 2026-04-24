import { NextRequest, NextResponse } from "next/server";
import { verifyPhoto } from "@/lib/photo-scoring";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { stopId: string; imageName: string };
    const result = await verifyPhoto(body.stopId, body.imageName);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify photo" },
      { status: 400 }
    );
  }
}

