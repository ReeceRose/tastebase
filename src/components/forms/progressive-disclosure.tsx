"use client";

import { ChevronDown, ChevronRight, Info, Settings, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface ProgressiveDisclosureSection {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  level: DisclosureLevel;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  preview?: string;
}

export enum DisclosureLevel {
  BASIC = "basic",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

interface ProgressiveDisclosureProps {
  sections: ProgressiveDisclosureSection[];
  userLevel?: DisclosureLevel;
  showLevelBadges?: boolean;
  showPreview?: boolean;
  className?: string;
}

export function ProgressiveDisclosure({
  sections,
  userLevel = DisclosureLevel.BASIC,
  showLevelBadges = true,
  showPreview = true,
  className,
}: ProgressiveDisclosureProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(
      sections
        .filter(
          (section) =>
            section.defaultOpen ||
            (userLevel === DisclosureLevel.ADVANCED &&
              section.level !== DisclosureLevel.BASIC) ||
            (userLevel === DisclosureLevel.INTERMEDIATE &&
              section.level === DisclosureLevel.BASIC),
        )
        .map((section) => section.id),
    ),
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "basic":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "basic":
        return "●";
      case "intermediate":
        return "●●";
      case "advanced":
        return "●●●";
      default:
        return "●";
    }
  };

  const getRecommendedSections = () => {
    return sections.filter((section) => {
      if (userLevel === "basic") return section.level === "basic";
      if (userLevel === "intermediate") return section.level !== "advanced";
      return true;
    });
  };

  const getOptionalSections = () => {
    return sections.filter((section) => {
      if (userLevel === "basic") return section.level !== "basic";
      if (userLevel === "intermediate") return section.level === "advanced";
      return false;
    });
  };

  const recommendedSections = getRecommendedSections();
  const optionalSections = getOptionalSections();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Recommended Sections */}
      {recommendedSections.length > 0 && (
        <div className="space-y-3">
          {recommendedSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <Collapsible
                open={openSections.has(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {openSections.has(section.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {section.icon && (
                            <div className="text-muted-foreground">
                              {section.icon}
                            </div>
                          )}
                          <span>{section.title}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {section.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {section.badge}
                            </Badge>
                          )}
                          {showLevelBadges && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getLevelColor(section.level),
                              )}
                            >
                              {getLevelIcon(section.level)} {section.level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardTitle>

                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1 text-left">
                        {section.description}
                      </p>
                    )}

                    {/* Preview when closed */}
                    {showPreview &&
                      !openSections.has(section.id) &&
                      section.preview && (
                        <p className="text-xs text-muted-foreground mt-2 italic text-left">
                          Preview: {section.preview}
                        </p>
                      )}
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">{section.children}</CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Advanced/Optional Sections */}
      {optionalSections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Advanced Options
            </h3>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </div>

          {optionalSections.map((section) => (
            <Card key={section.id} className="overflow-hidden border-dashed">
              <Collapsible
                open={openSections.has(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {openSections.has(section.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {section.icon && (
                            <div className="text-muted-foreground">
                              {section.icon}
                            </div>
                          )}
                          <span className="text-muted-foreground">
                            {section.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {section.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {section.badge}
                            </Badge>
                          )}
                          {showLevelBadges && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getLevelColor(section.level),
                              )}
                            >
                              {getLevelIcon(section.level)} {section.level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardTitle>

                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1 text-left">
                        {section.description}
                      </p>
                    )}

                    {showPreview &&
                      !openSections.has(section.id) &&
                      section.preview && (
                        <p className="text-xs text-muted-foreground mt-2 italic text-left">
                          Preview: {section.preview}
                        </p>
                      )}
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">{section.children}</CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Helper Actions */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>
            {openSections.size} of {sections.length} sections expanded
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenSections(new Set())}
            disabled={openSections.size === 0}
          >
            Collapse All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenSections(new Set(sections.map((s) => s.id)))}
            disabled={openSections.size === sections.length}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setOpenSections(new Set(recommendedSections.map((s) => s.id)))
            }
          >
            <Star className="h-3 w-3 mr-1" />
            Recommended Only
          </Button>
        </div>
      </div>
    </div>
  );
}
