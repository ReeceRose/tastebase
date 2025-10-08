# Quick Build Commands for Tastebase

## 🎯 For Unraid Deployment (AMD64/x86_64)

### One-Time Setup
```bash
./scripts/setup-buildx.sh
```

### Build for AMD64 (Unraid)
```bash
# Build locally for testing
./scripts/build-local.sh latest linux/amd64

# Or build and push to Docker Hub
docker login
./scripts/build-push.sh latest
```

### Deploy to Unraid
```bash
# Method 1: Using Docker Hub (recommended)
ssh root@YOUR_UNRAID_IP
docker pull reecerose/tastebase:latest
cd /mnt/user/appdata/tastebase
docker compose up -d

# Method 2: Export and import
docker save reecerose/tastebase:latest | gzip > tastebase.tar.gz
scp tastebase.tar.gz root@YOUR_UNRAID_IP:/tmp/
ssh root@YOUR_UNRAID_IP 'docker load < /tmp/tastebase.tar.gz'
```

## 🚀 Architecture Reference

| Your System | Target System | Build Command |
|------------|---------------|---------------|
| Mac M1/M2/M3 | Unraid (Intel/AMD) | `./scripts/build-local.sh latest linux/amd64` |
| Mac M1/M2/M3 | Mac (local test) | `./scripts/build-local.sh latest linux/arm64` |
| Any | Docker Hub (both) | `./scripts/build-push.sh latest` |

## 📦 Build Scripts

```bash
# Setup (one-time)
./scripts/setup-buildx.sh

# Build for single platform
./scripts/build-local.sh [VERSION] [PLATFORM]
./scripts/build-local.sh latest linux/amd64     # For Unraid
./scripts/build-local.sh latest linux/arm64     # For Mac

# Build and push multi-platform
./scripts/build-push.sh [VERSION]
./scripts/build-push.sh latest

# Full release with version tags
./scripts/release.sh [VERSION]
./scripts/release.sh v1.0.0
```

## ✅ Current Setup

- **Your Mac:** Apple Silicon (ARM64)
- **Unraid Server:** x86_64 (AMD64)
- **Buildx Platforms:** ✅ linux/amd64, linux/arm64 supported
- **Default Build Target:** linux/amd64 (for Unraid)

## 🔍 Verify Build

```bash
# Check architecture of built image
docker inspect reecerose/tastebase:latest | grep Architecture

# For Docker Hub images
docker buildx imagetools inspect reecerose/tastebase:latest
```

## 📚 Documentation

- **Cross-platform builds:** `docs/BUILDING_FOR_UNRAID.md`
- **Docker Hub deployment:** `docs/DOCKER_BUILD_PUSH.md`
- **Unraid setup:** `docs/DEPLOYMENT_UNRAID.md`
- **Troubleshooting:** `docs/DOCKER_TROUBLESHOOTING.md`
