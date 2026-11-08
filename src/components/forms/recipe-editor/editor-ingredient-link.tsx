"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { LinkRecipeDialog } from "@/components/modals/link-recipe-dialog";
import type {
  LinkedRecipe,
  RecipeEditorValues,
} from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { linkSearchFromIngredient } from "@/lib/utils/recipe-editor-values";

interface EditorIngredientLinkProps {
  index: number;
  excludeRecipeId: string | null;
}

const textButton =
  "rounded-sm px-1 text-caption font-normal text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring";

export function EditorIngredientLink({
  index,
  excludeRecipeId,
}: EditorIngredientLinkProps) {
  const [open, setOpen] = useState(false);
  const { control, getValues, setValue } = useFormContext<RecipeEditorValues>();
  const linkedTitle = useWatch({
    control,
    name: `ingredients.${index}.linkedRecipeTitle`,
  });

  const saveLink = (recipe: LinkedRecipe | null) => {
    setValue(`ingredients.${index}.linkedRecipeId`, recipe?.id ?? null, {
      shouldDirty: true,
    });
    setValue(`ingredients.${index}.linkedRecipeTitle`, recipe?.title ?? null, {
      shouldDirty: true,
    });
  };

  return (
    <div className="absolute top-0 right-0 flex max-w-[55%] items-center">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(textButton, "min-w-0 truncate")}
      >
        {linkedTitle ? `Linked to ${linkedTitle}` : "Link a recipe"}
      </button>
      {linkedTitle && (
        <button
          type="button"
          onClick={() => saveLink(null)}
          aria-label={`Remove link to ${linkedTitle}`}
          className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      )}
      <LinkRecipeDialog
        open={open}
        onOpenChange={setOpen}
        initialQuery={linkSearchFromIngredient(
          getValues(`ingredients.${index}.name`) ?? "",
        )}
        excludeRecipeId={excludeRecipeId}
        onSelect={(recipe) => {
          saveLink(recipe);
          setOpen(false);
        }}
      />
    </div>
  );
}
