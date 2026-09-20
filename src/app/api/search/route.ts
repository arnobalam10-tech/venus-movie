import { NextResponse } from "next/server";
import { searchMulti } from "@/lib/tmdb";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q")?.trim();
  const page = Number(searchParams.get("page") ?? "1");

  if (!query) {
    return NextResponse.json({ page: 0, results: [], total_pages: 0, total_results: 0 });
  }

  try {
    const data = await searchMulti(query, page);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}
