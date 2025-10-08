#!/bin/bash
set -e

VERSION=${1:-latest}
IMAGE_NAME="reecerose/tastebase"
PLATFORMS="linux/amd64,linux/arm64"

echo "🔨 Building ${IMAGE_NAME}:${VERSION} for ${PLATFORMS}..."

# Ensure builder exists
docker buildx create --name tastebase-builder --use 2>/dev/null || docker buildx use tastebase-builder

# Build and push
docker buildx build \
  --platform ${PLATFORMS} \
  -t ${IMAGE_NAME}:${VERSION} \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VERSION=${VERSION} \
  --push \
  .

echo "✅ Build complete: ${IMAGE_NAME}:${VERSION}"
echo ""
echo "Verify with:"
echo "  docker buildx imagetools inspect ${IMAGE_NAME}:${VERSION}"
echo ""
echo "Pull and test:"
echo "  docker pull ${IMAGE_NAME}:${VERSION}"
