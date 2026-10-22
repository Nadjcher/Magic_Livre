/**
 * Génération du PDF imprimable d'un livre, côté serveur.
 *
 * Format A4 paysage, une page PDF par page d'histoire (plus une page de titre),
 * police lisible pour enfants. Aucun filigrane : ce PDF n'est produit qu'après
 * paiement validé.
 */

import "server-only";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Story } from "./storySchema";
import { STYLE_CONFIG } from "./style_config";

// Styles du PDF. On utilise les couleurs centralisées de style_config.
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: STYLE_CONFIG.couleurs.fond,
    padding: 48,
    justifyContent: "center",
  },
  coverTitle: {
    fontSize: 36,
    textAlign: "center",
    color: STYLE_CONFIG.couleurs.primaire,
    marginBottom: 24,
  },
  coverSubtitle: {
    fontSize: 16,
    textAlign: "center",
    color: STYLE_CONFIG.couleurs.texteClair,
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 48,
    fontSize: 12,
    color: STYLE_CONFIG.couleurs.texteClair,
  },
  storyText: {
    fontSize: 22,
    lineHeight: 1.6,
    color: STYLE_CONFIG.couleurs.texte,
    textAlign: "center",
    marginHorizontal: 40,
  },
  sceneHint: {
    marginTop: 28,
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    color: STYLE_CONFIG.couleurs.texteClair,
  },
  illustration: {
    width: "100%",
    height: 340,
    objectFit: "cover",
    borderRadius: 10,
    marginBottom: 20,
  },
  coverImage: {
    width: 420,
    height: 260,
    objectFit: "cover",
    borderRadius: 12,
    marginBottom: 28,
    alignSelf: "center",
  },
});

/**
 * Construit le document PDF (élément React) à partir d'une histoire.
 * Séparé du rendu binaire pour faciliter les tests unitaires.
 */
export function buildStoryDocument(story: Story): JSX.Element {
  return (
    <Document title={story.titre} author="Mon Livre Magique">
      {/* Page de couverture */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {story.couvertureUrl ? <Image src={story.couvertureUrl} style={styles.coverImage} /> : null}
        <Text style={styles.coverTitle}>{story.titre}</Text>
        <Text style={styles.coverSubtitle}>Un livre créé avec Mon Livre Magique</Text>
      </Page>

      {/* Une page PDF par page d'histoire */}
      {story.pages.map((p, index) => (
        <Page
          key={index}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
          <View>
            {p.imageUrl ? <Image src={p.imageUrl} style={styles.illustration} /> : null}
            <Text style={styles.storyText}>{p.texte}</Text>
            {!p.imageUrl ? (
              <Text style={styles.sceneHint}>✦ {p.scene_illustration}</Text>
            ) : null}
          </View>
          <Text style={styles.pageNumber}>{index + 1}</Text>
        </Page>
      ))}
    </Document>
  );
}

/**
 * Rend l'histoire en un buffer PDF prêt à être envoyé au client.
 */
export async function renderStoryPdf(story: Story): Promise<Buffer> {
  return renderToBuffer(buildStoryDocument(story));
}

// ---------------------------------------------------------------------------
// Cahier de coloriage : version en noir et blanc à imprimer et colorier.
// ---------------------------------------------------------------------------
const coloring = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 36,
    justifyContent: "center",
  },
  cover: { fontSize: 32, textAlign: "center", color: "#1f2937", marginBottom: 10 },
  coverSub: { fontSize: 13, textAlign: "center", color: "#6b7280" },
  image: {
    width: "100%",
    height: 420,
    objectFit: "contain",
    marginBottom: 14,
  },
  legend: { fontSize: 13, textAlign: "center", color: "#374151" },
  num: { position: "absolute", bottom: 20, right: 40, fontSize: 11, color: "#9ca3af" },
});

/**
 * Construit le PDF « cahier de coloriage ». `coloringUrls[i]` est le dessin au
 * trait de la page i (ou null si indisponible).
 */
export function buildColoringDocument(
  story: Story,
  coloringUrls: (string | null)[],
): JSX.Element {
  return (
    <Document title={`${story.titre} — à colorier`} author="Mon Livre Magique">
      <Page size="A4" orientation="landscape" style={coloring.page}>
        <Text style={coloring.cover}>{story.titre}</Text>
        <Text style={coloring.coverSub}>Cahier de coloriage · à imprimer et colorier</Text>
      </Page>
      {story.pages.map((p, i) => (
        <Page key={i} size="A4" orientation="landscape" style={coloring.page}>
          {coloringUrls[i] ? <Image src={coloringUrls[i] as string} style={coloring.image} /> : null}
          <Text style={coloring.legend}>{p.texte}</Text>
          <Text style={coloring.num}>{i + 1}</Text>
        </Page>
      ))}
    </Document>
  );
}

export async function renderColoringPdf(
  story: Story,
  coloringUrls: (string | null)[],
): Promise<Buffer> {
  return renderToBuffer(buildColoringDocument(story, coloringUrls));
}

// ---------------------------------------------------------------------------
// Poster : une affiche du héros à imprimer (A4 portrait).
// ---------------------------------------------------------------------------
const poster = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: STYLE_CONFIG.couleurs.fond,
    padding: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 460,
    objectFit: "cover",
    borderRadius: 16,
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    textAlign: "center",
    color: STYLE_CONFIG.couleurs.primaire,
  },
  sub: { fontSize: 15, textAlign: "center", color: STYLE_CONFIG.couleurs.texteClair, marginTop: 12 },
});

/** Construit le PDF « poster » (affiche A4 portrait). */
export function buildPosterDocument(story: Story, childName: string): JSX.Element {
  const image = story.couvertureUrl ?? story.pages[0]?.imageUrl ?? null;
  return (
    <Document title={`${story.titre} — poster`} author="Mon Livre Magique">
      <Page size="A4" style={poster.page}>
        {image ? <Image src={image} style={poster.image} /> : null}
        <Text style={poster.title}>{story.titre}</Text>
        <Text style={poster.sub}>Les aventures de {childName}</Text>
      </Page>
    </Document>
  );
}

export async function renderPosterPdf(story: Story, childName: string): Promise<Buffer> {
  return renderToBuffer(buildPosterDocument(story, childName));
}
