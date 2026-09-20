import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data } = await supabase
    .from("tv_devices")
    .select("paired_at")
    .eq("user_id", user.id)
    .not("paired_at", "is", null)
    .order("paired_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ paired: !!data, pairedAt: data?.paired_at ?? null });
}
