"use client";

import { BookOpen, Copy, Plus, Settings, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getUserTemplates,
  recordTemplateUsage,
} from "@/lib/server-actions/template-actions";
import { SortOrder } from "@/lib/types";
import type { TemplateWithMeta } from "@/lib/types/template-types";

export interface NoteTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  // General Notes Templates
  {
    id: "general-first-time",
    name: "First Time Making This",
    category: "general",
    description: "Template for your initial experience with a recipe",
    content:
      "First time making this recipe! Here's what I noticed:\n\n• Preparation took about ___ minutes\n• The instructions were [clear/confusing] at step ___\n• Final result: ___\n• Would I make this again? ___\n\nOverall impression: ___",
    tags: ["first-time", "experience"],
  },
  {
    id: "general-quick-notes",
    name: "Quick Notes",
    category: "general",
    description: "Simple template for brief observations",
    content: "Quick notes:\n\n• ___\n• ___\n• ___\n\nNext time: ___",
    tags: ["quick", "simple"],
  },

  // Modifications Templates
  {
    id: "modifications-substitutions",
    name: "Ingredient Substitutions",
    category: "modifications",
    description: "Track ingredient swaps and their results",
    content:
      "Ingredient substitutions I made:\n\n• Replaced ___ with ___ because ___\n• Used ___ instead of ___ (results: ___)\n• Adjusted ___ from ___ to ___\n\nHow it affected the recipe:\n___\n\nWould I use these substitutions again?\n___",
    tags: ["substitutions", "ingredients"],
  },
  {
    id: "modifications-scaling",
    name: "Recipe Scaling",
    category: "modifications",
    description: "Notes on doubling, halving, or scaling recipes",
    content:
      "Scaled this recipe:\n\n• Original serves: ___\n• Made for: ___\n• Scaling factor: ___\n\nAdjustments needed:\n• Cooking time: ___ (was ___)\n• Temperature: ___ (was ___)\n• Special considerations: ___\n\nResults: ___",
    tags: ["scaling", "portions"],
  },
  {
    id: "modifications-dietary",
    name: "Dietary Modifications",
    category: "modifications",
    description: "Adapting recipes for dietary restrictions",
    content:
      "Made this [gluten-free/dairy-free/vegan/etc.]:\n\n• Replaced ___ with ___\n• Added ___ for texture/flavor\n• Omitted ___ because ___\n\nResults:\n• Taste: ___\n• Texture: ___\n• Overall success: ___\n\nTips for next time:\n___",
    tags: ["dietary", "adaptations"],
  },

  // Cooking Tips Templates
  {
    id: "tips-techniques",
    name: "Technique Notes",
    category: "tips",
    description: "Helpful cooking techniques and methods",
    content:
      "Helpful techniques I discovered:\n\n• For better results: ___\n• Pro tip: ___\n• What worked well: ___\n• What to avoid: ___\n\nKey technique: ___\nWhy it matters: ___\n\nAdvice for beginners: ___",
    tags: ["techniques", "tips"],
  },
  {
    id: "tips-shortcuts",
    name: "Time-Saving Shortcuts",
    category: "tips",
    description: "Ways to make the recipe faster or easier",
    content:
      "Time-saving shortcuts:\n\n• Prep ahead: ___\n• Quick version: ___\n• Equipment that helps: ___\n• Steps that can be combined: ___\n\nOriginal time: ___\nWith shortcuts: ___\n\nQuality comparison: ___",
    tags: ["shortcuts", "efficiency"],
  },

  // Timing Templates
  {
    id: "timing-schedule",
    name: "Cooking Schedule",
    category: "timing",
    description: "Detailed timing for complex recipes",
    content:
      "Cooking schedule:\n\n1 hour before: ___\n30 minutes before: ___\n15 minutes before: ___\nStart cooking: ___\n\nActual timing:\n• Prep: ___ minutes\n• Active cooking: ___ minutes\n• Passive cooking: ___ minutes\n• Total: ___ minutes\n\nNext time adjustments: ___",
    tags: ["schedule", "timing"],
  },
  {
    id: "timing-make-ahead",
    name: "Make-Ahead Notes",
    category: "timing",
    description: "What can be prepared in advance",
    content:
      "Make-ahead options:\n\n• Can prep ___ days ahead: ___\n• Freeze for up to: ___\n• Reheat by: ___\n• Best consumed within: ___\n\nQuality after storage:\n• Taste: ___\n• Texture: ___\n• Overall: ___\n\nStorage tips: ___",
    tags: ["make-ahead", "storage"],
  },

  // Rating Templates
  {
    id: "rating-detailed",
    name: "Detailed Review",
    category: "rating",
    description: "Comprehensive rating with detailed feedback",
    content:
      "Detailed Review:\n\n★ TASTE: ___/5 - ___\n★ DIFFICULTY: ___/5 - ___\n★ TIME VALUE: ___/5 - ___\n★ INSTRUCTIONS: ___/5 - ___\n★ OVERALL: ___/5\n\nWhat I loved: ___\nWhat could be improved: ___\nWho would I recommend this to: ___\n\nWill I make again? ___",
    tags: ["review", "detailed"],
  },
  {
    id: "rating-quick",
    name: "Quick Rating",
    category: "rating",
    description: "Simple rating template",
    content:
      "Quick rating: ⭐⭐⭐⭐⭐\n\nThe good: ___\nThe not-so-good: ___\nPerfect for: ___\nNext time: ___",
    tags: ["rating", "simple"],
  },
];

interface NoteTemplatesProps {
  onSelectTemplate: (content: string) => void;
  className?: string;
}

export function NoteTemplates({
  onSelectTemplate,
  className,
}: NoteTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userTemplates, setUserTemplates] = useState<TemplateWithMeta[]>([]);
  const [loadingUserTemplates, setLoadingUserTemplates] = useState(true);

  const filteredTemplates = NOTE_TEMPLATES;

  // Load user templates when the dialog opens
  useEffect(() => {
    const fetchUserTemplates = async () => {
      if (isOpen) {
        try {
          const result = await getUserTemplates({
            sortBy: "usage",
            sortOrder: SortOrder.DESC,
          });
          if (result.success) {
            setUserTemplates(result.data || []);
          }
        } catch (error) {
          console.error("Error fetching user templates:", error);
        } finally {
          setLoadingUserTemplates(false);
        }
      }
    };

    fetchUserTemplates();
  }, [isOpen]);

  const handleUseTemplate = async (
    template: NoteTemplate | TemplateWithMeta,
  ) => {
    onSelectTemplate(template.content);
    setIsOpen(false);
    toast.success(`Applied "${template.name}" template`);

    // Record usage for user templates
    if ("isSystem" in template && !template.isSystem) {
      try {
        await recordTemplateUsage({ templateId: template.id });
      } catch (error) {
        console.error("Failed to record template usage:", error);
      }
    }
  };

  const copyTemplate = (template: NoteTemplate | TemplateWithMeta) => {
    navigator.clipboard.writeText(template.content);
    toast.success("Template copied to clipboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <BookOpen className="h-4 w-4 mr-2" />
          Use Template
          <Badge variant="secondary" className="ml-2">
            {filteredTemplates.length + userTemplates.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Note Templates
          </DialogTitle>
          <DialogDescription>
            Choose a template to get started with your note, or use it as
            inspiration for your own content.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Templates ({userTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Templates ({filteredTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="mt-4">
            <ScrollArea className="max-h-[50vh] pr-4">
              {loadingUserTemplates ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted/30 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : userTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No custom templates yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your own templates to speed up your note-taking
                    process.
                  </p>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">
                            {template.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.usageCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Used {template.usageCount}x
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description || "No description"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTemplate(template)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          className="h-8 px-3"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="system" className="mt-4">
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{template.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyTemplate(template)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="h-8 px-3"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
