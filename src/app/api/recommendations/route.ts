import { NextResponse } from "next/server";
import { fetchRecommendations } from "@/lib/discogs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seed = searchParams.get("seed") ?? undefined;

  const results = await fetchRecommendations(seed);

  return NextResponse.json({ results });
}



