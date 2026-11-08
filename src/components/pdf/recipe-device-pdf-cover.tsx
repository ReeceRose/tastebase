import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PDF_SWATCH_COLOURS } from "@/lib/pdf/recipe-pdf-colours";
import { PDF_FONT_FAMILY } from "@/lib/pdf/recipe-pdf-fonts";
import type {
  RecipePdfContent,
  RecipePdfPhotos,
  RecipePdfScreenLayout,
} from "@/lib/types/recipe-pdf-types";
import { isDarkSwatch } from "@/lib/utils/swatches";

export const COVER_DESCRIPTION_LIMIT = 260;

const RING_INSET = 10;

const styles = StyleSheet.create({
  cover: { fontFamily: PDF_FONT_FAMILY, position: "relative" },
  ring: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  photo: {
    position: "absolute",
    top: RING_INSET,
    left: RING_INSET,
    objectFit: "cover",
  },
  motifLarge: { position: "absolute" },
  motifSmall: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  text: { position: "absolute" },
  byline: { fontSize: 13, fontWeight: 700 },
  title: {
    marginTop: 10,
    fontWeight: 800,
    letterSpacing: -1,
    lineHeight: 0.98,
  },
  description: { marginTop: 12, fontSize: 14, lineHeight: 1.35 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  fact: { borderRadius: 14, paddingVertical: 8, paddingHorizontal: 13 },
  factLabel: { fontSize: 10.5, fontWeight: 700 },
  factValue: { fontSize: 17, fontWeight: 800 },
});

function baseTitleSize(title: string): number {
  if (title.length <= 22) return 54;
  if (title.length <= 44) return 44;
  if (title.length <= 70) return 36;
  if (title.length <= 120) return 30;
  return 24;
}

interface RecipeDevicePdfCoverProps {
  content: RecipePdfContent;
  photos: RecipePdfPhotos;
  layout: RecipePdfScreenLayout;
}

export function RecipeDevicePdfCover({
  content,
  photos,
  layout,
}: RecipeDevicePdfCoverProps) {
  const colours = PDF_SWATCH_COLOURS[content.swatch];
  const photo = content.mainPhoto ? photos.get(content.mainPhoto) : null;
  const { cover } = layout;
  const circle = {
    top: cover.ringTop,
    right: cover.ringRight,
    width: cover.ringSize,
    height: cover.ringSize,
    borderRadius: cover.ringSize / 2,
  };
  const photoSize = cover.ringSize - RING_INSET * 2;
  const factBackground = isDarkSwatch(content.swatch)
    ? "rgba(255,255,255,0.15)"
    : "rgba(0,0,0,0.1)";
  const showDescription =
    content.description &&
    content.description.length <= COVER_DESCRIPTION_LIMIT;

  return (
    <Page
      size={layout.page}
      style={[styles.cover, { backgroundColor: colours.bg, color: colours.fg }]}
    >
      {photo ? (
        <View style={[styles.ring, circle]}>
          <Image
            style={[
              styles.photo,
              {
                width: photoSize,
                height: photoSize,
                borderRadius: photoSize / 2,
              },
            ]}
            src={{ data: photo, format: "jpg" }}
          />
        </View>
      ) : (
        <>
          <View
            style={[
              styles.motifLarge,
              circle,
              { backgroundColor: colours.deep },
            ]}
          />
          <View
            style={[
              styles.motifSmall,
              { top: cover.motifTop, left: cover.motifLeft },
            ]}
          />
        </>
      )}
      <View
        style={[
          styles.text,
          {
            left: cover.textLeft,
            right: cover.textRight,
            bottom: cover.textBottom,
          },
        ]}
      >
        <Text style={styles.byline}>{content.author}'s recipe</Text>
        <Text
          style={[
            styles.title,
            {
              fontSize: Math.round(
                baseTitleSize(content.title) * cover.titleScale,
              ),
            },
          ]}
        >
          {content.title}
        </Text>
        {showDescription && (
          <Text style={styles.description}>{content.description}</Text>
        )}
        {content.facts.length > 0 && (
          <View style={styles.facts}>
            {content.facts.map((fact) => (
              <View
                key={fact.label}
                style={[styles.fact, { backgroundColor: factBackground }]}
              >
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue}>{fact.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Page>
  );
}
