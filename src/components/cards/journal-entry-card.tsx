"use client";

import { MoreHorizontal, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useState } from "react";
import { PhotoLightbox } from "@/components/modals/photo-lightbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { AvatarSize, JournalEntryKind } from "@/lib/types";
import type {
  JournalEntry,
  JournalEntryRecipe,
} from "@/lib/types/journal-types";
import { cn } from "@/lib/utils";
import {
  formatJournalDay,
  journalEntryHeading,
  journalRecipeTitles,
} from "@/lib/utils/journal";

interface RecipeLinksProps {
  recipes: JournalEntryRecipe[];
  linkClassName: string;
}

interface JournalEntryCardProps {
  entry: JournalEntry;
  today: string;
  isOwn: boolean;
  showAuthor: boolean;
  showRecipe: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function separator(index: number, count: number): string {
  if (index === 0) return "";
  return index === count - 1 ? " and " : ", ";
}

function RecipeLinks({ recipes, linkClassName }: RecipeLinksProps) {
  return recipes.map((recipe, index) => (
    <Fragment key={recipe.recipeId ?? `gone-${recipe.title}`}>
      {separator(index, recipes.length)}
      {recipe.slug ? (
        <Link href={`/recipes/${recipe.slug}`} className={linkClassName}>
          {recipe.title}
        </Link>
      ) : (
        <span className="font-semibold">{recipe.title}</span>
      )}
    </Fragment>
  ));
}

export function JournalEntryCard({
  entry,
  today,
  isOwn,
  showAuthor,
  showRecipe,
  onEdit,
  onDelete,
}: JournalEntryCardProps) {
  const [openPhoto, setOpenPhoto] = useState<number | null>(null);
  const cooked = entry.kind === JournalEntryKind.COOKED;
  const heading = showRecipe || !cooked ? journalEntryHeading(entry) : null;
  const recipeTitles = journalRecipeTitles(entry);
  const photos = entry.photos.map((photo) => ({
    id: photo.id,
    filename: photo.filename,
    altText: null,
    photoRole: null,
    stepNumbers: [],
  }));
  const single = photos.length === 1;

  return (
    <article className="space-y-3 rounded-tile bg-card p-5">
      <header className="flex items-center gap-2 text-meta">
        {showAuthor && (
          <>
            <MemberAvatar
              userId={entry.userId}
              name={entry.authorName}
              size={AvatarSize.SM}
              decorative
            />
            <span className="font-extrabold">
              {isOwn ? "You" : entry.authorName}
            </span>
          </>
        )}
        <span className="font-semibold text-muted-foreground">
          {cooked ? "Made it" : "Note"}
        </span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <time
          dateTime={new Date(entry.happenedAt).toISOString()}
          className="text-muted-foreground"
          suppressHydrationWarning
        >
          {formatJournalDay(entry.happenedAt, today)}
        </time>
        {entry.isPrivate && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-caption">
            Only you
          </span>
        )}
        {isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Entry options"
              className="-my-1 -mr-1 ml-auto grid size-9 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring sm:size-7"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>Edit entry</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                Delete entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {heading && (
        <h3 className="text-tile">
          {cooked && entry.recipes.length > 0 ? (
            <>
              Made{" "}
              <RecipeLinks
                recipes={entry.recipes}
                linkClassName="rounded-sm underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
              />
            </>
          ) : (
            heading
          )}
        </h3>
      )}

      {!cooked && showRecipe && recipeTitles && (
        <p className="text-meta text-muted-foreground">
          About{" "}
          <RecipeLinks
            recipes={entry.recipes}
            linkClassName="rounded-sm font-semibold text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          />
        </p>
      )}

      {entry.rating && (
        <p className="flex items-center gap-0.5">
          <span className="sr-only">Rated {entry.rating} out of 5</span>
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={`journal-star-${value}`}
              aria-hidden
              className={cn(
                "size-4",
                value <= (entry.rating ?? 0)
                  ? "fill-accent text-accent"
                  : "text-muted-foreground/40",
              )}
            />
          ))}
        </p>
      )}

      {entry.content && (
        <p className="whitespace-pre-line text-body">{entry.content}</p>
      )}

      {photos.length > 0 && (
        <ul
          className={cn(
            "grid gap-2",
            single ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3",
          )}
          aria-label="Photos"
        >
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setOpenPhoto(index)}
                aria-label={`Open photo ${index + 1} of ${photos.length}`}
                className={cn(
                  "relative block w-full overflow-hidden rounded-control bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                  single ? "aspect-[4/3] max-h-96" : "aspect-square",
                )}
              >
                <Image
                  src={`/api/recipes/images/${photo.filename}`}
                  alt=""
                  fill
                  sizes={single ? "(max-width: 768px) 100vw, 640px" : "220px"}
                  className="object-cover"
                  unoptimized
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <PhotoLightbox
        images={photos}
        title={heading ?? recipeTitles ?? "Journal photo"}
        openIndex={openPhoto}
        onOpenIndexChange={setOpenPhoto}
      />
    </article>
  );
}
