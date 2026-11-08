import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PDF_SWATCH_COLOURS } from "@/lib/pdf/recipe-pdf-colours";
import {
  buildRecipePdfContent,
  splitIngredientColumns,
} from "@/lib/pdf/recipe-pdf-content";
import { loadRecipePdfPhotos } from "@/lib/pdf/recipe-pdf-photos";
import { RECIPE_PDF_SCREEN_LAYOUTS } from "@/lib/pdf/recipe-pdf-screen-layouts";
import { pdfText } from "@/lib/pdf/recipe-pdf-text";
import { renderRecipePdf } from "@/lib/pdf/render-recipe-pdf";
import {
  MeasurementUnit,
  PhotoRole,
  RecipeDifficulty,
  RecipePdfScreen,
  RecipePdfStyle,
  RecipeSwatch,
  TemperatureUnit,
} from "@/lib/types";
import type {
  RecipePdfIngredientGroup,
  RecipePdfUnits,
} from "@/lib/types/recipe-pdf-types";
import type {
  RecipeImage,
  RecipeIngredient,
  RecipeInstruction,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import {
  recipePdfScreenForWidth,
  recipePdfUrl,
} from "@/lib/utils/recipe-pdf-url";

const photoDirectory = mkdtempSync(path.join(tmpdir(), "tastebase-pdf-"));

vi.mock("@/lib/file-storage", () => ({
  getRecipeImagePath: (filename: string) => path.join(photoDirectory, filename),
}));

const imperial: RecipePdfUnits = {
  measurementSystem: MeasurementUnit.IMPERIAL,
  temperatureUnit: TemperatureUnit.FAHRENHEIT,
};
const metric: RecipePdfUnits = {
  measurementSystem: MeasurementUnit.METRIC,
  temperatureUnit: TemperatureUnit.CELSIUS,
};

function image(
  id: string,
  role: PhotoRole | null,
  stepNumbers: number[],
  isHero = false,
): RecipeImage {
  return {
    id,
    recipeId: "recipe",
    filename: `${id}.png`,
    originalName: null,
    mimeType: "image/png",
    fileSize: 1,
    width: null,
    height: null,
    altText: null,
    isHero,
    sortOrder: 0,
    photoRole: role,
    stepNumbers,
    metadata: null,
    uploadedAt: new Date(),
  };
}

function ingredient(
  id: string,
  sortOrder: number,
  amount: string | null,
  unit: string | null,
  name: string,
  overrides: Partial<RecipeIngredient> = {},
): RecipeIngredient {
  return {
    id,
    recipeId: "recipe",
    name,
    amount,
    unit,
    notes: null,
    groupName: null,
    sortOrder,
    isOptional: false,
    linkedRecipeId: null,
    ...overrides,
  };
}

function step(
  stepNumber: number,
  instruction: string,
  overrides: Partial<RecipeInstruction> = {},
): RecipeInstruction {
  return {
    id: `step-${stepNumber}`,
    recipeId: "recipe",
    stepNumber,
    instruction,
    timeMinutes: null,
    temperature: null,
    notes: null,
    groupName: null,
    ...overrides,
  };
}

const recipe: RecipeWithRelations = {
  id: "recipe",
  slug: "roast-chicken",
  userId: "user",
  title: "Roast chicken 🍗",
  description: "A weeknight bird.",
  servings: 4,
  prepTimeMinutes: 15,
  cookTimeMinutes: 60,
  difficulty: RecipeDifficulty.HARD,
  cuisine: null,
  swatch: RecipeSwatch.LEEK,
  sourceUrl: "https://example.com/chicken",
  sourceName: "The binder",
  videoUrl: null,
  extraNotes: null,
  isPublic: true,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ingredients: [
    ingredient("salt", 2, null, null, "Salt", { isOptional: true }),
    ingredient("flour", 1, "1⅓", "cup", "flour", { notes: "sifted" }),
  ],
  instructions: [
    step(2, "Roast at 400°F.", { timeMinutes: 60, notes: "Rest it." }),
    step(1, "Season the bird."),
  ],
  images: [
    image("step", PhotoRole.STEP, [2]),
    image("main", null, [], true),
    image("ingredients", PhotoRole.INGREDIENTS, []),
    image("finished", PhotoRole.FINISHED, []),
    image("orphan-step", PhotoRole.STEP, [9]),
  ],
  notes: [],
  tags: [],
  author: { id: "user", name: "Sam" },
};

beforeAll(async () => {
  await Promise.all(
    recipe.images.map((photo) =>
      sharp({
        create: {
          width: 40,
          height: 30,
          channels: 3,
          background: { r: 214, g: 58, b: 37 },
        },
      })
        .png()
        .toFile(path.join(photoDirectory, photo.filename)),
    ),
  );
});

afterAll(() => {
  rmSync(photoDirectory, { recursive: true, force: true });
});

describe("pdfText", () => {
  it("spells out fractions the embedded font doesn't have", () => {
    expect(pdfText("1⅓ cups")).toBe("1 1/3 cups");
    expect(pdfText("⅛ tsp")).toBe("1/8 tsp");
  });

  it("keeps fractions and symbols the font does have", () => {
    expect(pdfText("½ cup at 350°F — crème fraîche™")).toBe(
      "½ cup at 350°F — crème fraîche™",
    );
  });

  it("drops emoji without leaving gaps", () => {
    expect(pdfText("Red wine 🍷 sauce ❤️")).toBe("Red wine sauce");
  });
});

describe("buildRecipePdfContent", () => {
  const content = buildRecipePdfContent(recipe, imperial);

  it("orders ingredients and shows what the recipe page shows", () => {
    const [group] = content.ingredientGroups;
    expect(group.name).toBeNull();
    expect(group.items[0]).toMatchObject({
      quantity: "1 1/3 cups",
      name: "flour",
      detail: "sifted",
    });
    expect(group.items[1]).toMatchObject({
      quantity: "",
      name: "Salt",
      detail: "optional",
    });
  });

  it("numbers steps in order and attaches their photos", () => {
    const [first, second] = content.stepGroups[0].steps;
    expect(first).toMatchObject({ number: 1, text: "Season the bird." });
    expect(second).toMatchObject({
      number: 2,
      facts: ["1 h"],
      notes: "Rest it.",
      photos: ["step.png"],
    });
  });

  it("converts temperatures to the reader's unit", () => {
    const converted = buildRecipePdfContent(recipe, metric);
    expect(converted.stepGroups[0].steps[1].text).toContain("°C");
  });

  it("places every photo exactly once", () => {
    expect(content.mainPhoto).toBe("main.png");
    expect(content.ingredientPhotos).toEqual(["ingredients.png"]);
    expect(content.otherPhotos).toEqual(["finished.png", "orphan-step.png"]);
  });

  it("cleans the title and collects the facts", () => {
    expect(content.title).toBe("Roast chicken");
    expect(content.facts).toEqual([
      { label: "Prep", value: "15 min" },
      { label: "Cook", value: "1 h" },
      { label: "Serves", value: "4" },
      { label: "Difficulty", value: "Takes effort" },
    ]);
  });

  it("ignores source links that aren't web addresses", () => {
    const unsafe = { ...recipe, sourceUrl: "javascript:alert(1)" };
    expect(buildRecipePdfContent(unsafe, imperial).sourceUrl).toBeNull();
  });
});

describe("splitIngredientColumns", () => {
  const items = (prefix: string, count: number) =>
    Array.from({ length: count }, (_, index) => ({
      id: `${prefix}-${index + 1}`,
      quantity: "1",
      name: prefix,
      detail: null,
    }));

  it("keeps every ingredient in order across two even columns", () => {
    const groups: RecipePdfIngredientGroup[] = [
      { name: "Sauce", items: items("sauce", 6) },
      { name: "Pasta", items: items("pasta", 3) },
    ];
    const [left, right] = splitIngredientColumns(groups);
    const ids = [...left, ...right].flatMap((group) =>
      group.items.map((item) => item.id),
    );
    expect(ids).toEqual(
      groups.flatMap((group) => group.items.map((item) => item.id)),
    );
    expect(left.reduce((sum, group) => sum + group.items.length, 0)).toBe(5);
  });

  it("only names a group once when it spans both columns", () => {
    const [left, right] = splitIngredientColumns([
      { name: "Everything", items: items("thing", 10) },
    ]);
    expect(left[0].name).toBe("Everything");
    expect(right[0].name).toBeNull();
  });
});

describe("loadRecipePdfPhotos", () => {
  it("turns printer photos grey and keeps device photos in colour", async () => {
    const grey = await loadRecipePdfPhotos(["main.png"], true);
    const colour = await loadRecipePdfPhotos(["main.png"], false);
    const greyInfo = await sharp(grey.get("main.png")).metadata();
    const colourPixel = await sharp(colour.get("main.png")).raw().toBuffer();
    expect(greyInfo.channels).toBe(1);
    expect(colourPixel[0]).toBeGreaterThan(colourPixel[1] + 50);
  });

  it("leaves out photos that can't be read", async () => {
    const photos = await loadRecipePdfPhotos(["missing.png"], false);
    expect(photos.size).toBe(0);
  });
});

describe("recipe PDF links", () => {
  it("picks a screen size from the window width", () => {
    expect(recipePdfScreenForWidth(390)).toBe(RecipePdfScreen.PHONE);
    expect(recipePdfScreenForWidth(820)).toBe(RecipePdfScreen.TABLET);
    expect(recipePdfScreenForWidth(1440)).toBe(RecipePdfScreen.LAPTOP);
  });

  it("asks for linked recipes only when they're wanted", () => {
    const choices = {
      style: RecipePdfStyle.PRINTER,
      includePhotos: false,
      colourPhotos: false,
      screen: RecipePdfScreen.PHONE,
    };
    expect(recipePdfUrl("soup", choices, false)).not.toContain("linked");
    expect(
      recipePdfUrl("soup", { ...choices, includeLinkedRecipes: true }, false),
    ).toContain("linked=1");
  });

  it("only sends the screen size for screen PDFs", () => {
    const choices = {
      includePhotos: false,
      colourPhotos: false,
      screen: RecipePdfScreen.TABLET,
    };
    expect(
      recipePdfUrl(
        "soup",
        { ...choices, style: RecipePdfStyle.PRINTER },
        false,
      ),
    ).not.toContain("screen=");
    expect(
      recipePdfUrl("soup", { ...choices, style: RecipePdfStyle.DEVICE }, false),
    ).toContain("screen=tablet");
  });
});

describe("PDF_SWATCH_COLOURS", () => {
  it("matches the swatch colours in globals.css", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );
    for (const swatch of Object.values(RecipeSwatch)) {
      const colours = PDF_SWATCH_COLOURS[swatch];
      expect(css).toContain(`--color-swatch-${swatch}: ${colours.bg};`);
      expect(css).toContain(`--color-swatch-${swatch}-fg: ${colours.fg};`);
      expect(css).toContain(`--color-swatch-${swatch}-deep: ${colours.deep};`);
    }
  });
});

async function pdfPageTexts(pdf: Buffer): Promise<string[]> {
  await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({
    data: new Uint8Array(pdf),
    verbosity: 0,
  });
  const document_ = await task.promise;
  const texts: string[] = [];
  for (let number = 1; number <= document_.numPages; number += 1) {
    const page = await document_.getPage(number);
    const { items } = await page.getTextContent();
    texts.push(items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  await task.destroy();
  return texts;
}

describe("printer PDF footer", () => {
  const printer = {
    style: RecipePdfStyle.PRINTER,
    includePhotos: false,
    colourPhotos: false,
    screen: RecipePdfScreen.PHONE,
    units: imperial,
  };

  it("prints where the recipe came from, without page numbers on one page", async () => {
    const [text] = await pdfPageTexts(await renderRecipePdf(recipe, printer));
    expect(text).toContain("From The binder");
    expect(text).toContain("https://example.com/chicken");
    expect(text).not.toContain("1 of 1");
  });

  it("numbers the pages and repeats the source on longer recipes", async () => {
    const instructions = Array.from({ length: 40 }, (_, index) =>
      step(index + 1, "Stir the pot and keep an eye on it. ".repeat(6)),
    );
    const texts = await pdfPageTexts(
      await renderRecipePdf({ ...recipe, instructions }, printer),
    );
    expect(texts.length).toBeGreaterThan(1);
    texts.forEach((text, index) => {
      expect(text).toContain(`${index + 1} of ${texts.length}`);
      expect(text).toContain("From The binder");
    });
  });

  it("keeps a very long source address to one line", async () => {
    const sourceUrl = `https://example.com/${"long-path/".repeat(60)}`;
    const [text] = await pdfPageTexts(
      await renderRecipePdf({ ...recipe, sourceUrl }, printer),
    );
    expect(text).toContain("From The binder");
    expect(text).not.toContain("long-path/".repeat(40));
  });
});

describe("long screen PDFs", () => {
  it.each(Object.values(RecipePdfScreen))(
    "numbers every page of a long %s PDF",
    async (screen) => {
      const instructions = Array.from({ length: 40 }, (_, index) =>
        step(index + 1, "Stir the pot and keep an eye on it. ".repeat(6)),
      );
      const texts = await pdfPageTexts(
        await renderRecipePdf(
          { ...recipe, instructions },
          {
            style: RecipePdfStyle.DEVICE,
            includePhotos: false,
            colourPhotos: false,
            screen,
            units: imperial,
          },
        ),
      );
      expect(texts.length).toBeGreaterThan(2);
      expect(texts[1]).toMatch(/\b2\s*$/);
    },
  );
});

describe("linked recipes in a PDF", () => {
  const linked = { id: "pesto", slug: "basil-pesto", title: "Basil pesto" };
  const chicken = {
    ...recipe,
    ingredients: recipe.ingredients.map((item, index) =>
      index === 0 ? { ...item, linkedRecipe: linked } : item,
    ),
  };
  const pesto = {
    ...recipe,
    id: "pesto",
    title: "Basil pesto",
    sourceName: "The pesto binder",
  };

  it.each([
    [RecipePdfStyle.PRINTER, 2],
    [RecipePdfStyle.DEVICE, 4],
  ])("gives a %s PDF the linked recipe's own pages", async (style, pages) => {
    const options = {
      style,
      includePhotos: false,
      colourPhotos: false,
      screen: RecipePdfScreen.PHONE,
      units: imperial,
    };
    const single = await pdfPageTexts(await renderRecipePdf(chicken, options));
    const texts = await pdfPageTexts(
      await renderRecipePdf(chicken, options, [pesto]),
    );

    expect(texts.length).toBeGreaterThanOrEqual(pages);
    expect(texts.length).toBeGreaterThan(single.length);
    expect(texts.join(" ")).toContain("see Basil pesto");
    expect(single.join(" ")).not.toContain("see Basil pesto");
  });
});

describe("renderRecipePdf", () => {
  it.each([
    [RecipePdfStyle.PRINTER, false],
    [RecipePdfStyle.PRINTER, true],
    [RecipePdfStyle.DEVICE, true],
  ])("renders a %s PDF (photos: %s)", async (style, includePhotos) => {
    const pdf = await renderRecipePdf(recipe, {
      style,
      includePhotos,
      colourPhotos: false,
      screen: RecipePdfScreen.PHONE,
      units: imperial,
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("embeds no photos in a plain printer PDF", async () => {
    const pdf = await renderRecipePdf(recipe, {
      style: RecipePdfStyle.PRINTER,
      includePhotos: false,
      colourPhotos: false,
      screen: RecipePdfScreen.PHONE,
      units: imperial,
    });
    expect(pdf.includes("/Subtype /Image")).toBe(false);
  });

  it("embeds photos when the printer option is on", async () => {
    const pdf = await renderRecipePdf(recipe, {
      style: RecipePdfStyle.PRINTER,
      includePhotos: true,
      colourPhotos: false,
      screen: RecipePdfScreen.PHONE,
      units: imperial,
    });
    expect(pdf.includes("/Subtype /Image")).toBe(true);
  });

  it("keeps printer photos grey unless colour is chosen", async () => {
    const render = (colourPhotos: boolean) =>
      renderRecipePdf(recipe, {
        style: RecipePdfStyle.PRINTER,
        includePhotos: true,
        colourPhotos,
        screen: RecipePdfScreen.PHONE,
        units: imperial,
      });
    const grey = await render(false);
    const colour = await render(true);
    expect(grey.includes("/ColorSpace /DeviceGray")).toBe(true);
    expect(grey.includes("/ColorSpace /DeviceRGB")).toBe(false);
    expect(colour.includes("/ColorSpace /DeviceRGB")).toBe(true);
  });

  it.each(Object.values(RecipePdfScreen))(
    "renders a %s PDF, with and without side-by-side content",
    async (screen) => {
      const options = {
        style: RecipePdfStyle.DEVICE,
        includePhotos: true,
        colourPhotos: false,
        screen,
        units: imperial,
      };
      const full = await renderRecipePdf(recipe, options);
      const noSteps = await renderRecipePdf(
        { ...recipe, instructions: [] },
        options,
      );
      expect(full.subarray(0, 5).toString()).toBe("%PDF-");
      expect(noSteps.subarray(0, 5).toString()).toBe("%PDF-");
    },
  );

  it.each(Object.values(RecipePdfScreen))(
    "keeps the %s cover on one full-size page",
    async (screen) => {
      const { page, cover } = RECIPE_PDF_SCREEN_LAYOUTS[screen];
      expect(cover.ringTop + cover.ringSize).toBeLessThanOrEqual(page[1]);

      const pdf = await renderRecipePdf(
        { ...recipe, images: [] },
        {
          style: RecipePdfStyle.DEVICE,
          includePhotos: true,
          colourPhotos: false,
          screen,
          units: imperial,
        },
      );
      const sizes = pdf.toString("latin1").match(/\/MediaBox \[[^\]]*\]/g);
      expect(sizes).toEqual([
        `/MediaBox [0 0 ${page[0]} ${page[1]}]`,
        `/MediaBox [0 0 ${page[0]} ${page[1]}]`,
      ]);
    },
  );

  it("renders a recipe with nothing but a title", async () => {
    const pdf = await renderRecipePdf(
      {
        ...recipe,
        description: null,
        ingredients: [],
        instructions: [],
        images: [],
      },
      {
        style: RecipePdfStyle.DEVICE,
        includePhotos: false,
        colourPhotos: false,
        screen: RecipePdfScreen.PHONE,
        units: imperial,
      },
    );
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
