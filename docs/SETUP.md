# Tastebase Setup Guide

This guide walks you through setting up Tastebase, a local-first recipe manager for a household or group. Tastebase runs on your own machine or server using Docker - no cloud dependencies, no subscriptions, just your recipes stored on hardware you control.

## Prerequisites

**For Docker deployment (recommended):**
- Docker with Docker Compose

**For development setup:**
- Node.js 22 or newer (24 recommended)
- pnpm (recommended) or npm
- Git

## Quick Start (Docker - Recommended)

**The easiest way to get started:**

1. **Download the Compose file and environment template:**
   ```bash
   mkdir tastebase && cd tastebase
   curl -O https://raw.githubusercontent.com/ReeceRose/tastebase/main/docker-compose.yml
   curl -o .env https://raw.githubusercontent.com/ReeceRose/tastebase/main/.env.docker.example
   ```

2. **Fill in `.env`:** run `openssl rand -base64 48` twice and paste one value into `BETTER_AUTH_SECRET` and the other into `ENCRYPTION_SECRET`. Set `BETTER_AUTH_URL` to the address you'll open Tastebase at.

3. **Start it:**
   ```bash
   docker compose up -d
   ```

4. **Open your `BETTER_AUTH_URL`** (e.g. [http://localhost:3000](http://localhost:3000)) and create the first account.

Your data is saved to Docker volumes and persists across restarts and upgrades. See [DEPLOYMENT.md](./DEPLOYMENT.md) for backups, updates and reverse proxies.

## Development Setup

If you want to modify the code or contribute:

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd tastebase
   pnpm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```bash
   # Database (Local SQLite file)
   DATABASE_URL="tastebase.db"
   
   # App Configuration
   
   # Authentication
   BETTER_AUTH_SECRET="your-super-secret-key-at-least-32-chars-long"
   BETTER_AUTH_URL="http://localhost:3000"
   BETTER_AUTH_TELEMETRY=0
   
   # File Storage
   UPLOAD_DIR="./uploads"
   MAX_FILE_SIZE="10485760"
   ```

3. **Fix better-sqlite3 (if needed)**
   
   If you encounter native binding errors:
   ```bash
   cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
   pnpm run build-release
   cd ../../../../..
   ```

4. **Database Setup**
   ```bash
   pnpm run db:migrate
   ```

5. **Start Development Server**
   ```bash
   pnpm run dev
   ```

## Development Workflow

### Database Operations

```bash
# Run migrations
pnpm run db:migrate

# Generate new migration from schema changes
pnpm run db:generate

# Open Drizzle Studio (database GUI)
pnpm run db:studio

# Seed development data
pnpm run db:seed
```

Seeding adds an example household (julia@, marco@ and sarah@example.com, password `tastebase-demo`) with a handful of recipes adapted from Serious Eats. It is safe to re-run: it only replaces `@example.com` members and their recipes, so your own account and recipes are left alone.

### Code Quality

```bash
# Run linting and formatting
pnpm run lint

# Type checking
pnpm run type-check

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch
```

### Codebase Health Monitoring

```bash
# Run all health checks
pnpm run health-check

# Quick critical checks only
pnpm run health-check:quick

# Find unused code
pnpm run unused-code

# Check for large files
pnpm run large-files

# Analyze import issues
pnpm run import-issues
```

## Project Structure

```
tastebase/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (dashboard)/     # Protected dashboard pages
│   │   └── (public)/        # Public pages (auth, landing)
│   ├── components/          # Shared UI components
│   │   ├── ui/             # ShadCN base components
│   │   └── dashboard/      # Dashboard layout components
│   ├── features/           # Feature-based architecture
│   │   ├── dashboard/      # Dashboard functionality
│   │   ├── profile/        # User profile management
│   │   ├── settings/       # App settings
│   │   └── recipes/        # Recipe management (to be implemented)
│   ├── db/                 # Database configuration
│   │   ├── schema.ts       # Main schema export
│   │   ├── schema.base.ts  # Base user schema
│   │   ├── schema.recipes.ts # Recipe schema
│   │   ├── index.ts        # Database connection
│   │   └── migrate.ts      # Migration runner
│   ├── lib/               # Shared utilities
│   └── proxy.ts           # Route protection
├── docs/                  # Documentation
├── scripts/              # Development and maintenance scripts
└── public/               # Static assets
```

## Key Features

### Recipe Management (Phase 1+)
- Create and edit recipes with ingredients, instructions, and notes
- Upload and manage recipe images
- Organize recipes with tags and categories
- Search recipes by name, ingredients, or tags

### User Profile
- Manage personal information and preferences
- Track cooking activity and favorite recipes
- Customize app settings and preferences

### Dashboard
- View recent recipes and cooking activity
- Quick access to frequently used recipes
- Recipe statistics and insights

## Database Schema

The application uses a modular database schema:

- **Base Schema** (`schema.base.ts`): User authentication and core data
- **Recipe Schema** (`schema.recipes.ts`): Recipe data, ingredients, instructions
- **Future Schemas**: Collections, meal planning, shopping lists

## Authentication

Tastebase uses BetterAuth for simple email/password authentication:

- Single-user focused (no organizations or teams)
- Secure session management
- Password reset functionality
- Remember me option

## File Storage

Recipe images and attachments are stored locally:

- Stored in `./uploads` (`/app/uploads` in Docker)
- Up to 10 MB per photo
- Automatic image optimization for web display
- Support for common image formats (JPG, PNG, WebP)

## Deployment

Use the published image, `ghcr.io/reecerose/tastebase`, as in the [Quick Start](#quick-start-docker---recommended). [DEPLOYMENT.md](./DEPLOYMENT.md) covers `docker run`, host folders, updates, backups and reverse proxies, and [DEPLOYMENT_UNRAID.md](./DEPLOYMENT_UNRAID.md) covers Unraid.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Contributing

1. Create a feature branch
2. Make your changes following the existing code style
3. Run `pnpm run health-check` to ensure code quality
4. Test your changes thoroughly
5. Submit a pull request

## Getting Help

- Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide
- Review the [CLAUDE.md](../CLAUDE.md) file for development guidance
- Use `pnpm run health-check` to diagnose common issues