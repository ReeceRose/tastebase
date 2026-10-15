# Phase 7: Modernization – Remove AI Extras, Import Without AI First, Current SDKs and Models

**Date:** 2026-10-14
**Prerequisites:** Phases 0–6 implemented
**Branch:** `chore/phase-7-modernization` (one PR per workstream below)

## Decision

AI stays only as an **optional fallback for recipe import**. Everything else that uses AI is removed: the discovery chat, cooking help, recipe modification chat, image analysis chat, image generation and saved conversations. Import first tries methods that need no AI: structured recipe data in the page (JSON-LD), a rule-based text parser and local OCR. It uses AI only when those fail and the user has set up a provider.

## Goals

- Import works fully without AI for most recipe URLs, and for tidy pasted text
- AI (cloud, or local through Ollama) improves import results when it's set up, and is never required
- Remove most of the AI code and its dependencies
- The remaining AI code uses AI SDK 7 and current models
- Close remaining TODOs, update outdated docs, add tests, and publish a first release

---

## Workstream 1 – Baseline

1. Create the branch and run `pnpm test`, `pnpm type-check`, `pnpm lint:check` and `pnpm health-check:ci`. **These need your go-ahead** under CLAUDE.md.
2. Record existing failures here so regressions can be told apart from failures that were already there.

## Workstream 2 – Remove the AI extras

### Delete

| Area | Files |
|---|---|
| Routes | `src/app/(dashboard)/recipes/discover/` (`page.tsx`, `[sessionId]/page.tsx`, `history/page.tsx`) |
| API | `src/app/api/chat/` (`recipe-discovery`, `cooking-assistance`, `recipe-modification`, `image-analysis`) |
| Components | `src/components/chat/` (whole folder, including `__tests__` and the unused `recipe-cooking-chat.tsx`), `src/components/lists/chat-history-list.tsx`, `src/components/ui/recipe-image-generator.tsx` |
| Hooks | `src/hooks/use-chat-performance.ts`, `src/hooks/use-mobile-chat.ts`, along with their tests |
| Server actions | `conversation-actions.ts`, `recipe-image-generation-actions.ts` |
| AI services | `src/lib/ai/services/image-generation-service.ts`, `src/lib/ai/prompts/image-generation-prompts.ts`, the chat/conversation functions in `src/lib/ai/service.ts` |
| Types | Chat, conversation, image-generation and modification-history types in `src/lib/types/index.ts` and `ai-types.ts` (`IMAGE_GENERATION_MODELS`, `CHAT_LOADING_MESSAGES`, …) |

### Edit

- `src/components/layout/dashboard-layout.tsx`: remove the "Recipe Discovery" nav item.
- Remove the image generator from:
  - `src/components/ui/recipe-image-manager.tsx`
  - `src/components/forms/recipe-create-form.tsx`
  - `src/components/cards/recipe-detail-view.tsx`
  - `src/components/recipes/image-gallery.tsx`

  Uploading images stays.
- AI settings forms: remove chat and image-generation options. What's left: provider, API key, model, and a test-connection button.
- `ai-config-actions.ts`: remove task types that no longer exist.

### Database

New migration (`pnpm db:generate`) that drops `conversation_sessions` and `conversation_history`. Review `ai_model_presets` and `ai_task_history`: drop them unless the slimmed-down settings still use them. Test the migration on a copy of a real `tastebase.db` first.

### Dependencies

Remove `@ai-sdk/react`.

### Out of scope, noted

`recipe-modification-actions.ts` and the `recipe_modifications` table store change history (not AI), but nothing imports them. Decide separately whether to wire them up or remove them.

## Workstream 3 – Import pipeline that works without AI first

Move the import code out of `src/lib/ai/` into `src/lib/import/`, so it's clear that import doesn't depend on AI:

```
src/lib/import/
├── fetch-page.ts          # safe URL fetch (moved from fetch-recipe-tool.ts)
├── json-ld-parser.ts      # moved from lib/ai/parsers
├── html-extractor.ts      # moved from lib/ai/parsers/html-parser.ts
├── text-recipe-parser.ts  # NEW rule-based parser
├── ocr.ts                 # moved from lib/ai/services/ocr-service.ts
└── import-recipe.ts       # runs the steps below in order
```

Add a `RecipeImportSource` enum (`json_ld`, `heuristic`, `ocr_heuristic`, `ai`) and a `RecipeImportResult` type (draft recipe, source, confidence, warnings) to `src/lib/types/`.

### Import order for each input

| Input | Step 1 (no AI) | Step 2 (no AI) | Step 3 (AI, only if set up) |
|---|---|---|---|
| URL | JSON-LD `schema.org/Recipe` (handle `@graph`, `HowToSection`, ISO 8601 durations) | Extract the main content from the HTML → text parser | Structured output from the extracted text |
| Pasted text | Text parser | – | "Clean up with AI" button, or automatic when confidence is low |
| Photo | Tesseract OCR → text parser | – | Vision model on the image itself |

### Rule-based text parser (`text-recipe-parser.ts`)

- Find section headings (Ingredients, Directions, Instructions, Method, Steps, Notes), allowing for different capitalization, colons and markdown.
- Treat numbered or bulleted lines as steps.
- Parse ingredient lines into amount (including `½`, `1 1/2`, ranges like `2–3`), unit (reusing `src/lib/utils/unit-conversions.ts`), name and notes.
- Pick up servings, prep, cook and total time from lines like "Serves 4" or "Prep: 15 min".
- Return a confidence score so the UI can suggest AI cleanup.

### Fetch security

The server fetches any URL a user types in. Block private, loopback and link-local addresses (including after redirects), and cap response size and redirect count. On a home server, the current code can be used to reach other machines on the local network.

### UI (`src/components/forms/ai-recipe-parser.tsx` → `recipe-import-form.tsx`)

- Always show the preview and edit step.
- Show where the recipe came from ("Imported from page data", "Parsed from text", "Cleaned up with AI").
- When no AI provider is set up, the AI button is disabled and links to Settings.
- Rename the server actions `ai-recipe-parsing-actions.ts` / `ai-image-processing-actions.ts` → `recipe-import-actions.ts`.

### Tests

- A fixture folder of saved real recipe pages: WP Recipe Maker, Tasty Recipes, Allrecipes, NYT Cooking, BBC Good Food, a `@graph` page and a page with no JSON-LD.
- Text-parser cases: tidy text, messy blog text, fractions and ranges, recipes with no headings.

## Workstream 4 – Non-AI dependency upgrades

1. `pnpm outdated`, then upgrade Next (16.1.6 → 16.4.x), React, better-auth (1.4.18 → 1.7.x), drizzle (0.45.1 → 0.45.4), zod, Radix/ShadCN and the dev tools.
2. better-auth: read the changelog. If its table schema changed, generate a migration and test it on a copy of the DB.
3. Next: run the codemods if any apply, and check `middleware.ts` against the `proxy.ts` convention.
4. `tesseract.js` is already on the latest version (7.0.0).

## Workstream 5 – AI fallback on AI SDK 7

1. Bump `ai` 6 → 7 and `@ai-sdk/{openai,anthropic,google}` 3 → 4. Run `npx @ai-sdk/codemod v7`, then work through the [migration guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0). For example, `system` becomes `instructions`.
2. **One AI entry point**, `src/lib/ai/recipe-cleanup.ts`, with two functions:
   - `cleanupRecipeText(text, config)` → `generateText({ output: Output.object({ schema: recipeDraftSchema }) })`
   - `extractRecipeFromImage(image, config)` → the same, with an image message part (vision)
3. Delete:
   - the regex/`JSON.parse` extraction (`service.ts:345`, `api/ai/parse-recipe/route.ts:132`)
   - `generateObject`
   - the tools registry (`src/lib/ai/tools/`); the pipeline fetches the page itself, so no tool call is needed
   - the streaming parse route, unless the UI really needs partial results
4. **Ollama:** replace `ollama-ai-provider@1.2.0` (built for AI SDK 4) with `ai-sdk-ollama` (4.x), and remove `as unknown as LanguageModel` in `providers.ts`. Check that structured output works with a local model.
5. Leave out `temperature` for models that don't support it (driven by the catalog below).
6. The connection test lists models instead of calling `generateText`.

## Workstream 6 – Model catalog (small)

One file, `src/lib/ai/models.ts`, replaces `DEFAULT_MODELS`, `COMMON_MODELS`, the display-name map in `providers.ts` and the two hardcoded form lists. For each model it records the ID, display name, `vision`, `temperature` and `status` (`current` / `legacy`).

Confirm the non-Anthropic IDs against the official provider pages at implementation time; they come from web searches and are not confirmed.

| Provider | Default | Also offer |
|---|---|---|
| Anthropic | `claude-haiku-5-5` (cheap, fast, vision; enough for parsing) | `claude-sonnet-5-5` |
| OpenAI | cheapest current GPT model with vision (*verify*) | one stronger model (*verify*) |
| Google | current Gemini Flash (*verify*) | current Flash-Lite (*verify*) |
| Ollama | a current local model that supports structured output (*verify*) | free-text model ID entry |

- Every provider also accepts a custom model ID.
- When a config is loaded, a saved `model_name` that is `legacy` or unknown falls back to the provider default and logs a warning. A one-time migration rewrites retired IDs in `ai_provider_configurations`.

## Workstream 7 – Remaining issues and docs

1. `auth-actions.ts:333`: add the recipe stats queries, reusing `dashboard-stats-actions.ts`.
2. `session-actions.ts:182`: use real failed-login data from better-auth, or remove the field.
3. The TODO in `recipe-discovery-chat.tsx:337` goes away when that file is deleted.
4. **Docs:**
   - Fix the Next.js and Node versions in CLAUDE.md and README.
   - Change the `pgTable` example in CLAUDE.md to `sqliteTable`.
   - README features: describe import as "works without AI; AI optional".
   - Add a note to the PRD that the app is now multi-user and the chat features have been removed.
   - Mark the plan docs for phases 3.2 (image generation) and 3.5 (chat) as superseded.
5. **Tests:**
   - Recipe CRUD server actions, including the public/private visibility rules
   - Model catalog fallback for retired models
   - `getProvider` for each provider
   - AI cleanup with the mock language models from `ai/test` (valid object accepted, invalid output rejected)

## Workstream 8 – Verify and release

1. Run the full test, type-check, lint, `health-check:ci` and Docker build (with your go-ahead).
2. **Manual smoke test:**
   - Import from URL, text and photo with **no AI set up**
   - The same with Anthropic, OpenAI, Google and Ollama
   - A database upgrade on a copy of an existing DB
3. Merge, then tag `v0.2.0` to publish the first Docker image. Release notes should cover the removed features and the dropped conversation data.

## Order and size

| # | Workstream | Size | Risk |
|---|---|---|---|
| 1 | Baseline | S | – |
| 2 | Remove AI extras | M | dropping tables deletes saved chat history |
| 3 | Import without AI first | L | parser quality on messy text |
| 4 | Non-AI deps | M | better-auth schema changes |
| 5 | AI SDK 7 fallback | S | Ollama structured output |
| 6 | Model catalog | S | migrating saved configs |
| 7 | Issues, docs, tests | M | – |
| 8 | Release | S | – |

Workstream 2 comes before 4 and 5 so fewer files need upgrading.
