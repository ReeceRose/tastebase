# Recipe App - Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2025-01-27  
**Owner:** Reece Rose

---

## 1. Purpose
The purpose of this project is to create a **Simple, Lovable, Complete (SLC) MVP** recipe management application that provides an end-to-end workflow for recipe collection, organization, and cooking. The app should feel like a polished, finished product while focusing on essential recipe workflows with beautiful UI and smooth UX.

---

## 2. Goals
- **Simple:** Only essential recipe workflows - no feature bloat
- **Lovable:** Beautiful UI, smooth UX, feels like a polished app
- **Complete:** End-to-end flow: add → parse → view → search → note
- **Self-hosted:** Deployable via Docker for personal use
- **AI-powered:** Smart recipe parsing from various sources
- **Open-source:** Ready for community adoption

---

## 3. Non-Goals
- Meal planning functionality
- Shopping list generation
- Nutrition analysis
- Multi-user support (single-user for MVP)
- Export/import features
- Plugin system
- Payment integration (Stripe)
- Enterprise features

---

## 4. Target Users
- **Primary:** Home cooks who want to organize and manage their recipe collection
- **Secondary:** Cooking enthusiasts who collect recipes from various online sources
- **Tertiary:** Developers interested in self-hosted recipe management

---

## 5. Core Features

### 5.1 Recipe Management (Complete Core)
- **CRUD Operations:** Create, read, update, delete recipes
- **Structured Fields:** 
  - Title, description, servings
  - Prep time, cook time, total time
  - Ingredients (with quantities and units)
  - Step-by-step instructions
  - Tags for categorization
  - Recipe images
- **Notes/Comments:** Per-recipe notes and cooking tips
- **Recipe Validation:** Ensure all required fields are present

### 5.2 AI Parsing (Lovable Differentiator)
- **URL Import:** Scrape recipe from URL + AI cleanup and structuring
- **Text Import:** Parse pasted recipe text with AI structuring
- **Image Import:** OCR + AI parsing for recipe images
- **Preview System:** Show parsed recipe before saving (user control)
- **Fallback Handling:** Manual editing when AI parsing fails

### 5.3 Search & Organization
- **Multi-field Search:** Search by title, tags, ingredients
- **Tagging System:** Custom tags for recipe categorization
- **Filtering:** Filter recipes by tags, cooking time, difficulty
- **Sorting:** Sort by date added, cooking time, alphabetical

### 5.4 Authentication & Security
- **BetterAuth Integration:** Single-user authentication
- **Recipe Protection:** Secure access to personal recipe collection
- **Session Management:** Persistent login sessions

### 5.5 Storage & Data Management
- **SQLite Database:** Local database for recipe storage
- **File System:** Local storage for recipe images
- **Docker Volumes:** Persistent data across container restarts
- **Data Backup:** Simple backup/restore functionality

### 5.6 UI/UX (Lovability Focus)
- **Recipe List:** Grid of cards with images and tags
- **Recipe Detail:** Hero image, metadata, ingredients checklist, steps, notes
- **Add/Edit Forms:** Structured, clean recipe creation interface
- **Import Flow:** URL/text/image → AI parsing → preview → save
- **Dark/Light Mode:** Theme switching capability
- **Responsive Design:** Usable on desktop and mobile devices
- **Loading States:** Smooth loading indicators for AI operations

---

## 6. Technical Requirements

### 6.1 Tech Stack
- **Frontend/Backend:** Next.js 15+ (App Router, Server Actions)
- **Database:** SQLite with Drizzle ORM
- **Authentication:** BetterAuth
- **Storage:** Local filesystem (S3 optional for future)
- **Job Queue:** Built-in job queue for AI parsing and OCR
- **AI Integration:** Cloud API (OpenAI/Anthropic) with abstraction layer
- **Deployment:** Docker with volume persistence
- **UI Framework:** Tailwind CSS + ShadCN/UI components

### 6.2 System Architecture
```
+-------------------+        +-------------------+
|   Next.js Frontend| <----> |   Next.js API     |
|   (UI/UX)         |        |   (Backend)       |
+-------------------+        +-------------------+
          |                           |
          |                           |
          v                           v
+-------------------+        +-------------------+
|   Drizzle ORM     |        |   Job Queue       |
|   (SQLite DB)     |        |   (AI Parsing)    |
+-------------------+        +-------------------+
          |                           |
          v                           v
+-------------------+        +-------------------+
|   SQLite DB       |        |   AI Service      |
|   (Recipes, etc.) |        |   (Cloud API)     |
+-------------------+        +-------------------+
          |
          v
+-------------------+
|   File Storage    |
|   (Local images)  |
+-------------------+
```

### 6.3 Key Architectural Decisions
- Next.js handles both frontend and backend API routes
- Drizzle + SQLite for structured recipe storage
- Job queue for async AI parsing (non-blocking UI)
- AI service layer with provider abstraction
- Local file storage with Docker volume mounting

---

## 7. User Flows

### 7.1 Recipe Creation Flow
1. User clicks "Add Recipe" button
2. Chooses input method: Manual, URL, Text, or Image
3. For AI imports: System processes input and shows preview
4. User reviews and edits parsed recipe
5. User saves recipe to collection
6. Recipe appears in recipe list

### 7.2 Recipe Viewing Flow
1. User browses recipe list (grid view)
2. Clicks on recipe card to view details
3. Views hero image, metadata, ingredients, steps
4. Can add notes or comments
5. Can edit or delete recipe

### 7.3 Search & Discovery Flow
1. User enters search query in search bar
2. System searches across title, tags, ingredients
3. Results filtered and sorted
4. User clicks on result to view recipe

### 7.4 Authentication Flow
1. User visits app (redirected to login if not authenticated)
2. Completes authentication via BetterAuth
3. Redirected to recipe dashboard
4. Session persists across browser sessions

---

## 8. Database Schema

### 8.1 Core Tables
- **recipes:** Main recipe data (title, description, times, etc.)
- **ingredients:** Recipe ingredients with quantities
- **steps:** Step-by-step instructions
- **tags:** Recipe categorization tags
- **notes:** User notes and comments
- **images:** Recipe image metadata and file paths
- **users:** User authentication data

### 8.2 Relationships
- One-to-many: Recipe → Ingredients, Steps, Tags, Notes, Images
- Many-to-many: Recipe ↔ Tags (via junction table)

---

## 9. Environment Variables

```env
# Database
DATABASE_URL=file:./recipes.db

# Authentication
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# AI Services
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# App Configuration
NODE_ENV=development
```

---

## 10. Development Roadmap

### Phase 1: Foundation (Week 1)
- Set up Next.js + Drizzle + SQLite
- Implement BetterAuth (single-user)
- Dockerize application with DB and uploads volume
- Basic UI framework setup

### Phase 2: Core Recipes (Week 2)
- Recipe CRUD operations
- Structured recipe forms
- Notes/comments system
- File upload for images
- Basic recipe list view

### Phase 3: AI Parsing (Week 3)
- URL import with AI parsing and preview
- Text import with AI structuring
- Image import with OCR + AI parsing
- Job queue for async processing
- Error handling and fallbacks

### Phase 4: UI/UX Polish (Week 4)
- Recipe grid list with images and tags
- Recipe detail page with hero image and metadata
- Ingredients checklist functionality
- Dark/light mode implementation
- Responsive design for mobile

### Phase 5: Release SLC-MVP (Week 5)
- Documentation and setup instructions
- Docker deployment guide
- Public repository preparation
- Community sharing and feedback

---

## 11. Success Criteria
- **Functional:** Complete end-to-end recipe workflow (add → parse → view → search → note)
- **Usable:** Beautiful UI that's pleasant to use while cooking
- **Deployable:** One-command Docker deployment
- **Performant:** Fast loading times and smooth interactions
- **Reliable:** Stable AI parsing with graceful fallbacks
- **Accessible:** Works on desktop and mobile devices

---

## 12. Risks & Mitigations

### 12.1 Technical Risks
- **AI Parsing Accuracy:** Mitigated by preview system and manual editing fallback
- **File Storage Limits:** Mitigated by Docker volume mounting and cleanup scripts
- **SQLite Performance:** Mitigated by proper indexing and query optimization

### 12.2 User Experience Risks
- **Complex Import Flow:** Mitigated by clear UI guidance and preview system
- **Mobile Usability:** Mitigated by responsive design and touch-friendly interfaces
- **Data Loss:** Mitigated by Docker volume persistence and backup documentation

---

## 13. Deliverables

### 13.1 Core Application
- Fully functional recipe management app
- AI-powered recipe parsing from multiple sources
- Beautiful, responsive UI with dark/light mode
- Docker deployment with persistent storage
- Single-user authentication system

### 13.2 Documentation
- Setup and installation guide
- Docker deployment instructions
- API documentation for future extensions
- User guide for recipe management features

### 13.3 Open Source Package
- Public GitHub repository
- MIT license for community adoption
- Contributing guidelines
- Issue templates and project boards

---

## 14. Future Considerations (Post-MVP)
- Multi-user support with recipe sharing
- Meal planning and calendar integration
- Shopping list generation from recipes
- Nutrition analysis and tracking
- Recipe export/import functionality
- Plugin system for extensions
- Cloud storage integration (S3, etc.)
- Mobile app development

---

## 15. Metrics & Analytics
- Recipe creation and import success rates
- AI parsing accuracy metrics
- User engagement with search and tagging
- Performance metrics (load times, response times)
- Error rates and user feedback collection

---

*This PRD represents the SLC-MVP vision for a recipe management application that balances simplicity, lovability, and completeness while providing a solid foundation for future enhancements.*
