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
  linkedRecipes: RecipeWithRelations[] = [],
): Promise<Buffer> {
  const includedRecipeIds = new Set(linkedRecipes.map((item) => item.id));
  const contents = [recipe, ...linkedRecipes].map((item) =>
    buildRecipePdfContent(item, options.units, includedRecipeIds),
  );
  const isPrinter = options.style === RecipePdfStyle.PRINTER;
  const wantsPhotos = !isPrinter || options.includePhotos;
  const photos = await loadRecipePdfPhotos(
    wantsPhotos ? contents.flatMap(recipePdfPhotoFilenames) : [],
    isPrinter && !options.colourPhotos,
  );

  return renderToBuffer(
    isPrinter ? (
      <RecipePrinterPdf contents={contents} photos={photos} />
    ) : (
      <RecipeDevicePdf
        contents={contents}
        photos={photos}
        screen={options.screen}
      />
    ),
  );
}
