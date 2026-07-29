# Current Feature

Seed Data

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Rewrite `prisma/seed.ts` to populate the database with sample data for
development and demos, per @context/features/seed-spec.md.

- **Demo user** — `demo@devstash.io` / "Demo User", password `12345678` hashed
  with bcryptjs (12 rounds), `isPro: false`, `emailVerified` set to now.
- **System item types** — keep the existing 7 (snippet, prompt, command, note,
  file, image, link), all `isSystem: true` with `userId: null`.
- **Collections & items** — 5 collections, 18 items total:
  - React Patterns — 3 TypeScript snippets (custom hook, context provider,
    utility function)
  - AI Workflows — 3 prompts (code review, docs generation, refactoring)
  - DevOps — 1 snippet, 1 command, 2 links (real URLs)
  - Terminal Commands — 4 commands (git, docker, process, package manager)
  - Design Resources — 4 links (real URLs)
- **Idempotent** — re-running `npm run db:seed` must produce the same state,
  not duplicates.

## Notes

<!-- Any extra notes -->

- Adds `bcryptjs` as a dependency (needed here for the demo password, and again
  later for NextAuth credentials sign-in).
- Beyond the spec's minimum, seed items also get tags, a few `isPinned` /
  `isFavorite` flags, and collections get a `defaultTypeId` where the
  collection is single-type. The dashboard already renders pinned/favorite
  sections, so this gives those real data to show.
- Idempotency: system types are matched on `[name, userId: null]` explicitly
  (Postgres treats NULLs in a unique constraint as distinct, so `upsert` can't
  match them); the demo user's collections and items are deleted and recreated
  on each run.

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Initial Next.js + Tailwind CSS v4 setup: stripped create-next-app boilerplate (`page.tsx`, `globals.css`, default SVGs), committed as "chore: initial next.js and tailwind setup", added `origin` remote, and pushed `master` to GitHub
- Dashboard UI Phase 1: initialized shadcn/ui, added button/input components, set dark mode as default, built the `/dashboard` route with a top bar (logo, search, New Item button) and Sidebar/Main placeholders. Build passes.
- Dashboard UI Phase 2: built the collapsible sidebar — desktop icon-rail collapse and a mobile Sheet drawer, an item type list linking to `/items/TYPE` with counts, a Collections section with Favorites/Recent groups, a user avatar footer, and a "Navigation" header housing the sidebar toggle. Build passes.
- Dashboard UI Phase 3: built the main dashboard area — 4 stats cards (items, collections, favorite items, favorite collections), a Collections grid, a Pinned items section, and a Recent Items list, all sourced from mock data. Added shadcn Card/Badge components, widened the main content padding, and added a disabled "New Collection" button to the top bar. Build passes.
- Prisma 7 + Neon PostgreSQL: set up Prisma 7 (`prisma-client` generator → `src/generated/prisma`, `PrismaNeon` driver adapter, connection URLs in `prisma.config.ts`) against the Neon development branch. Created the initial schema (User, Item, ItemType, Collection, ItemCollection, Tag + NextAuth Account/Session/VerificationToken) with indexes and cascade deletes, applied it via `migrate dev --name init`, and seeded the 7 system item types. Added `src/lib/db-url.ts` to derive Neon's pooled/direct URLs from a single `DATABASE_URL`, a `src/lib/prisma.ts` hot-reload-safe singleton, and `scripts/test-db.ts` (`npm run db:test`) for connectivity checks. Build, lint, and db:test all pass.
- Seed Data: rewrote `prisma/seed.ts` to populate a demo dataset — the `demo@devstash.io` user (password bcrypt-hashed at 12 rounds), the 7 system item types, and 5 collections holding 18 items (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources) with tags, real URLs for links, and a few pinned/favorite flags so the dashboard's pinned and favorites sections have real data. Added `bcryptjs`. The script is idempotent — system types are matched on `[name, userId: null]` and the demo user's collections/items are cleared and rebuilt on each run. Verified across two consecutive runs (5 collections / 18 items / 18 join rows, no duplicates); build and lint pass.
