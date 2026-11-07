import { describe, expect, it } from "vitest";
import {
  parseIngredientList,
  readIngredientHeading,
  toGroupName,
} from "@/lib/import/ingredient-list";
import {
  parseIngredientLine,
  parseIngredientLines,
} from "@/lib/import/ingredient-parser";

describe("parseIngredientLine", () => {
  it.each([
    ["2 cups all-purpose flour", "2", "cups", "all-purpose flour"],
    ["1 1/2 tsp salt", "1 1/2", "tsp", "salt"],
    ["½ cup sugar", "½", "cup", "sugar"],
    ["1½ tablespoons olive oil", "1½", "tbsp", "olive oil"],
    ["200g butter", "200", "g", "butter"],
    ["3 eggs", "3", null, "eggs"],
    ["- 1 lb ground beef", "1", "lb", "ground beef"],
    ["▢ 4 tbsp. soy sauce", "4", "tbsp", "soy sauce"],
    ["2 fl oz cream", "2", "fl oz", "cream"],
    ["1 cup of milk", "1", "cup", "milk"],
    ["2 large tomatoes", "2", null, "large tomatoes"],
    ["2-3 cloves garlic", "2-3", "cloves", "garlic"],
    ["2 to 3 carrots", "2 to 3", null, "carrots"],
  ])("parses %s", (line, quantity, unit, name) => {
    expect(parseIngredientLine(line)).toMatchObject({ quantity, unit, name });
  });

  it("returns null for blank lines", () => {
    expect(parseIngredientLine("   ")).toBeNull();
  });

  it("keeps lines without an amount as the name", () => {
    expect(parseIngredientLine("Salt and pepper to taste")).toMatchObject({
      quantity: null,
      unit: null,
      name: "Salt and pepper",
      notes: "to taste",
    });
  });

  it.each([
    ["3 Tbsp sugar", "tbsp"],
    ["2 Tablespoons butter", "tbsp"],
    ["1 Tbsp. oil", "tbsp"],
    ["2 TBSP oil", "tbsp"],
    ["2 T butter", "tbsp"],
    ["2 t vanilla", "tsp"],
    ["1/4 teaspoon cumin", "tsp"],
    ["1 Tsp cumin", "tsp"],
    ["2 ounces cheese", "oz"],
    ["1 pound beef", "lb"],
    ["1 lbs beef", "lb"],
    ["100 grams flour", "g"],
    ["2 Cups rice", "cups"],
    ["1 c. sugar", "cup"],
    ["1 L stock", "l"],
    ["2 dl cream", "dl"],
    ["3 stalks celery", "stalks"],
    ["1 tin tomatoes", "tin"],
  ])("recognises the unit in %s", (line, unit) => {
    expect(parseIngredientLine(line)?.unit).toBe(unit);
  });

  it("doesn't read the start of a word as a unit", () => {
    expect(parseIngredientLine("2 grapes")).toMatchObject({
      unit: null,
      name: "grapes",
    });
    expect(parseIngredientLine("1 carrot")).toMatchObject({
      unit: null,
      name: "carrot",
    });
    expect(parseIngredientLine("2 cloves")).toMatchObject({
      unit: null,
      name: "cloves",
    });
  });

  it.each([
    ["1 and 1/2 cups flour", "1 1/2"],
    ["1 & 1/2 cups flour", "1 1/2"],
    ["1-1/2 cups flour", "1 1/2"],
    ["1 ½ cups flour", "1 ½"],
    ["2 and ½ cups flour", "2½"],
    ["1­1/2 cups flour", "1 1/2"],
    ["½­ cup flour", "½"],
    [".5 cup flour", "0.5"],
    ["1 or 2 cups flour", "1-2"],
  ])("reads the amount in %s", (line, quantity) => {
    expect(parseIngredientLine(line)).toMatchObject({
      quantity,
      name: "flour",
    });
  });

  it.each([
    ["a pinch of salt", "1", "pinch", "salt"],
    ["an ounce of rum", "1", "oz", "rum"],
    ["half a lemon", "1/2", null, "lemon"],
    ["One onion", "1", null, "onion"],
    ["two cloves garlic", "2", "cloves", "garlic"],
  ])("reads the word amount in %s", (line, quantity, unit, name) => {
    expect(parseIngredientLine(line)).toMatchObject({ quantity, unit, name });
  });

  it("leaves an article alone when it isn't an amount", () => {
    expect(parseIngredientLine("a selection of nuts")).toMatchObject({
      quantity: null,
      name: "a selection of nuts",
    });
  });

  it.each([
    ["400g / 14 oz canned tomato", "400", "g", "canned tomato (14 oz)"],
    ["4 oz / 120g green chiles", "4", "oz", "green chiles (120g)"],
    ["60 g/4 tbsp melted butter", "60", "g", "melted butter (4 tbsp)"],
    ["1 cup / 240 ml milk", "1", "cup", "milk (240 ml)"],
    ["1 cup / 8 fl oz / 240 ml milk", "1", "cup", "milk (8 fl oz; 240 ml)"],
    ["1 cup (160 ml) milk", "1", "cup", "milk (160 ml)"],
    ["1 cup (8 oz; 225 g) butter", "1", "cup", "butter (8 oz; 225 g)"],
    ["4 pounds (about 2kg) potatoes", "4", "lb", "potatoes (about 2kg)"],
    ["500g/1lb 2oz flour", "500", "g", "flour"],
    ["500g / 1.2 - 1.6lb chicken", "500", "g", "chicken"],
  ])(
    "keeps the author's second measure in %s",
    (line, quantity, unit, name) => {
      expect(parseIngredientLine(line)).toMatchObject({ quantity, unit, name });
    },
  );

  it.each([
    ["1 cup plus 1 tbsp sugar", "sugar, plus 1 tbsp"],
    ["2 Tbsp. plus ¼ cup olive oil", "olive oil, plus ¼ cup"],
    ["1 cup + 2 Tablespoons water", "water, plus 2 tbsp"],
    ["1 cup (200 g) plus 1 tbsp sugar", "sugar (200 g), plus 1 tbsp"],
    [
      "2 cups minus 2 tablespoons cake flour (8 ½ ounces)",
      "cake flour (8 ½ ounces), minus 2 tbsp",
    ],
    ["¼ cup brown sugar, + 2 tablespoons", "brown sugar, plus 2 tbsp"],
    ["¼ cup brown sugar, plus 2 tablespoons", "brown sugar, plus 2 tbsp"],
  ])("keeps the adjustment in %s where scaling finds it", (line, name) => {
    expect(parseIngredientLine(line)?.name).toBe(name);
  });

  it("treats a plus sign with no amount as a minimum", () => {
    expect(parseIngredientLine("1/2 tbsp+ lime juice")).toMatchObject({
      quantity: "1/2",
      unit: "tbsp",
      name: "lime juice",
      notes: "or more",
    });
  });

  it.each([
    ["1 (14 oz) can diced tomatoes", "1", "can", "diced tomatoes (14 oz)"],
    ["1 14-ounce can coconut milk", "1", "can", "coconut milk (14 oz)"],
    ["2 15 oz cans beans", "2", "cans", "beans (15 oz)"],
    ["14 oz can tomatoes", "1", "can", "tomatoes (14 oz)"],
    ["2 x 400g tins tomatoes", "2", "tins", "tomatoes (400 g)"],
    ["a 14-oz can tomatoes", "1", "can", "tomatoes (14 oz)"],
    ["12-ounce (340g) loaf of bread", "1", "loaf", "bread (12 oz; 340g)"],
    ["One 1-lb challah", "1", null, "challah (1 lb)"],
    ["12-ounce cheddar", "12", "oz", "cheddar"],
  ])("reads the package size in %s", (line, quantity, unit, name) => {
    expect(parseIngredientLine(line)).toMatchObject({ quantity, unit, name });
  });

  it("reads a length of ginger", () => {
    expect(parseIngredientLine("2 inch piece of ginger, peeled")).toMatchObject(
      { quantity: "1", unit: "piece", name: "ginger", notes: "2-inch; peeled" },
    );
  });

  it.each([
    ["1 clove garlic, minced", "garlic", "minced"],
    ["2 eggs, beaten", "eggs", "beaten"],
    ["1 onion, finely diced", "onion", "finely diced"],
    ["1 cup milk (whole)", "milk", "whole"],
    ["1 cup (packed) brown sugar", "brown sugar", "packed"],
    ["1 cup milk, warm", "milk", "warm"],
    ["1 cup flour, plus more for dusting", "flour", "plus more for dusting"],
    ["1 cup olive oil, or duck fat", "olive oil", "or duck fat"],
    ["1 large egg or 2 small eggs", "large egg", "or 2 small eggs"],
    [
      "2 cups flour plus 2 tbsp for dusting",
      "flour",
      "plus 2 tbsp for dusting",
    ],
    ["2 cups chard for serving", "chard", "for serving"],
    ["1 cup milk, at room temperature", "milk", "at room temperature"],
  ])("splits the note from %s", (line, name, notes) => {
    expect(parseIngredientLine(line)).toMatchObject({ name, notes });
  });

  it.each([
    ["1 lb boneless, skinless chicken", "boneless, skinless chicken"],
    ["2 cups milk, full cream", "milk, full cream"],
    ["1 cup salt, cooking/kosher", "salt, cooking/kosher"],
    ["1 tbsp red, green or yellow pepper", "red, green or yellow pepper"],
    ["1 cup milk plus cream", "milk plus cream"],
  ])("keeps %s together", (line, name) => {
    const parsed = parseIngredientLine(line);
    expect(parsed?.name).toBe(name);
    expect(parsed?.notes).toBeNull();
  });

  it("puts a qualifier on the amount into the notes", () => {
    expect(parseIngredientLine("scant 1 cup sugar")).toMatchObject({
      quantity: "1",
      name: "sugar",
      notes: "scant",
    });
    expect(parseIngredientLine("Heaping ¼ teaspoon salt")).toMatchObject({
      quantity: "¼",
      unit: "tsp",
      notes: "heaping",
    });
    expect(parseIngredientLine("2 large cloves garlic")).toMatchObject({
      unit: "cloves",
      name: "garlic",
      notes: "large",
    });
    expect(parseIngredientLine("about 2 cups rice")).toMatchObject({
      quantity: "2",
      notes: null,
    });
  });

  it.each([
    ["Optional: 2 cups edamame, steamed", "edamame", "steamed"],
    ["1 tbsp capers (optional)", "capers", null],
    ["2 tbsp (optional) capers, drained", "capers", "drained"],
    ["2 tomatoes (diced (optional))", "tomatoes", "diced"],
    ["1 tsp sugar, optional", "sugar", null],
    ["1 tsp sugar, if using", "sugar", "if using"],
  ])("marks %s as optional", (line, name, notes) => {
    expect(parseIngredientLine(line)).toMatchObject({
      name,
      notes,
      isOptional: true,
    });
  });

  it.each([
    ["1 1/2 tbsp oil ((or butter))", "oil", "or butter"],
    ["1 garlic clove (, minced)", "garlic clove", "minced"],
    [
      "1/2 onion (, finely chopped (white, brown, yellow))",
      "onion",
      "finely chopped (white, brown, yellow)",
    ],
    ["1 1/2 cups rice (, uncooked (Note 1))", "rice", "uncooked"],
    ["1/3 cup pine nuts (, toasted (Note 1))", "pine nuts", "toasted"],
    ["2 cups stock ((Note 2))", "stock", null],
    ["1 cup rice (see note 3)", "rice", null],
    ["1 cup rice (see note)", "rice", null],
    ["1 cup rice (notes)", "rice", null],
    ["500 g berries (Note 1 for frozen)", "berries", null],
    ["1 cup Notes 5 blend", "Notes 5 blend", null],
    [
      "3/4 tsp salt ( (if table salt: 1/2 tsp))",
      "salt",
      "if table salt: 1/2 tsp",
    ],
  ])("tidies site notes in %s", (line, name, notes) => {
    expect(parseIngredientLine(line)).toMatchObject({ name, notes });
  });

  it("unwraps a name a site put in one big bracket", () => {
    expect(
      parseIngredientLine(
        "1 loaf ((18 slices) white bread, crusts removed and cut into 1-inch (2.5-cm) cubes)",
      ),
    ).toMatchObject({
      unit: "loaf",
      name: "white bread",
      notes: "crusts removed and cut into 1-inch (2.5-cm) cubes; 18 slices",
    });
  });

  it.each([
    ["⅓ cup ketchup ($0.22)", "ketchup"],
    ["2/3 cup raisins*", "raisins"],
    ["1 cup bread flour** (sifted)", "bread flour"],
    ["2 tbsp Kikkoman® soy sauce", "Kikkoman soy sauce"],
    ["1 [grilled corn | https://example.com/corn]", "grilled corn"],
    ["1 cup flour.", "flour"],
  ])("removes page clutter from %s", (line, name) => {
    expect(parseIngredientLine(line)?.name).toBe(name);
  });

  it("leaves brackets that don't balance in the name", () => {
    expect(parseIngredientLine("1 cup milk (whole")).toMatchObject({
      name: "milk (whole",
      notes: null,
    });
  });

  it("keeps a measure that is all there is", () => {
    expect(parseIngredientLine("1 cup (160 ml)")?.name).toBe("(160 ml)");
  });

  it("keeps a bracketed name without its brackets", () => {
    expect(parseIngredientLine("1 cup (milk)")?.name).toBe("milk");
  });
});

describe("lines that have gone wrong before", () => {
  it.each([
    [
      "1/4-1/2 teaspoon cayenne pepper",
      "1/4-1/2",
      "tsp",
      "cayenne pepper",
      null,
    ],
    [
      "1/4-1/3 cup shredded coconut ((unsweetened))",
      "1/4-1/3",
      "cup",
      "shredded coconut",
      "unsweetened",
    ],
    ["1/2 cup to 1 cup barbecue sauce", "1/2-1", "cup", "barbecue sauce", null],
    ["1 1/2 ounces to 2 ounces Campari", "1 1/2-2", "oz", "Campari", null],
    ["1 tablespoon (tbsp) Butter", "1", "tbsp", "Butter", null],
    ["0.18 teaspoon (tsp) Sugar", "0.18", "tsp", "Sugar", null],
    ["1 cup whole or 2% milk", "1", "cup", "whole or 2% milk", null],
    ["1 cup or 200 grams chana dal", "1", "cup", "chana dal (200 grams)", null],
    [
      "1 cup or 2 medium sized tomatoes (finely chopped)",
      "1",
      "cup",
      "tomatoes",
      "or 2 medium sized; finely chopped",
    ],
    [
      "1 x 1.2kg whole free-range chicken",
      "1",
      null,
      "whole free-range chicken (1.2 kg)",
      null,
    ],
    [
      "2 x 800g / 1.3lb racks of lamb (, frenched (Note 1))",
      "2",
      null,
      "racks of lamb (800 g; 1.3lb)",
      "frenched",
    ],
    ["One 1-lb / 450g challah", "1", null, "challah (1 lb; 450g)", null],
    ['1 1" piece ginger, peeled', "1", "piece", "ginger", "1-inch; peeled"],
    [
      "1 lime cut into 8 wedges to serve",
      "1",
      null,
      "lime",
      "cut into 8 wedges to serve",
    ],
    [
      "1/2 tsp vanilla extract ((optional but recommended))",
      "1/2",
      "tsp",
      "vanilla extract",
      "recommended",
    ],
    [
      "Fresh chopped parsley ((optional // to garnish))",
      null,
      null,
      "Fresh chopped parsley",
      "to garnish",
    ],
    [
      "1 pinch asafoetida ((hing), optional)",
      "1",
      "pinch",
      "asafoetida",
      "hing",
    ],
    [
      "2 avocados, (pitted and diced)",
      "2",
      null,
      "avocados",
      "pitted and diced",
    ],
    [
      "3/4 cup, plus 2 tablespoons (100g) almond flour",
      "3/4",
      "cup",
      "almond flour (100g), plus 2 tbsp",
      null,
    ],
    [
      "1 cup raw, unpasteurized, unfiltered vinegar, or a vinegar mother",
      "1",
      "cup",
      "raw, unpasteurized, unfiltered vinegar",
      "or a vinegar mother",
    ],
    [
      "1 medium onion, very thinly sliced",
      "1",
      null,
      "medium onion",
      "very thinly sliced",
    ],
    [
      "3 Tbsp. peanut, rice bran, or other neutral oil",
      "3",
      "tbsp",
      "peanut, rice bran, or other neutral oil",
      null,
    ],
    ["Pinch of salt", "1", "pinch", "salt", null],
    ["1 unit Baby Lettuce", "1", null, "Baby Lettuce", null],
    ["½ inch water", "½", null, "inch water", null],
    ["1 cup carrots (shredded, $0.49)", "1", "cup", "carrots", "shredded"],
    ["1 inch fresh ginger", "1", "piece", "fresh ginger", "1-inch"],
    ["handful cilantro (optional) ($0.25)", "1", "handful", "cilantro", null],
    ["½ to 1 teaspoons oil (- optional)", "½ to 1", "tsp", "oil", null],
    [
      "1 bunch green onions, (cut into 1-inch (3cm) lengths)",
      "1",
      "bunch",
      "green onions",
      "cut into 1-inch (3cm) lengths",
    ],
    [
      "1/2 tsp salt (, cooking/kosher salt)",
      "1/2",
      "tsp",
      "salt",
      "cooking/kosher salt",
    ],
    [
      "600 - 800g / 1.2 - 1.6lb chicken thigh fillets (, skinless)",
      "600-800",
      "g",
      "chicken thigh fillets",
      "skinless",
    ],
    [
      "400g / 14oz can black beans (, drained)",
      "400",
      "g",
      "black beans (14oz)",
      "canned or packaged; drained",
    ],
  ])("%s", (line, quantity, unit, name, notes) => {
    expect(parseIngredientLine(line)).toMatchObject({
      quantity,
      unit,
      name,
      notes,
    });
  });

  it.each([
    ["1 tsp salt (less if using table salt)", false],
    ["1 tsp cornstarch (only if using milk)", true],
    ["optional after baking: 2 Tablespoons parsley", true],
  ])("decides whether %s is optional", (line, isOptional) => {
    expect(parseIngredientLine(line)?.isOptional).toBe(isOptional);
  });

  it("keeps a note that only looks like an adjustment out of the name", () => {
    expect(
      parseIngredientLine(
        "1 tablespoon olive oil, plus 1/2 teaspoon for the baking sheet",
      ),
    ).toMatchObject({
      name: "olive oil",
      notes: "plus 1/2 teaspoon for the baking sheet",
    });
  });

  it("notes when an optional ingredient is wanted", () => {
    expect(
      parseIngredientLine("optional after baking: 2 Tablespoons parsley"),
    ).toMatchObject({ unit: "tbsp", name: "parsley", notes: "after baking" });
  });

  it("doesn't split an adjustment into a second ingredient", () => {
    expect(
      parseIngredientLines("3/4 cup, plus 2 tablespoons (100g) almond flour"),
    ).toHaveLength(1);
  });
});

describe("the salsa that started this", () => {
  it.each([
    [
      "1/4 cup chopped onion ((white, brown or yellow))",
      "1/4",
      "cup",
      "chopped onion",
      "white, brown or yellow",
    ],
    [
      "1 tbsp jalapeño pepper (, seeds removed, roughly chopped (fresh best, canned ok))",
      "1",
      "tbsp",
      "jalapeño pepper",
      "seeds removed, roughly chopped (fresh best, canned ok)",
    ],
    [
      "400g / 14 oz  canned crushed tomato (, best quality)",
      "400",
      "g",
      "canned crushed tomato (14 oz)",
      "best quality",
    ],
    [
      "4 oz / 120g  canned diced green chiles ((Note 1))",
      "4",
      "oz",
      "canned diced green chiles (120g)",
      null,
    ],
    [
      "1/4 cup (packed) cilantro/coriander (, roughly chopped)",
      "1/4",
      "cup",
      "cilantro/coriander",
      "packed; roughly chopped",
    ],
    ["1/2 tbsp+ lime juice", "1/2", "tbsp", "lime juice", "or more"],
    ["1 clove garlic (, minced)", "1", "clove", "garlic", "minced"],
    ["1/4 teaspoon ground cumin", "1/4", "tsp", "ground cumin", null],
  ])("%s", (line, quantity, unit, name, notes) => {
    expect(parseIngredientLine(line)).toMatchObject({
      quantity,
      unit,
      name,
      notes,
    });
  });
});

describe("parseIngredientLines", () => {
  it("splits two ingredients joined on one line", () => {
    expect(
      parseIngredientLines(
        "1 tablespoon grated lemon zest plus 3/4 cup (180 ml) fresh lemon juice, plus additional zest for serving",
      ),
    ).toMatchObject([
      { quantity: "1", unit: "tbsp", name: "grated lemon zest" },
      {
        quantity: "3/4",
        unit: "cup",
        name: "fresh lemon juice (180 ml)",
        notes: "plus additional zest for serving",
      },
    ]);
    expect(
      parseIngredientLines(
        "1 cup flour plus 2 tbsp cornstarch plus 1 tsp salt",
      ).map((item) => item.name),
    ).toEqual(["flour", "cornstarch", "salt"]);
    expect(
      parseIngredientLines("1/2 tsp salt + 1/2 Tbsp of salt for water"),
    ).toHaveLength(2);
  });

  it.each([
    ["1 cup plus 1 tbsp sugar"],
    ["1 cup (200 g) plus 1 tbsp sugar"],
    ["1 cup sugar plus 1 tbsp more"],
    ["2 cups flour plus 2 tbsp for dusting"],
    ["1 tbsp oil (plus 1 tsp butter)"],
    ["1 cup milk plus cream"],
    ["salt plus 1 tsp pepper"],
  ])("keeps %s as one ingredient", (line) => {
    expect(parseIngredientLines(line)).toHaveLength(1);
  });

  it("returns nothing for blank lines", () => {
    expect(parseIngredientLines("   ")).toEqual([]);
  });
});

describe("parseIngredientList", () => {
  it("uses heading lines as sections", () => {
    const rows = parseIngredientList([
      "2 cups flour",
      "FROSTING:",
      "1 cup icing sugar",
      "For the Marinade:",
      "1 tbsp soy sauce",
      "## To serve",
      "1 lime",
    ]);

    expect(rows.map((row) => [row.groupName, row.name])).toEqual([
      [null, "flour"],
      ["Frosting", "icing sugar"],
      ["For the Marinade", "soy sauce"],
      ["To serve", "lime"],
    ]);
  });

  it("reads a section at the start of a line", () => {
    const rows = parseIngredientList([
      "Sauce: 1 cup stock",
      "Optional: 2 limes",
    ]);

    expect(rows[0]).toMatchObject({ groupName: "Sauce", name: "stock" });
    expect(rows[1]).toMatchObject({ isOptional: true, name: "limes" });
  });

  it("prefers the section from the page's recipe card", () => {
    const rows = parseIngredientList(
      ["1 cup stock", "1 onion"],
      ["Soup", null],
    );

    expect(rows.map((row) => row.groupName)).toEqual(["Soup", null]);
  });

  it("treats a plain Ingredients heading as no section", () => {
    const rows = parseIngredientList([
      "Sauce:",
      "1 cup stock",
      "Ingredients:",
      "1 onion",
    ]);

    expect(rows.map((row) => row.groupName)).toEqual(["Sauce", null]);
  });

  it("drops rows with no ingredient in them", () => {
    expect(parseIngredientList(["3/4 cup ,", "1 cup milk"])).toHaveLength(1);
  });
});

describe("toGroupName", () => {
  it.each([
    ["FOR PANCAKES*", "For pancakes"],
    ["Marinade:", "Marinade"],
    ["Wet Ingredients", "Wet Ingredients"],
    ["Ingredients", null],
    ["Ingredients:", null],
  ])("tidies %s", (text, name) => {
    expect(toGroupName(text)).toBe(name);
  });
});

describe("readIngredientHeading", () => {
  it.each([
    ["For the salsa:", "For the salsa"],
    ["for the sauce", "for the sauce"],
    ["FOR THE GLAZE", "For the glaze"],
    ["**Filling:**", "Filling"],
  ])("reads %s", (line, heading) => {
    expect(readIngredientHeading(line)).toBe(heading);
  });

  it.each([
    ["2 cups flour"],
    ["Salt and pepper to taste"],
    ["Note: use fresh"],
  ])("doesn't read %s as a heading", (line) => {
    expect(readIngredientHeading(line)).toBeNull();
  });
});
