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

## 🐳 Run Tastebase with Docker

Tastebase is published as a Docker image for `linux/amd64` and `linux/arm64` (Apple Silicon, Raspberry Pi 4/5) at `ghcr.io/reecerose/tastebase`.

1. **Grab the Compose file and environment template:**
   ```bash
   mkdir tastebase && cd tastebase
   curl -O https://raw.githubusercontent.com/ReeceRose/tastebase/main/docker-compose.yml
   curl -o .env https://raw.githubusercontent.com/ReeceRose/tastebase/main/.env.docker.example
   ```

2. **Fill in `.env`:**
   - `BETTER_AUTH_SECRET` and `ENCRYPTION_SECRET`: run `openssl rand -base64 48` once for each. They must be different.
   - `BETTER_AUTH_URL`: the address people will type, e.g. `http://192.168.1.100:3000`

3. **Start it:**
   ```bash
   docker compose up -d
   ```

4. **Open Tastebase** at your `BETTER_AUTH_URL` and create the first account. Everyone else in the house signs up from the same page.

Recipes live in the `tastebase-data` volume and photos in `tastebase-uploads`, so both survive restarts and upgrades. Migrations run automatically when the container starts.

### Updating

```bash
docker compose pull
docker compose up -d
```

`latest` always points at the newest release. To control when you upgrade, pin a version in `docker-compose.yml` (e.g. `ghcr.io/reecerose/tastebase:0.1.0`). Release notes are in [CHANGELOG.md](CHANGELOG.md) and on the [Releases page](https://github.com/ReeceRose/tastebase/releases).

### More deployment guides

- **[Deployment Guide](docs/DEPLOYMENT.md)** - `docker run`, backups, reverse proxies and HTTPS
- **[Unraid](docs/DEPLOYMENT_UNRAID.md)** - Compose Manager or the Docker tab
- **[Environment Variables](docs/environment-variables.md)** - Every setting

## 🛠️ Local Development

### Prerequisites

- Node.js 24 (22 or newer is required; the Docker image uses 24)
- pnpm
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ReeceRose/tastebase.git
   cd tastebase
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
   Fill in your environment variables (see [Environment Variables](#-environment-variables)).

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

## 📁 Project Structure

```
tastebase/
├── src/
│   ├── app/
│   │   ├── (public)/          # Sign-in, sign-up, password reset
│   │   ├── (dashboard)/       # Signed-in pages (recipes, search, settings)
│   │   └── api/               # Auth, health check and image routes
│   ├── components/            # UI components organized by purpose
│   │   ├── ui/                # ShadCN base components
│   │   ├── layout/            # App shell and page layouts
│   │   ├── forms/             # Forms, including the recipe editor
│   │   ├── lists/ cards/      # Lists, tiles and cards
│   │   ├── modals/            # Dialogs and menus
│   │   ├── navigation/        # Sidebar and tab bar
│   │   └── skeletons/         # Loading states
│   ├── db/                    # Drizzle schema and migrations
│   ├── lib/                   # Server actions, import, auth, types, utilities
│   ├── hooks/                 # React hooks
│   └── proxy.ts               # Route protection
├── extensions/                # "Save to Tastebase" browser extension
├── scripts/                   # Release script and codebase health checks
├── docs/                      # Documentation
└── public/                    # Static assets
```

## 🔧 Environment Variables

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Path to the SQLite file, e.g. `tastebase.db` locally or `file:/app/data/tastebase.db` in Docker |
| `BETTER_AUTH_SECRET` | Yes | Signs sessions |
| `BETTER_AUTH_URL` | Yes | The address people use to reach Tastebase |
| `ENCRYPTION_SECRET` | Yes | Encrypts the AI keys people add in Settings. Must differ from `BETTER_AUTH_SECRET` |
| `CURRENT_ENCRYPTION_VERSION` | No | Bump when rotating `ENCRYPTION_SECRET` (default `1`) |
| `OLLAMA_BASE_URL` | No | Default Ollama address (default `http://localhost:11434`) |

Generate each secret with `openssl rand -base64 48`. AI provider keys are not environment variables: each person adds their own in **Settings**, stored encrypted. Details and troubleshooting: [docs/environment-variables.md](docs/environment-variables.md).

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
docker compose up -d        # Start with Docker
docker compose down         # Stop Docker containers
docker compose logs -f      # View container logs
docker build -t tastebase . # Build the image from source

# Releases (maintainers)
./scripts/release.sh        # Tag a release; CI publishes the image (docs/RELEASES.md)
```

## 🍳 Recipe Management Features

### Core Recipe Operations
- **Create Recipes** - Manual entry with structured forms
- **Import Recipes** - From links, pasted text or photos, with optional AI
- **Edit & Update** - Full recipe editing with validation
- **Delete Recipes** - Safe deletion with confirmation
- **Recipe Validation** - Ensure all required fields are present

### Recipe Import
- **Link Import** - Reads recipe data from most recipe sites, then falls back to the page text. The recipe photo comes in as the main photo, and the other photos on the page are offered to pick from
- **Browser Extension** - [Save to Tastebase](extensions/chrome/README.md) imports the page you're viewing, including sites that block automated imports (Serious Eats, Allrecipes) and subscriber sites you're signed in to (NYT Cooking)
- **Save from your phone** - Install Tastebase on Android to share recipe links straight into it, or set up an iPhone Shortcut (steps in Settings → Saving recipes)
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

## 🧪 Testing

Tests are organized by feature and type:
- Unit tests for utilities and server actions
- Component tests for UI interactions
- Integration tests for complete recipe workflows
- AI parsing tests for import functionality

## 🚢 Where to Run It

- **Home server or NAS** - Synology, QNAP, Unraid, TrueNAS
- **Raspberry Pi** - The arm64 image runs on a Pi 4 or 5
- **VPS** - Any Linux server with Docker, behind a reverse proxy for HTTPS

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
- **[Releasing](docs/RELEASES.md)** - Cutting a release and how CI publishes the image

## 🎯 Quick Links

- **Documentation**: [docs/](docs/)
- **Releases**: [GitHub Releases](https://github.com/ReeceRose/tastebase/releases) and [CHANGELOG.md](CHANGELOG.md)
- **Image**: [ghcr.io/reecerose/tastebase](https://github.com/ReeceRose/tastebase/pkgs/container/tastebase)
- **Issues**: [GitHub Issues](https://github.com/ReeceRose/tastebase/issues)
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