import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── CORS allowlist ──────────────────────────────────────────────────────────
//
// Same-origin requests don't need CORS headers in browsers, so by default we
// don't emit any. CORS only matters when another site's JavaScript hits our
// /api/* routes. The allowlist is configured via env vars so it can vary
// between dev/staging/prod without code changes.
//
//   ALLOWED_ORIGINS  comma-separated list of exact origins, e.g.
//                    "https://thewildflowervault.com,https://www.thewildflowervault.com"
//   NEXT_PUBLIC_SITE_URL  always implicitly allowed if set (it's our own site)
//
// Anything not on the list is rejected with no CORS headers (default browser
// behavior blocks it).

function getAllowedOrigins(): Set<string> {
  const set = new Set<string>();
  const env = process.env.ALLOWED_ORIGINS;
  if (env) {
    for (const o of env.split(",")) {
      const trimmed = o.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) set.add(process.env.NEXT_PUBLIC_SITE_URL.trim());
  // Always allow localhost during dev.
  if (process.env.NODE_ENV !== "production") {
    set.add("http://localhost:3000");
    set.add("http://127.0.0.1:3000");
  }
  return set;
}

function applyCorsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  if (!origin) return res;

  const allowed = getAllowedOrigins();
  if (!allowed.has(origin)) return res;

  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  res.headers.set("Access-Control-Max-Age", "600");
  return res;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ── Admin gate (defense-in-depth) ─────────────────────────────────────────
  //
  // The /admin layout already enforces ADMIN role at the React layer; this
  // middleware adds a second, lower-level check so an accidental missing
  // role-guard on a future admin page can never expose data. The JWT is
  // verified using the same NEXTAUTH_SECRET, so a forged/expired token will
  // fail here.
  if (path.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const signin = new URL("/auth/signin", req.url);
      signin.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(signin);
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
  }

  // ── Same protection for /api/admin/* ──────────────────────────────────────
  if (path.startsWith("/api/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── CORS for /api/* ───────────────────────────────────────────────────────
  if (path.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      const res = new NextResponse(null, { status: 204 });
      return applyCorsHeaders(req, res);
    }
    return applyCorsHeaders(req, NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  // Match admin pages, all API routes, and skip Next internals + static assets.
  matcher: ["/admin/:path*", "/api/:path*"],
};
