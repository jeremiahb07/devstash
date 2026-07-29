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
