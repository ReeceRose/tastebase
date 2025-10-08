# Tastebase Setup Guide

This guide walks you through setting up Tastebase, a local-first personal recipe management application. Tastebase runs on your computer using Docker - no cloud dependencies, no subscriptions, just your recipes stored securely on your own machine.

## Prerequisites

**For Docker deployment (recommended):**
- Docker and Docker Compose
- Git

**For development setup:**
- Node.js 18.17+ or 20.5+
- pnpm (recommended) or npm
- Git

## Quick Start (Docker - Recommended)

**The easiest way to get started:**

1. **Clone and start:**
   ```bash
   git clone <repository-url> tastebase
   cd tastebase
   docker-compose up -d
   ```

2. **Access your recipes:**
   Open [http://localhost:3000](http://localhost:3000) and start adding recipes!

Your data is automatically saved to Docker volumes and will persist even when you restart the container.

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
│   └── middleware/        # Authentication middleware
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

- Upload directory configurable via `UPLOAD_DIR`
- File size limits configurable via `MAX_FILE_SIZE`
- Automatic image optimization for web display
- Support for common image formats (JPG, PNG, WebP)

## Deployment

### Docker Deployment (Recommended)

**Production deployment with Docker:**

```bash
# Use docker-compose for easy deployment
docker-compose up -d

# Or build and run manually
docker build -t tastebase .
docker run -d \
  -p 3000:3000 \
  -v tastebase-data:/app/data \
  -v tastebase-uploads:/app/uploads \
  --name tastebase \
  tastebase
```

**Benefits of Docker deployment:**
- **Data persistence**: Your recipes are safely stored in Docker volumes
- **Easy updates**: Pull new versions without losing data
- **Isolation**: No conflicts with your system
- **Portability**: Run on any machine with Docker
- **Backup friendly**: Simply backup Docker volumes

**Managing your deployment:**
```bash
# Update to latest version
docker-compose pull && docker-compose up -d

# View logs
docker-compose logs -f

# Backup your data
docker run --rm -v tastebase-data:/data -v $(pwd):/backup alpine tar czf /backup/tastebase-backup.tar.gz -C /data .

# Stop the application
docker-compose down
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Development Phases

This application follows a phased development approach:

- **Phase 0**: ✅ Foundation & SaaS cleanup (completed)
- **Phase 1**: Recipe CRUD operations
- **Phase 2**: Enhanced recipe features (collections, tags)
- **Phase 3**: AI-powered features (ingredient suggestions, recipe generation)
- **Phase 4**: Advanced features (meal planning, shopping lists)
- **Phase 5**: Import/export and sharing features
- **Phase 6**: Mobile optimization and PWA features

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