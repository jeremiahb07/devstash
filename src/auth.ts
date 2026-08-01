import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";

import authConfig, { credentialFields } from "@/auth.config";
import { EmailNotVerifiedError } from "@/lib/auth/errors";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validations/auth";

/**
 * The real email/password check, replacing the `() => null` placeholder that
 * `src/auth.config.ts` declares for the proxy's benefit.
 *
 * Returning `null` (rather than throwing something descriptive) is deliberate:
 * Auth.js turns it into a generic `CredentialsSignin` error, so a caller can't
 * tell "no such account" apart from "wrong password".
 */
const credentialsProvider = Credentials({
  credentials: credentialFields,
  async authorize(credentials) {
    const parsed = credentialsSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        password: true,
        emailVerified: true,
      },
    });

    // Either no such account, or one created through GitHub that never set a
    // password — there is nothing to compare against in both cases.
    if (!user?.password) return null;

    if (!(await compare(password, user.password))) return null;

    // Deliberately *after* the password check: telling an anonymous caller that
    // an address exists but is unverified would hand them an account
    // enumeration oracle. Only someone who already knows the password sees it.
    //
    // This lives in the credentials path alone, not in a shared callback, so
    // GitHub logins are unaffected — GitHub has already proven that address,
    // and those rows carry no `emailVerified` of ours.
    if (!user.emailVerified) throw new EmailNotVerifiedError();

    // Everything but the hash: this becomes the JWT payload.
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },
});

/**
 * The full Auth.js instance — import this everywhere except the proxy, which
 * needs the edge-safe `auth.config.ts` instead.
 *
 * The Prisma adapter still persists users and linked OAuth accounts, but
 * sessions are JWTs rather than rows in the `sessions` table: the split config
 * pattern requires `strategy: "jwt"` so the proxy can read the session without
 * a database round trip. Credentials sign-in requires it too — the adapter is
 * never asked to create a session for a password login.
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Swap the placeholder out by position so GitHub's entry, and any provider
  // added to the shared config later, carries through untouched.
  providers: authConfig.providers.map((provider) =>
    typeof provider !== "function" && provider.type === "credentials"
      ? credentialsProvider
      : provider,
  ),
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
