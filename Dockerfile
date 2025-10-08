FROM node:24-alpine AS base

# Install dependencies only when needed
# Note: Alpine uses musl libc, not glibc. better-sqlite3 must be compiled from source.
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install dependencies without scripts first (avoids husky)
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile --prod=false --ignore-scripts

# Compile better-sqlite3 from source (required for Alpine/musl)
RUN corepack enable pnpm && \
    cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && \
    npm run build-release

# Production dependencies only
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile --prod --ignore-scripts

# Compile better-sqlite3 from source (required for Alpine/musl)
RUN corepack enable pnpm && \
    cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && \
    npm run build-release

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Verify better-sqlite3 was built in deps stage and check if it exists
RUN ls -la /app/node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/build/ || echo "No build directory found"

# Build the application
# Provide dummy env vars for build (real values set at runtime)
ENV NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=1 \
    DATABASE_URL="file:/tmp/build.db" \
    BETTER_AUTH_SECRET="build-time-secret-min-32-chars-long" \
    BETTER_AUTH_URL="http://localhost:3000" \
    ENCRYPTION_SECRET="build-time-encryption-secret-must-be-64-chars-long-placeholder"
RUN corepack enable pnpm && pnpm build

# Production image - minimal runtime
FROM node:24-alpine AS runner

# Install only runtime dependencies
RUN apk add --no-cache dumb-init && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy built application (standalone includes required dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy only runtime-required external packages (defined in serverExternalPackages)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules/.pnpm/@node-rs+argon2@* ./node_modules/.pnpm/
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules/.pnpm/pino@* ./node_modules/.pnpm/
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules/.pnpm/pino-pretty@* ./node_modules/.pnpm/
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules/.pnpm/better-sqlite3@* ./node_modules/.pnpm/

# Copy pnpm structure files for module resolution
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules/.modules.yaml ./node_modules/
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules/.pnpm/node_modules ./node_modules/.pnpm/node_modules

# Create symlinks for external packages (pnpm structure)
RUN ln -s .pnpm/better-sqlite3@*/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Copy database migrations (required for auto-migration via instrumentation.ts)
COPY --from=builder --chown=nextjs:nodejs /app/src/db/migrations ./src/db/migrations

# Create volume mount points
RUN mkdir -p /app/data /app/uploads && \
    chown nextjs:nodejs /app/data /app/uploads

# Define volumes for persistent data
VOLUME ["/app/data", "/app/uploads"]

USER nextjs
EXPOSE 3000

# Use dumb-init for proper signal handling
# Migrations run automatically via instrumentation.ts
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]