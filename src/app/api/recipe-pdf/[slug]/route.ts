import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { renderRecipePdf } from "@/lib/pdf/render-recipe-pdf";
import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";
import { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import { recipePdfFilename } from "@/lib/utils/recipe-pdf-url";
import { recipePdfQuerySchema } from "@/lib/validations/recipe-pdf-schemas";

const logger = createOperationLogger("recipe-pdf");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = recipePdfQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return NextResponse.json({ error: "Invalid options" }, { status: 400 });
  }

  const { slug } = await params;

  try {
    const result = await getRecipeBySlug(slug);
    if (!result.success || !result.data) {
      const notFound = result.error === "Recipe not found";
      return NextResponse.json(
        { error: result.error ?? "Failed to load recipe" },
        { status: notFound ? 404 : 500 },
      );
    }

    const { style, photos, colour, screen, download } = query.data;
    const pdf = await renderRecipePdf(result.data, {
      style,
      includePhotos: photos,
      colourPhotos: colour,
      screen,
      units: {
        measurementSystem:
          session.user.preferredWeightUnit === MeasurementUnit.METRIC
            ? MeasurementUnit.METRIC
            : MeasurementUnit.IMPERIAL,
        temperatureUnit:
          session.user.preferredTemperatureUnit === TemperatureUnit.CELSIUS
            ? TemperatureUnit.CELSIUS
            : TemperatureUnit.FAHRENHEIT,
      },
    });

    const disposition = download ? "attachment" : "inline";
    return new NextResponse(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${recipePdfFilename(slug, style, screen)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logError(logger, "Recipe PDF failed", error, { slug });
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
