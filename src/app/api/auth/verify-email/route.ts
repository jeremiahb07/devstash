import { NextResponse } from "next/server";

import { consumeVerificationToken } from "@/lib/auth/verification";

/**
 * `GET /api/auth/verify-email?token=…` — the target of the link in the email.
 *
 * Redeeming is a write, so it happens here rather than while a page renders,
 * then redirects to `/verify-email?status=…` which is pure presentation. The
 * token never reaches that page, so it cannot leak through a referrer header or
 * sit in browser history as a working credential.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  const result = token
    ? await consumeVerificationToken(token)
    : ({ status: "invalid" } as const);

  const destination = new URL("/verify-email", request.url);
  destination.searchParams.set("status", result.status);

  // 303 so the browser lands on the result with a GET and a refresh cannot
  // replay the redemption.
  return NextResponse.redirect(destination, 303);
}
