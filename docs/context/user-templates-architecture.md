# User Templates System - Technical Architecture

**Document Version:** 1.0  
**Date:** 2025-01-17  
**Status:** Implemented  

## Overview

This document outlines the technical architecture for the User Templates system in TasteBase, which allows users to create, manage, and use custom note templates for recipe notes. This feature enhances the note-taking experience by providing reusable templates with placeholders and smart content generation.

## System Architecture

### 1. Database Schema

#### Primary Table: `user_note_templates`
```sql
CREATE TABLE user_note_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  tags JSON, -- Array of strings for template organization
  is_public BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Indexes for Performance
- `user_templates_user_id_idx` - Fast user-specific queries
- `user_templates_category_idx` - Category filtering
- `user_templates_usage_count_idx` - Sort by popularity
- `user_templates_created_at_idx` - Chronological sorting

### 2. Type System

#### Core Types
```typescript
// Database types (auto-generated from Drizzle schema)
export type UserNoteTemplate = typeof userNoteTemplates.$inferSelect;
export type UserNoteTemplateInsert = typeof userNoteTemplates.$inferInsert;

// Enhanced types for UI
export interface TemplateWithMeta extends UserNoteTemplate {
  isSystem: boolean;
  lastUsed?: Date;
  isRecent?: boolean;
}

// Template categories for organization
export const TEMPLATE_CATEGORIES = [
  "general", "modifications", "tips", "timing", "rating"
] as const;
```

#### Smart Placeholders
```typescript
export const TEMPLATE_PLACEHOLDERS: Record<string, TemplatePlaceholder> = {
  date: { key: "{{date}}", label: "Current Date", type: "date" },
  recipeName: { key: "{{recipeName}}", label: "Recipe Name", type: "text", required: true },
  servings: { key: "{{servings}}", label: "Number of Servings", type: "number" },
  // ... additional placeholders
};
```

### 3. Server Actions (CRUD Operations)

#### Template Management
- `createTemplate(input: CreateTemplateInput)` - Create new user template
- `getUserTemplates(filters?: TemplateFiltersInput)` - Fetch user templates with filtering
- `updateTemplate(input: UpdateTemplateInput)` - Update existing template
- `deleteTemplate(templateId: string)` - Remove template
- `duplicateTemplate(templateId: string)` - Clone existing template

#### Template Usage Tracking
- `recordTemplateUsage(input: TemplateUsageInput)` - Track template usage statistics
- `bulkTemplateAction(input: BulkTemplateActionInput)` - Bulk operations (delete, categorize)

#### Security & Validation
- All operations require authentication via `auth.api.getSession()`
- Input validation using Zod schemas
- User isolation - users can only access their own templates
- XSS prevention through content sanitization

### 4. User Interface Components

#### Component Architecture
```
src/components/
├── forms/
│   ├── template-form.tsx           # Create/edit template form
│   └── note-templates.tsx          # Template picker (enhanced)
├── lists/
│   └── template-list.tsx           # Template management interface
├── cards/
│   └── template-card.tsx           # Individual template display
└── modals/
    └── template-manager-modal.tsx  # (Future) Advanced management
```

#### Key UI Features
- **Tabbed Template Picker**: Separate "Your Templates" and "System Templates" tabs
- **Live Usage Tracking**: Shows usage count and recent usage indicators
- **Smart Filtering**: Category, search, and sorting capabilities
- **Bulk Operations**: Select multiple templates for batch actions
- **Responsive Design**: Mobile-friendly template management
- **Optimistic Updates**: Immediate UI feedback for all operations

### 5. Integration with Existing Note System

#### Enhanced Note Creation Flow
1. User clicks "Use Template" in note form
2. Template picker opens with tabbed interface (User Templates prioritized)
3. User selects template → content inserted into note field
4. Usage tracked automatically for user templates
5. Template placeholders can be replaced with dynamic values

#### Hybrid Template System
- **System Templates**: Hardcoded templates from `NOTE_TEMPLATES` array
- **User Templates**: Database-stored, user-created templates
- **Unified Interface**: Both types available through same picker UI
- **Migration Path**: Users can duplicate system templates to customize

### 6. Performance Optimizations

#### Database Performance
- Efficient indexing strategy for common query patterns
- User-specific queries always filtered by `user_id`
- Usage statistics updated via SQL increment (`usage_count + 1`)
- Pagination support for large template collections

#### Frontend Performance
- Lazy loading of user templates (only when picker opens)
- Optimistic UI updates for immediate feedback
- Debounced search for real-time filtering
- Virtual scrolling for large template lists (future enhancement)

#### Caching Strategy
- Template content cached in browser local storage
- Server-side caching for popular system templates
- Invalidation on template updates

### 7. Future Extensibility

#### Planned Enhancements
- **Template Sharing**: Public templates visible to other users
- **Import/Export**: Bulk template operations via JSON/CSV
- **Smart Suggestions**: AI-powered template recommendations
- **Version Control**: Track template changes and rollback capability
- **Template Analytics**: Usage patterns and optimization insights

#### API Design for Future Features
```typescript
// Template sharing (future)
export async function shareTemplate(templateId: string): Promise<ActionResult>;
export async function getPublicTemplates(): Promise<ActionResult<TemplateWithMeta[]>>;

// Template analytics (future)
export async function getTemplateAnalytics(): Promise<ActionResult<TemplateStats>>;

// Template versioning (future)
export async function getTemplateHistory(templateId: string): Promise<ActionResult<TemplateVersion[]>>;
```

### 8. Security Considerations

#### Data Protection
- User templates are private by default (`is_public = false`)
- Strict user isolation - templates only accessible to their creator
- Content sanitization prevents XSS attacks
- Input validation prevents SQL injection

#### Access Control
- All template operations require valid user session
- Template ownership verified on all CRUD operations
- Rate limiting on template creation to prevent abuse
- Audit logging for template operations (via Pino structured logging)

#### Privacy Features
- Users can permanently delete their templates
- No tracking of template content by system
- Local-first approach - all data stays on user's infrastructure

### 9. Error Handling & Resilience

#### Graceful Degradation
- Template picker falls back to system templates if user templates fail to load
- Partial functionality maintained during database outages
- Clear error messages with actionable next steps

#### Error Recovery
- Failed template operations can be retried
- Optimistic updates reverted on server errors
- Automatic retry logic with exponential backoff

#### User Feedback
- Toast notifications for all template operations
- Loading states for async operations
- Confirmation dialogs for destructive actions

### 10. Testing Strategy

#### Unit Tests
- Server action validation and logic
- Template placeholder replacement
- Error handling scenarios
- Input sanitization

#### Integration Tests
- End-to-end template creation workflow
- Template picker integration with note form
- Database operations and data integrity
- Authentication and authorization

#### Performance Tests
- Large template collection handling
- Concurrent user operations
- Database query optimization
- UI responsiveness under load

## Implementation Status

✅ **Completed Features:**
- Database schema and migrations
- Core CRUD server actions
- Template management UI components
- Integration with existing note system
- Navigation and routing
- User authentication and authorization

🔄 **Current Status:**
- Feature fully implemented and functional
- Ready for user testing and feedback
- Performance optimized for typical usage patterns

⏭️ **Next Steps:**
- User acceptance testing
- Template sharing features (Phase 3)
- AI-powered template suggestions (Phase 3)
- Advanced analytics and insights (Phase 4)

## Conclusion

The User Templates system provides a robust, scalable foundation for customizable recipe note-taking. The architecture supports both immediate user needs and future enhancements while maintaining security, performance, and usability standards consistent with the TasteBase application.

The hybrid approach of combining system templates with user-created templates offers the best of both worlds: immediate value from curated templates and long-term personalization through custom templates. The comprehensive UI and backend systems ensure a smooth user experience from template creation to daily usage.

This implementation serves as a bridge between the basic recipe CRUD functionality (Phase 2) and the advanced AI integration features (Phase 3), providing immediate user value while laying groundwork for future AI-enhanced template suggestions and generation.