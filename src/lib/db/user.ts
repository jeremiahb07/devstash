import { cache } from "react";

import { auth } from "@/auth";

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
