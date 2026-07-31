import type { DefaultSession } from "next-auth";

/**
 * Auth.js's default `Session["user"]` carries only name/email/image. The
 * session callback in `src/auth.ts` copies the user's database id across from
 * `token.sub`, so declare it here to make it visible to callers.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
