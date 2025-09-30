"use client";

import {
  Calendar,
  Copy,
  Eye,
  Globe,
  Lock,
  Settings,
  Share2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PermissionLevel, SharingType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CollectionCollaborator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  permissions: PermissionLevel;
  addedAt: Date;
  addedByUserId: string;
  addedByUserName: string;
}

export interface CollectionShareSettings {
  id: string;
  shareType: SharingType;
  shareLink?: string;
  allowComments: boolean;
  allowCopying: boolean;
  requireAuth: boolean;
  expiresAt?: Date;
  collaborators: CollectionCollaborator[];
  totalViews: number;
  totalCopies: number;
}

export interface CollectionShareSettingsProps {
  collectionName: string;
  ownerId: string;
  currentSettings: CollectionShareSettings;
  onUpdateSettings: (
    settings: Partial<CollectionShareSettings>,
  ) => Promise<void>;
  onAddCollaborator: (email: string, permissions: string) => Promise<void>;
  onUpdateCollaborator: (
    collaboratorId: string,
    permissions: string,
  ) => Promise<void>;
  onRemoveCollaborator: (collaboratorId: string) => Promise<void>;
  onGenerateShareLink: () => Promise<string>;
  onDeleteShareLink: () => Promise<void>;
  className?: string;
}

// Extracted components for better performance
const ShareTypeSelector = ({
  settings,
  handleUpdateSettings,
}: {
  settings: { shareType: SharingType };
  handleUpdateSettings: (updates: { shareType: SharingType }) => void;
}) => (
  <div className="space-y-3">
    <Label className="text-sm font-medium">Privacy Level</Label>
    <div className="grid gap-2">
      {[
        {
          type: SharingType.PRIVATE,
          icon: Lock,
          title: "Private",
          description: "Only you and invited collaborators can access",
          available: true,
        },
        {
          type: SharingType.LINK,
          icon: Share2,
          title: "Anyone with Link",
          description: "Anyone with the link can access",
          available: true,
        },
        {
          type: SharingType.PUBLIC,
          icon: Globe,
          title: "Public",
          description: "Visible in public collection directory",
          available: false, // Future feature
        },
      ].map(({ type, icon: Icon, title, description, available }) => (
        <button
          key={type}
          type="button"
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors text-left w-full",
            settings.shareType === type && "border-primary bg-primary/5",
            !available && "opacity-50 cursor-not-allowed",
          )}
          onClick={() => available && handleUpdateSettings({ shareType: type })}
          disabled={!available}
        >
          <Icon className="h-4 w-4" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{title}</span>
              {!available && (
                <Badge variant="outline" className="text-xs">
                  Coming Soon
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const CollaboratorItem = ({
  collaborator,
  ownerId,
  onUpdateCollaborator,
  onRemoveCollaborator,
}: {
  collaborator: CollectionCollaborator;
  ownerId: string;
  onUpdateCollaborator: (id: string, permissions: string) => void;
  onRemoveCollaborator: (collaboratorId: string) => Promise<void>;
}) => (
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={collaborator.userAvatar} />
        <AvatarFallback>
          {collaborator.userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div>
        <p className="text-sm font-medium">{collaborator.userName}</p>
        <p className="text-xs text-muted-foreground">
          {collaborator.userEmail}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Select
        value={collaborator.permissions}
        onValueChange={(value) => onUpdateCollaborator(collaborator.id, value)}
        disabled={collaborator.userId === ownerId}
      >
        <SelectTrigger className="w-24 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="read">View</SelectItem>
          <SelectItem value="edit">Edit</SelectItem>
        </SelectContent>
      </Select>

      {collaborator.userId !== ownerId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveCollaborator(collaborator.id)}
          className="text-destructive hover:text-destructive h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
);

export function CollectionShareSettings({
  collectionName,
  ownerId,
  currentSettings,
  onUpdateSettings,
  onAddCollaborator,
  onUpdateCollaborator,
  onRemoveCollaborator,
  onGenerateShareLink,
  onDeleteShareLink,
  className,
}: CollectionShareSettingsProps) {
  const [settings, setSettings] = useState(currentSettings);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermissions, setInvitePermissions] = useState<PermissionLevel>(
    PermissionLevel.VIEW,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateSettings = async (
    updates: Partial<CollectionShareSettings>,
  ) => {
    setIsLoading(true);
    try {
      await onUpdateSettings(updates);
      setSettings((prev) => ({ ...prev, ...updates }));
      toast.success("Settings updated successfully");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setIsLoading(true);
    try {
      const shareLink = await onGenerateShareLink();
      setSettings((prev) => ({ ...prev, shareLink }));
      toast.success("Share link generated");
    } catch {
      toast.error("Failed to generate share link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShareLink = async () => {
    setIsLoading(true);
    try {
      await onDeleteShareLink();
      setSettings((prev) => ({
        ...prev,
        shareLink: undefined,
        shareType: SharingType.PRIVATE,
      }));
      toast.success("Share link deleted");
    } catch {
      toast.error("Failed to delete share link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      await onAddCollaborator(inviteEmail, invitePermissions);
      setInviteEmail("");
      toast.success("Invitation sent");
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!settings.shareLink) return;

    try {
      await navigator.clipboard.writeText(settings.shareLink);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Collection: {collectionName}
        </CardTitle>
        <CardDescription>
          Manage who can access and collaborate on this collection
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Share Type Selection */}
        <ShareTypeSelector
          settings={settings}
          handleUpdateSettings={handleUpdateSettings}
        />

        {/* Share Link Section */}
        {settings.shareType !== "private" && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Share Link</Label>

            {settings.shareLink ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={settings.shareLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button size="sm" onClick={handleCopyShareLink}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteShareLink}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{settings.totalViews} views</span>
                  <span>{settings.totalCopies} copies</span>
                </div>
              </div>
            ) : (
              <Button onClick={handleGenerateShareLink} disabled={isLoading}>
                Generate Share Link
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Permissions */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Link Permissions</Label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Allow Comments</Label>
                <p className="text-xs text-muted-foreground">
                  Viewers can comment on recipes in this collection
                </p>
              </div>
              <Switch
                checked={settings.allowComments}
                onCheckedChange={(checked) =>
                  handleUpdateSettings({ allowComments: checked })
                }
                disabled={settings.shareType === "private"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Allow Copying</Label>
                <p className="text-xs text-muted-foreground">
                  Viewers can copy this collection to their account
                </p>
              </div>
              <Switch
                checked={settings.allowCopying}
                onCheckedChange={(checked) =>
                  handleUpdateSettings({ allowCopying: checked })
                }
                disabled={settings.shareType === "private"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Require Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Only signed-in users can access this collection
                </p>
              </div>
              <Switch
                checked={settings.requireAuth}
                onCheckedChange={(checked) =>
                  handleUpdateSettings({ requireAuth: checked })
                }
                disabled={settings.shareType === "private"}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Collaborators */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Collaborators ({settings.collaborators.length})
            </Label>
          </div>

          {/* Invite New Collaborator */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Select
              value={invitePermissions}
              onValueChange={(value: string) =>
                setInvitePermissions(value as PermissionLevel)
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleInviteCollaborator}
              disabled={isLoading || !inviteEmail.trim()}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Collaborator List */}
          <div className="space-y-2">
            {settings.collaborators.map((collaborator) => (
              <CollaboratorItem
                key={collaborator.id}
                collaborator={collaborator}
                ownerId={ownerId}
                onUpdateCollaborator={onUpdateCollaborator}
                onRemoveCollaborator={onRemoveCollaborator}
              />
            ))}

            {settings.collaborators.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No collaborators yet</p>
                <p className="text-xs">
                  Invite people to collaborate on this collection
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Advanced Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Advanced Options</Label>

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p className="font-medium">Link Expiration</p>
              <p className="text-xs">Coming soon - set expiration dates</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium">Analytics</p>
              <p className="text-xs">Coming soon - detailed view analytics</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium">Download Protection</p>
              <p className="text-xs">Coming soon - prevent bulk downloads</p>
            </div>

            <div className="space-y-1">
              <p className="font-medium">Password Protection</p>
              <p className="text-xs">Coming soon - password-protect links</p>
            </div>
          </div>
        </div>

        {/* Future Features Preview */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">
              Coming in Future Updates
            </CardTitle>
            <CardDescription>
              Advanced collaboration features in development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Real-time collaborative editing</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3" />
                <span>View and edit permissions by recipe</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                <span>Custom invitation messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                <span>Public collection marketplace</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
