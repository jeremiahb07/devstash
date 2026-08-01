// Deletes every user except one — by default the seeded demo account — along
// with everything they own.
//
// Dry run by default. Nothing is written unless you pass --yes:
//
//   npm run db:prune          # report what would go
//   npm run db:prune -- --yes # actually delete
//
// Keep more than the demo account with KEEP_USER_EMAILS — a comma-separated
// list. Your own login is easy to forget and is deleted like any other:
//
//   KEEP_USER_EMAILS="demo@devstash.io,you@example.com" npm run db:prune
//
// `dotenv/config` must be imported before anything that reads process.env —
// the Prisma singleton builds its connection string at module load.
import "dotenv/config";

import { prisma } from "../src/lib/prisma";

const DEFAULT_KEEP_EMAIL = "demo@devstash.io";

/** Matches the normalisation the app applies before storing an address. */
const KEEP_EMAILS = (process.env.KEEP_USER_EMAILS ?? DEFAULT_KEEP_EMAIL)
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

const CONFIRMED = process.argv.includes("--yes");

/**
 * Most of the graph is removed by the database rather than by this script:
 * `Account`, `Session`, `Item`, `Collection` and a user's *custom* `ItemType`
 * rows all carry `onDelete: Cascade` on their user relation, `ItemCollection`
 * cascades from both sides, and Prisma clears the implicit `Item`-`Tag` join
 * rows with the items.
 *
 * Two things are not reachable that way and are handled explicitly below:
 *
 *   - `VerificationToken` has no user relation at all — it is keyed by an email
 *     string — so its rows would outlive the accounts they belong to.
 *   - `Tag` is global rather than per-user, so deleting a user's items can
 *     leave tags attached to nothing.
 *
 * System item types (`userId: null`) have no user to cascade from and are
 * untouched, which is what keeps the seed's seven types in place.
 */
async function collectPlan() {
  const keepers = await prisma.user.findMany({
    where: { email: { in: KEEP_EMAILS } },
    select: { id: true, email: true, name: true },
  });

  const doomed = await prisma.user.findMany({
    where: { email: { notIn: KEEP_EMAILS } },
    select: {
      id: true,
      email: true,
      name: true,
      _count: {
        select: {
          items: true,
          collections: true,
          itemTypes: true,
          accounts: true,
          sessions: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return { keepers, doomed };
}

/**
 * Items may only reference a system type or one of their owner's custom types,
 * so this should always be empty. It is checked anyway because `Item.itemType`
 * has no `onDelete`, which means Restrict: were a surviving item pointing at a
 * departing user's custom type, the cascade would fail on a foreign key and the
 * error would name a constraint rather than the cause.
 */
async function findCrossOwnedTypes(keeperIds: string[]) {
  return prisma.item.findMany({
    where: {
      userId: { in: keeperIds },
      itemType: { userId: { not: null, notIn: keeperIds } },
    },
    select: { id: true, title: true, itemType: { select: { name: true } } },
  });
}

async function main() {
  const { keepers, doomed } = await collectPlan();

  // Without at least one survivor the "everything except" filter matches every
  // row. A typo in the keep list is the likeliest way to get here.
  if (keepers.length === 0) {
    throw new Error(
      `None of the accounts to keep exist (${KEEP_EMAILS.join(", ")}) — refusing to run, since that would delete every user.`,
    );
  }

  // A name that matched nothing is far more likely to be a typo than an
  // instruction to prune it, and the cost of guessing wrong is unrecoverable.
  const missing = KEEP_EMAILS.filter(
    (email) => !keepers.some((keeper) => keeper.email === email),
  );

  if (missing.length > 0) {
    throw new Error(
      `Refusing to run: no account exists for ${missing.join(", ")}. Fix the address, or drop it from KEEP_USER_EMAILS to confirm it should not be kept.`,
    );
  }

  console.log("Keeping:");
  for (const keeper of keepers) {
    console.log(`  - ${keeper.email}${keeper.name ? ` (${keeper.name})` : ""}`);
  }

  if (doomed.length === 0) {
    console.log("\nNothing to delete — no other users exist.");
    return;
  }

  const crossOwned = await findCrossOwnedTypes(keepers.map((k) => k.id));

  if (crossOwned.length > 0) {
    throw new Error(
      `Refusing to run: ${crossOwned.length} kept item(s) use a custom item type owned by a user being deleted, ` +
        `which the delete would fail on. Reassign them first: ` +
        crossOwned.map((i) => `"${i.title}" -> ${i.itemType.name}`).join(", "),
    );
  }

  const totals = doomed.reduce(
    (sum, user) => ({
      items: sum.items + user._count.items,
      collections: sum.collections + user._count.collections,
      itemTypes: sum.itemTypes + user._count.itemTypes,
      accounts: sum.accounts + user._count.accounts,
      sessions: sum.sessions + user._count.sessions,
    }),
    { items: 0, collections: 0, itemTypes: 0, accounts: 0, sessions: 0 },
  );

  console.log(`\nDeleting ${doomed.length} user(s):`);
  for (const user of doomed) {
    const { items, collections, itemTypes, accounts, sessions } = user._count;
    console.log(
      `  - ${user.email}${user.name ? ` (${user.name})` : ""} — ` +
        `${items} items, ${collections} collections, ${itemTypes} custom types, ` +
        `${accounts} linked accounts, ${sessions} sessions`,
    );
  }

  console.log(
    `\nCascaded totals: ${totals.items} items, ${totals.collections} collections, ` +
      `${totals.itemTypes} custom types, ${totals.accounts} accounts, ${totals.sessions} sessions`,
  );

  if (!CONFIRMED) {
    console.log("\nDry run — nothing was deleted. Re-run with --yes to apply.");
    return;
  }

  // One transaction: a foreign key that fires halfway through would otherwise
  // leave the database with some users gone and their leftovers behind.
  const result = await prisma.$transaction(async (tx) => {
    const users = await tx.user.deleteMany({
      where: { email: { notIn: KEEP_EMAILS } },
    });

    // Both shapes: this app writes "email-verification:<email>", while the
    // Auth.js adapter would write a bare address.
    const tokens = await tx.verificationToken.deleteMany({
      where: {
        identifier: {
          notIn: [
            ...KEEP_EMAILS,
            ...KEEP_EMAILS.map((email) => `email-verification:${email}`),
          ],
        },
      },
    });

    // After the items are gone, so it catches tags the delete just orphaned.
    // Tags shared with a kept item still have one and survive.
    const tags = await tx.tag.deleteMany({ where: { items: { none: {} } } });

    return { users: users.count, tokens: tokens.count, tags: tags.count };
  });

  console.log(
    `\nDeleted ${result.users} user(s), ${result.tokens} stale verification token(s), ` +
      `${result.tags} orphaned tag(s).`,
  );

  const [remainingUsers, systemTypes] = await Promise.all([
    prisma.user.findMany({ select: { email: true } }),
    prisma.itemType.count({ where: { userId: null } }),
  ]);

  console.log(
    `Remaining users: ${remainingUsers.map((u) => u.email).join(", ") || "none"}`,
  );
  console.log(`System item types intact: ${systemTypes}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
