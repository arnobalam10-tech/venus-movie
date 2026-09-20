import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminUser } from "@/lib/admin";

export async function updateSession(request: NextRequest) {
  // Threaded through as a request header so Server Components (the root
  // layout, specifically) can read the current pathname via next/headers
  // without restructuring the route tree into groups — used to hide the
  // normal site chrome (Header) on /tv-embed pages.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname.startsWith("/login");
  const isApiRoute = pathname.startsWith("/api");

  // The TV device itself never has a Supabase session — it only ever
  // proves itself with its own device_token, checked inside the route
  // handlers below. /tv-embed similarly authenticates via a signed
  // view token in the query string, not a session. Both are public at
  // the proxy level by design.
  const isPublicRoute =
    isLoginRoute ||
    pathname.startsWith("/tv-embed") ||
    pathname === "/api/tv/register" ||
    pathname === "/api/tv/poll";

  if (!user) {
    if (isPublicRoute) {
      return supabaseResponse;
    }
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/login")) {
    const admin = await isAdminUser(user.id);
    const url = request.nextUrl.clone();
    url.pathname = admin ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
