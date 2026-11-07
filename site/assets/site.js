for (const block of document.querySelectorAll(".code")) {
  const pre = block.querySelector("pre");
  if (!pre || !navigator.clipboard) continue;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-copy";
  button.textContent = "Copy";
  button.setAttribute("aria-label", "Copy these commands");

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pre.textContent.trim());
      button.textContent = "Copied";
    } catch {
      button.textContent = "Select and copy";
    }
    setTimeout(() => {
      button.textContent = "Copy";
    }, 2000);
  });

  block.append(button);
}

const recipe = document.querySelector("[data-recipe]");

if (recipe && window.sampleRecipe) {
  const { base, max, amounts } = window.sampleRecipe;
  let servings = base;
  let system = "imperial";

  const find = (name) => recipe.querySelector(`[data-${name}]`);
  const ticks = [...recipe.querySelectorAll("[data-tick]")];

  const render = () => {
    const scaled = servings !== base;
    for (const cell of recipe.querySelectorAll("[data-amount]")) {
      cell.textContent = amounts[system][servings][cell.dataset.amount];
    }
    find("servings").textContent = `Serves ${servings}`;
    find("servings-fact").textContent = servings;
    find("less").disabled = servings <= 1;
    find("more").disabled = servings >= max;
    find("reset").hidden = !scaled;
    find("note").hidden = !scaled;
    find("note").textContent = scaled
      ? `Scaled from ${base} to ${servings} servings. Amounts are simply multiplied, so check seasoning, pan size and cooking times.`
      : "";
    for (const button of recipe.querySelectorAll("[data-system]")) {
      button.setAttribute("aria-pressed", String(button.dataset.system === system));
    }
  };

  const setServings = (next) => {
    servings = Math.min(max, Math.max(1, next));
    render();
  };

  find("less").addEventListener("click", () => setServings(servings - 1));
  find("more").addEventListener("click", () => setServings(servings + 1));
  find("reset").addEventListener("click", () => setServings(base));

  for (const button of recipe.querySelectorAll("[data-system]")) {
    button.addEventListener("click", () => {
      system = button.dataset.system;
      render();
    });
  }

  const syncUntick = () => {
    find("untick").hidden = !ticks.some((tick) => tick.checked);
  };

  for (const tick of ticks) tick.addEventListener("change", syncUntick);

  find("untick").addEventListener("click", () => {
    for (const tick of ticks) tick.checked = false;
    syncUntick();
  });

  for (const controls of recipe.querySelectorAll("[data-controls]")) {
    controls.hidden = false;
  }

  render();
}
