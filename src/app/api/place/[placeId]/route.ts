import { NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/place-details";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ placeId: string }>;
  }
) {
  const params = await context.params;
  const details = await getPlaceDetails(decodeURIComponent(params.placeId));
  return NextResponse.json(details);
}
