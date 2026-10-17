"use client";

import { Heart, LayoutList, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ListNameDialog } from "@/components/modals/list-name-dialog";
import { useNavCounts } from "@/components/navigation/nav-counts-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setFavourite } from "@/lib/server-actions/recipe-favorites-actions";
import {
  createRecipeList,
  setRecipeInList,
} from "@/lib/server-actions/recipe-list-actions";
import { ButtonVariant, NavCountKey } from "@/lib/types";
import type {
  RecipeListInput,
  RecipeListOption,
} from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";

const FAVOURITES_KEY = "favourites";

interface RecipeSaveMenuProps {
  recipeId: string;
  initialIsFavourite: boolean;
  initialLists: RecipeListOption[];
}

function saveLabel(isFavourite: boolean, listCount: number): string {
  if (listCount === 0) return isFavourite ? "Saved" : "Save";
  const lists = `${listCount} ${listCount === 1 ? "list" : "lists"}`;
  return isFavourite ? `Saved, ${lists}` : `In ${lists}`;
}

export function RecipeSaveMenu({
  recipeId,
  initialIsFavourite,
  initialLists,
}: RecipeSaveMenuProps) {
  const { adjustCount } = useNavCounts();
  const [isFavourite, setIsFavourite] = useState(initialIsFavourite);
  const [lists, setLists] = useState(initialLists);
  const [createOpen, setCreateOpen] = useState(false);
  const [draftId, setDraftId] = useState(() => nanoid());
  const latestRequest = useRef(new Map<string, number>());
  const listCount = lists.filter((list) => list.containsRecipe).length;

  const startRequest = (key: string) => {
    const request = (latestRequest.current.get(key) ?? 0) + 1;
    latestRequest.current.set(key, request);
    return () => request === latestRequest.current.get(key);
  };

  const showFavourite = (value: boolean) => {
    setIsFavourite(value);
    adjustCount(NavCountKey.FAVOURITES, value ? 1 : -1);
  };

  const toggleFavourite = async (next: boolean) => {
    const isLatest = startRequest(FAVOURITES_KEY);
    showFavourite(next);
    const result = await setFavourite(recipeId, next).catch(() => null);
    if (!isLatest() || result?.success) return;
    showFavourite(!next);
    toast.error(result?.error || "Couldn't update your favourites");
  };

  const setIncluded = (listId: string, included: boolean) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId ? { ...list, containsRecipe: included } : list,
      ),
    );
  };

  const toggleList = async (list: RecipeListOption, included: boolean) => {
    const isLatest = startRequest(list.id);
    setIncluded(list.id, included);
    const result = await setRecipeInList(list.id, recipeId, included).catch(
      () => null,
    );
    if (!isLatest()) return;
    if (result?.success) {
      toast.success(
        included ? `Added to ${list.name}` : `Removed from ${list.name}`,
      );
      return;
    }
    setIncluded(list.id, !included);
    toast.error(
      result && !result.success ? result.error : "Couldn't update that list",
    );
  };

  const create = async (input: RecipeListInput) => {
    const result = await createRecipeList(draftId, input, recipeId);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }
    setDraftId(nanoid());
    setLists((current) => [...current, result.data]);
    toast.success(`Added to ${result.data.name}`);
    return true;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={ButtonVariant.SECONDARY} size="lg">
            <Heart
              className={cn(
                "size-5",
                isFavourite && "fill-swatch-tomato text-swatch-tomato",
              )}
            />
            {saveLabel(isFavourite, listCount)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuCheckboxItem
            checked={isFavourite}
            onCheckedChange={(checked) => toggleFavourite(checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            <Heart className="text-swatch-tomato" />
            Favourites
          </DropdownMenuCheckboxItem>
          {lists.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Your lists</DropdownMenuLabel>
              {lists.map((list) => (
                <DropdownMenuCheckboxItem
                  key={list.id}
                  checked={list.containsRecipe}
                  onCheckedChange={(checked) =>
                    toggleList(list, checked === true)
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      swatchClasses(list.swatch).bg,
                    )}
                  />
                  <span className="truncate">{list.name}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
            <Plus />
            New list
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/recipes/lists">
              <LayoutList />
              See all lists
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ListNameDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        listId={draftId}
        title="New list"
        description="This recipe goes straight in. Only you can see your lists."
        submitLabel="Create and add"
        initialName=""
        initialSwatch={null}
        onSubmit={create}
      />
    </>
  );
}
