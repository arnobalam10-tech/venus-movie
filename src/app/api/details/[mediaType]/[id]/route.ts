import { NextResponse } from "next/server";
import { getDetails } from "@/lib/tmdb";
import { validateMediaType } from "@/lib/validateMediaType";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaType: string; id: string }> },
) {
  const { mediaType, id } = await params;
  if (!validateMediaType(mediaType)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  try {
    const data = await getDetails(mediaType, id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load details" }, { status: 502 });
  }
}
