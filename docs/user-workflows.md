# Tastebase User Workflows - Phase 2 Complete System

This document walks through all the user workflows you can expect in the current Phase 2 implementation of Tastebase. These are the complete user journeys from sign-up to advanced recipe management.

---

## 🔐 **Authentication & Account Setup**

### New User Registration
1. **Navigate to sign-up page** → `/auth/sign-up`
2. **Fill registration form:**
   - Full name (required)
   - Email address (required)
   - Password (required, 8+ chars, uppercase, lowercase, number)
   - Confirm password (must match)
   - **Preferences:**
     - Temperature unit (Fahrenheit/Celsius)
     - Weight unit (Imperial/Metric)
     - Volume unit (Imperial/Metric)  
     - Recipe view preference (Card/List)
3. **Submit form** → Account created, automatically signed in
4. **Welcome experience** → Redirected to empty recipe dashboard

### User Sign In
1. **Navigate to sign-in page** → `/auth/sign-in`
2. **Enter credentials:**
   - Email address
   - Password
3. **Sign in** → Redirected to recipe dashboard

### Password Reset
1. **From sign-in page** → Click "Forgot Password?"
2. **Enter email** → Reset email sent
3. **Click reset link** → Navigate to reset form
4. **Set new password** → Password updated, signed in

---

## 🏠 **Dashboard Experience**

### First-Time User Dashboard
- **Empty state message** → "No recipes yet"
- **Create first recipe** → Large CTA button
- **Import recipe** → Alternative option
- **Navigation menu** → Access to all features

### Established User Dashboard
- **Recipe grid/list** → All user's recipes displayed
- **Search bar** → Real-time recipe search with suggestions
- **Filter options** → By tags, difficulty, time, favorites
- **Sort options** → By date, name, rating, cook time
- **Quick actions** → Create, import, view favorites
- **Status indicators** → "New", "Updated", "Recently Viewed" badges

---

## 📝 **Recipe Creation Workflow**

### Starting Recipe Creation
1. **Click "New Recipe"** → Navigate to `/recipes/new`
2. **Recipe creation form loads** → Multi-section form interface

### Basic Information Section
1. **Recipe title** (required) → Enter recipe name
2. **Description** (optional) → Brief recipe description
3. **Metadata:**
   - **Servings** → Number input (default 4)
   - **Prep time** → Minutes input
   - **Cook time** → Minutes input
   - **Difficulty** → Easy/Medium/Hard dropdown
   - **Cuisine** → Free text input with suggestions
4. **Public/Private toggle** → Recipe visibility setting

### Dynamic Ingredients Section
1. **Add ingredients:**
   - **Smart parsing** → Type "2 cups flour" → Auto-fills amount/unit/name
   - **Ingredient suggestions** → Type "gar" → Shows "garlic"
   - **Unit suggestions** → Type "cu" → Shows "cup", "cups"
   - **Optional toggle** → Mark ingredient as optional
   - **Advanced options** → Notes, grouping (e.g., "For sauce")
2. **Multiple ingredients:**
   - **Add ingredient** → Click button to add new row
   - **Remove ingredient** → X button (minimum 1 required)
   - **Reorder** → Drag and drop to reorder

### Dynamic Instructions Section
1. **Add instructions:**
   - **Step text** → Multi-line instruction description
   - **Time parsing** → "15 min" or "1h 30m" → Auto-parsed
   - **Temperature** → "350°F", "medium heat" with suggestions
   - **Smart suggestions** → Type "bake" → Suggests temp/time
   - **Advanced options** → Notes, grouping (e.g., "Prep", "Cooking")
2. **Multiple instructions:**
   - **Add instruction** → Click button to add new step
   - **Remove instruction** → X button (minimum 1 required)
   - **Auto-numbering** → Steps show "Step 1", "Step 2", etc.

### Recipe Tags Section
1. **Tag categories** → Quick buttons for cuisine, diet, course, etc.
2. **Tag input:**
   - **Type to search** → Shows categorized suggestions
   - **Category colors** → Different colors for tag types
   - **Add tags** → Enter key or Add button
   - **Remove tags** → Click tag with X
   - **Tag limit** → Maximum 20 tags

### Source Information
1. **Source URL** → Link to original recipe (optional)
2. **Source Name** → Name of source (optional)

### Recipe Submission
1. **Validation check** → Real-time validation with helpful errors
2. **Submit** → "Create Recipe" button with loading state
3. **Success** → Redirected to new recipe detail page
4. **Error handling** → Specific error messages for failed creation

---

## 🖼️ **Image Management Workflow**

### Adding Images to Recipe
1. **From recipe detail page** → Click "Manage Images" or upload area
2. **Image upload interface:**
   - **Drag and drop** → Drag files onto upload zone
   - **Browse files** → Click to open file picker
   - **Multi-select** → Choose multiple images at once
   - **File validation** → JPEG, PNG, WebP only, 10MB max each

### Upload Process
1. **Upload progress** → Progress bars for each file
2. **Preview thumbnails** → See images while uploading
3. **Error handling** → Clear error messages for failed uploads
4. **Success confirmation** → Images appear in gallery

### Image Gallery Management
1. **Grid layout** → All recipe images in responsive grid
2. **Hero image** → Main image marked with "Hero" badge
3. **Image metadata** → Filename, file size, dimensions displayed
4. **Hover actions** → Edit, Star (hero), Delete buttons appear

### Image Operations
1. **Set hero image:**
   - **Click star icon** → Sets image as main recipe image
   - **Auto-update** → Other images lose hero status
2. **Edit image:**
   - **Click edit icon** → Opens metadata dialog
   - **Alt text** → For accessibility
   - **Hero toggle** → Alternative way to set hero image
3. **Delete image:**
   - **Click delete icon** → Confirmation dialog
   - **Confirm deletion** → Image removed from recipe
4. **Reorder images:**
   - **Drag and drop** → Change image display order
   - **Visual feedback** → Images highlight during drag

---

## 📖 **Recipe Viewing Experience**

### Recipe Detail Page
1. **Navigation** → From dashboard or direct link to `/recipes/[id]`
2. **Hero section:**
   - **Main image** → Large hero image display
   - **Recipe title** → Prominent heading
   - **Recipe metadata** → Servings, times, difficulty, cuisine
   - **Status badges** → "New", "Updated", "Favorite" indicators
   - **Quick actions** → Edit, Delete, Share, Favorite buttons

### Recipe Content Sections
1. **Ingredients list:**
   - **Formatted display** → Amount, unit, ingredient name
   - **Optional ingredients** → Marked as "(optional)"
   - **Ingredient groups** → Sections like "For sauce", "For garnish"
   - **Interactive checkboxes** → Check off ingredients while cooking

2. **Instructions list:**
   - **Numbered steps** → Clear step-by-step progression
   - **Time indicators** → Step timing when available
   - **Temperature info** → Cooking temperatures displayed
   - **Additional notes** → Extra tips for each step

3. **Recipe tags:**
   - **Categorized display** → Tags grouped by type
   - **Clickable tags** → Click to search for similar recipes
   - **Color coding** → Different colors for different categories

### Interactive Elements
1. **Image gallery:**
   - **Multiple images** → Cycle through recipe photos
   - **Lightbox view** → Click for full-size viewing
   - **Caption display** → Alt text and descriptions

2. **Notes and ratings:**
   - **Personal notes section** → Your private recipe notes
   - **Rating display** → Average star rating
   - **Add note button** → Create new personal note

---

## ✏️ **Recipe Editing Workflow**

### Starting Recipe Edit
1. **From recipe detail page** → Click "Edit" button
2. **From recipe list** → Click edit action in quick menu
3. **Navigate to edit form** → `/recipes/[id]/edit`

### Edit Form Experience
1. **Pre-populated form** → All existing data loaded
2. **Same interface as creation** → Familiar editing experience
3. **Edit capabilities:**
   - **Modify basic info** → Title, description, metadata
   - **Edit ingredients** → Add, remove, modify existing ingredients
   - **Edit instructions** → Add, remove, modify existing steps
   - **Update tags** → Add/remove tags with suggestions
   - **Change visibility** → Public/private toggle

### Advanced Editing Features
1. **Ingredient editing:**
   - **In-place modification** → Edit existing ingredient details
   - **Smart suggestions** → Still work during editing
   - **Reordering** → Change ingredient order
   - **Advanced options** → Modify notes and grouping

2. **Instruction editing:**
   - **Step modification** → Edit instruction text and timing
   - **Smart parsing** → Time/temperature parsing still active
   - **Step reordering** → Change instruction order
   - **Advanced options** → Modify notes and grouping

### Saving Changes
1. **Real-time validation** → Errors shown immediately
2. **Unsaved changes warning** → Prompt before leaving page
3. **Save changes** → "Update Recipe" button with loading state
4. **Cancel option** → "Cancel" button returns without saving
5. **Success redirect** → Back to recipe detail page with updates

---

## ⭐ **Recipe Notes and Ratings**

### Adding Personal Notes
1. **From recipe detail page** → Find "Notes" section
2. **Toggle note form** → Click "Add Note" button
3. **Note creation:**
   - **Star rating** → Click 1-5 stars (interactive with hover)
   - **Note content** → Multi-line text area for personal thoughts
   - **Privacy toggle** → Keep notes private or make shareable
4. **Save note** → Note appears in chronological list

### Managing Notes
1. **View all notes** → Chronological list with ratings and dates
2. **Edit existing notes:**
   - **Click edit icon** → Modify note content and rating
   - **Update privacy** → Change private/public status
3. **Delete notes:**
   - **Click delete icon** → Confirmation dialog
   - **Confirm deletion** → Note removed permanently

### Rating System
1. **Individual ratings** → Each note can have 1-5 star rating
2. **Average calculation** → Overall recipe rating from all notes
3. **Rating display** → Stars with numerical average
4. **Rating influence** → Used in search relevance and sorting

---

## 💖 **Favorites System**

### Adding to Favorites
1. **From any recipe card** → Click heart icon
2. **From recipe detail page** → Click heart in quick actions
3. **Visual feedback:**
   - **Unfilled heart** → Click to add to favorites
   - **Filled red heart** → Recipe is favorited
   - **Loading state** → Brief loading animation
   - **Toast notification** → "Recipe added to favorites"

### Managing Favorites
1. **Remove from favorites:**
   - **Click filled heart** → Removes from favorites
   - **Visual change** → Heart becomes unfilled
   - **Toast notification** → "Recipe removed from favorites"

2. **View favorites:**
   - **Filter option** → "Show only favorites" in recipe list
   - **Favorites badge** → Recipes show heart badge in lists
   - **Persistent status** → Favorite status saved across sessions

---

## 🔍 **Search and Discovery**

### Basic Search
1. **From dashboard** → Use search bar at top
2. **Real-time search:**
   - **Type query** → Results update as you type (debounced)
   - **Search scope** → Searches title, ingredients, instructions, tags
   - **Clear search** → X button to clear and show all recipes

### Advanced Search Features
1. **Search suggestions:**
   - **Ingredient suggestions** → Based on your recipe ingredients
   - **Recipe titles** → Matching recipe names
   - **Cuisine types** → Based on recipe cuisines
   - **Tags** → From your recipe tags

2. **Search history:**
   - **Recent searches** → Dropdown shows last 5-10 searches
   - **Click to repeat** → Rerun previous searches
   - **Clear history** → Option to clear search history

### Search Results
1. **Relevance ranking** → Best matches appear first
2. **Result highlighting** → Search terms highlighted in yellow
3. **Context snippets** → Relevant text excerpts shown
4. **No results state** → Helpful message when no matches found

### Filtering and Sorting
1. **Filter options:**
   - **Difficulty** → Easy/Medium/Hard checkboxes
   - **Time ranges** → Prep time and cook time sliders
   - **Cuisine** → Filter by cuisine type
   - **Tags** → Filter by specific recipe tags
   - **Favorites** → Show only favorited recipes
   - **Recent** → Recently viewed or created recipes

2. **Sort options:**
   - **Date created** → Newest or oldest first
   - **Alphabetical** → Recipe name A-Z or Z-A
   - **Rating** → Highest rated first
   - **Cook time** → Shortest to longest cooking time

3. **Filter persistence:**
   - **Active filters** → Remain active while browsing
   - **Clear filters** → Reset all filters to show all recipes
   - **URL parameters** → Filters reflected in URL for bookmarking

---

## 📥 **Recipe Import Workflow**

### Starting Recipe Import
1. **From dashboard** → Click "Import Recipe" button
2. **Navigate to import page** → `/recipes/import`
3. **Import interface loads** → Text input area with example

### Text Import Process
1. **Paste recipe text:**
   - **Large text area** → Paste full recipe from any source
   - **Example template** → Shows proper format for best results
   - **Flexible parsing** → Handles various text formats

2. **Parsing preview:**
   - **Real-time parsing** → See results as you type/paste
   - **Parsed sections:**
     - **Title detection** → Automatically identified recipe name
     - **Ingredients parsed** → "2 cups flour" → Amount, unit, name
     - **Instructions parsed** → Numbered or bulleted steps
     - **Metadata extraction** → Servings, times when mentioned
     - **Tag suggestions** → Based on detected content

### Import Review and Edit
1. **Preview parsed data:**
   - **All sections displayed** → Review extracted information
   - **Manual corrections** → Edit any incorrectly parsed data
   - **Add missing info** → Fill in any gaps from parsing

2. **Import completion:**
   - **Save as new recipe** → Creates recipe with imported data
   - **Success redirect** → Navigate to new recipe detail page
   - **Import history** → Track previously imported recipes

---

## 📊 **Recipe Status and Tracking**

### Status Indicators
1. **Recipe badges:**
   - **"New" badge** → Green badge for recipes created within 7 days
   - **"Updated" badge** → Blue badge for recipes edited within 3 days
   - **"Favorite" badge** → Red heart for favorited recipes
   - **"Recently Viewed" badge** → Eye icon for recently accessed recipes
   - **Rating badge** → Stars with average rating when available

### Recently Viewed Tracking
1. **View tracking:**
   - **Automatic tracking** → Views recorded when visiting recipe detail
   - **Smart deduplication** → Multiple quick views don't spam history
   - **Recent recipes list** → Access recently viewed recipes

2. **View history:**
   - **Last 10-20 recipes** → Maintain reasonable history size
   - **Chronological order** → Most recently viewed first
   - **Quick access** → Easy navigation back to recent recipes

---

## 🚀 **Advanced Features**

### Specialized Input Components
1. **Smart ingredient input:**
   - **Parsing while typing** → "2 cups flour" auto-fills fields
   - **Ingredient suggestions** → Common ingredients appear
   - **Unit suggestions** → Measurement units suggested
   - **Advanced options** → Notes, grouping, optional status

2. **Smart instruction input:**
   - **Time parsing** → Various time formats recognized
   - **Temperature suggestions** → Common cooking temperatures
   - **Action detection** → Cooking verbs trigger suggestions
   - **Context awareness** → Relevant suggestions based on content

3. **Intelligent tag input:**
   - **Category shortcuts** → Quick access to tag types
   - **Organized suggestions** → Tags grouped by category
   - **Visual organization** → Different colors for different tag types
   - **Smart search** → Finds tags as you type

### Quick Actions Throughout UI
1. **Recipe card actions:**
   - **Hover reveal** → Actions appear on mouse hover
   - **Touch friendly** → Work properly on mobile devices
   - **Dropdown menu** → All actions in organized menu
   - **Confirmation dialogs** → Safe destructive actions

2. **Bulk operations:**
   - **Multiple selection** → Select multiple recipes (planned)
   - **Batch actions** → Apply actions to multiple recipes (planned)
   - **Export options** → Export recipes in various formats (planned)

---

## 📱 **Mobile Experience**

### Responsive Design
1. **Mobile navigation:**
   - **Collapsible menu** → Space-efficient navigation
   - **Touch-friendly buttons** → Properly sized for fingers
   - **Swipe gestures** → Natural mobile interactions

2. **Mobile forms:**
   - **Optimized layouts** → Forms adapt to narrow screens
   - **Touch keyboards** → Proper input types trigger correct keyboards
   - **Scrollable sections** → Long forms remain usable

3. **Mobile image handling:**
   - **Camera integration** → Take photos directly for recipes
   - **Photo gallery access** → Choose from existing photos
   - **Touch image management** → Tap and hold for actions

### Touch Interactions
1. **Recipe browsing:**
   - **Swipe navigation** → Swipe between recipe details
   - **Pull to refresh** → Update recipe lists
   - **Tap targets** → All interactive elements properly sized

2. **Form interaction:**
   - **Touch-friendly inputs** → Easy to tap and type
   - **Drag and drop** → Reorder ingredients/instructions
   - **Touch feedback** → Visual response to touches

---

## ⚡ **Performance and Optimization**

### Fast Loading
1. **Progressive loading:**
   - **Critical content first** → Recipe basics load immediately
   - **Images load progressively** → Large images don't block content
   - **Lazy loading** → Off-screen content loads when needed

2. **Caching:**
   - **Smart caching** → Frequently accessed recipes cached
   - **Offline capability** → Recently viewed recipes available offline
   - **Background sync** → Changes sync when connection available

### Efficient Search
1. **Instant search:**
   - **Debounced input** → Searches triggered efficiently
   - **Client-side filtering** → Fast filtering of loaded results
   - **Smart indexing** → Efficient database queries

---

This comprehensive workflow guide covers all the user experiences available in the current Phase 2 implementation of Tastebase. Each workflow has been designed to be intuitive, efficient, and feature-rich while maintaining excellent performance and usability across all devices.

**Ready to explore your complete recipe management system!** 🍳✨