"use client";

import {
  Check,
  Columns2,
  CookingPot,
  FileDown,
  MoreHorizontal,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CompareRecipePicker } from "@/components/modals/compare-recipe-picker";
import { DeleteRecipeDialog } from "@/components/modals/delete-recipe-dialog";
import { RecipeExportDialog } from "@/components/modals/recipe-export-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShortcutAction } from "@/hooks/use-shortcut-action";
import { recordRecipeCook } from "@/lib/server-actions/recipe-cook-actions";
import { KeyboardShortcutAction } from "@/lib/types";
import type { RecipeCookSummary } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { compareHref } from "@/lib/utils/recipe-compare";
import { COOK_REPEAT_WINDOW_MS } from "@/lib/utils/recipe-constants";

interface RecipeActionsMenuProps {
  recipeId: string;
  slug: string;
  title: string;
  hasPhotos: boolean;
  linkedRecipeTitles: string[];
  canDelete: boolean;
  canUpdateFromSource: boolean;
  cooks: RecipeCookSummary;
  currentUserId: string;
  className?: string;
}

function justCookedByUser(cooks: RecipeCookSummary, currentUserId: string) {
  if (!cooks.lastCookedAt || cooks.lastCookedBy?.id !== currentUserId) {
    return false;
  }
  return (
    Date.now() - new Date(cooks.lastCookedAt).getTime() < COOK_REPEAT_WINDOW_MS
  );
}

export function RecipeActionsMenu({
  recipeId,
  slug,
  title,
  hasPhotos,
  linkedRecipeTitles,
  canDelete,
  canUpdateFromSource,
  cooks,
  currentUserId,
  className,
}: RecipeActionsMenuProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const justCooked = justCookedByUser(cooks, currentUserId);

  useShortcutAction(KeyboardShortcutAction.EXPORT_RECIPE, () =>
    setExportOpen(true),
  );

  const share = async () => {
    const url = window.location.href.replace(/\/cook$/, "");
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      return;
    }
  };

  const markCooked = async () => {
    const result = await recordRecipeCook(recipeId);
    if (!result.success) {
      toast.error(result.error || "Couldn't mark this recipe as cooked");
      return;
    }
    toast.success(
      result.recorded ? "Marked as cooked" : "Already marked as cooked today",
    );
    router.refresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More actions"
          className={cn(
            "grid size-13 place-items-center rounded-control outline-none transition-colors hover:bg-black/10 focus-visible:ring-[3px] focus-visible:ring-ring",
            className,
          )}
        >
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {justCooked ? (
            <DropdownMenuItem disabled>
              <Check />
              Marked as cooked
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={markCooked}>
              <CookingPot />
              {cooks.count > 0 ? "Cooked it again" : "Mark as cooked"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setCompareOpen(true)}>
            <Columns2 />
            Compare with…
          </DropdownMenuItem>
          {canUpdateFromSource && (
            <DropdownMenuItem
              onSelect={() => router.push(`/recipes/${slug}/edit?refresh=1`)}
            >
              <RefreshCw />
              Update from source
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={share}>
            <Share2 />
            Share link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setExportOpen(true)}>
            <FileDown />
            Export as PDF
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 />
                Delete recipe
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <RecipeExportDialog
        slug={slug}
        title={title}
        hasPhotos={hasPhotos}
        linkedRecipeTitles={linkedRecipeTitles}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
      <CompareRecipePicker
        open={compareOpen}
        onOpenChange={setCompareOpen}
        chosen={[{ id: recipeId, slug, title }]}
        onSelect={(recipe) => {
          setCompareOpen(false);
          router.push(compareHref([slug, recipe.slug]));
        }}
      />
      {canDelete && (
        <DeleteRecipeDialog
          recipeId={recipeId}
          title={title}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}
