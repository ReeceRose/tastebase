"use client";

import {
  type FormEvent,
  useEffect,
  useId,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SwatchPicker } from "@/components/ui/swatch-picker";
import { ButtonVariant, type RecipeSwatch } from "@/lib/types";
import type { RecipeListInput } from "@/lib/types/recipe-types";
import { swatchFor } from "@/lib/utils/swatches";

interface ListNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  title: string;
  description: string;
  submitLabel: string;
  initialName: string;
  initialSwatch: RecipeSwatch | null;
  onSubmit: (input: RecipeListInput) => Promise<boolean>;
}

export function ListNameDialog({
  open,
  onOpenChange,
  listId,
  title,
  description,
  submitLabel,
  initialName,
  initialSwatch,
  onSubmit,
}: ListNameDialogProps) {
  const nameId = useId();
  const [name, setName] = useState(initialName);
  const [swatch, setSwatch] = useState(initialSwatch);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setSwatch(initialSwatch);
  }, [open, initialName, initialSwatch]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    startSaving(async () => {
      const saved = await onSubmit({ name, swatch });
      if (saved) onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Want to cook"
              maxLength={60}
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Colour</p>
            <SwatchPicker
              label="List colour"
              value={swatch}
              automaticSwatch={swatchFor(listId)}
              onValueChange={setSwatch}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant={ButtonVariant.OUTLINE}
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
