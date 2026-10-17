"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ListNameDialog } from "@/components/modals/list-name-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteRecipeList,
  updateRecipeList,
} from "@/lib/server-actions/recipe-list-actions";
import type {
  RecipeListDetail,
  RecipeListInput,
} from "@/lib/types/recipe-types";

interface ListActionsMenuProps {
  list: RecipeListDetail;
}

export function ListActionsMenu({ list }: ListActionsMenuProps) {
  const { id: listId, name } = list;
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  const edit = async (input: RecipeListInput) => {
    const result = await updateRecipeList(listId, input);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }
    router.refresh();
    return true;
  };

  const confirmDelete = () => {
    startDeleting(async () => {
      const result = await deleteRecipeList(listId);
      if (!result.success) {
        toast.error(result.error);
        setDeleteOpen(false);
        return;
      }
      toast.success("List deleted");
      router.push("/recipes/lists");
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="List actions"
          className="grid size-11 place-items-center rounded-control outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit list
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ListNameDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        listId={listId}
        title="Edit list"
        description="Recipes in the list stay where they are."
        submitLabel="Save"
        initialName={name}
        initialSwatch={list.chosenSwatch}
        onSubmit={edit}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The list goes away, but the recipes in it stay in your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete list"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
