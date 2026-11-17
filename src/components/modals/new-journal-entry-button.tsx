"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JournalEntryDialog } from "@/components/modals/journal-entry-dialog";
import { Button } from "@/components/ui/button";
import {
  type ButtonVariant,
  ComponentSize,
  JournalEntryKind,
} from "@/lib/types";
import type { LinkedRecipe } from "@/lib/types/recipe-types";

interface NewJournalEntryButtonProps {
  label: string;
  presetRecipe: LinkedRecipe | null;
  variant: ButtonVariant;
  size: ComponentSize;
  initiallyOpen: boolean;
}

export function NewJournalEntryButton({
  label,
  presetRecipe,
  variant,
  size,
  initiallyOpen,
}: NewJournalEntryButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(initiallyOpen);

  useEffect(() => {
    if (initiallyOpen) setOpen(true);
  }, [initiallyOpen]);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next && initiallyOpen) router.replace(pathname, { scroll: false });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size === ComponentSize.SM ? "sm" : "default"}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" strokeWidth={2.5} />
        {label}
      </Button>
      <JournalEntryDialog
        open={open}
        onOpenChange={changeOpen}
        entry={null}
        presetRecipe={presetRecipe}
        defaultKind={JournalEntryKind.COOKED}
      />
    </>
  );
}
