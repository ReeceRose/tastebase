#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh v1.2.3"
  exit 1
fi

VERSION=$1
IMAGE_NAME="reecerose/tastebase"
PLATFORMS="linux/amd64,linux/arm64"

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Error: Version must be in format v1.2.3"
  exit 1
fi

# Extract version parts
MAJOR=$(echo $VERSION | cut -d. -f1)
MINOR=$(echo $VERSION | cut -d. -f1,2)

echo "🚀 Releasing Tastebase ${VERSION}"
echo ""
echo "Will create the following tags:"
echo "   - ${IMAGE_NAME}:${VERSION}"
echo "   - ${IMAGE_NAME}:${MINOR}"
echo "   - ${IMAGE_NAME}:${MAJOR}"
echo "   - ${IMAGE_NAME}:latest"
echo ""

# Confirm
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Release cancelled"
  exit 1
fi

# Ensure builder exists
docker buildx create --name tastebase-builder --use 2>/dev/null || docker buildx use tastebase-builder

echo ""
echo "🔨 Building and pushing..."

# Build and push with all tags
docker buildx build \
  --platform ${PLATFORMS} \
  -t ${IMAGE_NAME}:${VERSION} \
  -t ${IMAGE_NAME}:${MINOR} \
  -t ${IMAGE_NAME}:${MAJOR} \
  -t ${IMAGE_NAME}:latest \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VERSION=${VERSION} \
  --push \
  .

echo ""
echo "✅ Release complete!"
echo ""
echo "Published images:"
echo "  - ${IMAGE_NAME}:${VERSION}"
echo "  - ${IMAGE_NAME}:${MINOR}"
echo "  - ${IMAGE_NAME}:${MAJOR}"
echo "  - ${IMAGE_NAME}:latest"
echo ""
echo "Verify: docker buildx imagetools inspect ${IMAGE_NAME}:${VERSION}"
echo "Test: docker pull ${IMAGE_NAME}:${VERSION}"
echo ""
echo "Next steps:"
echo "  1. Create GitHub release with tag ${VERSION}"
echo "  2. Update CHANGELOG.md"
echo "  3. Announce on Discord/Forums"
