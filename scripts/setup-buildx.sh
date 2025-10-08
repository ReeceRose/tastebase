#!/bin/bash
set -e

echo "🔧 Setting up Docker Buildx for cross-platform builds..."
echo ""

# Check if buildx is available
if ! docker buildx version &> /dev/null; then
    echo "❌ Error: Docker Buildx is not available"
    echo "Please update Docker Desktop to the latest version"
    exit 1
fi

echo "✓ Docker Buildx is available"

# Check if builder exists
if docker buildx inspect tastebase-builder &> /dev/null; then
    echo "✓ Builder 'tastebase-builder' already exists"
    docker buildx use tastebase-builder
else
    echo "Creating new builder 'tastebase-builder'..."
    docker buildx create --name tastebase-builder --use
fi

# Bootstrap the builder
echo "Bootstrapping builder..."
docker buildx inspect --bootstrap

# Show supported platforms
echo ""
echo "✅ Builder configured successfully!"
echo ""
echo "Supported platforms:"
docker buildx inspect --bootstrap | grep "Platforms:" || true

echo ""
echo "Ready to build! Use:"
echo "  ./scripts/build-local.sh latest linux/amd64    # For x86_64/Unraid"
echo "  ./scripts/build-push.sh latest                 # Multi-platform push to Docker Hub"
