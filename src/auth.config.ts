import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
import type { CredentialInput } from "next-auth/providers";

/**
 * The fields the Credentials provider renders on the built-in sign-in page and
 * hands to `authorize`. Shared with `src/auth.ts` so the form and the validation
 * can't drift apart.
 */
export const credentialFields = {
  email: { label: "Email", type: "email", placeholder: "you@example.com" },
  password: { label: "Password", type: "password" },
} satisfies Record<string, CredentialInput>;

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
  providers: [
    GitHub,
    // A placeholder so the proxy's provider list matches the real one. Checking
    // a password needs Prisma and bcrypt, neither of which belongs in this
    // file, so `src/auth.ts` replaces this entry with the real implementation —
    // and nothing can sign in through the config as written here.
    Credentials({ credentials: credentialFields, authorize: () => null }),
  ],
} satisfies NextAuthConfig;
