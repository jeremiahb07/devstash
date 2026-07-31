import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

/**
 * A second, adapter-free Auth.js instance. Importing `@/auth` here would pull
 * the Prisma client and the Neon driver into the proxy bundle, which runs
 * ahead of every matched request; the JWT session strategy means the cookie is
 * all we need to tell whether someone is signed in.
 */
const { auth } = NextAuth(authConfig);

/** The auth pages, which someone already signed in has no use for. */
const AUTH_ROUTES = ["/sign-in", "/register"];

/** Where a signed-in user is sent instead of those pages. */
const SIGNED_IN_HOME = "/dashboard";

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const signedIn = Boolean(req.auth);

  if (AUTH_ROUTES.includes(pathname)) {
    // Only navigations. A redirect preserves the request method, so bouncing a
    // POST would send a form submission to /dashboard, which cannot answer it —
    // reachable by submitting a stale sign-in form in a second tab after
    // signing in in the first. Letting it through costs nothing: the action
    // redirects to the dashboard on its own.
    if (signedIn && req.method === "GET") {
      return NextResponse.redirect(new URL(SIGNED_IN_HOME, req.nextUrl.origin));
    }

    return;
  }

  if (signedIn) return;

  // The custom sign-in page. `callbackUrl` is what sends the user back to the
  // page they asked for once they are signed in.
  const signInUrl = new URL("/sign-in", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

  return NextResponse.redirect(signInUrl);
});

export const config = {
  // Literals, not `...AUTH_ROUTES`: matcher values are read by static analysis
  // at build time and "dynamic values such as variables will be ignored", which
  // would silently drop the guard rather than fail. Keep both lists in step.
  matcher: ["/dashboard/:path*", "/sign-in", "/register"],
};
