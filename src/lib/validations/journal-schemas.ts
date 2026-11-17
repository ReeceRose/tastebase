import { z } from "zod";
import { JournalEntryKind } from "@/lib/types";
import {
  JOURNAL_CONTENT_MAX,
  JOURNAL_PHOTO_MAX,
  JOURNAL_RECIPE_MAX,
  JOURNAL_TITLE_MAX,
} from "@/lib/utils/journal";

const STORED_IMAGE_NAME = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullable()
    .transform((value) => (value ? value : null));

export const journalPhotoSchema = z.object({
  filename: z.string().regex(STORED_IMAGE_NAME, "That photo isn't valid"),
  originalName: z.string().max(255).nullable(),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

export const journalEntrySchema = z
  .object({
    id: z.string().min(1).nullable(),
    kind: z.enum(JournalEntryKind),
    recipes: z
      .array(
        z.object({
          recipeId: z.string().min(1).nullable(),
          title: z.string().trim().min(1).max(500),
        }),
      )
      .max(JOURNAL_RECIPE_MAX, `Pick up to ${JOURNAL_RECIPE_MAX} recipes`),
    title: optionalText(
      JOURNAL_TITLE_MAX,
      `Titles must be ${JOURNAL_TITLE_MAX} characters or less`,
    ),
    content: optionalText(
      JOURNAL_CONTENT_MAX,
      `Entries must be ${JOURNAL_CONTENT_MAX} characters or less`,
    ),
    rating: z.number().int().min(1).max(5).nullable(),
    isPrivate: z.boolean(),
    happenedOn: z
      .string()
      .regex(ISO_DAY, "Pick a date")
      .refine((value) => !Number.isNaN(Date.parse(value)), "Pick a date"),
    photos: z
      .array(journalPhotoSchema)
      .max(JOURNAL_PHOTO_MAX, `Add up to ${JOURNAL_PHOTO_MAX} photos`),
  })
  .superRefine((entry, context) => {
    if (
      entry.kind === JournalEntryKind.NOTE &&
      !entry.title &&
      !entry.content &&
      entry.photos.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["content"],
        message: "Write something or add a photo",
      });
    }
  });

export type ValidJournalEntry = z.infer<typeof journalEntrySchema>;
