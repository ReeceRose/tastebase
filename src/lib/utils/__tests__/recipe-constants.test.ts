import { describe, expect, it } from "vitest";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

describe("Recipe Constants", () => {
  describe("DIFFICULTY_LEVELS", () => {
    it("should have correct difficulty levels", () => {
      expect(RECIPE_CONSTANTS.DIFFICULTY_LEVELS).toHaveLength(3);

      const values = RECIPE_CONSTANTS.DIFFICULTY_LEVELS.map((d) => d.value);
      expect(values).toContain("easy");
      expect(values).toContain("medium");
      expect(values).toContain("hard");
    });

    it("should have labels and descriptions for all levels", () => {
      RECIPE_CONSTANTS.DIFFICULTY_LEVELS.forEach((level) => {
        expect(level.value).toBeTruthy();
        expect(level.label).toBeTruthy();
        expect(level.description).toBeTruthy();
      });
    });
  });

  describe("TIME_LIMITS", () => {
    it("should have sensible time limits", () => {
      expect(RECIPE_CONSTANTS.TIME_LIMITS.MIN_PREP_TIME).toBe(0);
      expect(RECIPE_CONSTANTS.TIME_LIMITS.MAX_PREP_TIME).toBe(600); // 10 hours
      expect(RECIPE_CONSTANTS.TIME_LIMITS.MIN_COOK_TIME).toBe(0);
      expect(RECIPE_CONSTANTS.TIME_LIMITS.MAX_COOK_TIME).toBe(1440); // 24 hours
      expect(RECIPE_CONSTANTS.TIME_LIMITS.DEFAULT_STEP_TIME).toBe(15);
    });
  });

  describe("SERVING_LIMITS", () => {
    it("should have reasonable serving limits", () => {
      expect(RECIPE_CONSTANTS.SERVING_LIMITS.MIN_SERVINGS).toBe(1);
      expect(RECIPE_CONSTANTS.SERVING_LIMITS.MAX_SERVINGS).toBe(100);
      expect(RECIPE_CONSTANTS.SERVING_LIMITS.DEFAULT_SERVINGS).toBe(4);
    });
  });

  describe("COMMON_UNITS", () => {
    it("should include common volume and weight units", () => {
      const units = RECIPE_CONSTANTS.COMMON_UNITS;

      // Metric volume
      expect(units).toContain("ml");
      expect(units).toContain("l");

      // Imperial volume
      expect(units).toContain("cup");
      expect(units).toContain("tbsp");
      expect(units).toContain("tsp");

      // Weight
      expect(units).toContain("g");
      expect(units).toContain("kg");
      expect(units).toContain("oz");
      expect(units).toContain("lb");

      // Special units
      expect(units).toContain("to taste");
      expect(units).toContain("pinch");
    });
  });

  describe("POPULAR_CUISINES", () => {
    it("should include diverse cuisines", () => {
      const cuisines = RECIPE_CONSTANTS.POPULAR_CUISINES;

      expect(cuisines).toContain("Italian");
      expect(cuisines).toContain("Chinese");
      expect(cuisines).toContain("Mexican");
      expect(cuisines).toContain("Indian");
      expect(cuisines).toContain("Thai");
      expect(cuisines).toContain("French");

      expect(cuisines.length).toBeGreaterThan(10);
    });
  });

  describe("COMMON_TAGS", () => {
    it("should include dietary tags", () => {
      const tags = RECIPE_CONSTANTS.COMMON_TAGS;

      expect(tags).toContain("vegetarian");
      expect(tags).toContain("vegan");
      expect(tags).toContain("gluten-free");
      expect(tags).toContain("dairy-free");
      expect(tags).toContain("low-carb");
      expect(tags).toContain("keto");
    });

    it("should include meal type tags", () => {
      const tags = RECIPE_CONSTANTS.COMMON_TAGS;

      expect(tags).toContain("breakfast");
      expect(tags).toContain("lunch");
      expect(tags).toContain("dinner");
      expect(tags).toContain("dessert");
      expect(tags).toContain("snack");
    });

    it("should include cooking method tags", () => {
      const tags = RECIPE_CONSTANTS.COMMON_TAGS;

      expect(tags).toContain("grilled");
      expect(tags).toContain("baked");
      expect(tags).toContain("fried");
      expect(tags).toContain("roasted");
      expect(tags).toContain("slow-cooked");
    });
  });

  describe("SEARCH_LIMITS", () => {
    it("should have appropriate search limits", () => {
      expect(RECIPE_CONSTANTS.SEARCH_LIMITS.MIN_QUERY_LENGTH).toBe(2);
      expect(RECIPE_CONSTANTS.SEARCH_LIMITS.MAX_RESULTS_PER_PAGE).toBe(50);
      expect(RECIPE_CONSTANTS.SEARCH_LIMITS.DEFAULT_RESULTS_PER_PAGE).toBe(20);
    });
  });

  describe("IMAGE_LIMITS", () => {
    it("should have reasonable image constraints", () => {
      expect(RECIPE_CONSTANTS.IMAGE_LIMITS.MAX_IMAGES_PER_RECIPE).toBe(10);
      expect(RECIPE_CONSTANTS.IMAGE_LIMITS.MAX_FILE_SIZE).toBe(
        10 * 1024 * 1024,
      ); // 10MB

      const supportedFormats = RECIPE_CONSTANTS.IMAGE_LIMITS.SUPPORTED_FORMATS;
      expect(supportedFormats).toContain("image/jpeg");
      expect(supportedFormats).toContain("image/png");
      expect(supportedFormats).toContain("image/webp");
    });

    it("should have defined image sizes", () => {
      const { THUMBNAIL_SIZE, CARD_SIZE, HERO_SIZE } =
        RECIPE_CONSTANTS.IMAGE_LIMITS;

      expect(THUMBNAIL_SIZE.width).toBe(200);
      expect(THUMBNAIL_SIZE.height).toBe(200);

      expect(CARD_SIZE.width).toBe(400);
      expect(CARD_SIZE.height).toBe(300);

      expect(HERO_SIZE.width).toBe(800);
      expect(HERO_SIZE.height).toBe(600);
    });
  });

  describe("VALIDATION_LIMITS", () => {
    it("should have appropriate field length limits", () => {
      expect(RECIPE_CONSTANTS.VALIDATION_LIMITS.TITLE.MIN_LENGTH).toBe(1);
      expect(RECIPE_CONSTANTS.VALIDATION_LIMITS.TITLE.MAX_LENGTH).toBe(200);

      expect(RECIPE_CONSTANTS.VALIDATION_LIMITS.DESCRIPTION.MAX_LENGTH).toBe(
        2000,
      );

      expect(
        RECIPE_CONSTANTS.VALIDATION_LIMITS.INGREDIENT_NAME.MIN_LENGTH,
      ).toBe(1);
      expect(
        RECIPE_CONSTANTS.VALIDATION_LIMITS.INGREDIENT_NAME.MAX_LENGTH,
      ).toBe(100);

      expect(RECIPE_CONSTANTS.VALIDATION_LIMITS.INSTRUCTION.MIN_LENGTH).toBe(1);
      expect(RECIPE_CONSTANTS.VALIDATION_LIMITS.INSTRUCTION.MAX_LENGTH).toBe(
        1000,
      );
    });
  });
});
