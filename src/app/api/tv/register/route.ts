import { randomBytes, randomInt } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CODE_TTL_MS = 10 * 60 * 1000;

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST() {
  const deviceToken = randomBytes(24).toString("base64url");
  const pairingCode = generateCode();
  const codeExpiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("tv_devices").insert({
      device_token: deviceToken,
      pairing_code: pairingCode,
      code_expires_at: codeExpiresAt,
    });

    if (error) {
      return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "TV pairing isn't configured yet" }, { status: 503 });
  }

  return NextResponse.json({ deviceToken, code: pairingCode });
}
