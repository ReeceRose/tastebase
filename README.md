# Tastebase

A simple, local-first recipe management application designed for personal use. Keep your recipes organized and accessible on your own computer with Docker deployment - no cloud dependencies, no subscriptions, just your recipes stored locally and securely.

## 🚀 Features

- **🏠 Local-First** - Everything stored on your computer, no cloud dependencies
- **🍳 Recipe Management** - Create, edit, and organize your personal recipe collection
- **🔍 Search & Filter** - Find recipes quickly by name, ingredients, or tags
- **📝 Personal Notes** - Add cooking tips, modifications, and personal notes
- **🏷️ Organization** - Tag and categorize recipes your way
- **📱 Responsive Design** - Works great on desktop, tablet, and mobile
- **🌙 Dark/Light Mode** - Choose your preferred theme
- **🔐 Single-User Auth** - Simple authentication for personal use
- **💾 SQLite Database** - Reliable local storage with full data ownership
- **🐳 Docker Deployment** - Run locally with one simple command
- **⚡ Modern Stack** - Built with Next.js 15 and modern web technologies
- **🎨 Clean UI** - Beautiful, intuitive interface built with ShadCN/UI

## 🏗️ Tech Stack

- **Framework**: Next.js 15+ with App Router and Server Actions
- **Authentication**: BetterAuth (simple email/password)
- **Database**: SQLite + Drizzle ORM (local file storage)
- **File Storage**: Local filesystem for recipe images
- **UI**: Tailwind CSS + ShadCN/UI components
- **Deployment**: Docker with persistent volumes
- **Development**: TypeScript, Vitest, ESLint, Prettier

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ (recommend using pnpm)
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

5. **Start development server:**
   ```bash
   pnpm run dev
   ```

6. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Deployment (Recommended)

**The easiest way to run Tastebase is with Docker:**

1. **Clone and start:**
   ```bash
   git clone <repository-url> tastebase
   cd tastebase
   docker-compose up -d
   ```

2. **Access your recipes:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Your data is safe:**
   All recipes and images are stored in Docker volumes and persist between restarts.

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
│   ├── components/            # UI components organized by feature
│   │   ├── ui/                # ShadCN base components
│   │   ├── auth/              # Authentication components
│   │   ├── profile/           # Profile management components
│   │   └── theme/             # Theme components
│   ├── lib/                   # Utilities organized by category
│   │   ├── auth/              # Authentication & user management
│   │   ├── config/            # Configuration files
│   │   ├── logging/           # Logging utilities
│   │   └── utils/             # General utilities
│   └── middleware.ts          # Route protection
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

# AI Services (Choose one)
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Required vs Optional

**Required for basic functionality:**
- `DATABASE_URL` - SQLite database file path
- `BETTER_AUTH_SECRET` - Authentication secret key
- `BETTER_AUTH_URL` - Application URL for auth callbacks
- `NEXT_PUBLIC_APP_URL` - Public application URL

**Required for AI features:**
- `OPENAI_API_KEY` OR `ANTHROPIC_API_KEY` - For recipe parsing

**Optional:**
- `UPLOAD_DIR` - Custom upload directory (defaults to ./uploads)
- `MAX_FILE_SIZE` - Max file size in bytes (defaults to 10MB)

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
- **Import Recipes** - AI-powered parsing from URLs, text, or images
- **Edit & Update** - Full recipe editing with validation
- **Delete Recipes** - Safe deletion with confirmation
- **Recipe Validation** - Ensure all required fields are present

### AI-Powered Import
- **URL Import** - Scrape and parse recipes from any website
- **Text Import** - Paste recipe text and let AI structure it
- **Image Import** - OCR + AI parsing for recipe photos
- **Preview System** - Review parsed recipes before saving
- **Fallback Handling** - Manual editing when AI parsing fails

### Search & Organization
- **Multi-field Search** - Search by title, tags, ingredients
- **Smart Filtering** - Filter by tags, cooking time, difficulty
- **Custom Tags** - Organize recipes with personal tags
- **Sorting Options** - Sort by date, time, alphabetical
- **Recipe Collections** - Group related recipes together

### User Experience
- **Recipe Cards** - Beautiful grid view with images and tags
- **Recipe Details** - Hero image, metadata, ingredients checklist
- **Notes System** - Add personal notes and cooking tips
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

**Relationships:**
- One-to-many: Recipe → Ingredients, Steps, Tags, Notes, Images
- Many-to-many: Recipe ↔ Tags (via junction table)

## 🔐 Authentication Flow

1. Users sign up/in via BetterAuth components
2. Middleware protects dashboard routes (`middleware.ts`)
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

### 4. Create Feature Structure
```bash
mkdir -p src/components/<feature-name> src/lib/<feature-name>
```

### 5. Implement Server Actions
```typescript
// src/lib/<feature-name>/<feature-name>-actions.ts
"use server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";

export async function createMyFeature(data: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  
  // Implementation here
}
```

### 6. Build UI Components
- Create form components in `components/`
- Add skeleton components in `components/skeletons/`
- Follow existing patterns for consistency
- Use Suspense with skeleton fallbacks

### 7. Add Routes and Navigation
```typescript
// src/app/<feature>/page.tsx
import { Suspense } from "react";
import { MyFeatureContent } from "@/components/<feature>/my-feature-content";
import { MyFeatureSkeleton } from "@/components/<feature>/my-feature-skeleton";

export default function MyFeaturePage() {
  return (
    <Suspense fallback={<MyFeatureSkeleton />}>
      <MyFeatureContent />
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

Comprehensive documentation is available in the `docs/` directory:

- **[Setup Guide](docs/SETUP.md)** - Complete installation and configuration instructions
- **[Features Documentation](docs/FEATURES.md)** - Detailed guide to all included features
- **[Deployment Guide](DEPLOYMENT.md)** - Docker deployment instructions
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Architecture Guide](docs/architecture.md)** - System architecture and design decisions
- **[Database Schema](docs/database.md)** - Database structure and relationships
- **[Environment Variables](docs/environment-variables.md)** - Configuration reference

## 🎯 Quick Links

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **PRD**: [Product Requirements Document](docs/plans/Recipe-App-PRD.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built for home cooks and cooking enthusiasts** 🍳

This recipe app is designed to be your personal recipe collection with AI-powered import, beautiful UI, and seamless organization. Perfect for anyone who loves to cook and wants to organize their recipes in one place.

### Why Choose This Recipe App?

- ✅ **AI-Powered** - Smart recipe parsing from any source
- ✅ **Beautiful UI** - Modern, responsive design that's a joy to use
- ✅ **Self-Hosted** - Your data stays on your server
- ✅ **Complete Workflow** - From import to cooking with notes and tips
- ✅ **Docker Ready** - One-command deployment
- ✅ **Open Source** - MIT licensed for community use
- ✅ **Type Safe** - Full TypeScript implementation
- ✅ **Modern Stack** - Latest Next.js, React, and best practices