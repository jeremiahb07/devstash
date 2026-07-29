// Neon exposes two connection strings that differ only by "-pooler" in the
// hostname: a pooled one for application queries and a direct one for DDL.
// Only DATABASE_URL is required — the other form is derived from it.

/**
 * Direct (unpooled) connection, used by the Prisma CLI. Migrations need
 * session-level advisory locks, which Neon's transaction-mode pooler does not
 * reliably support, so DDL must not go through the pooler.
 */
export function directConnectionString(): string | undefined {
  const explicit = process.env.DIRECT_URL;
  if (explicit) return explicit;

  return process.env.DATABASE_URL?.replace("-pooler.", ".");
}

/**
 * Pooled connection, used by the app at runtime to avoid exhausting
 * Postgres connections from serverless functions.
 */
export function pooledConnectionString(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (url.includes("-pooler.")) return url;

  // Insert "-pooler" into the first hostname label.
  return url.replace(/@([^.:/?]+)\./, "@$1-pooler.");
}
