"use client";

import { CookingPot, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteRecipeDialog } from "@/components/modals/delete-recipe-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { recordRecipeCook } from "@/lib/server-actions/recipe-cook-actions";
import { cn } from "@/lib/utils";

interface RecipeActionsMenuProps {
  recipeId: string;
  title: string;
  canDelete: boolean;
  className?: string;
}

export function RecipeActionsMenu({
  recipeId,
  title,
  canDelete,
  className,
}: RecipeActionsMenuProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          <DropdownMenuItem onSelect={markCooked}>
            <CookingPot />
            Mark as cooked
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={share}>
            <Share2 />
            Share link
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
