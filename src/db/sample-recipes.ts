import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  recipeIngredients,
  recipeInstructions,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { RecipeDifficulty } from "@/lib/types";
import { generateRecipeSlug } from "@/lib/utils/recipe-utils";

const logger = createOperationLogger("sample-data");

interface SampleRecipe {
  title: string;
  description: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  cuisine: string;
  ingredients: {
    name: string;
    amount?: number;
    unit?: string;
    notes?: string;
    groupName?: string;
    sortOrder: number;
  }[];
  instructions: {
    stepNumber: number;
    instruction: string;
    timeMinutes?: number;
    notes?: string;
  }[];
  tags: string[];
  isPublic: boolean;
}

const sampleTags = [
  { name: "vegetarian", category: "diet", color: "#22c55e" },
  { name: "vegan", category: "diet", color: "#16a34a" },
  { name: "gluten-free", category: "diet", color: "#eab308" },
  { name: "dairy-free", category: "diet", color: "#06b6d4" },
  { name: "quick", category: "time", color: "#f59e0b" },
  { name: "make-ahead", category: "time", color: "#8b5cf6" },
  { name: "one-pot", category: "method", color: "#ef4444" },
  { name: "baking", category: "method", color: "#f97316" },
  { name: "grilling", category: "method", color: "#84cc16" },
  { name: "healthy", category: "nutrition", color: "#10b981" },
  { name: "comfort-food", category: "style", color: "#f472b6" },
  { name: "spicy", category: "flavor", color: "#dc2626" },
  { name: "sweet", category: "flavor", color: "#ec4899" },
];

const sampleRecipes: SampleRecipe[] = [
  {
    title: "Classic Spaghetti Carbonara",
    description:
      "A traditional Italian pasta dish with eggs, cheese, and pancetta. Simple yet elegant comfort food.",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    difficulty: RecipeDifficulty.MEDIUM,
    cuisine: "Italian",
    ingredients: [
      { name: "spaghetti", amount: 14.1, unit: "oz", sortOrder: 1 },
      {
        name: "pancetta",
        amount: 5.3,
        unit: "oz",
        notes: "diced",
        sortOrder: 2,
      },
      { name: "large eggs", amount: 3, unit: "whole", sortOrder: 3 },
      {
        name: "Parmesan cheese",
        amount: 3.5,
        unit: "oz",
        notes: "freshly grated",
        sortOrder: 4,
      },
      {
        name: "black pepper",
        amount: 0.17,
        unit: "fl oz",
        notes: "freshly cracked",
        sortOrder: 5,
      },
      { name: "salt", notes: "for pasta water", sortOrder: 6 },
    ],
    instructions: [
      {
        stepNumber: 1,
        instruction:
          "Bring a large pot of salted water to boil. Cook spaghetti according to package directions until al dente.",
      },
      {
        stepNumber: 2,
        instruction:
          "While pasta cooks, heat a large skillet over medium heat. Add pancetta and cook until crispy, about 5 minutes.",
        timeMinutes: 5,
      },
      {
        stepNumber: 3,
        instruction:
          "In a bowl, whisk together eggs, grated Parmesan, and black pepper.",
      },
      {
        stepNumber: 4,
        instruction: "Reserve 1 cup pasta water, then drain spaghetti.",
      },
      {
        stepNumber: 5,
        instruction:
          "Add hot pasta to the skillet with pancetta. Remove from heat.",
      },
      {
        stepNumber: 6,
        instruction:
          "Quickly pour egg mixture over pasta, tossing vigorously. Add pasta water as needed to create a creamy sauce.",
      },
      {
        stepNumber: 7,
        instruction: "Serve immediately with extra Parmesan and black pepper.",
      },
    ],
    tags: ["quick", "comfort-food"],
    isPublic: true,
  },
  {
    title: "Thai Green Curry",
    description:
      "Aromatic and spicy Thai curry with coconut milk, vegetables, and your choice of protein.",
    servings: 6,
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    difficulty: RecipeDifficulty.MEDIUM,
    cuisine: "Thai",
    ingredients: [
      { name: "green curry paste", amount: 1.5, unit: "fl oz", sortOrder: 1 },
      {
        name: "coconut milk",
        amount: 13.5,
        unit: "fl oz",
        notes: "full-fat",
        sortOrder: 2,
      },
      {
        name: "chicken thighs",
        amount: 17.6,
        unit: "oz",
        notes: "boneless, cut into pieces",
        sortOrder: 3,
      },
      {
        name: "Thai eggplant",
        amount: 16,
        unit: "fl oz",
        notes: "quartered",
        sortOrder: 4,
      },
      {
        name: "bell peppers",
        amount: 2,
        unit: "medium",
        notes: "sliced",
        sortOrder: 5,
      },
      {
        name: "Thai basil",
        amount: 8,
        unit: "fl oz",
        notes: "fresh leaves",
        sortOrder: 6,
      },
      { name: "fish sauce", amount: 1, unit: "fl oz", sortOrder: 7 },
      {
        name: "palm sugar",
        amount: 0.5,
        unit: "fl oz",
        notes: "or brown sugar",
        sortOrder: 8,
      },
      {
        name: "lime juice",
        amount: 0.5,
        unit: "fl oz",
        notes: "fresh",
        sortOrder: 9,
      },
    ],
    instructions: [
      {
        stepNumber: 1,
        instruction:
          "Heat 2 tablespoons of coconut milk in a large pan over medium-high heat.",
      },
      {
        stepNumber: 2,
        instruction:
          "Add green curry paste and fry for 2 minutes until fragrant.",
        timeMinutes: 2,
      },
      {
        stepNumber: 3,
        instruction:
          "Add chicken pieces and cook until no longer pink, about 5 minutes.",
        timeMinutes: 5,
      },
      {
        stepNumber: 4,
        instruction:
          "Pour in remaining coconut milk and bring to a gentle simmer.",
      },
      {
        stepNumber: 5,
        instruction: "Add eggplant and simmer for 10 minutes until tender.",
        timeMinutes: 10,
      },
      {
        stepNumber: 6,
        instruction:
          "Add bell peppers, fish sauce, and palm sugar. Cook for 5 more minutes.",
        timeMinutes: 5,
      },
      {
        stepNumber: 7,
        instruction:
          "Stir in Thai basil and lime juice. Taste and adjust seasoning.",
      },
      { stepNumber: 8, instruction: "Serve hot over jasmine rice." },
    ],
    tags: ["spicy", "healthy"],
    isPublic: true,
  },
  {
    title: "Chocolate Chip Cookies",
    description:
      "Classic chewy chocolate chip cookies that are perfect for any occasion. A family favorite!",
    servings: 24,
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    difficulty: RecipeDifficulty.EASY,
    cuisine: "American",
    ingredients: [
      { name: "all-purpose flour", amount: 18, unit: "fl oz", sortOrder: 1 },
      { name: "baking soda", amount: 0.17, unit: "fl oz", sortOrder: 2 },
      { name: "salt", amount: 0.17, unit: "fl oz", sortOrder: 3 },
      {
        name: "butter",
        amount: 8,
        unit: "fl oz",
        notes: "softened",
        sortOrder: 4,
      },
      { name: "granulated sugar", amount: 6, unit: "fl oz", sortOrder: 5 },
      {
        name: "brown sugar",
        amount: 6,
        unit: "fl oz",
        notes: "packed",
        sortOrder: 6,
      },
      { name: "large eggs", amount: 2, unit: "whole", sortOrder: 7 },
      { name: "vanilla extract", amount: 0.33, unit: "fl oz", sortOrder: 8 },
      {
        name: "chocolate chips",
        amount: 16,
        unit: "fl oz",
        notes: "semi-sweet",
        sortOrder: 9,
      },
    ],
    instructions: [
      { stepNumber: 1, instruction: "Preheat oven to 375°F (190°C)." },
      {
        stepNumber: 2,
        instruction:
          "In a medium bowl, whisk together flour, baking soda, and salt.",
      },
      {
        stepNumber: 3,
        instruction:
          "In a large bowl, cream together softened butter and both sugars until fluffy.",
      },
      {
        stepNumber: 4,
        instruction: "Beat in eggs one at a time, then vanilla extract.",
      },
      {
        stepNumber: 5,
        instruction: "Gradually mix in flour mixture until just combined.",
      },
      { stepNumber: 6, instruction: "Fold in chocolate chips." },
      {
        stepNumber: 7,
        instruction:
          "Drop rounded tablespoons of dough onto ungreased baking sheets, spacing 2 inches apart.",
      },
      {
        stepNumber: 8,
        instruction: "Bake for 9-11 minutes until edges are golden brown.",
        timeMinutes: 10,
      },
      {
        stepNumber: 9,
        instruction:
          "Cool on baking sheet for 5 minutes, then transfer to wire rack.",
      },
    ],
    tags: ["sweet", "baking", "comfort-food"],
    isPublic: true,
  },
  {
    title: "Quinoa Buddha Bowl",
    description:
      "A nutritious and colorful bowl packed with quinoa, roasted vegetables, and tahini dressing.",
    servings: 4,
    prepTimeMinutes: 20,
    cookTimeMinutes: 30,
    difficulty: RecipeDifficulty.EASY,
    cuisine: "Mediterranean",
    ingredients: [
      { name: "quinoa", amount: 1, unit: "cup", notes: "rinsed", sortOrder: 1 },
      {
        name: "sweet potato",
        amount: 2,
        unit: "medium",
        notes: "cubed",
        sortOrder: 2,
      },
      {
        name: "broccoli",
        amount: 1,
        unit: "head",
        notes: "cut into florets",
        sortOrder: 3,
      },
      {
        name: "chickpeas",
        amount: 1,
        unit: "can",
        notes: "drained and rinsed",
        sortOrder: 4,
      },
      {
        name: "avocado",
        amount: 1,
        unit: "large",
        notes: "sliced",
        sortOrder: 5,
      },
      { name: "pumpkin seeds", amount: 0.25, unit: "cup", sortOrder: 6 },
      {
        name: "olive oil",
        amount: 3,
        unit: "tbsp",
        groupName: "for roasting",
        sortOrder: 7,
      },
      {
        name: "salt and pepper",
        notes: "to taste",
        groupName: "for roasting",
        sortOrder: 8,
      },
      {
        name: "tahini",
        amount: 3,
        unit: "tbsp",
        groupName: "dressing",
        sortOrder: 9,
      },
      {
        name: "lemon juice",
        amount: 2,
        unit: "tbsp",
        groupName: "dressing",
        sortOrder: 10,
      },
      {
        name: "maple syrup",
        amount: 1,
        unit: "tbsp",
        groupName: "dressing",
        sortOrder: 11,
      },
      {
        name: "garlic",
        amount: 1,
        unit: "clove",
        notes: "minced",
        groupName: "dressing",
        sortOrder: 12,
      },
    ],
    instructions: [
      { stepNumber: 1, instruction: "Preheat oven to 425°F (220°C)." },
      {
        stepNumber: 2,
        instruction:
          "Cook quinoa according to package directions. Set aside to cool.",
      },
      {
        stepNumber: 3,
        instruction:
          "Toss sweet potato and broccoli with olive oil, salt, and pepper.",
      },
      {
        stepNumber: 4,
        instruction:
          "Roast vegetables for 20-25 minutes until tender and slightly caramelized.",
        timeMinutes: 22,
      },
      {
        stepNumber: 5,
        instruction:
          "Meanwhile, whisk together all dressing ingredients until smooth. Add water to thin if needed.",
      },
      { stepNumber: 6, instruction: "Divide quinoa among 4 bowls." },
      {
        stepNumber: 7,
        instruction:
          "Top with roasted vegetables, chickpeas, avocado, and pumpkin seeds.",
      },
      { stepNumber: 8, instruction: "Drizzle with tahini dressing and serve." },
    ],
    tags: ["vegetarian", "vegan", "healthy", "gluten-free"],
    isPublic: true,
  },
  {
    title: "Beef Tacos with Homemade Salsa",
    description:
      "Flavorful ground beef tacos with fresh homemade salsa and all the fixings.",
    servings: 6,
    prepTimeMinutes: 25,
    cookTimeMinutes: 15,
    difficulty: RecipeDifficulty.EASY,
    cuisine: "Mexican",
    ingredients: [
      {
        name: "ground beef",
        amount: 1,
        unit: "lb",
        notes: "80/20",
        sortOrder: 1,
      },
      {
        name: "yellow onion",
        amount: 1,
        unit: "medium",
        notes: "diced",
        sortOrder: 2,
      },
      {
        name: "garlic",
        amount: 3,
        unit: "cloves",
        notes: "minced",
        sortOrder: 3,
      },
      { name: "chili powder", amount: 2, unit: "tsp", sortOrder: 4 },
      { name: "cumin", amount: 1, unit: "tsp", sortOrder: 5 },
      { name: "paprika", amount: 1, unit: "tsp", sortOrder: 6 },
      { name: "corn tortillas", amount: 12, unit: "small", sortOrder: 7 },
      {
        name: "Roma tomatoes",
        amount: 4,
        unit: "medium",
        notes: "diced",
        groupName: "salsa",
        sortOrder: 8,
      },
      {
        name: "red onion",
        amount: 0.25,
        unit: "cup",
        notes: "finely diced",
        groupName: "salsa",
        sortOrder: 9,
      },
      {
        name: "jalapeño",
        amount: 1,
        unit: "small",
        notes: "seeded and minced",
        groupName: "salsa",
        sortOrder: 10,
      },
      {
        name: "lime juice",
        amount: 2,
        unit: "tbsp",
        groupName: "salsa",
        sortOrder: 11,
      },
      {
        name: "cilantro",
        amount: 0.25,
        unit: "cup",
        notes: "chopped",
        groupName: "salsa",
        sortOrder: 12,
      },
    ],
    instructions: [
      {
        stepNumber: 1,
        instruction:
          "Make salsa by combining tomatoes, red onion, jalapeño, lime juice, and cilantro. Season with salt and set aside.",
      },
      {
        stepNumber: 2,
        instruction:
          "Heat a large skillet over medium-high heat. Add ground beef and cook, breaking up with a spoon.",
        timeMinutes: 6,
      },
      {
        stepNumber: 3,
        instruction:
          "Add diced onion and cook until softened, about 3 minutes.",
        timeMinutes: 3,
      },
      {
        stepNumber: 4,
        instruction: "Add garlic and spices. Cook for 1 minute until fragrant.",
        timeMinutes: 1,
      },
      {
        stepNumber: 5,
        instruction: "Season with salt and pepper. Remove from heat.",
      },
      {
        stepNumber: 6,
        instruction: "Warm tortillas in a dry skillet or microwave.",
      },
      {
        stepNumber: 7,
        instruction: "Fill tortillas with beef mixture and top with salsa.",
      },
      {
        stepNumber: 8,
        instruction:
          "Serve with additional toppings like cheese, sour cream, and lettuce.",
      },
    ],
    tags: ["quick", "spicy", "comfort-food"],
    isPublic: true,
  },
  {
    title: "Vegetarian Lasagna",
    description:
      "Layers of pasta, ricotta, vegetables, and marinara sauce make this hearty vegetarian lasagna.",
    servings: 8,
    prepTimeMinutes: 45,
    cookTimeMinutes: 60,
    difficulty: RecipeDifficulty.HARD,
    cuisine: "Italian",
    ingredients: [
      { name: "lasagna noodles", amount: 12, unit: "sheets", sortOrder: 1 },
      { name: "ricotta cheese", amount: 15, unit: "oz", sortOrder: 2 },
      {
        name: "mozzarella cheese",
        amount: 2,
        unit: "cups",
        notes: "shredded",
        sortOrder: 3,
      },
      {
        name: "Parmesan cheese",
        amount: 0.75,
        unit: "cup",
        notes: "grated",
        sortOrder: 4,
      },
      { name: "large egg", amount: 1, unit: "whole", sortOrder: 5 },
      { name: "marinara sauce", amount: 3, unit: "cups", sortOrder: 6 },
      {
        name: "zucchini",
        amount: 2,
        unit: "medium",
        notes: "sliced",
        sortOrder: 7,
      },
      {
        name: "yellow squash",
        amount: 1,
        unit: "medium",
        notes: "sliced",
        sortOrder: 8,
      },
      {
        name: "bell peppers",
        amount: 2,
        unit: "medium",
        notes: "sliced",
        sortOrder: 9,
      },
      {
        name: "spinach",
        amount: 5,
        unit: "oz",
        notes: "fresh, wilted",
        sortOrder: 10,
      },
      { name: "Italian seasoning", amount: 2, unit: "tsp", sortOrder: 11 },
      {
        name: "fresh basil",
        amount: 0.25,
        unit: "cup",
        notes: "chopped",
        sortOrder: 12,
      },
    ],
    instructions: [
      {
        stepNumber: 1,
        instruction:
          "Preheat oven to 375°F (190°C). Cook lasagna noodles according to package directions.",
      },
      {
        stepNumber: 2,
        instruction:
          "In a bowl, combine ricotta, 1 cup mozzarella, half the Parmesan, egg, and Italian seasoning.",
      },
      {
        stepNumber: 3,
        instruction:
          "Sauté zucchini, squash, and bell peppers until tender, about 8 minutes.",
        timeMinutes: 8,
      },
      {
        stepNumber: 4,
        instruction: "Wilt spinach in the same pan and set vegetables aside.",
      },
      {
        stepNumber: 5,
        instruction:
          "Spread 1 cup marinara in the bottom of a 9x13 inch baking dish.",
      },
      {
        stepNumber: 6,
        instruction:
          "Layer 3 noodles, half the ricotta mixture, half the vegetables, and 1 cup sauce.",
      },
      {
        stepNumber: 7,
        instruction:
          "Repeat layers, then top with remaining noodles, sauce, and cheeses.",
      },
      {
        stepNumber: 8,
        instruction: "Cover with foil and bake for 45 minutes.",
        timeMinutes: 45,
      },
      {
        stepNumber: 9,
        instruction: "Remove foil and bake 15 more minutes until bubbly.",
        timeMinutes: 15,
      },
      {
        stepNumber: 10,
        instruction:
          "Let rest 10 minutes before serving. Garnish with fresh basil.",
      },
    ],
    tags: ["vegetarian", "make-ahead", "comfort-food"],
    isPublic: true,
  },
];

export async function createSampleRecipes(userId: string): Promise<void> {
  try {
    logger.info({ userId }, "Creating sample recipes");

    // First, create tags
    const createdTags = new Map<string, string>();

    for (const tag of sampleTags) {
      const [existingTag] = await db
        .select()
        .from(recipeTags)
        .where(eq(recipeTags.name, tag.name))
        .limit(1);

      if (!existingTag) {
        const tagId = crypto.randomUUID();
        await db.insert(recipeTags).values({
          id: tagId,
          name: tag.name,
          color: tag.color,
          category: tag.category,
          createdAt: new Date(),
        });
        createdTags.set(tag.name, tagId);
        logger.info({ tagName: tag.name, tagId }, "Created recipe tag");
      } else {
        createdTags.set(tag.name, existingTag.id);
      }
    }

    // Create recipes
    for (const sampleRecipe of sampleRecipes) {
      const recipeId = crypto.randomUUID();
      const slug = `${generateRecipeSlug(sampleRecipe.title)}-${recipeId.slice(-8)}`;

      // Insert recipe
      await db.insert(recipes).values({
        id: recipeId,
        slug: slug,
        userId,
        title: sampleRecipe.title,
        description: sampleRecipe.description,
        servings: sampleRecipe.servings,
        prepTimeMinutes: sampleRecipe.prepTimeMinutes,
        cookTimeMinutes: sampleRecipe.cookTimeMinutes,
        difficulty: sampleRecipe.difficulty,
        cuisine: sampleRecipe.cuisine,
        isPublic: sampleRecipe.isPublic,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Insert ingredients
      for (const ingredient of sampleRecipe.ingredients) {
        await db.insert(recipeIngredients).values({
          id: crypto.randomUUID(),
          recipeId,
          name: ingredient.name,
          amount: ingredient.amount ? ingredient.amount.toString() : null,
          unit: ingredient.unit || null,
          notes: ingredient.notes || null,
          groupName: ingredient.groupName || null,
          sortOrder: ingredient.sortOrder,
          isOptional: false,
        });
      }

      // Insert instructions
      for (const instruction of sampleRecipe.instructions) {
        await db.insert(recipeInstructions).values({
          id: crypto.randomUUID(),
          recipeId,
          stepNumber: instruction.stepNumber,
          instruction: instruction.instruction,
          timeMinutes: instruction.timeMinutes,
          notes: instruction.notes,
        });
      }

      // Insert tag relations
      for (const tagName of sampleRecipe.tags) {
        const tagId = createdTags.get(tagName);
        if (tagId) {
          await db.insert(recipeTagRelations).values({
            recipeId,
            tagId,
          });
        }
      }

      logger.info(
        { recipeId, title: sampleRecipe.title },
        "Created sample recipe",
      );
    }

    logger.info(
      { userId, recipeCount: sampleRecipes.length },
      "Sample recipes created successfully",
    );
  } catch (error) {
    logError(logger, "Failed to create sample recipes", error, { userId });
    throw error;
  }
}
