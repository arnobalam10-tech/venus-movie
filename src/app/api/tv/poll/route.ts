import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createViewToken } from "@/lib/tvToken";
import type { MediaType } from "@/lib/tmdb";

export async function GET(request: Request) {
  const deviceToken = new URL(request.url).searchParams.get("device_token");
  if (!deviceToken) {
    return NextResponse.json({ error: "Missing device_token" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "TV pairing isn't configured yet." }, { status: 503 });
  }

  const { data: device, error } = await admin
    .from("tv_devices")
    .select(
      "paired_at, cast_media_type, cast_tmdb_id, cast_season, cast_episode, cast_issued_at",
    )
    .eq("device_token", deviceToken)
    .maybeSingle();

  if (error || !device) {
    return NextResponse.json({ error: "Unknown device" }, { status: 404 });
  }

  if (!device.paired_at) {
    return NextResponse.json({ paired: false });
  }

  if (!device.cast_media_type || device.cast_tmdb_id == null || !device.cast_issued_at) {
    return NextResponse.json({ paired: true, cast: null });
  }

  const mediaType = device.cast_media_type as MediaType;
  const viewToken = createViewToken({
    deviceToken,
    mediaType,
    tmdbId: device.cast_tmdb_id,
    season: device.cast_season ?? undefined,
    episode: device.cast_episode ?? undefined,
  });

  return NextResponse.json({
    paired: true,
    cast: {
      mediaType,
      tmdbId: device.cast_tmdb_id,
      season: device.cast_season,
      episode: device.cast_episode,
      issuedAt: device.cast_issued_at,
      viewToken,
    },
  });
}
