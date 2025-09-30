"use client";

import { Keyboard, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsDialogProps {
  shortcuts: KeyboardShortcut[];
  children?: React.ReactNode;
}

export function KeyboardShortcutsDialog({
  shortcuts,
  children,
}: KeyboardShortcutsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { formatShortcut, getShortcutsByCategory } = useKeyboardShortcuts({
    shortcuts: [],
    enabled: false,
  });

  const categorizedShortcuts = getShortcutsByCategory();

  const filteredShortcuts = Object.entries(categorizedShortcuts).reduce(
    (acc, [category, categoryShortcuts]) => {
      const filtered = categoryShortcuts.filter(
        (shortcut) =>
          shortcut.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          shortcut.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      if (filtered.length > 0) {
        acc[category] = filtered;
      }

      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>,
  );

  const totalShortcuts = shortcuts.length;
  const visibleShortcuts = Object.values(filteredShortcuts).flat().length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts. Press any key
            combination to trigger the action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Results counter */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {visibleShortcuts} of {totalShortcuts} shortcuts
            </span>
            <Badge variant="outline">Press ? to open this dialog</Badge>
          </div>

          {/* Shortcuts by category */}
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-6">
              {Object.entries(filteredShortcuts).map(
                ([category, categoryShortcuts]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-3">
                        {categoryShortcuts.map((shortcut) => (
                          <div
                            key={`${category}-${shortcut.key}-${shortcut.description}`}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-sm">
                              {shortcut.description}
                            </span>
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {formatShortcut(shortcut)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}

              {Object.keys(filteredShortcuts).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Keyboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No shortcuts found matching "{searchQuery}"</p>
                  <p className="text-xs mt-1">
                    Try searching for a different term
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Tips */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">Pro Tips:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                • Shortcuts work from anywhere except when typing in input
                fields
              </li>
              <li>
                • Hold Shift while pressing shortcuts for additional actions
              </li>
              <li>• Press Escape to cancel most operations</li>
              <li>• Use Tab to navigate between form fields quickly</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
