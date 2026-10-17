"use client";

import { MoreHorizontal, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { AvatarSize } from "@/lib/types";
import type { RecipeNoteWithAuthor } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import {
  isDarkSwatch,
  memberSwatch,
  swatchClasses,
} from "@/lib/utils/swatches";
import { formatRelativeDay } from "@/lib/utils/time-formatting";

interface NoteBubbleProps {
  note: RecipeNoteWithAuthor;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function NoteBubble({ note, isOwn, onEdit, onDelete }: NoteBubbleProps) {
  const swatch = memberSwatch(note.userId);
  const classes = swatchClasses(swatch);
  const dark = isDarkSwatch(swatch);
  const name = isOwn ? "You" : note.authorName;

  return (
    <article
      className={cn(
        "rounded-[20px_20px_20px_6px] px-4 pt-3 pb-4",
        classes.bg,
        classes.fg,
      )}
    >
      <header className="mb-1.5 flex items-center gap-2">
        <MemberAvatar
          userId={note.userId}
          name={note.authorName}
          size={AvatarSize.SM}
          decorative
          className="bg-white/85 text-ink-fixed"
        />
        <span className="text-meta font-extrabold">{name}</span>
        {note.isPrivate && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-caption",
              dark ? "bg-white/20" : "bg-black/10",
            )}
          >
            Only you
          </span>
        )}
        <span className="ml-auto text-caption font-normal opacity-80">
          {formatRelativeDay(note.createdAt)}
        </span>
        {isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Note options"
              className="-mr-1 grid size-7 place-items-center rounded-full outline-none hover:bg-black/10 focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>Edit note</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                Delete note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {note.rating && (
        <p className="mb-1 flex items-center gap-0.5">
          <span className="sr-only">Rated {note.rating} out of 5</span>
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={`note-star-${value}`}
              aria-hidden
              className={cn(
                "size-3.5",
                value <= (note.rating ?? 0) ? "fill-current" : "opacity-35",
              )}
            />
          ))}
        </p>
      )}
      <p className="whitespace-pre-line text-body">{note.content}</p>
    </article>
  );
}
