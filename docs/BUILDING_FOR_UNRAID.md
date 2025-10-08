# Building Tastebase for Unraid (x86_64/AMD64)

This guide helps you build Tastebase Docker images on Apple Silicon (ARM64) for deployment on Unraid servers (x86_64/AMD64).

## Why Cross-Platform Builds?

- **Your Mac:** Apple Silicon (ARM64 architecture)
- **Unraid Server:** Intel/AMD CPU (x86_64/AMD64 architecture)
- **The Problem:** Docker images built on ARM64 won't work on AMD64
- **The Solution:** Docker Buildx for cross-platform compilation

## Quick Start

### 1. Setup Docker Buildx (One-Time)

```bash
./scripts/setup-buildx.sh
```

This creates a builder that can compile for multiple architectures.

### 2. Build for AMD64 (Unraid)

```bash
# Build for AMD64/x86_64 (Unraid)
./scripts/build-local.sh latest linux/amd64

# Or build and push to Docker Hub
./scripts/build-push.sh latest
```

## Understanding the Build Process

### Architecture Mapping

| Platform | Docker Platform Flag | Used By |
|----------|---------------------|---------|
| Apple Silicon | `linux/arm64` | M1/M2/M3 Macs |
| Intel/AMD | `linux/amd64` | Unraid, most servers |
| Raspberry Pi | `linux/arm/v7` or `linux/arm64` | RPi 3+/4/5 |

### Build Commands

**Single platform (AMD64 for Unraid):**
```bash
docker buildx build --platform linux/amd64 --load -t reecerose/tastebase:latest .
```

**Multi-platform (AMD64 + ARM64):**
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t reecerose/tastebase:latest --push .
```

**Note:** Multi-platform builds require `--push` (can't use `--load`). They must be pushed to a registry.

## Step-by-Step: Build for Unraid

### Option 1: Build Locally and Export

If you want to build and save the image without pushing to Docker Hub:

```bash
# 1. Setup buildx
./scripts/setup-buildx.sh

# 2. Build for AMD64
docker buildx build \
  --platform linux/amd64 \
  --load \
  -t tastebase:amd64 \
  .

# 3. Save to tar file
docker save tastebase:amd64 | gzip > tastebase-amd64.tar.gz

# 4. Copy to Unraid server
scp tastebase-amd64.tar.gz root@YOUR_UNRAID_IP:/tmp/

# 5. On Unraid, load the image
ssh root@YOUR_UNRAID_IP
docker load < /tmp/tastebase-amd64.tar.gz
```

### Option 2: Build and Push to Docker Hub (Recommended)

Much simpler - build once, pull anywhere:

```bash
# 1. Setup buildx
./scripts/setup-buildx.sh

# 2. Login to Docker Hub
docker login

# 3. Build and push for AMD64
./scripts/build-push.sh latest

# 4. On Unraid, simply pull
ssh root@YOUR_UNRAID_IP
docker pull reecerose/tastebase:latest
```

## Verifying the Build

### Check Image Architecture

```bash
# Inspect the image
docker buildx imagetools inspect reecerose/tastebase:latest

# Should show:
# - linux/amd64
# - linux/arm64 (if multi-platform build)
```

### Test AMD64 Image on Mac

You can test the AMD64 image on your Mac (it will use emulation):

```bash
# Pull AMD64 version specifically
docker pull --platform linux/amd64 reecerose/tastebase:latest

# Run it (will be slower due to emulation)
docker run --platform linux/amd64 -d -p 3000:3000 \
  -e DATABASE_URL="file:/app/data/tastebase.db" \
  -e BETTER_AUTH_SECRET="test-secret-at-least-32-chars-long-for-testing" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  -e ENCRYPTION_SECRET="Test123!@#\$%Encryption456&*()Secret789^&*With-Good-Entropy-64Chars!" \
  reecerose/tastebase:latest
```

## Troubleshooting

### Error: "multiple platforms feature is currently not supported"

**Solution:** Use `docker buildx` instead of `docker build`:
```bash
# Wrong
docker build --platform linux/amd64 .

# Correct
docker buildx build --platform linux/amd64 --load .
```

### Error: "failed to solve: no match for platform in manifest"

**Cause:** Trying to run an image built for a different architecture.

**Solution:** Ensure you built for the correct platform:
```bash
# Check what platform the image was built for
docker inspect reecerose/tastebase:latest | grep Architecture

# Rebuild for correct platform
./scripts/build-local.sh latest linux/amd64
```

### Error: "exec format error" when running on Unraid

**Cause:** Image was built for ARM64 but Unraid is AMD64.

**Solution:** Rebuild with explicit AMD64 platform:
```bash
./scripts/build-local.sh latest linux/amd64
./scripts/build-push.sh latest
```

### Better-sqlite3 Build Fails During Cross-Compile

**Symptoms:**
```
gyp ERR! build error
node-gyp: not found
```

**Solution:** The Dockerfile already handles this with:
1. Install build tools in the target platform
2. Run `npm install` inside better-sqlite3 directory
3. Compiles natively for the target architecture

If it still fails, verify build tools are installed:
```dockerfile
RUN apk add --no-cache libc6-compat python3 make g++
```

## Build Scripts Reference

### setup-buildx.sh
```bash
./scripts/setup-buildx.sh
```
- Creates and configures Docker Buildx builder
- Enables cross-platform compilation
- One-time setup

### build-local.sh
```bash
./scripts/build-local.sh [VERSION] [PLATFORM]

# Examples:
./scripts/build-local.sh latest linux/amd64     # For Unraid
./scripts/build-local.sh latest linux/arm64     # For Mac
./scripts/build-local.sh v1.0.0 linux/amd64     # Specific version
```
- Builds for single platform
- Loads into local Docker
- Good for testing

### build-push.sh
```bash
./scripts/build-push.sh [VERSION]

# Examples:
./scripts/build-push.sh latest
./scripts/build-push.sh v1.0.0
```
- Builds for multiple platforms (AMD64 + ARM64)
- Pushes to Docker Hub
- Recommended for production

### release.sh
```bash
./scripts/release.sh [VERSION]

# Example:
./scripts/release.sh v1.0.0
```
- Full release with multiple tags
- Multi-platform build
- Pushes to Docker Hub

## Recommended Workflow for Unraid

1. **Development on Mac (ARM64):**
   ```bash
   # Test locally on Mac
   docker compose up -d
   ```

2. **Build for Unraid (AMD64):**
   ```bash
   # One-time setup
   ./scripts/setup-buildx.sh

   # Build and push
   docker login
   ./scripts/build-push.sh latest
   ```

3. **Deploy on Unraid:**
   ```bash
   # Update docker-compose.yml to use your image
   image: reecerose/tastebase:latest

   # Pull and start
   docker compose pull
   docker compose up -d
   ```

## Performance Notes

### Build Times

- **Native build (ARM64 on Mac):** ~2-3 minutes
- **Cross-compile (AMD64 on Mac):** ~5-8 minutes (due to emulation)
- **Multi-platform build:** ~8-12 minutes (builds both)

### Runtime Performance

- **Native:** Full CPU performance
- **Emulated:** 20-50% slower (don't run AMD64 images on Mac for production)
- **On Unraid:** Full performance when using AMD64 images

## Best Practices

1. ✅ **Always build for AMD64 when targeting Unraid**
2. ✅ **Use multi-platform builds for Docker Hub** (supports both Mac and Unraid users)
3. ✅ **Test locally on Mac with ARM64 first** (faster iteration)
4. ✅ **Use Docker Hub for deployment** (easier than tar files)
5. ❌ **Don't run AMD64 images on Mac for production** (use emulation only for testing)

## FAQ

**Q: Can I build on Unraid instead?**
A: Yes! Building on Unraid is actually simpler since it's native AMD64. Just clone the repo and run `docker build .` or `docker compose up -d --build`.

**Q: Do I need to build for both platforms?**
A: No, if you only use Unraid, just build AMD64. Multi-platform is for publishing to Docker Hub for other users.

**Q: How do I know if I built the right architecture?**
A: Check with `docker inspect IMAGE_NAME | grep Architecture`. Should show `amd64` for Unraid.

**Q: The build is slow on my Mac, why?**
A: Cross-compiling for AMD64 on ARM64 uses QEMU emulation. It's normal for it to be 2-3x slower. Consider using GitHub Actions for automated builds.

## Next Steps

- ✅ Set up buildx: `./scripts/setup-buildx.sh`
- ✅ Build for AMD64: `./scripts/build-local.sh latest linux/amd64`
- ✅ Push to Docker Hub: `./scripts/build-push.sh latest`
- ✅ Deploy on Unraid: See `docs/DEPLOYMENT_UNRAID.md`
