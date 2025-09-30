"use client";

import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  History,
  Image,
  List,
  Settings,
  Star,
  Undo2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { RecipeModificationInput } from "@/lib/types";
import { cn } from "@/lib/utils";

export enum ChangeType {
  TITLE = "title",
  INGREDIENTS = "ingredients",
  INSTRUCTIONS = "instructions",
  METADATA = "metadata",
  IMAGES = "images",
  MAJOR = "major",
}

export interface RecipeModification {
  id: string;
  recipeId: string;
  userId: string;
  changeType: ChangeType;
  changeDescription: string;
  oldValue?: string;
  newValue?: string;
  versionNumber: number;
  createdAt: Date;
  userName?: string;
}

export interface RecipeModificationHistoryProps {
  modifications: RecipeModification[];
  onRestoreVersion?: (modificationId: string) => void;
  onCompareVersions?: (versionA: number, versionB: number) => void;
  className?: string;
  showUserInfo?: boolean;
  maxHeight?: string;
}

export enum HistorySortBy {
  NEWEST = "newest",
  OLDEST = "oldest",
  CHANGE_TYPE = "change-type",
  VERSION = "version",
}

export enum HistoryFilterBy {
  ALL = "all",
  TITLE = "title",
  INGREDIENTS = "ingredients",
  INSTRUCTIONS = "instructions",
  METADATA = "metadata",
  IMAGES = "images",
  MAJOR = "major",
}

const changeTypeConfig = {
  [ChangeType.TITLE]: {
    icon: FileText,
    label: "Title Change",
    color: "bg-blue-100 text-blue-800",
  },
  [ChangeType.INGREDIENTS]: {
    icon: List,
    label: "Ingredients",
    color: "bg-green-100 text-green-800",
  },
  [ChangeType.INSTRUCTIONS]: {
    icon: Edit3,
    label: "Instructions",
    color: "bg-orange-100 text-orange-800",
  },
  [ChangeType.METADATA]: {
    icon: Settings,
    label: "Recipe Info",
    color: "bg-purple-100 text-purple-800",
  },
  [ChangeType.IMAGES]: {
    icon: Image,
    label: "Images",
    color: "bg-pink-100 text-pink-800",
  },
  [ChangeType.MAJOR]: {
    icon: Star,
    label: "Major Update",
    color: "bg-red-100 text-red-800",
  },
};

interface ModificationItemProps {
  modification: RecipeModification;
  expandedItems: Set<string>;
  toggleExpanded: (id: string) => void;
  onRestoreVersion?: (modificationId: string) => void;
  showUserInfo?: boolean;
}

const ModificationItem = ({
  modification,
  expandedItems,
  toggleExpanded,
  onRestoreVersion,
  showUserInfo,
}: ModificationItemProps) => {
  const config = changeTypeConfig[modification.changeType];
  const Icon = config.icon;
  const isExpanded = expandedItems.has(modification.id);
  const hasDetails = modification.oldValue || modification.newValue;

  return (
    <Card className="border-l-4 border-l-primary/20">
      <Collapsible>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-full bg-muted">
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("text-xs", config.color)}>
                    {config.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    v{modification.versionNumber}
                  </Badge>
                </div>

                <CardTitle className="text-sm mt-1">
                  {modification.changeDescription}
                </CardTitle>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{modification.createdAt.toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{modification.createdAt.toLocaleTimeString()}</span>
                  </div>

                  {showUserInfo && modification.userName && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{modification.userName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onRestoreVersion && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRestoreVersion(modification.id)}
                  title="Restore this version"
                >
                  <Undo2 className="h-3 w-3" />
                </Button>
              )}

              {hasDetails && (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(modification.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
          </div>
        </CardHeader>

        {hasDetails && (
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                {modification.oldValue && (
                  <div>
                    <h4 className="font-medium text-destructive mb-1">
                      Previous:
                    </h4>
                    <div className="p-2 bg-destructive/5 border border-destructive/10 rounded text-xs">
                      {typeof modification.oldValue === "string"
                        ? modification.oldValue
                        : JSON.stringify(
                            JSON.parse(modification.oldValue),
                            null,
                            2,
                          )}
                    </div>
                  </div>
                )}

                {modification.newValue && (
                  <div>
                    <h4 className="font-medium text-green-600 mb-1">
                      Updated to:
                    </h4>
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                      {typeof modification.newValue === "string"
                        ? modification.newValue
                        : JSON.stringify(
                            JSON.parse(modification.newValue),
                            null,
                            2,
                          )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  );
};

export function RecipeModificationHistory({
  modifications,
  onRestoreVersion,
  onCompareVersions,
  className,
  showUserInfo = false,
  maxHeight = "400px",
}: RecipeModificationHistoryProps) {
  const [sortBy, setSortBy] = useState<HistorySortBy>(HistorySortBy.NEWEST);
  const [filterBy, setFilterBy] = useState<HistoryFilterBy>(
    HistoryFilterBy.ALL,
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredAndSortedModifications = useMemo(() => {
    let filtered = modifications;

    // Filter by type
    if (filterBy !== HistoryFilterBy.ALL) {
      filtered = filtered.filter(
        (mod) => mod.changeType === (filterBy as unknown as ChangeType),
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case HistorySortBy.NEWEST:
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case HistorySortBy.OLDEST:
        sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case HistorySortBy.CHANGE_TYPE:
        sorted.sort((a, b) => a.changeType.localeCompare(b.changeType));
        break;
      case HistorySortBy.VERSION:
        sorted.sort((a, b) => b.versionNumber - a.versionNumber);
        break;
    }

    return sorted;
  }, [modifications, sortBy, filterBy]);

  if (modifications.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Modification History
          </CardTitle>
          <CardDescription>
            Track changes made to this recipe over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">No modifications yet</p>
            <p className="text-sm">Changes to this recipe will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Modification History
            </CardTitle>
            <CardDescription>
              {modifications.length} change
              {modifications.length !== 1 ? "s" : ""} • Current version:{" "}
              {Math.max(...modifications.map((m) => m.versionNumber))}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {onCompareVersions && modifications.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const versions = modifications
                    .map((m) => m.versionNumber)
                    .sort((a, b) => b - a);
                  onCompareVersions(versions[0], versions[1]);
                }}
              >
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Compare
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters and Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={sortBy}
            onValueChange={(value: HistorySortBy) => setSortBy(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={HistorySortBy.NEWEST}>Newest First</SelectItem>
              <SelectItem value={HistorySortBy.OLDEST}>Oldest First</SelectItem>
              <SelectItem value={HistorySortBy.CHANGE_TYPE}>By Type</SelectItem>
              <SelectItem value={HistorySortBy.VERSION}>By Version</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterBy}
            onValueChange={(value: HistoryFilterBy) => setFilterBy(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={HistoryFilterBy.ALL}>All Types</SelectItem>
              <SelectItem value={HistoryFilterBy.TITLE}>Title</SelectItem>
              <SelectItem value={HistoryFilterBy.INGREDIENTS}>
                Ingredients
              </SelectItem>
              <SelectItem value={HistoryFilterBy.INSTRUCTIONS}>
                Instructions
              </SelectItem>
              <SelectItem value={HistoryFilterBy.METADATA}>
                Recipe Info
              </SelectItem>
              <SelectItem value={HistoryFilterBy.IMAGES}>Images</SelectItem>
              <SelectItem value={HistoryFilterBy.MAJOR}>
                Major Updates
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedModifications.length} of{" "}
            {modifications.length}
          </div>
        </div>

        <Separator />

        {/* History List */}
        <ScrollArea className="w-full" style={{ maxHeight }}>
          <div className="space-y-3">
            {filteredAndSortedModifications.map((modification, index) => (
              <div key={modification.id} className="relative">
                {index < filteredAndSortedModifications.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                )}
                <ModificationItem
                  modification={modification}
                  expandedItems={expandedItems}
                  toggleExpanded={toggleExpanded}
                  onRestoreVersion={onRestoreVersion}
                  showUserInfo={showUserInfo}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        {filteredAndSortedModifications.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>No modifications found for the selected filter</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility function to create a modification record
export function createModificationRecord(
  recipeId: string,
  userId: string,
  changeType: ChangeType,
  changeDescription: string,
  oldValue?: string | number | boolean | null,
  newValue?: string | number | boolean | null,
  versionNumber?: number,
): RecipeModificationInput {
  return {
    recipeId,
    userId,
    changeType,
    changeDescription,
    oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
    newValue: newValue ? JSON.stringify(newValue) : undefined,
    versionNumber: versionNumber || 1,
  };
}

// Component for comparing two versions
export function RecipeVersionComparison({
  versionA,
  versionB,
  modifications,
  className,
}: {
  versionA: number;
  versionB: number;
  modifications: RecipeModification[];
  className?: string;
}) {
  const modA = modifications.find((m) => m.versionNumber === versionA);
  const modB = modifications.find((m) => m.versionNumber === versionB);

  if (!modA || !modB) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Cannot compare - one or both versions not found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Version Comparison</CardTitle>
        <CardDescription>
          Comparing version {versionA} with version {versionB}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-sm mb-2">Version {versionA}</h3>
            <div className="p-3 bg-muted/30 rounded text-sm">
              <p className="font-medium">{modA.changeDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {modA.createdAt.toLocaleString()}
              </p>
              {modA.newValue && (
                <div className="mt-2 text-xs">{modA.newValue}</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Version {versionB}</h3>
            <div className="p-3 bg-muted/30 rounded text-sm">
              <p className="font-medium">{modB.changeDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {modB.createdAt.toLocaleString()}
              </p>
              {modB.newValue && (
                <div className="mt-2 text-xs">{modB.newValue}</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
