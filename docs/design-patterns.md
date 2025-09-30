# TasteBase Design Patterns

Common UI patterns and implementation examples used throughout the TasteBase application.

## Pattern Index

1. [Dashboard Layout Pattern](#dashboard-layout-pattern)
2. [Card Grid Pattern](#card-grid-pattern)
3. [Form Pattern](#form-pattern)
4. [List with Actions Pattern](#list-with-actions-pattern)
5. [Modal/Dialog Pattern](#modal-dialog-pattern)
6. [Loading States Pattern](#loading-states-pattern)
7. [Status Indicators Pattern](#status-indicators-pattern)
8. [Search and Filter Pattern](#search-and-filter-pattern)
9. [Interactive Lists Pattern](#interactive-lists-pattern)
10. [Optimistic Updates Pattern](#optimistic-updates-pattern)
11. [Rating Display Pattern](#rating-display-pattern)

## Dashboard Layout Pattern

### When to Use
- Any authenticated page that needs navigation
- Pages that are part of the main application flow

### Implementation
```tsx
// src/app/(dashboard)/layout.tsx
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession();
  if (!session) redirect("/auth/sign-in");

  return (
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  );
}
```

### Page Structure
```tsx
// Individual pages
export default function RecipePage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">All Recipes</h1>
        <p className="text-muted-foreground">
          Manage your personal recipe collection
        </p>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        {/* Content sections */}
      </div>
    </div>
  );
}
```

## Card Grid Pattern

### When to Use
- Displaying collections of items (recipes, ingredients, etc.)
- Content that benefits from visual thumbnails
- Items that need quick scanning and selection

### Implementation
```tsx
// Responsive grid with consistent cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1">{item.title}</CardTitle>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {/* Metadata */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(item.totalTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{item.servings}</span>
            </div>
          </div>
          
          {/* Status or rating */}
          {item.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span>{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### With Loading State
```tsx
// Show skeletons while loading
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[0, 1, 2, 3, 4, 5].map((index) => (
      <CardSkeleton key={`skeleton-${index}`} />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map((item) => (
      <ItemCard key={item.id} item={item} />
    ))}
  </div>
)}
```

## Form Pattern

### When to Use
- Creating or editing data
- User input collection
- Settings and preferences

### Basic Form Structure
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ItemForm({ item, onSuccess, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: item?.title || "",
      description: item?.description || "",
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await saveItem(data);
      if (result.success) {
        toast.success("Item saved successfully!");
        onSuccess?.(result.data);
      } else {
        toast.error(result.error || "Failed to save item");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {item ? "Edit Item" : "Create Item"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter title..."
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter description..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

## List with Actions Pattern

### When to Use
- Managing collections of items
- Operations like edit, delete, reorder
- Bulk actions on multiple items

### Implementation
```tsx
export function ItemsList({ items, onItemsChange }) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const handleDeleteItem = async (itemId: string) => {
    try {
      const result = await deleteItem(itemId);
      if (result.success) {
        toast.success("Item deleted successfully");
        onItemsChange?.();
      } else {
        toast.error(result.error || "Failed to delete item");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="group relative">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingItem(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeletingItemId(item.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  Created {formatDate(item.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  {item.isPublic ? (
                    <Badge variant="default">Public</Badge>
                  ) : (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingItem !== null} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              item={editingItem}
              onSuccess={() => {
                setEditingItem(null);
                onItemsChange?.();
              }}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingItemId !== null} onOpenChange={(open) => !open && setDeletingItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingItemId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingItemId && handleDeleteItem(deletingItemId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Modal/Dialog Pattern

### When to Use
- Confirmations (delete, save, etc.)
- Forms that overlay main content
- Detailed views that don't need full page

### Implementation
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Provide context about what this dialog does.
      </DialogDescription>
    </DialogHeader>
    
    {/* Dialog content */}
    <div className="space-y-4">
      {/* Form fields, content, etc. */}
    </div>
    
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleAction}>
        Confirm
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Confirmation Dialog Pattern
```tsx
function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const confirm = (options: {
    title: string;
    description: string;
    onConfirm: () => void;
  }) => {
    setConfig(options);
    setIsOpen(true);
  };

  const ConfirmDialog = () => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config?.title}</DialogTitle>
          <DialogDescription>{config?.description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              config?.onConfirm();
              setIsOpen(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
```

## Loading States Pattern

### When to Use
- Any async data fetching
- Form submissions
- Long-running operations

### Skeleton Loading
```tsx
function ItemListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((index) => (
        <Card key={`skeleton-${index}`}>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between items-center pt-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Suspense Pattern
```tsx
// Page component
<Suspense fallback={<ItemListSkeleton />}>
  <ItemList />
</Suspense>

// Async data component
async function ItemList() {
  const items = await getItems();
  
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## Status Indicators Pattern

### When to Use
- Showing item states (public/private, active/inactive)
- Progress indicators
- Success/error states

### Implementation
```tsx
function StatusBadge({ status }: { status: 'public' | 'private' | 'draft' }) {
  const variants = {
    public: { variant: "default" as const, text: "Public" },
    private: { variant: "outline" as const, text: "Private" },
    draft: { variant: "secondary" as const, text: "Draft" },
  };

  const config = variants[status];
  
  return (
    <Badge variant={config.variant}>
      {config.text}
    </Badge>
  );
}

// Now uses the unified RatingDisplay component
import { RatingDisplay } from "@/components/ui/rating-display";

function StatusWithRating({ status, rating }: { status: string; rating?: number }) {
  return (
    <div className="flex items-center gap-4">
      <StatusBadge status={status} />
      <RatingDisplay rating={rating} variant="compact" size="sm" />
    </div>
  );
}
```

## Search and Filter Pattern

### When to Use
- Large collections of data
- Multiple filtering criteria
- Real-time search

### Implementation
```tsx
export function ItemsSearch({ onSearch, onFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <Select value={filters.category} onValueChange={(value) => {
              const newFilters = { ...filters, category: value };
              setFilters(newFilters);
              onFilter?.(newFilters);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="recipes">Recipes</SelectItem>
                <SelectItem value="ingredients">Ingredients</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => {
              const newFilters = { ...filters, status: value };
              setFilters(newFilters);
              onFilter?.(newFilters);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Interactive Lists Pattern

### When to Use
- Ingredient lists with checkboxes
- Instruction steps with completion tracking
- Todo-style interfaces

### Implementation
```tsx
export function CheckableList({ items, onItemToggle }) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      onItemToggle?.(itemId, newSet.has(itemId));
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isChecked = checkedItems.has(item.id);
        
        return (
          <div key={item.id} className="flex items-start gap-3">
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggleItem(item.id)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className={`text-sm leading-relaxed ${
                isChecked ? "line-through text-muted-foreground" : "text-foreground"
              }`}>
                {item.text}
              </p>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
      
      {checkedItems.size > 0 && (
        <div className="pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            {checkedItems.size} of {items.length} items completed
          </p>
        </div>
      )}
    </div>
  );
}
```

## Optimistic Updates Pattern

### When to Use
- Actions that are likely to succeed
- Improving perceived performance
- Operations like adding/editing/deleting items

### Implementation
```tsx
export function OptimisticList({ initialItems, onItemsChange }) {
  const [optimisticItems, setOptimisticItems] = useState(initialItems);

  // Update optimistic items when props change
  useEffect(() => {
    if (initialItems !== optimisticItems && initialItems.length !== optimisticItems.length) {
      setOptimisticItems(initialItems);
    }
  }, [initialItems]);

  const handleOptimisticAdd = (newItemData: Partial<Item>) => {
    const optimisticItem: Item = {
      id: `temp-${Date.now()}`,
      ...newItemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Item;
    
    const updatedItems = [...optimisticItems, optimisticItem];
    setOptimisticItems(updatedItems);
    onItemsChange?.(updatedItems);
  };

  const handleOptimisticUpdate = (itemId: string, updates: Partial<Item>) => {
    const updatedItems = optimisticItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setOptimisticItems(updatedItems);
    onItemsChange?.(updatedItems);
  };

  const handleOptimisticDelete = (itemId: string) => {
    const updatedItems = optimisticItems.filter(item => item.id !== itemId);
    setOptimisticItems(updatedItems);
    onItemsChange?.(updatedItems);
  };

  const handleAddItem = async (itemData: CreateItemInput) => {
    try {
      // Optimistically add item
      handleOptimisticAdd(itemData);

      const result = await addItem(itemData);
      
      if (result.success) {
        toast.success("Item added successfully!");
        // Real data will come through props update
      } else {
        toast.error(result.error || "Failed to add item");
        // Revert on error - real data will restore through props
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div>
      {/* Add form */}
      <ItemForm onSubmit={handleAddItem} />
      
      {/* List with optimistic updates */}
      <ItemsList
        items={optimisticItems}
        onUpdate={handleOptimisticUpdate}
        onDelete={handleOptimisticDelete}
      />
    </div>
  );
}
```

## Best Practices Summary

### Component Organization
- Keep patterns consistent across the application
- Create reusable components for common patterns
- Use TypeScript for prop validation
- Implement proper error boundaries

### State Management
- Use optimistic updates for better UX
- Handle loading states appropriately
- Provide clear error messages
- Implement proper cleanup in useEffect

### Accessibility
- Use proper semantic HTML
- Implement keyboard navigation
- Provide screen reader support
- Test with accessibility tools

### Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Debounce search inputs
- Lazy load heavy components

## Rating Display Pattern

### When to Use
- Displaying user ratings and reviews
- Recipe quality indicators
- Interactive rating inputs
- Consistent rating displays across the app

### Implementation

#### Basic Rating Display
```tsx
import { RatingDisplay } from "@/components/ui/rating-display";

// Compact rating for headers/metadata
<RatingDisplay 
  rating={4.5}
  variant="compact"
  size="sm"
/>

// Detailed rating with count
<RatingDisplay 
  rating={4.2}
  showValue={true}
  showCount={true}
  count={23}
  size="md"
  variant="default"
/>

// Stylized rating in container
<RatingDisplay 
  rating={3.8}
  showValue={true}
  size="sm"
  variant="detailed"
/>
```

#### Interactive Rating Input
```tsx
import { InteractiveRating } from "@/components/ui/rating-display";

function RatingForm() {
  const [rating, setRating] = useState<number | undefined>();

  return (
    <div>
      <Label>Rate this recipe</Label>
      <InteractiveRating
        rating={rating}
        onRatingChange={setRating}
        size="md"
        clearable={true}
      />
      {rating && (
        <p className="text-sm text-muted-foreground mt-2">
          {rating} star{rating !== 1 ? "s" : ""} out of 5
        </p>
      )}
    </div>
  );
}
```

#### Pattern Variants

**Compact Variant**: Best for metadata displays
```tsx
<RatingDisplay rating={4.3} variant="compact" size="sm" />
// Outputs: "4.3/5" or "Unrated"
```

**Default Variant**: Standard display with stars
```tsx
<RatingDisplay 
  rating={4.3}
  showValue={true}
  showCount={true}
  count={12}
  size="md"
/>
// Outputs: ★★★★☆ 4.3 /5 (12 ratings)
```

**Detailed Variant**: Stylized with background container
```tsx
<RatingDisplay 
  rating={4.3}
  showValue={true}
  variant="detailed"
  size="sm"
/>
// Outputs: [★★★★☆] 4.3 /5 (styled container)
```

### Design System Compliance

#### Colors
- **Filled stars**: `text-primary fill-primary` (theme-aware)
- **Empty stars**: `text-muted-foreground/30` (subtle)
- **Hover states**: `hover:text-primary/80` (feedback)
- **Text colors**: `text-foreground`, `text-muted-foreground` (semantic)

#### Transitions
- **Standard duration**: `transition-all duration-200`
- **Smooth interactions**: Hover effects, click feedback
- **Consistent timing**: Matches design system standards

#### Spacing
- **Icon sizes**: `h-3 w-3` (sm), `h-4 w-4` (md), `h-5 w-5` (lg)
- **Gaps**: `gap-0.5` (sm), `gap-1` (md), `gap-1.5` (lg)
- **Consistent spacing**: Follows design system spacing scale

#### Accessibility
- **Semantic buttons**: Proper button elements for interactions
- **Keyboard support**: Focus management and keyboard navigation
- **Screen reader support**: Clear button labels and states
- **Visual feedback**: Hover and focus states

### Best Practices

#### ✅ DO
- Use semantic variants (compact, default, detailed)
- Apply consistent sizing across similar contexts
- Provide clear feedback for interactive ratings
- Use theme-aware colors only
- Include count information when relevant

#### ❌ DON'T
- Mix different rating styles in the same interface
- Use hard-coded colors for star states
- Create custom rating components
- Omit hover/focus states for interactive ratings
- Use generic text instead of visual stars

---

These patterns provide a solid foundation for building consistent, accessible, and performant UI components in the TasteBase application. Always refer to the main design system document for color and styling guidelines.