# Changelog

Release notes for [Tastebase](https://github.com/ReeceRose/tastebase). This file is the
source of truth: `scripts/release.sh` writes each entry here, commits it, tags that
commit, and publishes the same text as the GitHub Release.

## v0.1.0 — 2026-10-17

### What's Changed

- **Add recipe lists, extension, release pipeline** (2b37be4)
- Make all pages mobile friendly (1be75f0)
- Clean up stale docs and fix the ones that remain (#4) (69ddee8)
- new layout, UX and design system (#3) (6a1a9e5)
- Remove unused date-fns dependency (#2) (a4bc510)
- docs: update for phase 7; fix OCR cache path and Ollama default host (0fe1be4)
- refactor: remove dead code and fix unwired favorites and recent views (6783482)
- feat: import recipes without AI first, with optional AI fallback (b4e570b)
- refactor: remove AI chat, image generation, and dead code (7a91c52)
- chore: package upgrade and phase 7 plan (78d6534)
- chore: package upgrade (cd23d27)
- chore: package upgrade (788deb1)
- chore: package upgrade (d11efe1)
- chore: package upgrade (085ccaa)
- chore: package upgrade (27f5c83)
- chore: Package upgrade (3792cec)
- bug: fix password reset workflow (e87f6af)
- bug: fix password reset workflow (1605b6c)
- chore: Package upgrade (0253d23)
- build: Add placeholder environment variables for CI (17891b0)
- build: Only run docker build & push on release and add docker build only step (43f98ec)
- chore: Package upgrade (4b01ea0)
- chore: Biome migrate (51f7577)
- Fixes to get Dockerfile running and app in a mostly deployable state (8417269)
- chore: Package upgrade (a56000c)
- Fix build (f398794)
- fix tests (e7179a0)
- fix 'ERROR  packages field missing or empty' (a351d00)
- working (4e9c8c9)
- Clone and initialzie project from template (d5f5d1f)

### Docker

```
docker pull ghcr.io/reecerose/tastebase:0.1.0
```

