import { z } from "zod";
import { RecipePdfScreen, RecipePdfStyle } from "@/lib/types";

export const recipePdfQuerySchema = z.object({
  style: z.enum(RecipePdfStyle).default(RecipePdfStyle.PRINTER),
  photos: z.stringbool().default(false),
  colour: z.stringbool().default(false),
  linked: z.stringbool().default(false),
  screen: z.enum(RecipePdfScreen).default(RecipePdfScreen.PHONE),
  download: z.stringbool().default(false),
});
