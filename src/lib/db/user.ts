import { cache } from "react";
import { connection } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * The seeded demo account. Authentication isn't wired up yet, so every query
 * is scoped to this user — replace this with the NextAuth session lookup once
 * auth lands.
 */
const DEMO_USER_EMAIL = "demo@devstash.io";

/**
 * Returns the signed-in user's id, or `null` when there is no user to scope to
 * (an unseeded database). Callers should treat `null` as "no data" rather than
 * an error so the dashboard still renders against an empty database.
 *
 * Memoized per request, so several data fetchers on one page share a single
 * lookup.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  // Prisma queries would otherwise resolve during prerendering and bake
  // build-time data into the page.
  await connection();

  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  return user?.id ?? null;
});
