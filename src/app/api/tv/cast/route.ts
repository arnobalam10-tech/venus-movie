import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MediaType } from "@/lib/tmdb";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const mediaType: MediaType | undefined = body?.mediaType;
  const tmdbId = Number(body?.tmdbId);
  const season = body?.season != null ? Number(body.season) : undefined;
  const episode = body?.episode != null ? Number(body.episode) : undefined;

  if ((mediaType !== "movie" && mediaType !== "tv") || !Number.isFinite(tmdbId)) {
    return NextResponse.json({ error: "Invalid cast request" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "TV casting isn't configured yet." }, { status: 503 });
  }

  const { data: device, error: findError } = await admin
    .from("tv_devices")
    .select("id")
    .eq("user_id", user.id)
    .not("paired_at", "is", null)
    .order("paired_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError || !device) {
    return NextResponse.json({ error: "No TV connected." }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from("tv_devices")
    .update({
      cast_media_type: mediaType,
      cast_tmdb_id: tmdbId,
      cast_season: season ?? null,
      cast_episode: episode ?? null,
      cast_issued_at: new Date().toISOString(),
    })
    .eq("id", device.id);

  if (updateError) {
    return NextResponse.json({ error: "Couldn't cast right now." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
