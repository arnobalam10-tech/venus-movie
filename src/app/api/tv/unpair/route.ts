import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    await admin.from("tv_devices").delete().eq("user_id", user.id);
  } catch {
    return NextResponse.json({ error: "TV pairing isn't configured yet." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
