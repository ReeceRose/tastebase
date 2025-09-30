"use client";

import { Copy, Edit2, Eye, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteTemplate,
  duplicateTemplate,
} from "@/lib/server-actions/template-actions";
import { BadgeVariant, SizeVariant } from "@/lib/types";
import type { TemplateWithMeta } from "@/lib/types/template-types";

interface TemplateCardProps {
  template: TemplateWithMeta;
  onEdit?: (template: TemplateWithMeta) => void;
  onDelete?: (templateId: string) => void;
  onDuplicate?: (template: TemplateWithMeta) => void;
  className?: string;
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  className,
}: TemplateCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDeleteTemplate = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTemplate(template.id);

      if (result.success) {
        toast.success("Template deleted successfully");
        onDelete?.(template.id);
        setShowDeleteDialog(false);
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateTemplate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateTemplate(template.id);

      if (result.success) {
        toast.success("Template duplicated successfully");
        onDuplicate?.(result.data as TemplateWithMeta);
      } else {
        toast.error(result.error || "Failed to duplicate template");
      }
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Failed to duplicate template");
    } finally {
      setIsDuplicating(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card
        className={`group hover:shadow-lg transition-shadow duration-200 !gap-1 ${className || ""}`}
      >
        <CardHeader className="!px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base line-clamp-1">
                  {template.name}
                </CardTitle>
                {template.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
                {template.isRecent && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Recent
                  </Badge>
                )}
              </div>

              <CategoryBadge
                category={template.category}
                variant={BadgeVariant.DEFAULT}
                size={SizeVariant.SM}
              />

              {template.description && (
                <CardDescription className="text-sm line-clamp-2 mt-1">
                  {template.description}
                </CardDescription>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={SizeVariant.SM}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDuplicateTemplate}
                  disabled={isDuplicating}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {isDuplicating ? "Duplicating..." : "Duplicate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onEdit?.(template)}
                  disabled={template.isSystem}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                  disabled={template.isSystem}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="!px-4 !py-0">
          <div className="space-y-2">
            {/* Content preview */}
            <div className="bg-muted/30 rounded-lg px-0 py-2">
              <p className="text-xs text-muted-foreground font-mono line-clamp-3">
                {template.content}
              </p>
            </div>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Footer info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Used {template.usageCount} times</span>
                <span>•</span>
                <span>{formatDate(template.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {template.name}
              <CategoryBadge
                category={template.category}
                variant={BadgeVariant.DEFAULT}
                size={SizeVariant.SM}
              />
            </DialogTitle>
            {template.description && (
              <DialogDescription>{template.description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Template Content</h4>
              <div className="bg-muted/30 rounded-lg px-0 py-4 font-mono text-sm whitespace-pre-wrap">
                {template.content}
              </div>
            </div>

            {template.tags && template.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{template.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTemplate}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
