#!/usr/bin/env bash
# Usage: ./scripts/release.sh [major|minor|patch|vX.Y.Z]
#
# CHANGELOG.md is the source of truth for release notes: this script writes the
# new entry there, commits it, tags that commit, and publishes the same text as
# the GitHub Release. The same commit bumps package.json's version, and pushing
# the tag makes CI build and publish the Docker image to GHCR.
set -euo pipefail

cd "$(dirname "$0")/.."

BUMP=${1:-patch}
CHANGELOG=CHANGELOG.md
PACKAGE_JSON=package.json

# Get the latest semver tag (default to v0.0.0 if none exist)
LATEST=$(git tag --sort=-version:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || true)
LATEST=${LATEST:-v0.0.0}

# Parse components
IFS='.' read -r MAJOR MINOR PATCH <<< "${LATEST#v}"

case "$BUMP" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
  v*)    MAJOR="" ;;  # explicit version — skip bump
  *)     echo "Usage: $0 [major|minor|patch|vX.Y.Z]" >&2; exit 1 ;;
esac

if [[ -n "$MAJOR" ]]; then
  NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"
else
  NEW_TAG="$BUMP"
fi

REPO=$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/\.git$//')
# Image references must be lowercase; GHCR lowercases the owner too.
IMAGE="ghcr.io/$(echo "$REPO" | tr '[:upper:]' '[:lower:]')"

# The changelog commit has to land on a branch, not a detached HEAD.
BRANCH=$(git symbolic-ref --short -q HEAD || true)
if [[ -z "$BRANCH" ]]; then
  echo "Error: HEAD is detached. Check out a branch before releasing." >&2
  exit 1
fi

# Uncommitted edits to either file would be swept into the release commit.
for FILE in "$CHANGELOG" "$PACKAGE_JSON"; do
  if ! git diff --quiet -- "$FILE" || ! git diff --cached --quiet -- "$FILE"; then
    echo "Error: ${FILE} has uncommitted changes. Commit or stash them first." >&2
    exit 1
  fi
done

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Warning: you have uncommitted changes. They will NOT be included in this release."
  git status --short
  echo ""
  read -r -p "Continue anyway? [y/N] " DIRTY
  [[ "$DIRTY" =~ ^[Yy]$ ]] || { echo "Aborted. Commit or stash your changes first."; exit 0; }
  echo ""
fi

echo "Current tag : ${LATEST}"
echo "New tag     : ${NEW_TAG}"
echo "Branch      : ${BRANCH}"
echo ""
read -r -p "Create and push ${NEW_TAG}? [y/N] " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# Collect commits since the last tag
if [[ "$LATEST" != "v0.0.0" ]]; then
  RANGE="${LATEST}..HEAD"
else
  RANGE="HEAD"
fi

COMMITS=$(git log "$RANGE" --pretty=format:"- %s (%h)" --no-merges)
DIFF_STAT=$(git diff --stat "${LATEST}..HEAD" 2>/dev/null || git diff --stat HEAD)

echo ""
echo "Generating changelog with Claude..."

# Headings start at level 3: CHANGELOG.md reserves `##` for version headings,
# and entries are split on exactly that.
PROMPT="You are writing a GitHub release changelog for Tastebase — a self-hosted recipe manager that a household or group runs together in Docker.

Release: ${NEW_TAG}
Previous release: ${LATEST}

Commits in this release:
${COMMITS}

Changed files summary:
${DIFF_STAT}

Write a concise, user-focused release changelog in GitHub-flavoured Markdown. Format it as:
- A short opening sentence describing the overall theme of this release (one line, no heading)
- A \"### What's Changed\" section with bullet points grouped under \"#### Features\", \"#### Fixes\", and \"#### Improvements\" subheadings. Use plain English, not commit message jargon. Skip merge commits and version bump commits.
- A \"### Docker\" section with the exact pull command: \`docker pull ${IMAGE}:${NEW_TAG#v}\`

Rules:
- Output the Markdown directly. Do NOT wrap the whole response in a code fence, and do NOT add any preamble such as 'Here is the changelog'.
- Do NOT include a title heading with the version number — that is added automatically.
- Headings must start at level 3 (###). Never use # or ##.
- Keep it tight — no filler, no 'this release includes' boilerplate. Max ~200 words."

NOTES_FILE=$(mktemp)
trap 'rm -f "$NOTES_FILE"' EXIT

claude -p "$PROMPT" > "$NOTES_FILE" 2>/dev/null || true

# Strip a wrapping ```markdown fence if the model added one anyway, and drop any
# leading `##`/`#` version title so the entry starts at its own prose.
awk '
  NR == 1 && /^```(markdown|md)?[[:space:]]*$/ { wrapped = 1; next }
  { lines[++n] = $0 }
  END {
    last = n
    if (wrapped) { while (last > 0 && lines[last] ~ /^[[:space:]]*$/) last--; if (lines[last] == "```") last-- }
    start = 1
    while (start <= last && lines[start] ~ /^[[:space:]]*$/) start++
    if (lines[start] ~ /^#{1,2} v?[0-9]+\.[0-9]+\.[0-9]+/) {
      start++
      while (start <= last && lines[start] ~ /^[[:space:]]*$/) start++
    }
    for (i = start; i <= last; i++) print lines[i]
  }
' "$NOTES_FILE" > "${NOTES_FILE}.clean" && mv "${NOTES_FILE}.clean" "$NOTES_FILE"

if [[ ! -s "$NOTES_FILE" ]]; then
  echo "Claude not available — using raw commit list."
  cat > "$NOTES_FILE" <<EOF
### What's Changed

${COMMITS}

### Docker

\`\`\`
docker pull ${IMAGE}:${NEW_TAG#v}
\`\`\`
EOF
fi

echo ""
echo "--- Release notes preview ---"
cat "$NOTES_FILE"
echo "-----------------------------"
echo ""
read -r -p "Proceed with these notes? [y/N] " CONFIRM2
[[ "$CONFIRM2" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# Insert the entry above the newest existing one, keeping the file newest-first.
[[ -f "$CHANGELOG" ]] || printf '# Changelog\n' > "$CHANGELOG"
RELEASE_DATE=$(date -u +%Y-%m-%d)

awk -v hdr="## ${NEW_TAG} — ${RELEASE_DATE}" -v notes="$NOTES_FILE" '
  function emit(  line) {
    print hdr
    print ""
    while ((getline line < notes) > 0) print line
    close(notes)
    print ""
    inserted = 1
  }
  !inserted && /^## v?[0-9]+\.[0-9]+\.[0-9]+/ { emit() }
  { print }
  END { if (!inserted) { print ""; emit() } }
' "$CHANGELOG" > "${CHANGELOG}.tmp" && mv "${CHANGELOG}.tmp" "$CHANGELOG"

echo "Updated ${CHANGELOG}."

# Tag the commit that carries the notes and the version bump, so the image built
# from the tag matches what CHANGELOG.md and package.json say.
npm pkg set version="${NEW_TAG#v}"

git add "$CHANGELOG" "$PACKAGE_JSON"
git commit -m "Release ${NEW_TAG}"
git push origin "$BRANCH"

git tag -a "$NEW_TAG" -m "Release ${NEW_TAG}"
git push origin "$NEW_TAG"

gh release create "$NEW_TAG" \
  --title "Tastebase ${NEW_TAG}" \
  --notes-file "$NOTES_FILE"

echo ""
echo "Released: https://github.com/${REPO}/releases/tag/${NEW_TAG}"
echo "Docker image building at: https://github.com/${REPO}/actions"
echo "Once it finishes: docker pull ${IMAGE}:${NEW_TAG#v}"
