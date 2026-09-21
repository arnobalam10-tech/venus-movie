import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code shown on your TV." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "TV pairing isn't configured yet." }, { status: 503 });
  }

  const { data: pending, error: findError } = await admin
    .from("tv_devices")
    .select("id, code_expires_at")
    .eq("pairing_code", code)
    .is("user_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError || !pending) {
    return NextResponse.json({ error: "That code wasn't found. Check your TV and try again." }, { status: 404 });
  }

  if (!pending.code_expires_at || new Date(pending.code_expires_at) < new Date()) {
    return NextResponse.json({ error: "That code has expired. Refresh the code on your TV." }, { status: 410 });
  }

  // Enforce one paired TV per account (v1 design assumption — see PRD §13.2 —
  // but never actually enforced here before). Without this, re-pairing a
  // second device leaves the first one orphaned: still showing "Connected"
  // on its screen, but /api/tv/cast always targets whichever device was
  // paired most recently, so the orphaned one silently never receives
  // anything cast to it again.
  await admin.from("tv_devices").delete().eq("user_id", user.id).neq("id", pending.id);

  const { error: updateError } = await admin
    .from("tv_devices")
    .update({ user_id: user.id, paired_at: new Date().toISOString(), pairing_code: null })
    .eq("id", pending.id);

  if (updateError) {
    return NextResponse.json({ error: "Couldn't pair right now. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
