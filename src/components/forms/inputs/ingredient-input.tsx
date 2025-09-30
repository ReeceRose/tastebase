"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Common units for ingredients
const COMMON_UNITS = [
  "cup",
  "cups",
  "tablespoon",
  "tablespoons",
  "tbsp",
  "tsp",
  "teaspoon",
  "teaspoons",
  "ounce",
  "ounces",
  "oz",
  "pound",
  "pounds",
  "lb",
  "lbs",
  "gram",
  "grams",
  "g",
  "kilogram",
  "kilograms",
  "kg",
  "milliliter",
  "milliliters",
  "ml",
  "liter",
  "liters",
  "l",
  "pint",
  "pints",
  "pt",
  "quart",
  "quarts",
  "qt",
  "gallon",
  "gallons",
  "gal",
  "piece",
  "pieces",
  "whole",
  "slice",
  "slices",
  "clove",
  "cloves",
  "pinch",
  "dash",
  "can",
  "cans",
  "bottle",
  "bottles",
  "package",
  "packages",
  "bunch",
];

// Common ingredient suggestions
const COMMON_INGREDIENTS = [
  "salt",
  "black pepper",
  "olive oil",
  "butter",
  "garlic",
  "onion",
  "flour",
  "sugar",
  "eggs",
  "milk",
  "water",
  "lemon juice",
  "vanilla extract",
  "baking powder",
  "baking soda",
  "chicken breast",
  "ground beef",
  "tomatoes",
  "potatoes",
  "carrots",
  "celery",
  "bell pepper",
  "cheese",
  "parmesan cheese",
  "mozzarella cheese",
  "heavy cream",
  "chicken broth",
  "vegetable broth",
];

export interface IngredientData {
  name: string;
  amount?: number;
  unit?: string;
  notes?: string;
  groupName?: string;
  isOptional?: boolean;
}

interface IngredientInputProps {
  value: IngredientData;
  onChange: (value: IngredientData) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

export function IngredientInput({
  value,
  onChange,
  onRemove,
  showRemove = true,
  autoFocus = false,
  placeholder = "Enter ingredient name",
  className,
}: IngredientInputProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>(
    [],
  );
  const [unitSuggestions, setUnitSuggestions] = useState<string[]>([]);

  const parseIngredientText = (text: string): Partial<IngredientData> => {
    if (!text.trim()) return { name: "" };

    // Try to parse "amount unit ingredient" format
    const patterns = [
      // "2 cups flour" or "2 cup flour"
      /^(\d+(?:\.\d+)?(?:\/\d+)?)\s+(cups?|cup|tablespoons?|tbsp|tsp|teaspoons?|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|pints?|pt|quarts?|qt|gallons?|gal|pieces?|cloves?|slices?)\s+(.+)$/i,
      // "2 flour" (amount with no unit)
      /^(\d+(?:\.\d+)?(?:\/\d+)?)\s+(.+)$/,
      // Just ingredient name
      /^(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match.length === 4) {
          // amount + unit + ingredient
          return {
            amount: parseFloat(match[1]),
            unit: match[2].toLowerCase(),
            name: match[3].trim(),
          };
        } else if (match.length === 3) {
          // amount + ingredient (no unit)
          const amount = parseFloat(match[1]);
          if (!Number.isNaN(amount)) {
            return {
              amount,
              name: match[2].trim(),
            };
          }
        }
        // Just ingredient name
        return { name: match[1].trim() };
      }
    }

    return { name: text.trim() };
  };

  const handleNameChange = (name: string) => {
    // Auto-parse if it looks like a full ingredient line
    if (name.includes(" ") && !value.amount && !value.unit) {
      const parsed = parseIngredientText(name);
      onChange({ ...value, ...parsed });
    } else {
      onChange({ ...value, name });
    }

    // Generate suggestions
    if (name.length >= 2) {
      const suggestions = COMMON_INGREDIENTS.filter(
        (ingredient) =>
          ingredient.toLowerCase().includes(name.toLowerCase()) &&
          ingredient.toLowerCase() !== name.toLowerCase(),
      ).slice(0, 5);
      setIngredientSuggestions(suggestions);
    } else {
      setIngredientSuggestions([]);
    }
  };

  const handleUnitChange = (unit: string) => {
    onChange({ ...value, unit });

    // Generate unit suggestions
    if (unit.length >= 1) {
      const suggestions = COMMON_UNITS.filter(
        (u) =>
          u.toLowerCase().includes(unit.toLowerCase()) &&
          u.toLowerCase() !== unit.toLowerCase(),
      ).slice(0, 5);
      setUnitSuggestions(suggestions);
    } else {
      setUnitSuggestions([]);
    }
  };

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <div className="flex gap-2 items-start">
        {/* Amount */}
        <div className="w-20">
          <Input
            type="number"
            step="any"
            placeholder="1"
            value={value.amount || ""}
            onChange={(e) =>
              onChange({
                ...value,
                amount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="text-sm"
          />
        </div>

        {/* Unit */}
        <div className="w-24 relative">
          <Input
            placeholder="cup"
            value={value.unit || ""}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="text-sm"
          />
          {unitSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg mt-1">
              {unitSuggestions.map((suggestion) => (
                <button
                  key={`unit-${suggestion}`}
                  type="button"
                  onClick={() => {
                    onChange({ ...value, unit: suggestion });
                    setUnitSuggestions([]);
                  }}
                  className="block w-full text-left px-2 py-1 text-sm hover:bg-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ingredient Name */}
        <div className="flex-1 relative">
          <Input
            placeholder={placeholder}
            value={value.name}
            onChange={(e) => handleNameChange(e.target.value)}
            autoFocus={autoFocus}
            className="text-sm"
          />
          {ingredientSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg mt-1">
              {ingredientSuggestions.map((suggestion) => (
                <button
                  key={`ingredient-${suggestion}`}
                  type="button"
                  onClick={() => {
                    onChange({ ...value, name: suggestion });
                    setIngredientSuggestions([]);
                  }}
                  className="block w-full text-left px-2 py-1 text-sm hover:bg-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Optional checkbox */}
        <div className="flex items-center space-x-1">
          <Checkbox
            id={`optional-${value.name}`}
            checked={value.isOptional || false}
            onCheckedChange={(checked) =>
              onChange({ ...value, isOptional: !!checked })
            }
          />
          <Label htmlFor={`optional-${value.name}`} className="text-xs">
            Optional
          </Label>
        </div>

        {/* Advanced options toggle */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs"
        >
          {showAdvanced ? "Less" : "More"}
        </Button>

        {/* Remove button */}
        {showRemove && onRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 border-l-2 border-muted">
          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Input
              placeholder="chopped, diced, etc."
              value={value.notes || ""}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Group</Label>
            <Input
              placeholder="For sauce, For garnish"
              value={value.groupName || ""}
              onChange={(e) =>
                onChange({ ...value, groupName: e.target.value })
              }
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
