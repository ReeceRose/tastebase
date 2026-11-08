import { renderToBuffer } from "@react-pdf/renderer";
import { RecipeDevicePdf } from "@/components/pdf/recipe-device-pdf";
import { RecipePrinterPdf } from "@/components/pdf/recipe-printer-pdf";
import {
  buildRecipePdfContent,
  recipePdfPhotoFilenames,
} from "@/lib/pdf/recipe-pdf-content";
import { loadRecipePdfPhotos } from "@/lib/pdf/recipe-pdf-photos";
import { RecipePdfStyle } from "@/lib/types";
import type { RecipePdfOptions } from "@/lib/types/recipe-pdf-types";
import type { RecipeWithRelations } from "@/lib/types/recipe-types";

export async function renderRecipePdf(
  recipe: RecipeWithRelations,
  options: RecipePdfOptions,
): Promise<Buffer> {
  const content = buildRecipePdfContent(recipe, options.units);
  const isPrinter = options.style === RecipePdfStyle.PRINTER;
  const wantsPhotos = !isPrinter || options.includePhotos;
  const photos = await loadRecipePdfPhotos(
    wantsPhotos ? recipePdfPhotoFilenames(content) : [],
    isPrinter && !options.colourPhotos,
  );

  return renderToBuffer(
    isPrinter ? (
      <RecipePrinterPdf content={content} photos={photos} />
    ) : (
      <RecipeDevicePdf
        content={content}
        photos={photos}
        screen={options.screen}
      />
    ),
  );
}
