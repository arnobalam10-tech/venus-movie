import { createHmac, timingSafeEqual } from "crypto";
import type { MediaType } from "@/lib/tmdb";

export interface CastPayload {
  deviceToken: string;
  mediaType: MediaType;
  tmdbId: number;
  season?: number;
  episode?: number;
  exp: number;
}

const TOKEN_TTL_MS = 10 * 60 * 1000;

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  const secret = process.env.TV_TOKEN_SECRET;
  if (!secret) throw new Error("TV_TOKEN_SECRET is not configured.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createViewToken(payload: Omit<CastPayload, "exp">): string {
  const full: CastPayload = { ...payload, exp: Date.now() + TOKEN_TTL_MS };
  const body = base64url(JSON.stringify(full));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifyViewToken(token: string): CastPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  let expectedSignature: string;
  try {
    expectedSignature = sign(body);
  } catch {
    return null;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as CastPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
