"use client";

import { Filter, Plus, Search, SortAsc, SortDesc } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TemplateCard } from "@/components/cards/template-card";
import { TemplateForm } from "@/components/forms/template-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserTemplates } from "@/lib/server-actions/template-actions";
import { SortOrder } from "@/lib/types";
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
  TemplateSortBy,
  type TemplateWithMeta,
} from "@/lib/types/template-types";
import type { TemplateFiltersInput } from "@/lib/validations/template-schemas";

// Type predicate for sort validation
const isValidSortBy = (value: string): value is TemplateSortBy => {
  return Object.values(TemplateSortBy).includes(value as TemplateSortBy);
};

interface TemplateListProps {
  className?: string;
}

export function TemplateList({ className }: TemplateListProps) {
  const [templates, setTemplates] = useState<TemplateWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<TemplateWithMeta | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<TemplateSortBy>(TemplateSortBy.NAME);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);

  const fetchTemplates = useCallback(async (filters?: TemplateFiltersInput) => {
    try {
      const result = await getUserTemplates(filters);

      if (result.success) {
        setTemplates(result.data || []);
      } else {
        toast.error("Failed to fetch templates");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load templates on component mount and when filters change
  useEffect(() => {
    const filters: TemplateFiltersInput = {
      searchTerm: searchTerm || undefined,
      category:
        selectedCategory !== "all"
          ? (selectedCategory as TemplateCategory)
          : undefined,
      sortBy,
      sortOrder,
    };

    fetchTemplates(filters);
  }, [searchTerm, selectedCategory, sortBy, sortOrder, fetchTemplates]);

  const handleTemplateCreated = (newTemplate: TemplateWithMeta) => {
    setTemplates((prev) => [newTemplate, ...prev]);
    setShowCreateForm(false);
  };

  const handleTemplateUpdated = (updatedTemplate: TemplateWithMeta) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
    );
    setEditingTemplate(null);
  };

  const handleTemplateDeleted = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const handleTemplateDuplicated = (duplicatedTemplate: TemplateWithMeta) => {
    setTemplates((prev) => [duplicatedTemplate, ...prev]);
  };

  const toggleSortOrder = () => {
    setSortOrder((current) =>
      current === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
    );
  };

  const getCategoryBadgeCount = (category: string) => {
    if (category === "all") {
      return templates.length;
    }
    return templates.filter((t) => t.category === category).length;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted/30 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${className || ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-muted-foreground">
              Manage your custom note templates
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Categories ({getCategoryBadgeCount("all")})
                  </SelectItem>
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      <span className="capitalize">
                        {category} ({getCategoryBadgeCount(category)})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  if (isValidSortBy(value)) {
                    setSortBy(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TemplateSortBy.NAME}>
                    Sort by Name
                  </SelectItem>
                  <SelectItem value={TemplateSortBy.USAGE}>
                    Sort by Usage
                  </SelectItem>
                  <SelectItem value={TemplateSortBy.CREATED}>
                    Sort by Created
                  </SelectItem>
                  <SelectItem value={TemplateSortBy.UPDATED}>
                    Sort by Updated
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                onClick={toggleSortOrder}
                className="justify-start"
              >
                {sortOrder === SortOrder.ASC ? (
                  <SortAsc className="h-4 w-4 mr-2" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-2" />
                )}
                {sortOrder === SortOrder.ASC ? "Ascending" : "Descending"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Your Templates ({templates.length})
            </h2>

            {selectedCategory !== "all" && (
              <Badge variant="outline" className="capitalize">
                {selectedCategory} ({getCategoryBadgeCount(selectedCategory)})
              </Badge>
            )}
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      No templates found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedCategory !== "all"
                        ? "No templates match your current filters. Try adjusting your search or category filter."
                        : "Create your first template to get started with customized note taking."}
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={setEditingTemplate}
                  onDelete={handleTemplateDeleted}
                  onDuplicate={handleTemplateDuplicated}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a custom template to speed up your recipe note taking.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            onSuccess={handleTemplateCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your template content and settings.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              template={editingTemplate}
              onSuccess={handleTemplateUpdated}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
