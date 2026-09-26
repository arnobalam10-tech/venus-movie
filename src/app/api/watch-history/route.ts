import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const mediaType = body?.mediaType;
  const tmdbId = body?.tmdbId;

  if ((mediaType !== "movie" && mediaType !== "tv") || typeof tmdbId !== "number") {
    return NextResponse.json({ error: "Invalid mediaType or tmdbId" }, { status: 400 });
  }

  const { error } = await supabase
    .from("watch_history")
    .delete()
    .eq("user_id", user.id)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId);

  if (error) {
    return NextResponse.json({ error: "Couldn't remove that." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
