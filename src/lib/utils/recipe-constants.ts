import { RecipeDifficulty } from "@/lib/types";

export const RECIPE_CONSTANTS = {
  DIFFICULTY_LEVELS: [
    {
      value: RecipeDifficulty.EASY,
      label: "Easy",
      description: "Simple recipes with basic techniques",
    },
    {
      value: RecipeDifficulty.MEDIUM,
      label: "Medium",
      description: "Moderate complexity with some advanced techniques",
    },
    {
      value: RecipeDifficulty.HARD,
      label: "Hard",
      description: "Complex recipes requiring advanced skills",
    },
  ] as const,

  TIME_LIMITS: {
    MIN_PREP_TIME: 0,
    MAX_PREP_TIME: 600, // 10 hours
    MIN_COOK_TIME: 0,
    MAX_COOK_TIME: 1440, // 24 hours
    DEFAULT_STEP_TIME: 15, // minutes
  },

  SERVING_LIMITS: {
    MIN_SERVINGS: 1,
    MAX_SERVINGS: 100,
    DEFAULT_SERVINGS: 4,
  },

  COMMON_UNITS: [
    // Volume - Metric
    "ml",
    "l",
    "liters",
    // Volume - Imperial
    "tsp",
    "tbsp",
    "fl oz",
    "cup",
    "cups",
    "pint",
    "quart",
    "gallon",
    // Weight - Metric
    "g",
    "kg",
    "grams",
    "kilograms",
    // Weight - Imperial
    "oz",
    "lb",
    "lbs",
    "pound",
    "pounds",
    // Count
    "piece",
    "pieces",
    "slice",
    "slices",
    "clove",
    "cloves",
    // Special
    "to taste",
    "pinch",
    "dash",
    "handful",
  ],

  POPULAR_CUISINES: [
    "American",
    "Italian",
    "Mexican",
    "Chinese",
    "Japanese",
    "Indian",
    "Thai",
    "French",
    "Mediterranean",
    "Greek",
    "Spanish",
    "Korean",
    "Vietnamese",
    "Middle Eastern",
    "British",
    "German",
    "Russian",
    "Moroccan",
    "Brazilian",
    "Caribbean",
    "Fusion",
  ],

  COMMON_TAGS: [
    // Dietary
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "low-carb",
    "keto",
    "paleo",
    "whole30",
    "low-sodium",
    "sugar-free",
    "nut-free",
    // Meal Type
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "dessert",
    "appetizer",
    "side-dish",
    "main-course",
    "soup",
    "salad",
    "beverage",
    // Cooking Method
    "grilled",
    "baked",
    "fried",
    "roasted",
    "steamed",
    "slow-cooked",
    "instant-pot",
    "air-fryer",
    "no-cook",
    "one-pot",
    "sheet-pan",
    // Occasion
    "holiday",
    "party",
    "date-night",
    "family-friendly",
    "comfort-food",
    "healthy",
    "quick",
    "make-ahead",
    "freezer-friendly",
  ],

  SEARCH_LIMITS: {
    MIN_QUERY_LENGTH: 2,
    MAX_RESULTS_PER_PAGE: 50,
    DEFAULT_RESULTS_PER_PAGE: 20,
  },

  IMAGE_LIMITS: {
    MAX_IMAGES_PER_RECIPE: 10,
    MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB (increased for PDFs)
    SUPPORTED_FORMATS: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ],
    THUMBNAIL_SIZE: { width: 200, height: 200 },
    CARD_SIZE: { width: 400, height: 300 },
    HERO_SIZE: { width: 800, height: 600 },
  },

  VALIDATION_LIMITS: {
    TITLE: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 200,
    },
    DESCRIPTION: {
      MAX_LENGTH: 2000,
    },
    INGREDIENT_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 200,
    },
    INSTRUCTION: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 1000,
    },
    NOTE_CONTENT: {
      MAX_LENGTH: 2000,
    },
    TAG_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 50,
    },
    SOURCE_URL: {
      MAX_LENGTH: 500,
    },
    SOURCE_NAME: {
      MAX_LENGTH: 100,
    },
  },
} as const;
