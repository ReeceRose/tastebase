"use client";

import { FileDown } from "lucide-react";
import { useId, useState } from "react";
import { RecipeExportPreview } from "@/components/modals/recipe-export-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { ButtonVariant, RecipePdfScreen, RecipePdfStyle } from "@/lib/types";
import {
  recipePdfFilename,
  recipePdfScreenForWidth,
  recipePdfUrl,
} from "@/lib/utils/recipe-pdf-url";

interface RecipeExportDialogProps {
  slug: string;
  title: string;
  hasPhotos: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STYLE_OPTIONS = [
  { value: RecipePdfStyle.PRINTER, label: "Printer" },
  { value: RecipePdfStyle.DEVICE, label: "Screen" },
];

const SCREEN_OPTIONS = [
  { value: RecipePdfScreen.PHONE, label: "Phone" },
  { value: RecipePdfScreen.TABLET, label: "Tablet" },
  { value: RecipePdfScreen.LAPTOP, label: "Laptop" },
];

const STYLE_HINTS: Record<RecipePdfStyle, string> = {
  [RecipePdfStyle.PRINTER]: "Plain text on letter paper. Easy on the ink.",
  [RecipePdfStyle.DEVICE]: "Full colour with photos, sized to fit your screen.",
};

export function RecipeExportDialog({
  slug,
  title,
  hasPhotos,
  open,
  onOpenChange,
}: RecipeExportDialogProps) {
  const photosId = useId();
  const colourId = useId();
  const [style, setStyle] = useState<RecipePdfStyle>(RecipePdfStyle.PRINTER);
  const [printPhotos, setPrintPhotos] = useState(false);
  const [colourPhotos, setColourPhotos] = useState(false);
  const [screen, setScreen] = useState<RecipePdfScreen>(() =>
    typeof window === "undefined"
      ? RecipePdfScreen.PHONE
      : recipePdfScreenForWidth(window.innerWidth),
  );
  const [attempt, setAttempt] = useState(0);
  const isPrinter = style === RecipePdfStyle.PRINTER;
  const includePhotos = isPrinter && printPhotos && hasPhotos;
  const choices = {
    style,
    includePhotos,
    colourPhotos: includePhotos && colourPhotos,
    screen,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export as PDF</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <SegmentedControl
              label="PDF style"
              options={STYLE_OPTIONS}
              value={style}
              onValueChange={(value) =>
                setStyle(
                  value === RecipePdfStyle.DEVICE
                    ? RecipePdfStyle.DEVICE
                    : RecipePdfStyle.PRINTER,
                )
              }
            />
            <p className="text-meta text-muted-foreground">
              {STYLE_HINTS[style]}
            </p>
            {!isPrinter && (
              <SegmentedControl
                label="Screen size"
                options={SCREEN_OPTIONS}
                value={screen}
                onValueChange={(value) =>
                  setScreen(
                    SCREEN_OPTIONS.find((option) => option.value === value)
                      ?.value ?? RecipePdfScreen.PHONE,
                  )
                }
              />
            )}
            {isPrinter && hasPhotos && (
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={photosId}>Include photos</Label>
                <Switch
                  id={photosId}
                  checked={printPhotos}
                  onCheckedChange={setPrintPhotos}
                />
              </div>
            )}
            {includePhotos && (
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={colourId}>Photos in colour</Label>
                <Switch
                  id={colourId}
                  checked={colourPhotos}
                  onCheckedChange={setColourPhotos}
                />
              </div>
            )}
          </div>

          <div className="max-h-[45dvh] overflow-y-auto rounded-control bg-muted p-3 md:max-h-[62dvh]">
            <RecipeExportPreview
              key={attempt}
              url={recipePdfUrl(slug, choices, false)}
              onRetry={() => setAttempt((value) => value + 1)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant={ButtonVariant.ACCENT} asChild>
            <a
              href={recipePdfUrl(slug, choices, true)}
              download={recipePdfFilename(slug, style, screen)}
            >
              <FileDown className="size-4" />
              Download PDF
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
