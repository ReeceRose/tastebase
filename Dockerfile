FROM node:24-alpine AS base
# Install the pnpm version pinned in package.json's packageManager field.
COPY package.json /tmp/package.json
RUN npm install -g "$(node -p 'require("/tmp/package.json").packageManager')" && rm /tmp/package.json

# Install dependencies without scripts (avoids husky).
# better-sqlite3 needs no compile: its npm package ships linuxmusl-x64 and
# linuxmusl-arm64 binaries in prebuilds/, and it loads those first at runtime.
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile --prod=false --ignore-scripts

# Production dependencies only
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile --prod --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
# Provide dummy env vars for build (real values set at runtime)
ENV NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=1 \
    DATABASE_URL="file:/tmp/build.db" \
    BETTER_AUTH_SECRET="build-time-secret-min-32-chars-long" \
    BETTER_AUTH_URL="http://localhost:3000" \
    ENCRYPTION_SECRET="build-time-encryption-secret-must-be-64-chars-long-placeholder"
RUN pnpm build

# Production image - minimal runtime
FROM node:24-alpine AS runner

ARG VERSION=dev
ARG COMMIT=unknown

LABEL org.opencontainers.image.source="https://github.com/ReeceRose/tastebase" \
      org.opencontainers.image.title="Tastebase" \
      org.opencontainers.image.description="Self-hosted recipe manager for households and groups" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${COMMIT}"

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