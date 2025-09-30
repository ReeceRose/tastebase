# Repository Guidelines

## Project Structure & Module Organization
Tastebase runs on the Next.js App Router; keep files in `src/app/` focused on routing and light composition. Server actions belong in `src/lib/server-actions/` (or feature-specific lib folders), not inside route trees. Components stay grouped by purpose under `src/components/` (forms, lists, cards, skeletons, modals, navigation, ui); reach for the directory decision tree in `CLAUDE.md` whenever unsure. Import them through the `@/` aliases instead of relative dot paths. Domain logic, logging, types, and validations live in `src/lib/`, database schema in `src/db/`, automation in `scripts/`, docs in `docs/`, static assets in `public/`, and user uploads in `uploads/`.

## Build, Test, and Development Commands
Use pnpm everywhere. `pnpm dev` launches Turbopack, `pnpm build` + `pnpm start` verify production bundles. Run `pnpm lint` for auto-fixes, with `pnpm lint:check`, `pnpm type-check`, and `pnpm test` as the pre-push baseline. Pull in targeted diagnostics—`pnpm architecture:naming`, `pnpm import-issues`, `pnpm unused-code`—before or after large edits. Database workflows rely on `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, and `pnpm db:studio` once `.env.local` mirrors `.env.example`.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, double quotes, semicolons, and bans unused imports; avoid disabling rules. Name React components, server actions, and hooks in PascalCase (`use`-prefixed for hooks); helpers and schema builders use camelCase. Prefer named exports and place tests or mock helpers alongside code in `__tests__/` folders. Components never reside in `src/app/`; schema files follow `src/db/schema.<feature>.ts` and are re-exported from `src/db/schema.ts`.

## Architecture & Logging Practices
Async server components should stream data behind Suspense boundaries with matching skeletons as described in `CLAUDE.md`. Keep business logic out of route files—compose UI components instead. Use Pino helpers (`createOperationLogger`, `createUserLogger`, `logError`) for server-side logging with object-first arguments; reserve `console.log` for client-only debugging. See `docs/server-logging-guide.md` for full patterns.

## Testing Guidelines
Vitest with Testing Library handles unit and integration coverage. Place specs in local `__tests__/` directories using the `*.test.ts` suffix, reuse `src/__tests__/setup.ts`, and cover critical flows (auth, AI recipe ingestion, uploads) when touched. `pnpm test:watch` supports TDD, while `pnpm test:coverage` tracks regressions.

## Commit & Pull Request Guidelines
Write imperative, present-tense commits (`Add nutrition parser`) and squash noise before pushing. Each PR needs a crisp problem statement, screenshots or recordings for UI changes, linked issues, and call-outs for migrations or env updates. Before requesting review run `pnpm lint:check`, `pnpm type-check`, `pnpm test`, plus relevant diagnostics (`pnpm architecture`, `pnpm import-issues:ci`). Never commit secrets, `.env.local`, or SQLite artifacts.
