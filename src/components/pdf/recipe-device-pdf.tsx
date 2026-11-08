import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  COVER_DESCRIPTION_LIMIT,
  RecipeDevicePdfCover,
} from "@/components/pdf/recipe-device-pdf-cover";
import {
  PDF_INK,
  PDF_INK_MUTED,
  PDF_PAPER,
  PDF_SURFACE,
  PDF_SWATCH_COLOURS,
} from "@/lib/pdf/recipe-pdf-colours";
import { PDF_FONT_FAMILY } from "@/lib/pdf/recipe-pdf-fonts";
import { RECIPE_PDF_SCREEN_LAYOUTS } from "@/lib/pdf/recipe-pdf-screen-layouts";
import type {
  RecipeDevicePdfProps,
  RecipePdfContent,
  RecipePdfPhotos,
  RecipePdfScreenLayout,
} from "@/lib/types/recipe-pdf-types";
import { stepSwatch } from "@/lib/utils/swatches";

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    backgroundColor: PDF_PAPER,
    color: PDF_INK,
    paddingTop: 28,
    paddingBottom: 46,
    fontSize: 15,
  },
  flow: { fontSize: 15, lineHeight: 1.32 },
  intro: { fontSize: 15, marginBottom: 16, paddingHorizontal: 6 },
  columns: { flexDirection: "row" },
  methodColumn: { flex: 1 },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  heading: {
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: -0.6,
    lineHeight: 1.2,
  },
  headingMeta: {
    fontSize: 12,
    fontWeight: 700,
    color: PDF_INK_MUTED,
    paddingBottom: 6,
  },
  card: {
    backgroundColor: PDF_SURFACE,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  groupName: {
    fontSize: 12,
    fontWeight: 700,
    color: PDF_INK_MUTED,
    marginTop: 10,
    marginBottom: 2,
  },
  ingredient: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: PDF_PAPER,
  },
  ingredientLast: { borderBottomWidth: 0 },
  quantity: { fontWeight: 800 },
  ingredientName: { flex: 1 },
  muted: { color: PDF_INK_MUTED },
  methodBelow: { marginTop: 26 },
  stepGroupName: {
    fontSize: 12,
    fontWeight: 700,
    color: PDF_INK_MUTED,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  step: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: PDF_SURFACE,
    borderRadius: 22,
    padding: 15,
    marginBottom: 9,
  },
  disc: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  discNumber: { fontSize: 17, fontWeight: 800, lineHeight: 1 },
  stepBody: { flex: 1, paddingTop: 2 },
  stepFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  stepFact: {
    backgroundColor: PDF_PAPER,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: 700,
  },
  stepNotes: { marginTop: 7, fontSize: 12.5, color: PDF_INK_MUTED },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  photo: { borderRadius: 14, objectFit: "cover" },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  galleryPhoto: { borderRadius: 22, objectFit: "cover" },
  source: {
    marginTop: 18,
    paddingHorizontal: 6,
    fontSize: 12,
    color: PDF_INK_MUTED,
  },
  sourceLink: { color: PDF_INK_MUTED },
  extraNotes: { marginTop: 18 },
  extraNotesText: { paddingHorizontal: 6 },
  pageNumber: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    color: PDF_INK_MUTED,
  },
});

interface SectionProps {
  content: RecipePdfContent;
  photos: RecipePdfPhotos;
  layout: RecipePdfScreenLayout;
}

function PhotoRow({
  filenames,
  photos,
  layout,
}: {
  filenames: string[];
  photos: RecipePdfPhotos;
  layout: RecipePdfScreenLayout;
}) {
  const present = filenames.filter((filename) => photos.has(filename));
  if (present.length === 0) return null;
  return (
    <View style={styles.photoRow}>
      {present.map((filename) => (
        <Image
          key={filename}
          style={[styles.photo, layout.stepPhoto]}
          src={{ data: photos.get(filename) as Buffer, format: "jpg" }}
        />
      ))}
    </View>
  );
}

function Ingredients({ content, photos, layout }: SectionProps) {
  return (
    <View>
      <View style={styles.headingRow} minPresenceAhead={90}>
        <Text style={styles.heading}>Ingredients</Text>
      </View>
      <View style={styles.card}>
        {content.ingredientGroups.map((group, groupIndex) => (
          <View key={group.name ?? `ingredients-${groupIndex}`}>
            {group.items.map((item, itemIndex) => (
              <View key={item.id} wrap={false}>
                {itemIndex === 0 && group.name && (
                  <Text style={styles.groupName}>{group.name}</Text>
                )}
                <View
                  style={
                    itemIndex === group.items.length - 1
                      ? [styles.ingredient, styles.ingredientLast]
                      : styles.ingredient
                  }
                >
                  <Text
                    style={[styles.quantity, { width: layout.quantityWidth }]}
                  >
                    {item.quantity || "—"}
                  </Text>
                  <Text style={styles.ingredientName}>
                    {item.detail ? `${item.name}, ` : item.name}
                    {item.detail && (
                      <Text style={styles.muted}>{item.detail}</Text>
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
      <PhotoRow
        filenames={content.ingredientPhotos}
        photos={photos}
        layout={layout}
      />
    </View>
  );
}

function Method({ content, photos, layout }: SectionProps) {
  return (
    <View>
      {content.stepGroups.map((group, groupIndex) => (
        <View key={group.name ?? `method-${groupIndex}`}>
          {group.steps.map((step, stepIndex) => {
            const disc =
              PDF_SWATCH_COLOURS[stepSwatch(content.swatch, step.number - 1)];
            return (
              <View key={step.id} wrap={false}>
                {step.number === 1 && (
                  <View style={styles.headingRow}>
                    <Text style={styles.heading}>Method</Text>
                    {content.methodSummary && (
                      <Text style={styles.headingMeta}>
                        {content.methodSummary}
                      </Text>
                    )}
                  </View>
                )}
                {stepIndex === 0 && group.name && (
                  <Text style={styles.stepGroupName}>{group.name}</Text>
                )}
                <View style={styles.step}>
                  <View style={[styles.disc, { backgroundColor: disc.bg }]}>
                    <Text style={[styles.discNumber, { color: disc.fg }]}>
                      {step.number}
                    </Text>
                  </View>
                  <View style={styles.stepBody}>
                    <Text>{step.text}</Text>
                    {step.facts.length > 0 && (
                      <View style={styles.stepFacts}>
                        {step.facts.map((fact) => (
                          <Text key={fact} style={styles.stepFact}>
                            {fact}
                          </Text>
                        ))}
                      </View>
                    )}
                    {step.notes && (
                      <Text style={styles.stepNotes}>{step.notes}</Text>
                    )}
                    <PhotoRow
                      filenames={step.photos}
                      photos={photos}
                      layout={layout}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Extras({ content, photos, layout }: SectionProps) {
  const gallery = content.otherPhotos.filter((name) => photos.has(name));
  const sourceLabel = content.sourceName ?? content.sourceUrl;
  return (
    <>
      {content.extraNotes && (
        <View style={styles.extraNotes}>
          <View style={styles.headingRow} minPresenceAhead={40}>
            <Text style={styles.heading}>Notes</Text>
          </View>
          <Text style={styles.extraNotesText}>{content.extraNotes}</Text>
        </View>
      )}
      {gallery.length > 0 && (
        <View style={styles.gallery}>
          {gallery.map((filename) => (
            <Image
              key={filename}
              style={[styles.galleryPhoto, layout.galleryPhoto]}
              src={{ data: photos.get(filename) as Buffer, format: "jpg" }}
            />
          ))}
        </View>
      )}
      {sourceLabel && (
        <Text style={styles.source}>
          From{" "}
          {content.sourceUrl ? (
            <Link src={content.sourceUrl} style={styles.sourceLink}>
              {sourceLabel}
            </Link>
          ) : (
            sourceLabel
          )}
        </Text>
      )}
    </>
  );
}

function RecipeDeviceRecipe({ content, photos, layout }: SectionProps) {
  const section = { content, photos, layout };
  const hasIngredients = content.ingredientGroups.length > 0;
  const hasSteps = content.stepGroups.length > 0;
  const longDescription =
    content.description && content.description.length > COVER_DESCRIPTION_LIMIT
      ? content.description
      : null;
  const sideBySide =
    layout.ingredientWidth !== null && hasIngredients && hasSteps;

  return (
    <>
      <RecipeDevicePdfCover content={content} photos={photos} layout={layout} />
      <Page
        size={layout.page}
        style={[styles.page, { paddingHorizontal: layout.padding }]}
      >
        <View style={styles.flow}>
          {longDescription && (
            <Text style={styles.intro}>{longDescription}</Text>
          )}

          {sideBySide ? (
            <View style={[styles.columns, { gap: layout.columnGap }]}>
              <View style={{ width: layout.ingredientWidth as number }}>
                <Ingredients {...section} />
              </View>
              <View style={styles.methodColumn}>
                <Method {...section} />
                <Extras {...section} />
              </View>
            </View>
          ) : (
            <>
              {hasIngredients && <Ingredients {...section} />}
              {hasSteps && (
                <View style={hasIngredients ? [styles.methodBelow] : []}>
                  <Method {...section} />
                </View>
              )}
              <Extras {...section} />
            </>
          )}
        </View>

        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber }) => String(pageNumber)}
        />
      </Page>
    </>
  );
}

export function RecipeDevicePdf({
  contents,
  photos,
  screen,
}: RecipeDevicePdfProps) {
  const layout = RECIPE_PDF_SCREEN_LAYOUTS[screen];
  return (
    <Document
      title={contents[0].title}
      author={contents[0].author}
      creator="Tastebase"
      producer="Tastebase"
    >
      {contents.map((content) => (
        <RecipeDeviceRecipe
          key={content.id}
          content={content}
          photos={photos}
          layout={layout}
        />
      ))}
    </Document>
  );
}
