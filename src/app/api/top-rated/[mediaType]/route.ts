import { NextResponse } from "next/server";
import { getTopRated } from "@/lib/tmdb";
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
    const data = await getTopRated(mediaType, page);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load top rated" }, { status: 502 });
  }
}
