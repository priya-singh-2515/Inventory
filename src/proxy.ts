import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Sign-in screens: reachable without a session, and pointless with one — a
 * signed-in visitor is sent to the app instead.
 */
const AUTH_PAGES = ["/login", "/signup"];

/**
 * Open either way. An invitee must be able to read what they were offered
 * before signing in, AND an already-signed-in user must be able to accept
 * rather than being bounced to the dashboard. Accepting still requires a
 * session whose email matches the invite.
 */
const OPEN_ROUTES = ["/invite", "/api/invites"];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Full session validation, not just a cookie-presence check — a forged
  // cookie must not be enough to reach the API.
  // Invite links bypass the gate entirely, signed in or not.
  if (matches(pathname, OPEN_ROUTES)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const isApi = pathname.startsWith("/api");

  if (!session) {
    // API callers get a status code, not an HTML redirect.
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (matches(pathname, AUTH_PAGES)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in — keep them out of the login/signup screens.
  if (matches(pathname, AUTH_PAGES)) {
    return NextResponse.redirect(new URL("/inventory", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Better Auth's own endpoints (which must stay reachable
  // while signed out) and Next.js internals. Proxy always runs on the Node.js
  // runtime, so the MongoDB-backed session lookup above is safe here.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
