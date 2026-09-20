import { NextResponse } from "next/server";
import { getGenres } from "@/lib/tmdb";
import { validateMediaType } from "@/lib/validateMediaType";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaType: string }> },
) {
  const { mediaType } = await params;
  if (!validateMediaType(mediaType)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  try {
    const data = await getGenres(mediaType);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load genres" }, { status: 502 });
  }
}
