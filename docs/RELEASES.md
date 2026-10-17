# Releasing Tastebase

## Prerequisites

- Push access to the repo
- `claude` CLI installed and authenticated (`npm install -g @anthropic-ai/claude-code`)
- `gh` CLI installed and authenticated (`gh auth login`)

## How to release

```bash
./scripts/release.sh          # bump patch:  v0.1.0 → v0.1.1
./scripts/release.sh minor    # bump minor:  v0.1.0 → v0.2.0
./scripts/release.sh major    # bump major:  v0.1.0 → v1.0.0
./scripts/release.sh v0.1.0   # explicit version
```

The script shows the current and new tag and asks for confirmation. Then it writes the
changelog entry, bumps `package.json`, commits both, and tags that commit.

## What happens

The script runs entirely locally:

1. Collects commits since the last tag
2. Calls `claude -p` to generate changelog notes
3. Shows a preview and asks for confirmation
4. Adds the entry to the top of `CHANGELOG.md`, sets `package.json`'s `version`, and commits both as `Release vX.Y.Z`
5. Pushes the branch, then creates and pushes an annotated tag on that commit
6. Creates the GitHub Release with `gh --notes-file`, using the same text

## `CHANGELOG.md` is the source of truth

The notes live in the repo, not only on GitHub. Edit the file by hand if you need to,
but keep `##` for version headings only (`## v0.1.0 — 2026-10-17`), because entries are
split on them. Notes from the script start their own headings at `###`.

The script commits, so it refuses to run on a detached HEAD or when `CHANGELOG.md` or
`package.json` have uncommitted changes. Other uncommitted changes get a warning: they
are not part of the release.

## CI

The **CI** workflow (`.github/workflows/ci.yml`) runs on pull requests, pushes to
`main`, and version tags:

1. **App**: lint (`biome check`), type check, and unit tests
2. **Docker**: runs only after App passes
   - Pull requests and `main`: builds the image for `linux/amd64` to prove it builds. Nothing is pushed.
   - Tags: builds for `linux/amd64` and `linux/arm64` and pushes to GHCR

Each release publishes two tags to `ghcr.io/reecerose/tastebase`: the exact version
(tag `v0.1.0` → image `0.1.0`) and `latest`. The image is ready about 10–15 minutes
after the tag is pushed. The arm64 build runs under emulation and compiles
better-sqlite3, so it takes most of that time.

### First release

GHCR creates the package as **private** the first time CI pushes it. To let people pull
without logging in, open the package on GitHub (profile → Packages → `tastebase` →
Package settings) and set its visibility to **Public**. You only need to do this once.

## Pulling a released image

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.0   # exact version (recommended)
docker pull ghcr.io/reecerose/tastebase:latest  # newest release
```

Deployment steps (volumes, environment variables, Unraid) are in
[`DEPLOYMENT.md`](DEPLOYMENT.md) and [`DEPLOYMENT_UNRAID.md`](DEPLOYMENT_UNRAID.md).

## Building an image yourself

CI does the publishing, so you only need a local build to test a change before you
push it:

```bash
docker build -t tastebase:test .                                   # your machine's architecture
docker buildx build --platform linux/amd64 -t tastebase:test --load .  # e.g. for an x86 NAS from Apple Silicon
```

## If changelog generation fails

If `claude` isn't available or fails, the script uses the raw commit list instead.

Editing the notes later on GitHub (`Releases → Edit`) only changes the GitHub Release.
Edit `CHANGELOG.md` too so the two stay in sync.
