# DevStash

A developer knowledge hub for snippets, commands, prompts, notes,
files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets)

There is no test runner configured in this project.

## Architecture

- Next.js App Router project (`src/app`), TypeScript, Tailwind CSS v4.
- `src/app/layout.tsx` — root layout; loads the Geist Sans/Mono fonts via `next/font/google` and exposes them as CSS variables (`--font-geist-sans`, `--font-geist-mono`) consumed in `globals.css`.
- `src/app/globals.css` — single Tailwind entry point (`@import "tailwindcss"`); no custom theme/utilities beyond the Tailwind import.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
- Styling is Tailwind-only — no CSS Modules or styled-components in use.

## Next.js version note

This repo pins `next@16.2.12`, which is ahead of common training data and may differ from familiar Next.js APIs/conventions. Per `AGENTS.md`, consult `node_modules/next/dist/docs/` for the current API reference before relying on prior knowledge of Next.js, especially for file conventions (`01-app/03-api-reference/03-file-conventions/`) and config APIs.
