# Tastebase

A simple, local-first recipe management application designed for shared instances. Keep your group's recipes organized and accessible on your own server with Docker deployment - no cloud dependencies, no subscriptions, just your shared recipe collection stored locally and securely.

## 🚀 Features

- **🏠 Local-First** - Everything stored on your server, no cloud dependencies
- **🧺 Made for a household** - Everyone on the instance shares recipes, leaves notes and sees what the house has been cooking
- **📥 Recipe Import** - Paste a link, the text or a photo of a cookbook page. Works without AI; optionally add OpenAI, Anthropic, Google or a local Ollama model to tidy up messy imports
- **✍️ One editor** - Paste whole ingredient lists or steps, autosaved drafts on your device, photos, tags and a colour for every recipe
- **👩‍🍳 Cook mode** - Full-screen steps, timers, ingredient tick-offs and a screen that stays on
- **⚖️ Scaling and units** - Scale servings up or down and switch metric/imperial on any recipe
- **🔍 Search & Filter** - Search names, ingredients, steps and notes; filter by cook, time, difficulty, cuisine and tag
- **📝 House notes and ratings** - Leave notes for everyone, or keep them to yourself
- **🏡 Home** - New recipes from the house, what you opened last, what's not been made in a while, and recent activity
- **🔐 Sharing Controls** - Share a recipe with the house or keep it only visible to you
- **📱 Responsive Design** - Sidebar on desktop, bottom tab bar on phones
- **🌙 Light and dark** - Follows your device or your choice
- **💾 SQLite Database** - Reliable local storage; migrations run automatically on start
- **🐳 Docker Deployment** - Run locally with one simple command

## 🏗️ Tech Stack

- **Framework**: Next.js 16 with App Router and Server Actions
- **AI (optional)**: Vercel AI SDK 7 for recipe import cleanup
- **Authentication**: BetterAuth (simple email/password)
- **Database**: SQLite + Drizzle ORM (local file storage)
- **File Storage**: Local filesystem for recipe images
- **UI**: Tailwind CSS + ShadCN/UI components
- **Deployment**: Docker with persistent volumes
- **Development**: TypeScript, Vitest, Biome

## 🛠️ Quick Start

### Prerequisites

- Node.js 24 (22 or newer is required; the Docker image uses 24)
- pnpm
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url> recipe-app
   cd recipe-app
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```
   
   **If better-sqlite3 fails to install**, manually build it:
   ```bash
   cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
   pnpm run build-release
   cd ../../../../..
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables (see [Environment Variables](#environment-variables) section).

4. **Database setup:**
   ```bash
   pnpm run db:migrate
   pnpm run db:seed
   ```
   Migrations also run automatically whenever the server starts, so after pulling updates you can just restart.

5. **Start development server:**
   ```bash
   pnpm run dev
   ```

6. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Deployment (Recommended)

**The easiest way to run Tastebase is with Docker:**

1. **Pull and run the latest release:**
   ```bash
   docker pull reecerose/tastebase:latest
   docker-compose up -d
   ```

2. **Access your recipes:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Your data is safe:**
   All recipes and images are stored in Docker volumes and persist between restarts.

### Docker Image Versions

Tastebase releases follow semantic versioning with multiple tag options:

```bash
# Latest stable release (recommended)
docker pull reecerose/tastebase:latest

# Specific version (for pinning)
docker pull reecerose/tastebase:v1.0.0
docker pull reecerose/tastebase:1.0    # Minor version
docker pull reecerose/tastebase:1      # Major version

# Specific commit (for testing)
docker pull reecerose/tastebase:sha-abc123
```

**Updating to a new release:**
```bash
docker-compose pull  # Pull latest images
docker-compose up -d # Restart with new version
```

### Why Docker?

- **Zero configuration** - Works out of the box
- **Data persistence** - Your recipes are safely stored in volumes
- **Easy updates** - Pull new versions without losing data
- **Isolated environment** - No conflicts with your system
- **Cross-platform** - Runs the same on Windows, Mac, and Linux

## 📁 Project Structure

```
recipe-app/
├── src/
│   ├── app/
│   │   ├── (public)/          # Unauthenticated pages
│   │   │   └── auth/          # Sign-in/sign-up pages
│   │   ├── profile/           # Protected profile page
│   │   ├── api/               # API routes and webhooks
│   │   └── page.tsx           # Main dashboard page
│   ├── components/            # UI components organized by purpose
│   │   ├── ui/                # ShadCN base components
│   │   ├── layout/            # Dashboard layout components
│   │   ├── auth/              # Authentication components
│   │   ├── forms/             # All form components
│   │   ├── lists/             # List and table components
│   │   ├── cards/             # Card components
│   │   ├── skeletons/         # Loading state components
│   │   └── theme/             # Theme components
│   ├── lib/                   # Utilities organized by category
│   │   ├── auth/              # Authentication & user management
│   │   ├── config/            # Configuration files
│   │   ├── logging/           # Logging utilities
│   │   └── utils/             # General utilities
│   └── proxy.ts               # Route protection
├── db/                        # Database schema and migrations
├── docs/                      # Documentation
├── uploads/                   # Recipe images storage
└── public/                    # Static assets
```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="file:./recipes.db"

# Authentication (BetterAuth)
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# API Key Encryption (Required for AI features)
ENCRYPTION_SECRET="your-separate-64-character-encryption-secret"
CURRENT_ENCRYPTION_VERSION=1

# AI Services (Choose one)
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# App Configuration
NODE_ENV="development"
```

### 🔐 Security Setup

**Generate secure encryption key:**
```bash
# Generate a 64-character encryption secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ Security Requirements:**
- `ENCRYPTION_SECRET` must be **different** from `BETTER_AUTH_SECRET`
- Must be at least 32 characters (64 recommended)
- Must have good entropy and character variety
- **Never commit secrets to version control**
- Store securely in production environments

### Required vs Optional

**Required for basic functionality:**
- `DATABASE_URL` - SQLite database file path
- `BETTER_AUTH_SECRET` - Authentication secret key
- `BETTER_AUTH_URL` - Application URL for auth callbacks

**Required for AI features:**
- `ENCRYPTION_SECRET` - Secure API key encryption
- `OPENAI_API_KEY` OR `ANTHROPIC_API_KEY` - For recipe parsing

**Optional:**
- `UPLOAD_DIR` - Custom upload directory (defaults to ./uploads)
- `MAX_FILE_SIZE` - Max file size in bytes (defaults to 10MB)
- `CURRENT_ENCRYPTION_VERSION` - Key rotation version (defaults to 1)

## 🎯 Available Scripts

```bash
# Development
pnpm dev                 # Start development server
pnpm build              # Build for production
pnpm start              # Start production server

# Database
pnpm db:generate        # Generate migration from schema changes
pnpm db:migrate         # Run pending migrations
pnpm db:seed            # Seed development data
pnpm db:studio          # Open Drizzle Studio

# Testing
pnpm test               # Run unit tests
pnpm test:coverage      # Run tests with coverage
pnpm test:watch         # Run tests in watch mode

# Code Quality
pnpm lint               # Run linting
pnpm type-check         # Run TypeScript checks

# Docker
docker-compose up -d    # Start with Docker
docker-compose down     # Stop Docker containers
docker-compose logs     # View container logs

# Deployment
docker build -t recipe-app .  # Build Docker image
```

## 🍳 Recipe Management Features

### Core Recipe Operations
- **Create Recipes** - Manual entry with structured forms
- **Import Recipes** - From links, pasted text or photos, with optional AI
- **Edit & Update** - Full recipe editing with validation
- **Delete Recipes** - Safe deletion with confirmation
- **Recipe Validation** - Ensure all required fields are present

### Recipe Import
- **Link Import** - Reads recipe data from most recipe sites, then falls back to the page text
- **Text Import** - Paste a recipe and it is split into ingredients and steps
- **Photo Import** - OCR on the server, or an AI vision model if you've added one
- **Review in the editor** - Imports open in the editor so you can check everything before saving
- **Optional AI tidy-up** - If an AI provider is set up, one click cleans up a messy import

### Search & Organization
- **Search** - Names, ingredients, steps and notes
- **Filters** - Cook, total time, difficulty, cuisine, tag and who can see it
- **Tags** - Coloured tag tiles with counts and previews
- **Sorting** - Newest, top rated, quickest, A to Z, recently changed
- **Favourites and recent** - Your saved recipes and the ones you opened last

### User Experience
- **Recipe tiles** - Every recipe gets a colour, so the collection is easy to scan even without photos
- **Recipe page** - Ingredients with tick-offs and scaling, numbered steps, notes from the house
- **Cook mode** - One step at a time with timers
- **Dark/Light Mode** - Theme switching for comfortable cooking
- **Responsive Design** - Works perfectly on desktop and mobile

## 🗃️ Database Schema

The database uses a modular schema approach with SQLite:

- `db/schema.base.ts` - Base user schema (BetterAuth integration)
- `db/schema.recipes.ts` - Recipe management tables
- `db/schema.ts` - Main export combining all schemas

### Current Tables

**Users** (`schema.base.ts`):
- User profiles with BetterAuth integration
- Authentication settings and preferences
- Activity timestamps and metadata

**Recipes** (`schema.recipes.ts`):
- `recipes` - Main recipe data (title, description, times, etc.)
- `ingredients` - Recipe ingredients with quantities and units
- `steps` - Step-by-step cooking instructions
- `tags` - Recipe categorization tags
- `notes` - User notes and cooking tips
- `images` - Recipe image metadata and file paths
- `recipe_favorites`, `recipe_views` - Favourites and recently opened recipes
- `recipe_cooks` - When someone finished a recipe in cook mode or marked it cooked
- `recipe_modifications` - A short history of edits, shown in the house activity feed

**Relationships:**
- One-to-many: Recipe → Ingredients, Steps, Tags, Notes, Images
- Many-to-many: Recipe ↔ Tags (via junction table)

## 🔐 Authentication Flow

1. Users sign up/in via BetterAuth components
2. The proxy protects dashboard routes (`src/proxy.ts`)
3. **Single-user system**: Personal recipe collection with secure access
4. **Session management**: Persistent login sessions with secure cookies

### BetterAuth Integration
- **Email/password authentication**: Simple, secure login system
- **Session management**: Secure session handling with automatic renewal
- **User profiles**: Basic user information and preferences
- **Route protection**: Automatic redirect to login for protected routes

## 🐳 Docker Deployment

The application is designed for easy self-hosting with Docker:

- **One-command deployment** - `docker-compose up -d`
- **Persistent storage** - SQLite database and uploads preserved across restarts
- **Volume mounting** - Data stored in Docker volumes for easy backup
- **Environment configuration** - All settings via environment variables
- **Production ready** - Optimized Docker image for production use

### Docker Configuration
- **Multi-stage build** - Optimized production image
- **Volume persistence** - Database and uploads survive container restarts
- **Health checks** - Automatic container health monitoring
- **Easy updates** - Simple pull and restart for updates

## 🧪 Testing

Tests are organized by feature and type:
- Unit tests for utilities and server actions
- Component tests for UI interactions
- Integration tests for complete recipe workflows
- AI parsing tests for import functionality

## 🚢 Deployment

### Docker Deployment (Recommended)

1. **Build the Docker image:**
   ```bash
   docker build -t recipe-app .
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000)

### Self-Hosting Options

- **VPS/Cloud Server** - Deploy on any Linux server with Docker
- **Home Server** - Perfect for personal use on home network
- **NAS Systems** - Compatible with Synology, QNAP, etc.
- **Raspberry Pi** - Lightweight deployment for personal use

## 📖 Adding New Features

Follow this systematic approach for consistent feature development:

### 1. Plan Your Feature
- Define the feature scope and requirements
- Identify database schema needs
- Plan UI components and user flows
- Consider recipe-specific requirements

### 2. Database Schema
```bash
# Create feature-specific schema
touch db/schema.<feature-name>.ts

# Add tables using Drizzle syntax
export const myFeatureTable = sqliteTable("my_feature", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  // ... other fields
});

# Export in main schema file
# Add to db/schema.ts: export * from './schema.<feature-name>';
```

### 3. Generate and Apply Migration
```bash
pnpm run db:generate  # Creates migration files
pnpm run db:migrate   # Applies to database
```

### 4. Create Component Structure
```bash
mkdir -p src/components/forms src/components/cards src/components/lists src/components/skeletons
```

### 5. Implement Server Actions
```typescript
// src/lib/server-actions/<feature-name>-actions.ts
"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";

export async function createMyFeature(data: FormData) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  // Implementation here
}
```

### 6. Build UI Components
- Create form components in `components/forms/`
- Create list components in `components/lists/`
- Create card components in `components/cards/`
- Add skeleton components in `components/skeletons/`
- Follow existing patterns for consistency
- Use Suspense with skeleton fallbacks

### 7. Add Routes and Navigation
```typescript
// src/app/<feature>/page.tsx
import { Suspense } from "react";
import { MyFeatureList } from "@/components/lists/my-feature-list";
import { MyFeatureSkeleton } from "@/components/skeletons/my-feature-skeleton";

export default function MyFeaturePage() {
  return (
    <Suspense fallback={<MyFeatureSkeleton />}>
      <MyFeatureList />
    </Suspense>
  );
}
```

### 8. Update Navigation
Add your feature to the main layout navigation or create appropriate navigation links

### 9. Add Tests
```bash
# Create test files alongside components and server actions
# __tests__/ directories for comprehensive testing
```

### 10. Documentation
Update relevant documentation files:
- Add to `docs/features.md` if it's a major feature
- Update API documentation if exposing new endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📚 Documentation

Documentation lives in the `docs/` directory:

- **[Setup Guide](docs/SETUP.md)** - Installation and local development
- **[Environment Variables](docs/environment-variables.md)** - Every setting and how to generate secrets
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Docker deployment, plus [Unraid](docs/DEPLOYMENT_UNRAID.md)
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and fixes
- **[Design System](docs/design-system.md)** - Colours, type, components and patterns for the UI
- **[Architecture Guide](docs/architecture.md)** - How the code is organized
- **[Development Guide](docs/DEVELOPMENT.md)** - Workflows, code quality and debugging
- **[Security](docs/security/README.md)** - Encryption of stored AI keys and key rotation

## 🎯 Quick Links

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **PRD**: [Product Requirements Document](docs/plans/PRD.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built for home cooks and cooking enthusiasts** 🍳

This recipe app is designed to be your group's shared recipe collection: import from anywhere, cook from a clear full-screen view, and keep notes together. Perfect for families, roommates, cooking clubs, restaurants, or any group who wants to organize recipes together with privacy controls for personal recipes.

### Why Choose This Recipe App?

- ✅ **Import from anywhere** - Links, pasted text or photos, with optional AI
- ✅ **Beautiful UI** - Modern, responsive design that's a joy to use
- ✅ **Self-Hosted** - Your data stays on your server
- ✅ **Complete Workflow** - From import to cooking with notes and tips
- ✅ **Docker Ready** - One-command deployment
- ✅ **Open Source** - MIT licensed for community use
- ✅ **Type Safe** - Full TypeScript implementation
- ✅ **Modern Stack** - Latest Next.js, React, and best practices