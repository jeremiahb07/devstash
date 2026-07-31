import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

/**
 * The edge-compatible half of the Auth.js config.
 *
 * This file must stay free of anything that touches the database — the proxy
 * imports it to read the session cookie, and the Prisma client (with its Neon
 * driver adapter) can't run in that context. The adapter and the session
 * strategy live in `src/auth.ts`, which is what the rest of the app imports.
 *
 * Credentials are read from `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`, which
 * Auth.js picks up from the environment automatically.
 */
export default {
  providers: [GitHub],
} satisfies NextAuthConfig;
