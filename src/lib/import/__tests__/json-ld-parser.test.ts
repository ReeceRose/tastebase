import { describe, expect, it } from "vitest";
import { extractJsonLdRecipe } from "@/lib/import/json-ld-parser";

function page(...jsonLd: object[]): string {
  const scripts = jsonLd
    .map(
      (data) =>
        `<script type="application/ld+json">${JSON.stringify(data)}</script>`,
    )
    .join("");
  return `<html><head>${scripts}</head><body></body></html>`;
}

// Shaped like WP Recipe Maker output: Recipe inside @graph, sectioned steps.
const WPRM_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "Example Kitchen" },
    { "@type": "WebPage", name: "Best Chili" },
    {
      "@type": "Recipe",
      name: "Best Chili &amp; Cornbread",
      description: "<p>Hearty and <strong>smoky</strong>.</p>",
      recipeYield: ["6", "6 servings"],
      prepTime: "PT15M",
      cookTime: "PT1H",
      recipeCuisine: ["American"],
      recipeCategory: "Main Course",
      keywords: "chili, beans, comfort food",
      recipeIngredient: ["2 lb ground beef", "1 (15 oz) can kidney beans"],
      recipeInstructions: [
        {
          "@type": "HowToSection",
          name: "Chili",
          itemListElement: [
            {
              "@type": "HowToStep",
              text: "Brown the beef over medium-high heat.",
            },
            {
              "@type": "HowToStep",
              text: "Add beans and simmer for 45 minutes.",
            },
          ],
        },
        {
          "@type": "HowToSection",
          name: "Cornbread",
          itemListElement: [
            { "@type": "HowToStep", text: "Bake at 400°F for 20-25 minutes." },
          ],
        },
      ],
    },
  ],
};

describe("extractJsonLdRecipe", () => {
  it("finds a recipe inside @graph and flattens sections", () => {
    const result = extractJsonLdRecipe(page(WPRM_GRAPH));
    expect(result).not.toBeNull();
    const recipe = result?.recipe;

    expect(recipe?.title).toBe("Best Chili & Cornbread");
    expect(recipe?.description).toBe("Hearty and smoky.");
    expect(recipe?.servings).toBe(6);
    expect(recipe?.prepTime).toBe(15);
    expect(recipe?.cookTime).toBe(60);
    expect(recipe?.cuisine).toBe("American");
    expect(recipe?.tags).toEqual([
      "main course",
      "chili",
      "beans",
      "comfort food",
    ]);
    expect(recipe?.ingredients[1]).toEqual({
      quantity: "1",
      unit: "can",
      name: "kidney beans (15 oz)",
    });
    expect(recipe?.instructions.map((step) => step.step)).toEqual([1, 2, 3]);
    expect(recipe?.instructions[1].timeMinutes).toBe(45);
    expect(recipe?.instructions[2]).toMatchObject({
      timeMinutes: 25,
      temperature: "400°F",
    });
    expect(result?.siteName).toBe("Example Kitchen");
  });

  it("handles an array @type and plain string instructions", () => {
    const result = extractJsonLdRecipe(
      page({
        "@context": "https://schema.org",
        "@type": ["Recipe", "NewsArticle"],
        name: "Toast",
        recipeIngredient: ["2 slices bread"],
        recipeInstructions: "Toast the bread.\nButter it.",
        totalTime: "PT5M",
        publisher: { "@type": "Organization", name: "Toast Times" },
      }),
    );
    expect(result?.recipe.instructions.map((s) => s.instruction)).toEqual([
      "Toast the bread.",
      "Butter it.",
    ]);
    expect(result?.recipe.cookTime).toBe(5);
    expect(result?.siteName).toBe("Toast Times");
  });

  it("finds the recipe in a top-level array and skips invalid blocks", () => {
    const html = `<script type="application/ld+json">{not json</script>${page([
      { "@type": "BreadcrumbList" },
      { "@type": "Recipe", name: "Soup", recipeIngredient: ["1 onion"] },
    ])}`;
    expect(extractJsonLdRecipe(html)?.recipe.title).toBe("Soup");
  });

  it("returns null when the page has no recipe", () => {
    expect(
      extractJsonLdRecipe(page({ "@type": "Article", name: "News" })),
    ).toBeNull();
  });

  it("picks a landscape photo over a larger square crop", () => {
    const result = extractJsonLdRecipe(
      page({
        "@type": "Recipe",
        name: "Cookies",
        image: [
          {
            "@type": "ImageObject",
            url: "https://img.example.com/square.jpg",
            width: 1800,
            height: 1800,
          },
          {
            "@type": "ImageObject",
            contentUrl: "https://img.example.com/wide.jpg",
            width: 1600,
            height: 900,
          },
        ],
      }),
    );
    expect(result?.imageUrl).toBe("https://img.example.com/wide.jpg");
  });

  it("reads a plain image string", () => {
    const result = extractJsonLdRecipe(
      page({ "@type": "Recipe", name: "Soup", image: "/photos/soup.jpg" }),
    );
    expect(result?.imageUrl).toBe("/photos/soup.jpg");
  });
});
