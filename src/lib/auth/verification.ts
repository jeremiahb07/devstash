import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

/** How long a verification link stays valid. */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum gap between two verification emails to the same address. */
export const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * `VerificationToken` is the Auth.js adapter's own table, shared with the Email
 * (magic link) provider this app does not use. Namespacing the identifier keeps
 * our rows apart from the adapter's if such a provider is ever added — it looks
 * tokens up by `identifier_token` and would otherwise walk straight into ours.
 */
const IDENTIFIER_PREFIX = "email-verification:";

const identifierFor = (email: string) => `${IDENTIFIER_PREFIX}${email}`;

/**
 * Only a hash is stored, so a leaked database does not hand over working links.
 * Unsalted SHA-256 is the right tool here rather than bcrypt: the token is 256
 * bits of randomness, so there is nothing to brute-force or rainbow-table, and
 * lookup has to stay a single indexed query on an exact value.
 */
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export interface IssuedToken {
  /** The raw token — only ever leaves in the email link, never stored. */
  token: string;
  expires: Date;
}

/**
 * Issues a fresh link for an address, retiring any previous one so there is
 * only ever a single live link per account.
 */
export async function issueVerificationToken(
  email: string,
): Promise<IssuedToken> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier: identifierFor(email) },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: identifierFor(email),
      token: hashToken(token),
      expires,
    },
  });

  return { token, expires };
}

export type VerificationResult =
  | { status: "verified"; email: string }
  | { status: "already-verified"; email: string }
  | { status: "expired"; email: string }
  | { status: "invalid" };

/**
 * Redeems a token and stamps `emailVerified`. The token is deleted on every
 * terminal outcome, so a link genuinely works once.
 *
 * `invalid` therefore covers both "never existed" and "already used" — they are
 * indistinguishable after the fact, which is why the page wording for it must
 * not accuse the visitor of anything. Mail scanners routinely fetch links
 * before a human ever clicks, so a used token is a normal thing to see.
 */
export async function consumeVerificationToken(
  token: string,
): Promise<VerificationResult> {
  const hashed = hashToken(token);

  const row = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  // The prefix check keeps an adapter-issued magic-link token from being
  // redeemed here as if it were ours.
  if (!row || !row.identifier.startsWith(IDENTIFIER_PREFIX)) {
    return { status: "invalid" };
  }

  const email = row.identifier.slice(IDENTIFIER_PREFIX.length);

  await prisma.verificationToken.delete({ where: { token: hashed } });

  if (row.expires <= new Date()) {
    return { status: "expired", email };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  // The account was deleted between the email going out and the click.
  if (!user) return { status: "invalid" };

  if (user.emailVerified) return { status: "already-verified", email };

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  return { status: "verified", email };
}

/**
 * Milliseconds left before another email may be sent to this address, or 0.
 *
 * The issue time is derived from `expires` rather than stored: the TTL is a
 * constant, and reusing the adapter's table means there is no spare column to
 * put a `createdAt` in.
 */
export async function verificationCooldownRemaining(email: string) {
  const row = await prisma.verificationToken.findFirst({
    where: { identifier: identifierFor(email) },
    orderBy: { expires: "desc" },
    select: { expires: true },
  });

  if (!row) return 0;

  const issuedAt = row.expires.getTime() - TOKEN_TTL_MS;

  return Math.max(0, issuedAt + RESEND_COOLDOWN_MS - Date.now());
}

/**
 * The absolute link that goes in the email. Auth.js already reads `AUTH_URL`,
 * so it is reused rather than adding a second near-identical variable.
 *
 * It targets the route handler, not the page: redeeming a token is a write, and
 * a page that mutates while rendering would be at the mercy of however many
 * times the framework chooses to render it. The handler consumes once and
 * redirects to `/verify-email?status=…`, which renders and writes nothing.
 */
export function buildVerificationUrl(token: string) {
  const base =
    process.env.AUTH_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const url = new URL("/api/auth/verify-email", base);

  url.searchParams.set("token", token);

  return url.toString();
}
