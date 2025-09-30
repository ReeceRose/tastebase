"use client";

import {
  Calendar,
  Copy,
  Download,
  Edit3,
  Eye,
  Image as ImageIcon,
  MoreVertical,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RecipeImage } from "@/db/schema.recipes";

interface RecipeImageCardProps {
  image: RecipeImage;
  onSetHero?: (imageId: string) => Promise<void>;
  onUpdateMetadata?: (
    imageId: string,
    metadata: { altText?: string },
  ) => Promise<void>;
  onDelete?: (imageId: string) => Promise<void>;
  onView?: (imageId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function RecipeImageCard({
  image,
  onSetHero,
  onUpdateMetadata,
  onDelete,
  onView,
  showActions = true,
  className,
}: RecipeImageCardProps) {
  const altTextId = useId();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editData, setEditData] = useState({
    altText: image.altText || "",
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const handleSetHero = async () => {
    if (!onSetHero) return;

    setIsProcessing(true);
    try {
      await onSetHero(image.id);
      toast.success("Hero image updated successfully");
    } catch {
      toast.error("Failed to set hero image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!onUpdateMetadata) return;

    setIsProcessing(true);
    try {
      await onUpdateMetadata(image.id, {
        altText: editData.altText || undefined,
      });
      toast.success("Image metadata updated successfully");
      setIsEditDialogOpen(false);
    } catch {
      toast.error("Failed to update image metadata");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsProcessing(true);
    try {
      await onDelete(image.id);
      toast.success("Image deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/recipes/images/${image.filename}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = image.originalName || image.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Image downloaded successfully");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleCopyUrl = async () => {
    try {
      const url = `/api/recipes/images/${image.filename}`;
      await navigator.clipboard.writeText(url);
      toast.success("Image URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <>
      <Card
        className={`group relative overflow-hidden hover:shadow-lg transition-all duration-200 ${className}`}
      >
        <div className="relative aspect-square">
          <Image
            src={`/api/recipes/images/${image.filename}`}
            alt={image.altText || "Recipe image"}
            fill
            className="object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
            onClick={() => onView?.(image.id)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />

          {/* Overlay with quick actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(image.id);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {showActions && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Hero badge */}
          {image.isHero && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
              <Star className="h-3 w-3 mr-1" />
              Hero
            </Badge>
          )}

          {/* Actions dropdown */}
          {showActions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 hover:bg-white h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onView?.(image.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Size
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Metadata
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!image.isHero && onSetHero && (
                    <DropdownMenuItem onClick={handleSetHero}>
                      <Star className="h-4 w-4 mr-2" />
                      Set as Hero Image
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Image
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h4
              className="text-sm font-medium truncate"
              title={image.originalName ?? undefined}
            >
              {image.originalName}
            </h4>
            {image.altText && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {image.altText}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-3 w-3" />
              <span>{formatFileSize(image.fileSize)}</span>
            </div>
            {image.width && image.height && (
              <span>
                {image.width}×{image.height}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Uploaded {new Date(image.uploadedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Edit Metadata Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image Metadata</DialogTitle>
            <DialogDescription>
              Update the metadata for this image to improve accessibility and
              organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
              <Image
                src={`/api/recipes/images/${image.filename}`}
                alt={editData.altText || "Recipe image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 50vw"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={altTextId}>Alt Text (for accessibility)</Label>
              <Textarea
                id={altTextId}
                value={editData.altText}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, altText: e.target.value }))
                }
                placeholder="Describe what's shown in this image..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Describe the image content to help users with screen readers
                understand what's shown.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateMetadata} disabled={isProcessing}>
              {isProcessing ? "Updating..." : "Update Metadata"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{image.originalName}" from your
              recipe. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
