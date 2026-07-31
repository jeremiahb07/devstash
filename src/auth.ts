import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";

/**
 * The full Auth.js instance — import this everywhere except the proxy, which
 * needs the edge-safe `auth.config.ts` instead.
 *
 * The Prisma adapter still persists users and linked OAuth accounts, but
 * sessions are JWTs rather than rows in the `sessions` table: the split config
 * pattern requires `strategy: "jwt"` so the proxy can read the session without
 * a database round trip.
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      // The default JWT session exposes only name/email/image. `token.sub` is
      // the user's database id, so copy it across to back the `user.id` we
      // declare in `src/types/next-auth.d.ts`.
      if (token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
