import { NextResponse } from "next/server";
import { discoverByGenre } from "@/lib/tmdb";
import { validateMediaType } from "@/lib/validateMediaType";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaType: string }> },
) {
  const { mediaType } = await params;
  if (!validateMediaType(mediaType)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  const searchParams = new URL(request.url).searchParams;
  const genre = Number(searchParams.get("genre"));
  const page = Number(searchParams.get("page") ?? "1");

  if (!genre) {
    return NextResponse.json({ error: "Missing genre" }, { status: 400 });
  }

  try {
    const data = await discoverByGenre(mediaType, genre, page);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load discover results" }, { status: 502 });
  }
}
