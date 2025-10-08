# Building and Publishing Tastebase Docker Images

This guide covers building Tastebase Docker images and publishing them to Docker Hub for easy deployment.

## Prerequisites

- Docker installed and running
- Docker Hub account (free tier works fine)
- Git repository with Tastebase source code
- Terminal/command line access

## Quick Start

```bash
# Login to Docker Hub
docker login

# Build and push latest
docker buildx build --platform linux/amd64,linux/arm64 \
  -t reecerose/tastebase:latest \
  --push .

# Build specific version
docker buildx build --platform linux/amd64,linux/arm64 \
  -t reecerose/tastebase:v1.0.0 \
  -t reecerose/tastebase:latest \
  --push .
```

## Step-by-Step Guide

### 1. Create Docker Hub Repository

1. Go to [Docker Hub](https://hub.docker.com/)
2. Sign in or create account
3. Click **Create Repository**
4. Repository details:
   - **Name**: `tastebase`
   - **Description**: "Local-first recipe management for shared instances"
   - **Visibility**: Public (or Private if preferred)
5. Click **Create**

Your repository will be at: `docker.io/reecerose/tastebase`

### 2. Login to Docker Hub

```bash
# Login (will prompt for username/password)
docker login

# Or use access token (recommended for CI/CD)
docker login -u reecerose -p YOUR_ACCESS_TOKEN
```

**Generate Access Token (recommended):**
1. Docker Hub → Account Settings → Security
2. Click **New Access Token**
3. Name: `tastebase-build`
4. Permissions: Read & Write
5. Copy token (save securely!)

### 3. Set Up Multi-Platform Builds

Tastebase supports both AMD64 (Intel/AMD) and ARM64 (Apple Silicon, Raspberry Pi) architectures.

```bash
# Create buildx builder (one-time setup)
docker buildx create --name tastebase-builder --use
docker buildx inspect --bootstrap

# Verify platforms
docker buildx inspect --bootstrap
```

You should see: `linux/amd64, linux/arm64, linux/arm/v7`

### 4. Build Single-Platform Image (Quick)

For testing or single-architecture deployments:

```bash
# Build for your current platform only
docker build -t reecerose/tastebase:latest .

# Test locally
docker run -d -p 3000:3000 \
  -e BETTER_AUTH_SECRET="test-secret-at-least-32-chars-long" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  -e ENCRYPTION_SECRET="test-encryption-secret-must-be-exactly-64-characters-long-abc" \
  reecerose/tastebase:latest

# Verify it works
curl http://localhost:3000/api/health

# Push to Docker Hub
docker push reecerose/tastebase:latest
```

### 5. Build Multi-Platform Image (Recommended)

Build once, run on AMD64 and ARM64:

```bash
# Build and push for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t reecerose/tastebase:latest \
  --push .
```

**With version tag:**

```bash
# Tag as both version and latest
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t reecerose/tastebase:v1.0.0 \
  -t reecerose/tastebase:latest \
  --push .
```

### 6. Verify Your Published Image

```bash
# Check image exists on Docker Hub
docker pull reecerose/tastebase:latest

# Inspect supported platforms
docker buildx imagetools inspect reecerose/tastebase:latest

# Should show:
# - linux/amd64
# - linux/arm64
```

## Versioning Strategy

Follow semantic versioning for releases:

| Tag | Purpose | Example |
|-----|---------|---------|
| `latest` | Latest stable release | Always points to newest version |
| `v1.0.0` | Specific version | Pin to exact version |
| `v1.0` | Minor version | Auto-updates patches (1.0.x) |
| `v1` | Major version | Auto-updates minor/patches (1.x.x) |
| `dev` | Development builds | Bleeding edge, may be unstable |
| `sha-abc123` | Git commit | Exact commit builds |

### Version Tagging Example

```bash
# For release v1.2.3
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t reecerose/tastebase:v1.2.3 \
  -t reecerose/tastebase:v1.2 \
  -t reecerose/tastebase:v1 \
  -t reecerose/tastebase:latest \
  --push .
```

## Build Scripts

### Local Build Script

Create `scripts/build-local.sh`:

```bash
#!/bin/bash
set -e

VERSION=${1:-latest}
IMAGE_NAME="reecerose/tastebase"

echo "Building ${IMAGE_NAME}:${VERSION} for local platform..."

docker build \
  -t ${IMAGE_NAME}:${VERSION} \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VERSION=${VERSION} \
  .

echo "✅ Build complete: ${IMAGE_NAME}:${VERSION}"
echo "Test with: docker run -d -p 3000:3000 ${IMAGE_NAME}:${VERSION}"
```

Usage:
```bash
chmod +x scripts/build-local.sh
./scripts/build-local.sh v1.0.0
```

### Multi-Platform Build and Push Script

Create `scripts/build-push.sh`:

```bash
#!/bin/bash
set -e

VERSION=${1:-latest}
IMAGE_NAME="reecerose/tastebase"
PLATFORMS="linux/amd64,linux/arm64"

echo "Building ${IMAGE_NAME}:${VERSION} for ${PLATFORMS}..."

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
echo "Verify with: docker buildx imagetools inspect ${IMAGE_NAME}:${VERSION}"
```

Usage:
```bash
chmod +x scripts/build-push.sh

# Build latest
./scripts/build-push.sh latest

# Build version
./scripts/build-push.sh v1.0.0
```

### Release Build Script

Create `scripts/release.sh`:

```bash
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
  echo "Error: Version must be in format v1.2.3"
  exit 1
fi

# Extract version parts
MAJOR=$(echo $VERSION | cut -d. -f1)
MINOR=$(echo $VERSION | cut -d. -f1,2)

echo "🚀 Releasing Tastebase ${VERSION}"
echo "   - ${IMAGE_NAME}:${VERSION}"
echo "   - ${IMAGE_NAME}:${MINOR}"
echo "   - ${IMAGE_NAME}:${MAJOR}"
echo "   - ${IMAGE_NAME}:latest"

# Confirm
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Ensure builder exists
docker buildx create --name tastebase-builder --use 2>/dev/null || docker buildx use tastebase-builder

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
```

Usage:
```bash
chmod +x scripts/release.sh
./scripts/release.sh v1.0.0
```

## GitHub Actions CI/CD

Automate builds with GitHub Actions.

Create `.github/workflows/docker-build.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

env:
  IMAGE_NAME: reecerose/tastebase

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha,prefix=sha-

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VERSION=${{ github.ref_name }}

      - name: Update Docker Hub description
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: peter-evans/dockerhub-description@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
          repository: ${{ env.IMAGE_NAME }}
          readme-filepath: ./README.md
```

**Setup GitHub Secrets:**

1. Go to repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub access token

## Build Optimization

### Enable BuildKit Cache

```bash
# Use GitHub Actions cache
docker buildx build \
  --cache-from type=registry,ref=reecerose/tastebase:buildcache \
  --cache-to type=registry,ref=reecerose/tastebase:buildcache,mode=max \
  -t reecerose/tastebase:latest \
  --push .
```

### Build Arguments

Add build metadata:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VERSION=v1.0.0 \
  --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) \
  -t reecerose/tastebase:v1.0.0 \
  --push .
```

Update Dockerfile to accept args:

```dockerfile
FROM node:24-alpine AS base
ARG BUILD_DATE
ARG VERSION
ARG GIT_COMMIT

LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
```

## Testing Your Image

### Basic Functionality Test

```bash
# Pull your image
docker pull reecerose/tastebase:latest

# Run with minimal config
docker run -d --name tastebase-test -p 3000:3000 \
  -e DATABASE_URL="file:/app/data/tastebase.db" \
  -e BETTER_AUTH_SECRET="test-secret-at-least-32-chars-long-for-testing" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  -e ENCRYPTION_SECRET="Test123!@#\$%Encryption456&*()Secret789^&*With-Good-Entropy-64Chars!" \
  reecerose/tastebase:latest

# Wait for startup
sleep 10

# Test health endpoint
curl http://localhost:3000/api/health

# Check logs
docker logs tastebase-test

# Cleanup
docker stop tastebase-test
docker rm tastebase-test
```

### Full Integration Test

```bash
# Use docker-compose with your published image
cat > docker-compose.test.yml <<EOF
services:
  tastebase:
    image: reecerose/tastebase:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/tastebase.db
      - BETTER_AUTH_SECRET=test-secret-at-least-32-chars-long-for-testing
      - BETTER_AUTH_URL=http://localhost:3000
      - ENCRYPTION_SECRET=Test123!@#$%Encryption456&*()Secret789^&*With-Good-Entropy-64Chars!
    volumes:
      - test-data:/app/data
      - test-uploads:/app/uploads

volumes:
  test-data:
  test-uploads:
EOF

# Run tests
docker compose -f docker-compose.test.yml up -d
sleep 10
curl http://localhost:3000/api/health
docker compose -f docker-compose.test.yml down -v
```

## Troubleshooting

### Build Fails

**Error: "failed to solve: platform not supported"**
```bash
# Ensure buildx is set up
docker buildx ls
docker buildx create --name tastebase-builder --use
```

**Error: "failed to push: denied"**
```bash
# Re-login to Docker Hub
docker logout
docker login
```

### Push Fails

**Error: "unauthorized: authentication required"**
```bash
# Check you're logged in
docker login

# Verify repository exists on Docker Hub
# Ensure repository name matches exactly
```

### Multi-Platform Issues

**ARM64 build fails:**
```bash
# Install QEMU for cross-platform builds
docker run --privileged --rm tonistiigi/binfmt --install all

# Verify
docker buildx inspect --bootstrap
```

## Best Practices

### Image Size Optimization

Current Dockerfile is already optimized with:
- ✅ Multi-stage builds
- ✅ Alpine base image
- ✅ Production-only dependencies
- ✅ Standalone Next.js output
- ✅ .dockerignore for build context

**Check image size:**
```bash
docker images reecerose/tastebase
# Target: < 500MB
```

### Security Scanning

```bash
# Scan with Docker Scout
docker scout cves reecerose/tastebase:latest

# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image reecerose/tastebase:latest
```

### Tag Management

- ✅ Always tag with version numbers
- ✅ Use `latest` for newest stable
- ✅ Never delete tags (breaks deployments)
- ✅ Create `dev` tag for unstable builds
- ❌ Don't overwrite version tags

### Documentation

Update your Docker Hub repository description:
1. Go to Docker Hub → Your Repository
2. Click **Description** tab
3. Add:
   - Quick start instructions
   - Environment variables
   - Volume paths
   - Links to full documentation

## Updating Deployment Docs

After publishing to Docker Hub, update your deployment guides to use the published image:

**docker-compose.yml:**
```yaml
services:
  tastebase:
    image: reecerose/tastebase:latest  # Changed from build: .
    # ... rest of config
```

**Unraid/Docker template:**
```
Repository: reecerose/tastebase:latest
```

This simplifies deployment - users don't need to build locally!

## Next Steps

1. ✅ Build and test image locally
2. ✅ Push to Docker Hub
3. ✅ Set up GitHub Actions for automated builds
4. ✅ Update deployment docs with Docker Hub image
5. ✅ Test deployment on Unraid with published image
6. ✅ Create release tags for versioning

## Resources

- [Docker Hub](https://hub.docker.com/)
- [Docker Buildx Docs](https://docs.docker.com/buildx/working-with-buildx/)
- [Multi-Platform Builds](https://docs.docker.com/build/building/multi-platform/)
- [GitHub Actions Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
