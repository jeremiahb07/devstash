import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** The signed-in user as the database has them, not as the token remembers them. */
export interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

/**
 * Returns the signed-in user's id, or `null` when nobody is signed in. Callers
 * should treat `null` as "no data" rather than an error so a page still renders
 * for a signed-out visitor.
 *
 * The id comes from the session JWT (`token.sub`) rather than a database
 * lookup, so this costs nothing beyond decoding the cookie — and reading the
 * cookie is itself a dynamic API, which is what keeps these queries out of the
 * prerender that `connection()` used to guard against.
 *
 * Memoized per request, so several data fetchers on one page share one call.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const session = await auth();

  return session?.user?.id ?? null;
});

/**
 * The row behind the session, or `null` when there is no session *or* the user
 * it names no longer exists.
 *
 * Sessions are JWTs, so a signed cookie outlives the account it was minted for:
 * deleting a user changes nothing until the cookie expires. This is the only
 * thing in the app that asks the database whether that person is still there,
 * which is why `null` means "sign this session out" rather than "no data" — see
 * `src/app/dashboard/layout.tsx`.
 *
 * Built on `getCurrentUserId` rather than calling `auth()` again, so a request
 * that needs both decodes the token once.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getCurrentUserId();

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  });
});
