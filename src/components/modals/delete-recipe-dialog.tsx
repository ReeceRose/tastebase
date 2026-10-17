"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteRecipe } from "@/lib/server-actions/recipe-actions";

interface DeleteRecipeDialogProps {
  recipeId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRecipeDialog({
  recipeId,
  title,
  open,
  onOpenChange,
}: DeleteRecipeDialogProps) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const confirm = () => {
    startDeleting(async () => {
      const result = await deleteRecipe(recipeId);
      if (result.success) {
        toast.success("Recipe deleted");
        router.push("/recipes");
      } else {
        toast.error(result.error || "That recipe didn't delete. Try again.");
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
          <AlertDialogDescription>
            The recipe, its photos and everyone's notes will be removed for the
            whole house. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              confirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting…" : "Delete recipe"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
