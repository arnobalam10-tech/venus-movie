import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// iOS before 12 can't run the site's JavaScript, so those devices get the
// standalone pairing page instead (see src/app/legacy-tv/route.ts).
const IOS_VERSION = /\b(?:iPad|iPhone|iPod)\b.*?\bOS (\d+)_/;

function isLegacyIos(userAgent: string) {
  const match = IOS_VERSION.exec(userAgent);
  return match !== null && Number(match[1]) < 12;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPassthrough =
    pathname.startsWith("/legacy-tv") ||
    pathname.startsWith("/tv-embed") ||
    pathname.startsWith("/api");

  if (
    request.method === "GET" &&
    !isPassthrough &&
    (request.headers.get("accept") ?? "").includes("text/html") &&
    isLegacyIos(request.headers.get("user-agent") ?? "")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/legacy-tv";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|apk|csv)$).*)",
  ],
};
