import { NextResponse } from "next/server";
import { getNewReleases } from "@/lib/tmdb";
import { validateMediaType } from "@/lib/validateMediaType";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaType: string }> },
) {
  const { mediaType } = await params;
  if (!validateMediaType(mediaType)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  const page = Number(new URL(request.url).searchParams.get("page") ?? "1");

  try {
    const data = await getNewReleases(mediaType, page);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load new releases" }, { status: 502 });
  }
}
