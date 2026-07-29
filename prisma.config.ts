import "dotenv/config";
import { defineConfig } from "prisma/config";

import { directConnectionString } from "./src/lib/db-url";

// Prisma 7 reads connection URLs from here rather than from schema.prisma.
// Left undefined when no env vars are set so that offline commands
// (`prisma generate`, `prisma validate`) still work — e.g. during CI builds.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directConnectionString(),
  },
});
