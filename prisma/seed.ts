import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";

import { directConnectionString } from "../src/lib/db-url";
import { PrismaClient } from "../src/generated/prisma/client";
import type { ContentType } from "../src/generated/prisma/enums";

const adapter = new PrismaNeon({ connectionString: directConnectionString() });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@devstash.io";
const DEMO_PASSWORD = "12345678";
const BCRYPT_ROUNDS = 12;

/**
 * Which account the sample content belongs to. Defaults to the demo user, so
 * a plain `npm run db:seed` behaves exactly as it always has.
 *
 * Override it to load the same content into an account you actually sign in
 * with — a GitHub login, say — so the dashboard has something to show:
 *
 *   SEED_USER_EMAIL=you@example.com npm run db:seed
 *
 * The account has to exist already in that case; the seed owns the content,
 * not the account.
 */
const SEED_EMAIL =
  process.env.SEED_USER_EMAIL?.trim().toLowerCase() || DEMO_EMAIL;

/** Gap between consecutive seeded rows. */
const SEED_INTERVAL_MS = 60_000;

/** Captured once so every row in a run is spaced off the same instant. */
const SEED_START = Date.now();

/**
 * Rows are written in parallel, so the database can't be relied on to stamp
 * them in source order. Space the timestamps explicitly instead — index 0 the
 * oldest, the last index landing on the start of the run — so anything ordered
 * by recency reads the same after every seed, whichever write finishes first.
 */
function seedTimestamp(index: number, total: number) {
  return new Date(SEED_START - (total - 1 - index) * SEED_INTERVAL_MS);
}

const systemItemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { name: "command", icon: "Terminal", color: "#f97316", isSystem: true },
  { name: "note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { name: "file", icon: "File", color: "#6b7280", isSystem: true },
  { name: "image", icon: "Image", color: "#ec4899", isSystem: true },
  { name: "link", icon: "Link", color: "#10b981", isSystem: true },
];

type SystemTypeName = (typeof systemItemTypes)[number]["name"];

type SeedItem = {
  title: string;
  type: SystemTypeName;
  contentType: ContentType;
  content?: string;
  url?: string;
  description?: string;
  language?: string;
  tags?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
};

type SeedCollection = {
  name: string;
  description: string;
  /** Set only where every item in the collection shares one type. */
  defaultType?: SystemTypeName;
  isFavorite?: boolean;
  items: SeedItem[];
};

const collections: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    defaultType: "snippet",
    isFavorite: true,
    items: [
      {
        title: "useDebounce hook",
        type: "snippet",
        contentType: "TEXT",
        language: "typescript",
        description:
          "Delays updating a value until the input has settled — for search boxes and other rapid-fire inputs.",
        tags: ["react", "hooks", "typescript"],
        isPinned: true,
        isFavorite: true,
        content: `import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`,
      },
      {
        title: "Theme context provider",
        type: "snippet",
        contentType: "TEXT",
        language: "typescript",
        description:
          "Context provider + typed consumer hook that throws when used outside the provider.",
        tags: ["react", "context", "typescript"],
        content: `'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  const value = useMemo(
    () => ({
      theme,
      toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}`,
      },
      {
        title: "cn() class name merger",
        type: "snippet",
        contentType: "TEXT",
        language: "typescript",
        description:
          "Merges conditional class names and resolves conflicting Tailwind utilities. The shadcn/ui standard helper.",
        tags: ["typescript", "tailwind", "utils"],
        content: `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    defaultType: "prompt",
    isFavorite: true,
    items: [
      {
        title: "Thorough code review",
        type: "prompt",
        contentType: "TEXT",
        description:
          "Asks for a prioritized review instead of a wall of nitpicks.",
        tags: ["code-review", "quality"],
        isPinned: true,
        content: `Review the following code change as a senior engineer on this team.

Focus, in priority order:
1. Correctness — logic errors, unhandled edge cases, race conditions.
2. Security — auth checks, input validation, injection, leaked secrets.
3. Performance — N+1 queries, unnecessary re-renders, blocking work.
4. Consistency — does it match the patterns already in this codebase?

For each finding: quote the exact line, explain the concrete failure it causes,
and give the corrected code. Skip style nits the linter already catches.
If the change is sound, say so plainly rather than inventing feedback.

\`\`\`
{{DIFF}}
\`\`\``,
      },
      {
        title: "Generate API documentation",
        type: "prompt",
        contentType: "TEXT",
        description:
          "Turns a module or route handler into reference docs with runnable examples.",
        tags: ["documentation", "api"],
        content: `Write reference documentation for the code below.

Include:
- A one-paragraph summary of what it does and when to reach for it.
- Every parameter: name, type, whether it is required, default value.
- The return shape, including error cases.
- Two runnable examples — the common path and one edge case.

Rules: document only what the code actually does — do not invent parameters or
behavior. Use the same terminology the code uses. Output GitHub-flavored
Markdown.

\`\`\`
{{CODE}}
\`\`\``,
      },
      {
        title: "Refactoring assistant",
        type: "prompt",
        contentType: "TEXT",
        description:
          "Behavior-preserving refactor with the reasoning made explicit.",
        tags: ["refactoring", "quality"],
        content: `Refactor the code below without changing its observable behavior.

Goals: reduce duplication, shorten long functions, name things for what they
mean, and push side effects to the edges.

Constraints:
- Keep the public API identical — same exports, same signatures.
- Do not add dependencies.
- Do not "improve" anything outside the code shown.

Return: the refactored code, then a short list of each change and the specific
problem it solves. If a piece is better left alone, say why.

\`\`\`
{{CODE}}
\`\`\``,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        title: "Multi-stage Dockerfile for Next.js",
        type: "snippet",
        contentType: "TEXT",
        language: "dockerfile",
        description:
          "Builds with full dependencies, ships only the standalone output.",
        tags: ["docker", "nextjs", "deployment"],
        content: `# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
      },
      {
        title: "Migrate and deploy",
        type: "command",
        contentType: "TEXT",
        language: "bash",
        description:
          "Apply pending migrations before the new build goes live — never the other way around.",
        tags: ["deployment", "prisma"],
        content: `npx prisma migrate deploy && npm run build && npm run start`,
      },
      {
        title: "Docker Compose file reference",
        type: "link",
        contentType: "URL",
        url: "https://docs.docker.com/reference/compose-file/",
        description:
          "Every key in compose.yaml, with the version each was introduced in.",
        tags: ["docker", "reference"],
      },
      {
        title: "GitHub Actions workflow syntax",
        type: "link",
        contentType: "URL",
        url: "https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions",
        description: "Triggers, jobs, matrix builds, and expression syntax.",
        tags: ["ci-cd", "github", "reference"],
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    defaultType: "command",
    items: [
      {
        title: "Undo last commit, keep the changes",
        type: "command",
        contentType: "TEXT",
        language: "bash",
        description:
          "Moves HEAD back one commit and leaves the work staged. Use --hard only when you want the changes gone.",
        tags: ["git"],
        isFavorite: true,
        content: `git reset --soft HEAD~1`,
      },
      {
        title: "Remove all stopped containers and dangling images",
        type: "command",
        contentType: "TEXT",
        language: "bash",
        description:
          "Reclaims disk after a few days of building. Add --volumes to also drop unused volumes.",
        tags: ["docker", "cleanup"],
        content: `docker system prune -af`,
      },
      {
        title: "Find and kill whatever is on port 3000",
        type: "command",
        contentType: "TEXT",
        language: "bash",
        description:
          "For the dev server that did not shut down cleanly. Windows: netstat -ano | findstr :3000, then taskkill /PID <pid> /F.",
        tags: ["process", "debugging"],
        isPinned: true,
        content: `lsof -ti:3000 | xargs kill -9`,
      },
      {
        title: "List packages that are behind",
        type: "command",
        contentType: "TEXT",
        language: "bash",
        description:
          "Shows current vs wanted vs latest. Exits non-zero when anything is outdated, so guard it in CI.",
        tags: ["npm", "dependencies"],
        content: `npm outdated --long`,
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    defaultType: "link",
    items: [
      {
        title: "Tailwind CSS documentation",
        type: "link",
        contentType: "URL",
        url: "https://tailwindcss.com/docs",
        description:
          "Utility reference plus the v4 CSS-first configuration guide.",
        tags: ["css", "tailwind", "reference"],
        isFavorite: true,
      },
      {
        title: "shadcn/ui components",
        type: "link",
        contentType: "URL",
        url: "https://ui.shadcn.com/docs/components",
        description:
          "Copy-in components built on Radix primitives and Tailwind.",
        tags: ["components", "react", "tailwind"],
      },
      {
        title: "Radix UI primitives",
        type: "link",
        contentType: "URL",
        url: "https://www.radix-ui.com/primitives/docs/overview/introduction",
        description:
          "Unstyled, accessible primitives — the behavior layer under most modern component libraries.",
        tags: ["components", "accessibility", "design-system"],
      },
      {
        title: "Lucide icon library",
        type: "link",
        contentType: "URL",
        url: "https://lucide.dev/icons/",
        description:
          "Searchable index of every Lucide icon. The icon set DevStash uses for item types.",
        tags: ["icons", "design-system"],
      },
    ],
  },
];

async function seedSystemItemTypes() {
  // Each type has its own name, so these can't collide with one another.
  const entries = await Promise.all(
    systemItemTypes.map(async (type) => {
      // System types have userId = null. Postgres treats NULLs in a unique
      // constraint as distinct, so `upsert` on [name, userId] can't match an
      // existing row here — find it explicitly instead.
      const existing = await prisma.itemType.findFirst({
        where: { name: type.name, userId: null },
      });

      const record = existing
        ? await prisma.itemType.update({
            where: { id: existing.id },
            data: type,
          })
        : await prisma.itemType.create({ data: type });

      return [type.name, record.id] as const;
    }),
  );

  return new Map<SystemTypeName, string>(entries);
}

async function seedUser() {
  if (SEED_EMAIL !== DEMO_EMAIL) {
    const existing = await prisma.user.findUnique({
      where: { email: SEED_EMAIL },
    });

    if (!existing) {
      throw new Error(
        `No account with the email ${SEED_EMAIL}. Sign in once to create it, then re-run the seed.`,
      );
    }

    // Take a real account exactly as it is. Rewriting its name, or forcing the
    // demo password onto an OAuth login, is not the seed's business.
    return existing;
  }

  const password = await hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Demo User", password, isPro: false },
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      password,
      isPro: false,
      emailVerified: new Date(),
    },
  });
}

async function main() {
  console.log(`Seeding system item types and user (${SEED_EMAIL})...`);
  const [typeIds, user] = await Promise.all([
    seedSystemItemTypes(),
    seedUser(),
  ]);

  // Make the seed re-runnable: clear this user's content and rebuild it.
  // Item -> ItemCollection and Item -> Tag rows go with the items.
  console.log("Clearing existing content...");
  await prisma.item.deleteMany({ where: { userId: user.id } });
  await prisma.collection.deleteMany({ where: { userId: user.id } });

  console.log("Seeding collections and items...");

  // Tags are shared across items, so create them up front and `connect` below.
  // Left to `connectOrCreate` on parallel writes, two items sharing a tag would
  // race on the unique name and one would fail.
  const tagNames = [
    ...new Set(
      collections.flatMap((collection) =>
        collection.items.flatMap((item) => item.tags ?? []),
      ),
    ),
  ];

  await prisma.tag.createMany({
    data: tagNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const created = await Promise.all(
    collections.map((collection, index) => {
      const timestamp = seedTimestamp(index, collections.length);

      return prisma.collection.create({
        data: {
          name: collection.name,
          description: collection.description,
          isFavorite: collection.isFavorite ?? false,
          userId: user.id,
          defaultTypeId: collection.defaultType
            ? typeIds.get(collection.defaultType)
            : null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });
    }),
  );

  // Flatten to one list so every item is written in a single round of writes
  // rather than one collection's worth at a time.
  const items = collections.flatMap((collection, index) =>
    collection.items.map((item) => ({ item, collectionId: created[index].id })),
  );

  await Promise.all(
    items.map(({ item, collectionId }, index) => {
      const itemTypeId = typeIds.get(item.type);
      if (!itemTypeId) throw new Error(`Unknown item type: ${item.type}`);

      const timestamp = seedTimestamp(index, items.length);

      return prisma.item.create({
        data: {
          title: item.title,
          contentType: item.contentType,
          content: item.content ?? null,
          url: item.url ?? null,
          description: item.description ?? null,
          language: item.language ?? null,
          isPinned: item.isPinned ?? false,
          isFavorite: item.isFavorite ?? false,
          userId: user.id,
          itemTypeId,
          createdAt: timestamp,
          updatedAt: timestamp,
          tags: {
            connect: (item.tags ?? []).map((name) => ({ name })),
          },
          collections: {
            create: { collectionId, addedAt: timestamp },
          },
        },
      });
    }),
  );

  console.log(
    `Seeding complete! ${collections.length} collections, ${items.length} items.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
