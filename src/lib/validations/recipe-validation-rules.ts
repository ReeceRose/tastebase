import type { ValidationRule } from "@/hooks/use-form-validation";

export const recipeValidationRules: ValidationRule[] = [
  {
    field: "title",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (!value || value.trim().length === 0) {
        return "Recipe title is required";
      }
      if (value.length > 200) {
        return "Title must be less than 200 characters";
      }
      if (value.length < 3) {
        return "Title must be at least 3 characters long";
      }
      if (value.trim() !== value) {
        return "Warning: Title has leading or trailing spaces";
      }
      return null;
    },
    debounceMs: 500,
  },
  {
    field: "description",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (value && value.length > 1000) {
        return "Description must be less than 1000 characters";
      }
      if (value && value.length > 500) {
        return "Warning: Long descriptions may be truncated in some views";
      }
      return null;
    },
    debounceMs: 800,
  },
  {
    field: "servings",
    validator: (value: unknown) => {
      if (typeof value !== "number") return null;
      if (!value || value < 1) {
        return "Servings must be at least 1";
      }
      if (value > 100) {
        return "Servings must be 100 or less";
      }
      if (value > 20) {
        return "Warning: Large serving sizes may need ingredient scaling";
      }
      if (!Number.isInteger(value)) {
        return "Warning: Fractional servings may be confusing";
      }
      return null;
    },
  },
  {
    field: "prepTimeMinutes",
    validator: (value: unknown) => {
      if (typeof value !== "number") return null;
      if (value < 0) {
        return "Prep time cannot be negative";
      }
      if (value > 1440) {
        return "Prep time must be less than 24 hours";
      }
      if (value > 480) {
        return "Warning: Very long prep times may indicate this should be a multi-day recipe";
      }
      return null;
    },
  },
  {
    field: "cookTimeMinutes",
    validator: (value: unknown, formData?: Record<string, unknown>) => {
      if (typeof value !== "number") return null;
      if (value < 0) {
        return "Cook time cannot be negative";
      }
      if (value > 1440) {
        return "Cook time must be less than 24 hours";
      }
      if (value > 480) {
        return "Warning: Very long cook times may indicate slow cooking or overnight preparation";
      }

      const prepTime =
        (typeof formData?.prepTimeMinutes === "number"
          ? formData.prepTimeMinutes
          : 0) || 0;
      const totalTime = prepTime + value;
      if (totalTime > 600) {
        return "Warning: Total time exceeds 10 hours - consider breaking into steps";
      }

      return null;
    },
    dependencies: ["prepTimeMinutes"],
  },
  {
    field: "difficulty",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      const validDifficulties = ["easy", "medium", "hard"];
      if (value && !validDifficulties.includes(value)) {
        return "Difficulty must be easy, medium, or hard";
      }
      return null;
    },
  },
  {
    field: "cuisine",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (value && value.length > 50) {
        return "Cuisine must be less than 50 characters";
      }
      if (value && !/^[a-zA-Z\s\-']+$/.test(value)) {
        return "Warning: Cuisine should contain only letters, spaces, hyphens, and apostrophes";
      }
      return null;
    },
  },
  {
    field: "sourceUrl",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (!value) return null;

      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) {
          return "URL must use http or https";
        }
        if (value.length > 500) {
          return "URL must be less than 500 characters";
        }
        return null;
      } catch {
        return "Please enter a valid URL (include http:// or https://)";
      }
    },
    debounceMs: 1000,
  },
  {
    field: "sourceName",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (value && value.length > 100) {
        return "Source name must be less than 100 characters";
      }
      return null;
    },
  },
];

export const ingredientValidationRules: ValidationRule[] = [
  {
    field: "name",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (!value || value.trim().length === 0) {
        return "Ingredient name is required";
      }
      if (value.length > 100) {
        return "Ingredient name must be less than 100 characters";
      }
      if (value.length < 2) {
        return "Ingredient name must be at least 2 characters";
      }
      return null;
    },
  },
  {
    field: "amount",
    validator: (value: unknown) => {
      if (typeof value !== "string" && typeof value !== "number") return null;
      if (!value) return null;

      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (Number.isNaN(numValue)) {
        return "Amount must be a valid number";
      }
      if (numValue < 0) {
        return "Amount cannot be negative";
      }
      if (numValue > 9999) {
        return "Amount seems unusually large";
      }
      if (numValue === 0) {
        return "Warning: Zero amount - consider marking as optional";
      }
      return null;
    },
  },
  {
    field: "unit",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (value && value.length > 20) {
        return "Unit must be less than 20 characters";
      }
      const commonUnits = [
        "cup",
        "cups",
        "tbsp",
        "tablespoon",
        "tablespoons",
        "tsp",
        "teaspoon",
        "teaspoons",
        "lb",
        "pound",
        "pounds",
        "oz",
        "ounce",
        "ounces",
        "g",
        "gram",
        "grams",
        "kg",
        "kilogram",
        "kilograms",
        "ml",
        "milliliter",
        "milliliters",
        "l",
        "liter",
        "liters",
        "pinch",
        "dash",
        "clove",
        "cloves",
        "whole",
        "piece",
        "pieces",
      ];
      if (value && !commonUnits.includes(value.toLowerCase())) {
        return "Warning: Consider using a standard cooking unit for clarity";
      }
      return null;
    },
  },
  {
    field: "notes",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (value && value.length > 200) {
        return "Notes must be less than 200 characters";
      }
      return null;
    },
  },
];

export const instructionValidationRules: ValidationRule[] = [
  {
    field: "instruction",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (!value || value.trim().length === 0) {
        return "Instruction is required";
      }
      if (value.length > 1000) {
        return "Instruction must be less than 1000 characters";
      }
      if (value.length < 10) {
        return "Instruction should be more detailed";
      }
      if (value.length > 500) {
        return "Warning: Very long instructions may be hard to follow - consider breaking into multiple steps";
      }
      return null;
    },
    debounceMs: 800,
  },
  {
    field: "timeMinutes",
    validator: (value: unknown) => {
      if (typeof value !== "number") return null;
      if (!value) return null;

      if (value < 0) {
        return "Time cannot be negative";
      }
      if (value > 480) {
        return "Step time seems unusually long";
      }
      if (value > 120) {
        return "Warning: Long step times may benefit from intermediate checks";
      }
      return null;
    },
  },
  {
    field: "temperature",
    validator: (value: unknown) => {
      if (typeof value !== "string") return null;
      if (!value) return null;

      if (value.length > 20) {
        return "Temperature must be less than 20 characters";
      }

      const tempMatch = value.match(/(\d+)\s*°?[CF]?/i);
      if (tempMatch) {
        const temp = parseInt(tempMatch[1], 10);
        if (temp > 500) {
          return "Warning: Temperature seems very high - please verify";
        }
        if (temp < 32) {
          return "Warning: Temperature seems very low for cooking";
        }
      }

      if (!/\d/.test(value)) {
        return "Warning: Temperature should include a number";
      }

      return null;
    },
  },
];

export function getValidationSuggestions(
  field: string,
  value: string | number | boolean | null | undefined,
): string[] {
  const suggestions: string[] = [];

  switch (field) {
    case "title":
      if (typeof value === "string" && value.length > 0) {
        if (!value.match(/^[A-Z]/)) {
          suggestions.push("Consider starting with a capital letter");
        }
        if (value.includes("  ")) {
          suggestions.push("Remove extra spaces");
        }
      }
      break;

    case "cuisine":
      if (typeof value === "string" && value.length > 0) {
        const capitalizedCuisine =
          value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        if (value !== capitalizedCuisine) {
          suggestions.push(`Did you mean "${capitalizedCuisine}"?`);
        }
      }
      break;

    case "sourceUrl":
      if (
        typeof value === "string" &&
        value.length > 0 &&
        !value.startsWith("http")
      ) {
        suggestions.push(`Try "https://${value}"`);
      }
      break;
  }

  return suggestions;
}
