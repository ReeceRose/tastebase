import path from "node:path";
import { Font } from "@react-pdf/renderer";

const FONT_DIRECTORY = path.join(process.cwd(), "public", "fonts", "pdf");
const FONT_WEIGHTS = [400, 700, 800];
const LATIN_FAMILY = "Bricolage";
const LATIN_EXTENDED_FAMILY = "Bricolage Extended";

function registerFamily(family: string, subset: string) {
  Font.register({
    family,
    fonts: FONT_WEIGHTS.map((fontWeight) => ({
      src: path.join(
        FONT_DIRECTORY,
        `bricolage-grotesque-${subset}-${fontWeight}-normal.woff`,
      ),
      fontWeight,
    })),
  });
}

registerFamily(LATIN_FAMILY, "latin");
registerFamily(LATIN_EXTENDED_FAMILY, "latin-ext");
Font.registerHyphenationCallback((word) => [word]);

export const PDF_FONT_FAMILY = [LATIN_FAMILY, LATIN_EXTENDED_FAMILY];
