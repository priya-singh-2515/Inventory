import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/** Pages reachable without a session. Everything else is gated. */
const PUBLIC_PAGES = ["/login", "/signup"];

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Full session validation, not just a cookie-presence check — a forged
  // cookie must not be enough to reach the API.
  const session = await auth.api.getSession({ headers: request.headers });
  const isApi = pathname.startsWith("/api");

  if (!session) {
    // API callers get a status code, not an HTML redirect.
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isPublicPage(pathname)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in — keep them out of the login/signup screens.
  if (isPublicPage(pathname)) {
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
