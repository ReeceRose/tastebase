"use client";

import {
  Copy,
  Download,
  ExternalLink,
  Globe,
  Link as LinkIcon,
  Lock,
  Mail,
  MessageSquare,
  Share2,
  Star,
  Users,
} from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SharingType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
}

export interface ShareSettings {
  shareType: SharingType;
  allowComments: boolean;
  allowRatings: boolean;
  allowCopying?: boolean;
  expiresIn?: number;
}

export interface RecipeShareButtonProps {
  recipe: Recipe;
  onExport?: (format: string) => void;
  onCreateShareLink?: (settings: ShareSettings) => Promise<string>;
  className?: string;
  disabled?: boolean;
}

interface QuickShareActionsProps {
  disabled: boolean;
  handleCopyToClipboard: (text: string) => void;
  handleEmailShare: () => void;
  handleExport: (format: string) => void;
  setShareDialogOpen: (open: boolean) => void;
}

function QuickShareActions({
  disabled,
  handleCopyToClipboard,
  handleEmailShare,
  handleExport,
  setShareDialogOpen,
}: QuickShareActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleCopyToClipboard(window.location.href)}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Recipe URL
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleEmailShare}>
          <Mail className="h-4 w-4 mr-2" />
          Share via Email
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>

        <DropdownMenuItem onClick={() => handleExport("json")}>
          <Download className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport("markdown")}>
          <Download className="h-4 w-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <Download className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Advanced Sharing...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AdvancedSharingDialogProps {
  recipe: Recipe;
  shareDialogOpen: boolean;
  setShareDialogOpen: (open: boolean) => void;
  shareSettings: ShareSettings;
  setShareSettings: (
    settings: ShareSettings | ((prev: ShareSettings) => ShareSettings),
  ) => void;
  shareLink: string;
  isCreatingLink: boolean;
  handleCreateShareLink: () => void;
  handleCopyToClipboard: (text: string) => void;
  handleExport: (format: string) => void;
}

function AdvancedSharingDialog({
  recipe,
  shareDialogOpen,
  setShareDialogOpen,
  shareSettings,
  setShareSettings,
  shareLink,
  isCreatingLink,
  handleCreateShareLink,
  handleCopyToClipboard,
  handleExport,
}: AdvancedSharingDialogProps) {
  return (
    <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Recipe: {recipe.title}
          </DialogTitle>
          <DialogDescription>
            Create a shareable link or export your recipe in different formats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Create Share Link
              </CardTitle>
              <CardDescription>
                Generate a link that others can use to view your recipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Privacy Level</Label>
                <div className="grid gap-2">
                  {[
                    {
                      type: SharingType.LINK,
                      icon: LinkIcon,
                      title: "Share via Link",
                      description: "Anyone with the link can view",
                      available: true,
                    },
                    {
                      type: SharingType.PUBLIC,
                      icon: Globe,
                      title: "Public Recipe",
                      description: "Visible in public recipe directory",
                      available: false,
                    },
                    {
                      type: SharingType.PRIVATE,
                      icon: Lock,
                      title: "Private Only",
                      description: "Only you can view this recipe",
                      available: true,
                    },
                  ].map(
                    ({ type, icon: Icon, title, description, available }) => (
                      <button
                        type="button"
                        key={type}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors w-full text-left",
                          "hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
                          shareSettings.shareType === type &&
                            "border-primary bg-primary/5",
                          !available && "opacity-50 cursor-not-allowed",
                        )}
                        onClick={() =>
                          available &&
                          setShareSettings((prev) => ({
                            ...prev,
                            shareType: type,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (
                            (e.key === "Enter" || e.key === " ") &&
                            available
                          ) {
                            e.preventDefault();
                            setShareSettings((prev) => ({
                              ...prev,
                              shareType: type,
                            }));
                          }
                        }}
                        disabled={!available}
                      >
                        <Icon className="h-4 w-4" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{title}</span>
                            {!available && (
                              <Badge variant="outline" className="text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {description}
                          </p>
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>

              {shareSettings.shareType !== "private" && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Permissions</Label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Allow Comments</Label>
                        <p className="text-xs text-muted-foreground">
                          Viewers can leave comments on your recipe
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.allowComments}
                        onCheckedChange={(checked) =>
                          setShareSettings((prev) => ({
                            ...prev,
                            allowComments: checked,
                          }))
                        }
                        disabled
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Allow Ratings</Label>
                        <p className="text-xs text-muted-foreground">
                          Viewers can rate your recipe
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.allowRatings}
                        onCheckedChange={(checked) =>
                          setShareSettings((prev) => ({
                            ...prev,
                            allowRatings: checked,
                          }))
                        }
                        disabled
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Allow Copying</Label>
                        <p className="text-xs text-muted-foreground">
                          Viewers can copy your recipe to their collection
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.allowCopying}
                        onCheckedChange={(checked) =>
                          setShareSettings((prev) => ({
                            ...prev,
                            allowCopying: checked,
                          }))
                        }
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

              {shareSettings.shareType === "link" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Link Expiration</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 7, 30, 0].map((days) => (
                      <Button
                        key={days}
                        variant={
                          shareSettings.expiresIn === days
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setShareSettings((prev) => ({
                            ...prev,
                            expiresIn: days,
                          }))
                        }
                        disabled
                      >
                        {days === 0
                          ? "Never"
                          : `${days} day${days !== 1 ? "s" : ""}`}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {!shareLink ? (
                  <Button
                    onClick={handleCreateShareLink}
                    disabled={
                      isCreatingLink || shareSettings.shareType === "private"
                    }
                    className="w-full"
                  >
                    {isCreatingLink ? "Creating Link..." : "Create Share Link"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Share Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={shareLink}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleCopyToClipboard(shareLink)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This link will expire in {shareSettings.expiresIn} days
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Recipe
              </CardTitle>
              <CardDescription>
                Download your recipe in different formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    format: "json",
                    label: "JSON",
                    description: "Structured data format",
                  },
                  {
                    format: "markdown",
                    label: "Markdown",
                    description: "Text format with formatting",
                  },
                  {
                    format: "pdf",
                    label: "PDF",
                    description: "Printable document",
                  },
                  {
                    format: "plaintext",
                    label: "Plain Text",
                    description: "Simple text format",
                  },
                ].map(({ format, label, description }) => (
                  <Button
                    key={format}
                    variant="outline"
                    onClick={() => handleExport(format)}
                    className="h-auto p-3 flex-col items-start"
                  >
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {description}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Coming Soon
              </CardTitle>
              <CardDescription>
                Future sharing features in development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" />
                  <span>Recipe comments and discussions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  <span>Public recipe ratings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span>Recipe collections and collaboration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  <span>Public recipe directory</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RecipeShareButton({
  recipe,
  onExport,
  onCreateShareLink,
  disabled = false,
}: RecipeShareButtonProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    shareType: SharingType.LINK,
    allowComments: false,
    allowRatings: false,
    allowCopying: false,
    expiresIn: 7,
  });

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (_error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleCreateShareLink = async () => {
    if (!onCreateShareLink) return;

    setIsCreatingLink(true);
    try {
      const link = await onCreateShareLink(shareSettings);
      setShareLink(link);
      toast.success("Share link created!");
    } catch (_error) {
      toast.error("Failed to create share link");
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleExport = (format: string) => {
    if (!onExport) return;
    onExport(format);
    toast.success(`Recipe exported as ${format.toUpperCase()}`);
  };

  const handleEmailShare = () => {
    const subject = `Check out this recipe: ${recipe.title}`;
    const body = `I thought you might like this recipe:\n\n${recipe.title}\n\n${
      recipe.description || ""
    }\n\n${shareLink || `View at: ${window.location.href}`}`;

    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  };

  return (
    <>
      <QuickShareActions
        disabled={disabled}
        handleCopyToClipboard={handleCopyToClipboard}
        handleEmailShare={handleEmailShare}
        handleExport={handleExport}
        setShareDialogOpen={setShareDialogOpen}
      />
      <AdvancedSharingDialog
        recipe={recipe}
        shareDialogOpen={shareDialogOpen}
        setShareDialogOpen={setShareDialogOpen}
        shareSettings={shareSettings}
        setShareSettings={setShareSettings}
        shareLink={shareLink}
        isCreatingLink={isCreatingLink}
        handleCreateShareLink={handleCreateShareLink}
        handleCopyToClipboard={handleCopyToClipboard}
        handleExport={handleExport}
      />
    </>
  );
}

// Simple share button for basic use cases
export function SimpleRecipeShareButton({
  recipe,
  className,
}: {
  recipe: Recipe;
  className?: string;
}) {
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || "Check out this recipe!",
          url,
        });
      } catch (_error) {
        // User cancelled or error occurred
        await navigator.clipboard.writeText(url);
        toast.success("Recipe URL copied to clipboard!");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Recipe URL copied to clipboard!");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={className}
    >
      <Share2 className="h-3 w-3 mr-1" />
      Share
    </Button>
  );
}
