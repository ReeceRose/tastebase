import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/recipe-pdf/[slug]/route";
import { auth } from "@/lib/auth/auth";
import { renderRecipePdf } from "@/lib/pdf/render-recipe-pdf";
import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";
import {
  MeasurementUnit,
  RecipePdfScreen,
  RecipePdfStyle,
  TemperatureUnit,
} from "@/lib/types";

vi.mock("@/lib/auth/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/lib/server-actions/recipe-actions", () => ({
  getRecipeBySlug: vi.fn(),
}));
vi.mock("@/lib/pdf/render-recipe-pdf", () => ({
  renderRecipePdf: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getRecipe = vi.mocked(getRecipeBySlug);
const render = vi.mocked(renderRecipePdf);

function request(search: string) {
  return GET(new NextRequest(`http://localhost/api/recipe-pdf/soup${search}`), {
    params: Promise.resolve({ slug: "soup" }),
  });
}

function signIn() {
  getSession.mockResolvedValue({
    user: {
      id: "user",
      preferredWeightUnit: MeasurementUnit.METRIC,
      preferredTemperatureUnit: TemperatureUnit.CELSIUS,
    },
  } as never);
}

describe("GET /api/recipe-pdf/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    render.mockResolvedValue(Buffer.from("%PDF-"));
  });

  it("rejects signed-out requests", async () => {
    getSession.mockResolvedValue(null as never);
    const response = await request("");
    expect(response.status).toBe(401);
    expect(getRecipe).not.toHaveBeenCalled();
  });

  it("rejects unknown styles", async () => {
    signIn();
    const response = await request("?style=poster");
    expect(response.status).toBe(400);
  });

  it("returns 404 for recipes the reader can't see", async () => {
    signIn();
    getRecipe.mockResolvedValue({
      success: false,
      error: "Recipe not found",
    });
    const response = await request("");
    expect(response.status).toBe(404);
    expect(render).not.toHaveBeenCalled();
  });

  it("adds linked recipes the reader can see when asked", async () => {
    signIn();
    const linkedRecipe = { id: "pesto", slug: "pesto", title: "Pesto" };
    const hiddenRecipe = { id: "hidden", slug: "hidden", title: "Hidden" };
    const recipe = {
      id: "soup",
      ingredients: [
        { linkedRecipe },
        { linkedRecipe },
        { linkedRecipe: hiddenRecipe },
        { linkedRecipe: null },
      ],
    };
    const pesto = { id: "pesto" };
    getRecipe.mockImplementation(async (slug: string) => {
      if (slug === "soup") return { success: true, data: recipe } as never;
      if (slug === "pesto") return { success: true, data: pesto } as never;
      return { success: false, error: "Recipe not found" };
    });

    await request("?linked=1");

    expect(render.mock.calls[0][2]).toEqual([pesto]);
    expect(getRecipe).toHaveBeenCalledTimes(3);
  });

  it("leaves linked recipes out unless asked", async () => {
    signIn();
    const recipe = {
      id: "soup",
      ingredients: [
        { linkedRecipe: { id: "pesto", slug: "pesto", title: "Pesto" } },
      ],
    };
    getRecipe.mockResolvedValue({ success: true, data: recipe } as never);

    await request("");

    expect(getRecipe).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][2]).toEqual([]);
  });

  it("rejects unknown screen sizes", async () => {
    signIn();
    const response = await request("?style=device&screen=watch");
    expect(response.status).toBe(400);
  });

  it("renders with the reader's units and options", async () => {
    signIn();
    const recipe = { id: "soup" };
    getRecipe.mockResolvedValue({
      success: true,
      data: recipe,
    } as never);

    const response = await request("?style=printer&photos=1&colour=1");

    expect(render).toHaveBeenCalledWith(
      recipe,
      {
        style: RecipePdfStyle.PRINTER,
        includePhotos: true,
        colourPhotos: true,
        screen: RecipePdfScreen.PHONE,
        units: {
          measurementSystem: MeasurementUnit.METRIC,
          temperatureUnit: TemperatureUnit.CELSIUS,
        },
      },
      [],
    );
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="soup-printable.pdf"',
    );
  });

  it("names the download after the style", async () => {
    signIn();
    getRecipe.mockResolvedValue({
      success: true,
      data: { id: "soup" },
    } as never);

    const response = await request("?style=device&screen=laptop&download=1");

    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="soup-laptop.pdf"',
    );
  });
});
