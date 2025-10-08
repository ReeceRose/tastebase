#!/bin/bash
set -e

VERSION=${1:-latest}
PLATFORM=${2:-linux/amd64}  # Default to AMD64 for Unraid
IMAGE_NAME="reecerose/tastebase"

echo "🔨 Building ${IMAGE_NAME}:${VERSION} for ${PLATFORM}..."

docker buildx build \
  --platform ${PLATFORM} \
  --load \
  -t ${IMAGE_NAME}:${VERSION} \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VERSION=${VERSION} \
  .

echo "✅ Build complete: ${IMAGE_NAME}:${VERSION} (${PLATFORM})"
echo ""
echo "Usage:"
echo "  ./scripts/build-local.sh [VERSION] [PLATFORM]"
echo ""
echo "Examples:"
echo "  ./scripts/build-local.sh latest linux/amd64     # For Unraid/x86_64 servers"
echo "  ./scripts/build-local.sh latest linux/arm64     # For Apple Silicon"
echo ""
echo "Test with:"
echo "  docker run -d -p 3000:3000 \\"
echo "    -e DATABASE_URL='file:/app/data/tastebase.db' \\"
echo "    -e BETTER_AUTH_SECRET='test-secret-at-least-32-chars-long-for-testing' \\"
echo "    -e BETTER_AUTH_URL='http://localhost:3000' \\"
echo "    -e ENCRYPTION_SECRET='Test123!@#\$%Encryption456&*()Secret789^&*With-Good-Entropy-64Chars!' \\"
echo "    ${IMAGE_NAME}:${VERSION}"
