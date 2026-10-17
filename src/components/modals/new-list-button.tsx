"use client";

import { Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ListNameDialog } from "@/components/modals/list-name-dialog";
import { Button } from "@/components/ui/button";
import { createRecipeList } from "@/lib/server-actions/recipe-list-actions";
import { ButtonVariant } from "@/lib/types";
import type { RecipeListInput } from "@/lib/types/recipe-types";

export function NewListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftId, setDraftId] = useState(() => nanoid());

  const create = async (input: RecipeListInput) => {
    const result = await createRecipeList(draftId, input, null);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }
    setDraftId(nanoid());
    router.push(`/recipes/lists/${result.data.id}`);
    return true;
  };

  return (
    <>
      <Button variant={ButtonVariant.ACCENT} onClick={() => setOpen(true)}>
        <Plus className="size-4" strokeWidth={2.5} />
        New list
      </Button>
      <ListNameDialog
        open={open}
        onOpenChange={setOpen}
        listId={draftId}
        title="New list"
        description="Only you can see your lists. Add recipes to it from any recipe page."
        submitLabel="Create list"
        initialName=""
        initialSwatch={null}
        onSubmit={create}
      />
    </>
  );
}
