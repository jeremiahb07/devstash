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

export const proxy = auth((req) => {
  if (req.auth) return;

  // Auth.js's built-in sign-in page. `callbackUrl` is what sends the user back
  // to the page they asked for once GitHub redirects them home.
  const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
  signInUrl.searchParams.set(
    "callbackUrl",
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
  );

  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
