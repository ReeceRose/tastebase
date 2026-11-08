import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { PDF_PRINT_BLACK } from "@/lib/pdf/recipe-pdf-colours";
import { splitIngredientColumns } from "@/lib/pdf/recipe-pdf-content";
import { PDF_FONT_FAMILY } from "@/lib/pdf/recipe-pdf-fonts";
import type {
  RecipePdfDocumentProps,
  RecipePdfIngredientGroup,
  RecipePdfPhotos,
} from "@/lib/types/recipe-pdf-types";

const MIN_INGREDIENTS_FOR_TWO_COLUMNS = 8;

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 11,
    color: PDF_PRINT_BLACK,
    backgroundColor: "#ffffff",
    paddingTop: 48,
    paddingBottom: 54,
    paddingHorizontal: 54,
  },
  flow: { fontSize: 11, lineHeight: 1.35 },
  header: { flexDirection: "row", gap: 18 },
  headerText: { flex: 1 },
  title: { fontSize: 26, fontWeight: 800, lineHeight: 1.1 },
  description: { marginTop: 6 },
  facts: { marginTop: 6, fontWeight: 700 },
  mainPhoto: { width: 160, height: 120, objectFit: "cover" },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: PDF_PRINT_BLACK,
    marginTop: 12,
    marginBottom: 14,
  },
  heading: {
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 6,
  },
  methodHeading: { marginTop: 16 },
  columns: { flexDirection: "row", gap: 24 },
  column: { flex: 1 },
  groupName: { fontWeight: 800, marginBottom: 2 },
  laterGroup: { marginTop: 6 },
  ingredient: { marginBottom: 3 },
  quantity: { fontWeight: 800 },
  step: { flexDirection: "row", marginBottom: 8 },
  stepNumber: { width: 22, fontWeight: 800 },
  stepBody: { flex: 1 },
  stepFacts: { marginTop: 2, fontSize: 10, fontWeight: 700 },
  stepNotes: { marginTop: 2, fontSize: 10 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  photo: { width: 120, height: 90, objectFit: "cover" },
  source: {
    position: "absolute",
    bottom: 28,
    left: 54,
    right: 110,
    fontSize: 9,
    maxLines: 1,
    textOverflow: "ellipsis",
  },
  pageNumber: {
    position: "absolute",
    bottom: 28,
    left: 54,
    right: 54,
    textAlign: "right",
    fontSize: 9,
  },
});

function IngredientColumn({ groups }: { groups: RecipePdfIngredientGroup[] }) {
  return (
    <View style={styles.column}>
      {groups.map((group, index) => (
        <View key={group.name ?? `ingredients-${index}`}>
          {group.name && (
            <Text
              style={
                index === 0
                  ? styles.groupName
                  : [styles.groupName, styles.laterGroup]
              }
            >
              {group.name}
            </Text>
          )}
          {group.items.map((item) => (
            <Text key={item.id} style={styles.ingredient}>
              {item.quantity && (
                <Text style={styles.quantity}>{item.quantity} </Text>
              )}
              {item.detail ? `${item.name}, ${item.detail}` : item.name}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function PhotoRow({
  filenames,
  photos,
}: {
  filenames: string[];
  photos: RecipePdfPhotos;
}) {
  const present = filenames.filter((filename) => photos.has(filename));
  if (present.length === 0) return null;
  return (
    <View style={styles.photoRow}>
      {present.map((filename) => (
        <Image
          key={filename}
          style={styles.photo}
          src={{ data: photos.get(filename) as Buffer, format: "jpg" }}
        />
      ))}
    </View>
  );
}

export function RecipePrinterPdf({ content, photos }: RecipePdfDocumentProps) {
  const ingredientCount = content.ingredientGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const columns =
    ingredientCount >= MIN_INGREDIENTS_FOR_TWO_COLUMNS
      ? splitIngredientColumns(content.ingredientGroups)
      : [content.ingredientGroups];
  const factLine = content.facts
    .map((fact) =>
      fact.label === "Difficulty" ? fact.value : `${fact.label} ${fact.value}`,
    )
    .join("   ·   ");
  const mainPhoto = content.mainPhoto ? photos.get(content.mainPhoto) : null;
  const source = [content.sourceName, content.sourceUrl]
    .filter(Boolean)
    .join(" · ");

  return (
    <Document title={content.title} creator="Tastebase" producer="Tastebase">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.flow}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{content.title}</Text>
              {content.description && (
                <Text style={styles.description}>{content.description}</Text>
              )}
              {factLine && <Text style={styles.facts}>{factLine}</Text>}
            </View>
            {mainPhoto && (
              <Image
                style={styles.mainPhoto}
                src={{ data: mainPhoto, format: "jpg" }}
              />
            )}
          </View>
          <View style={styles.rule} />

          {ingredientCount > 0 && (
            <View>
              <Text style={styles.heading}>Ingredients</Text>
              <View style={styles.columns}>
                {columns.map((groups, index) => (
                  <IngredientColumn
                    key={index === 0 ? "first-column" : "second-column"}
                    groups={groups}
                  />
                ))}
              </View>
              <PhotoRow filenames={content.ingredientPhotos} photos={photos} />
            </View>
          )}

          {content.stepGroups.length > 0 && (
            <Text
              style={[styles.heading, styles.methodHeading]}
              minPresenceAhead={40}
            >
              Method
            </Text>
          )}
          {content.stepGroups.map((group, index) => (
            <View key={group.name ?? `method-${index}`}>
              {group.name && (
                <Text
                  style={[styles.groupName, styles.laterGroup]}
                  minPresenceAhead={30}
                >
                  {group.name}
                </Text>
              )}
              {group.steps.map((step) => (
                <View key={step.id} style={styles.step} wrap={false}>
                  <Text style={styles.stepNumber}>{step.number}.</Text>
                  <View style={styles.stepBody}>
                    <Text>{step.text}</Text>
                    {step.facts.length > 0 && (
                      <Text style={styles.stepFacts}>
                        {step.facts.join(" · ")}
                      </Text>
                    )}
                    {step.notes && (
                      <Text style={styles.stepNotes}>{step.notes}</Text>
                    )}
                    <PhotoRow filenames={step.photos} photos={photos} />
                  </View>
                </View>
              ))}
            </View>
          ))}

          <PhotoRow filenames={content.otherPhotos} photos={photos} />
        </View>

        {source && (
          <Text style={styles.source} fixed>
            From {source}
          </Text>
        )}
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `${pageNumber} of ${totalPages}` : ""
          }
        />
      </Page>
    </Document>
  );
}
