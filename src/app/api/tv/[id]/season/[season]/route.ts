import { NextResponse } from "next/server";
import { getSeason } from "@/lib/tmdb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; season: string }> },
) {
  const { id, season } = await params;
  const seasonNumber = Number(season);

  if (!Number.isFinite(seasonNumber)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  try {
    const data = await getSeason(id, seasonNumber);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load season" }, { status: 502 });
  }
}
