// Connectivity / sanity check for the Neon database.
// Run with: npm run db:test
//
// `dotenv/config` must be imported before anything that reads process.env —
// the Prisma singleton builds its connection string at module load.
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { pooledConnectionString } from "../src/lib/db-url";

const EXPECTED_SYSTEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

const DEMO_EMAIL = "demo@devstash.io";

/** Mirrors prisma/seed.ts — update both together. */
const EXPECTED_COLLECTIONS: Record<string, number> = {
  "React Patterns": 3,
  "AI Workflows": 3,
  DevOps: 4,
  "Terminal Commands": 4,
  "Design Resources": 4,
};

/** Host only — never print the full URL, it carries credentials. */
function describeHost(url: string | undefined) {
  if (!url) return "not set";
  try {
    return new URL(url).host;
  } catch {
    return "unparseable";
  }
}

const failures: string[] = [];

function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} — ${detail}`);
  if (!ok) failures.push(label);
}

function fetchDemoCollections(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      defaultType: { select: { name: true } },
      items: {
        orderBy: { addedAt: "asc" },
        include: {
          item: {
            include: {
              itemType: { select: { name: true } },
              tags: { select: { name: true }, orderBy: { name: "asc" } },
            },
          },
        },
      },
    },
  });
}

type DemoCollection = Awaited<ReturnType<typeof fetchDemoCollections>>[number];

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/**
 * Prints the seeded content as a tree. `P` marks a pinned item, `F` a
 * favorite — the two flags the dashboard's pinned/favorites sections read.
 */
function printDemoData(demoCollections: DemoCollection[]) {
  console.log("\nDemo data\n");

  for (const collection of demoCollections) {
    const meta = [
      collection.defaultType ? `default: ${collection.defaultType.name}` : null,
      collection.isFavorite ? "favorite" : null,
    ].filter(Boolean);

    console.log(
      `  ${collection.name}${meta.length ? `  (${meta.join(", ")})` : ""}`
    );
    console.log(`    ${collection.description ?? ""}`);

    for (const { item } of collection.items) {
      const flags =
        `${item.isPinned ? "P" : " "}${item.isFavorite ? "F" : " "}`;
      const type = item.itemType.name.padEnd(7);
      const title = truncate(item.title, 38).padEnd(38);
      const detail = item.url ?? item.tags.map((t) => t.name).join(", ");
      console.log(`    ${flags}  ${type}  ${title}  ${truncate(detail, 60)}`);
    }

    console.log("");
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
    process.exit(1);
  }

  console.log(`Connecting to ${describeHost(pooledConnectionString())}\n`);

  // 1. Can we reach the database at all?
  await prisma.$queryRaw`SELECT 1`;
  check("connection", true, "reachable");

  // 2. Are the migrations applied?
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name::text AS table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  const tableNames = tables.map((t) => t.table_name);
  const expectedTables = [
    "accounts",
    "collections",
    "item_collections",
    "item_types",
    "items",
    "sessions",
    "tags",
    "users",
    "verification_tokens",
  ];
  const missingTables = expectedTables.filter((t) => !tableNames.includes(t));
  check(
    "schema",
    missingTables.length === 0,
    missingTables.length === 0
      ? `${tableNames.length} tables present`
      : `missing: ${missingTables.join(", ")}`
  );

  // 3. Did the seed run, and is it free of duplicates?
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    orderBy: { name: "asc" },
  });
  const names = systemTypes.map((t) => t.name);
  const missingTypes = EXPECTED_SYSTEM_TYPES.filter((n) => !names.includes(n));
  check(
    "seed",
    missingTypes.length === 0 && names.length === EXPECTED_SYSTEM_TYPES.length,
    missingTypes.length > 0
      ? `missing: ${missingTypes.join(", ")} — run npm run db:seed`
      : `${names.length} system types: ${names.join(", ")}`
  );

  // 4. Row counts — confirms every model maps to a real table.
  const [users, items, collections, tags, itemCollections] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
    prisma.itemCollection.count(),
  ]);
  check(
    "models",
    true,
    `users=${users} items=${items} collections=${collections} tags=${tags} itemCollections=${itemCollections}`
  );

  // 5. Is the demo user there, and usable for credentials sign-in?
  const demoUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });
  check(
    "demo user",
    demoUser !== null && demoUser.password !== null,
    demoUser === null
      ? `${DEMO_EMAIL} not found — run npm run db:seed`
      : `${demoUser.name} <${demoUser.email}> isPro=${demoUser.isPro} ` +
          `verified=${demoUser.emailVerified !== null} ` +
          `password=${demoUser.password ? "hashed" : "MISSING"}`
  );

  if (!demoUser) {
    console.log(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
    process.exit(1);
  }

  // 6. Fetch the demo content in one go — also exercises the relations
  //    (item -> type, item -> tags, collection -> items) end to end.
  const demoCollections = await fetchDemoCollections(demoUser.id);

  const expectedNames = Object.keys(EXPECTED_COLLECTIONS).sort();
  const actualNames = demoCollections.map((c) => c.name).sort();
  const wrongCounts = demoCollections
    .filter((c) => c.items.length !== EXPECTED_COLLECTIONS[c.name])
    .map((c) => `${c.name}=${c.items.length}`);
  check(
    "demo collections",
    actualNames.join("|") === expectedNames.join("|") && wrongCounts.length === 0,
    actualNames.join("|") !== expectedNames.join("|")
      ? `expected [${expectedNames.join(", ")}], got [${actualNames.join(", ")}]`
      : wrongCounts.length > 0
        ? `wrong item counts: ${wrongCounts.join(", ")}`
        : `${demoCollections.length} collections, ` +
          `${demoCollections.reduce((n, c) => n + c.items.length, 0)} items`
  );

  // 7. Every item should carry content appropriate to its contentType —
  //    a link without a URL or a snippet without a body is a broken seed.
  const demoItems = demoCollections.flatMap((c) => c.items.map((ic) => ic.item));
  const emptyItems = demoItems
    .filter((i) =>
      i.contentType === "URL" ? !i.url : i.contentType === "TEXT" ? !i.content : false
    )
    .map((i) => i.title);
  check(
    "item content",
    emptyItems.length === 0,
    emptyItems.length === 0
      ? `${demoItems.length} items have content for their contentType`
      : `empty: ${emptyItems.join(", ")}`
  );

  // 8. Items only reachable through a collection would be invisible in
  //    type-filtered views, so confirm the join table covers all of them.
  const orphanItems = await prisma.item.count({
    where: { userId: demoUser.id, collections: { none: {} } },
  });
  check(
    "item membership",
    orphanItems === 0,
    orphanItems === 0
      ? "every item belongs to at least one collection"
      : `${orphanItems} item(s) in no collection`
  );

  printDemoData(demoCollections);

  console.log(
    failures.length === 0
      ? "\nAll checks passed."
      : `\n${failures.length} check(s) failed: ${failures.join(", ")}`
  );

  if (failures.length > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error("\nDatabase test failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
