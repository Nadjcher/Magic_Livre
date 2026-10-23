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

// ---------------------------------------------------------------------------
// Carte d'invitation : A4 portrait, à plier en deux, pour une fête à thème.
// ---------------------------------------------------------------------------
const invit = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: STYLE_CONFIG.couleurs.fond,
    padding: 44,
    alignItems: "center",
  },
  image: { width: 300, height: 220, objectFit: "cover", borderRadius: 16, marginTop: 10, marginBottom: 22 },
  kicker: { fontSize: 15, color: STYLE_CONFIG.couleurs.secondaire, marginBottom: 6 },
  title: { fontSize: 32, textAlign: "center", color: STYLE_CONFIG.couleurs.primaire, marginBottom: 6 },
  sub: { fontSize: 14, textAlign: "center", color: STYLE_CONFIG.couleurs.texteClair, marginBottom: 26 },
  ligne: { fontSize: 15, color: STYLE_CONFIG.couleurs.texte, marginBottom: 16, width: 360 },
  foot: { position: "absolute", bottom: 26, fontSize: 10, color: STYLE_CONFIG.couleurs.texteClair },
});

/** Carte d'invitation d'anniversaire sur le thème du livre. */
export function buildInvitationDocument(
  story: Story,
  childName: string,
  image: string | null,
): JSX.Element {
  return (
    <Document title={`Invitation — ${childName}`} author="Mon Livre Magique">
      <Page size="A4" style={invit.page}>
        <Text style={invit.kicker}>Tu es invité·e à une grande aventure</Text>
        {image ? <Image src={image} style={invit.image} /> : null}
        <Text style={invit.title}>La fête de {childName} !</Text>
        <Text style={invit.sub}>Une journée de super-héros, de contes et de magie.</Text>
        <Text style={invit.ligne}>Quand : ______________________________________</Text>
        <Text style={invit.ligne}>Heure : ______________________________________</Text>
        <Text style={invit.ligne}>Où : _________________________________________</Text>
        <Text style={invit.ligne}>Réponse avant le : ___________________________</Text>
        <Text style={invit.foot}>Créé avec Mon Livre Magique</Text>
      </Page>
    </Document>
  );
}

export async function renderInvitationPdf(
  story: Story,
  childName: string,
  image: string | null,
): Promise<Buffer> {
  return renderToBuffer(buildInvitationDocument(story, childName, image));
}

// ---------------------------------------------------------------------------
// Planche d'autocollants : les illustrations en vignettes à découper.
// ---------------------------------------------------------------------------
const stick = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#ffffff", padding: 30 },
  title: { fontSize: 24, textAlign: "center", color: STYLE_CONFIG.couleurs.primaire, marginBottom: 4 },
  sub: { fontSize: 11, textAlign: "center", color: STYLE_CONFIG.couleurs.texteClair, marginBottom: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  sticker: {
    width: 150,
    height: 150,
    objectFit: "cover",
    borderRadius: 20,
    margin: 9,
    borderWidth: 3,
    borderStyle: "solid",
    borderColor: STYLE_CONFIG.couleurs.secondaire,
  },
});

/** Planche d'autocollants à découper (vignettes des illustrations). */
export function buildStickersDocument(story: Story, images: string[]): JSX.Element {
  // On remplit la planche en répétant les illustrations disponibles.
  const base = images.length > 0 ? images : [];
  const cells: string[] = [];
  for (let i = 0; i < 12 && base.length > 0; i++) cells.push(base[i % base.length] as string);
  return (
    <Document title={`${story.titre} — autocollants`} author="Mon Livre Magique">
      <Page size="A4" style={stick.page}>
        <Text style={stick.title}>Mes autocollants</Text>
        <Text style={stick.sub}>{story.titre} · à découper le long des contours</Text>
        <View style={stick.grid}>
          {cells.map((src, i) => (
            <Image key={i} src={src} style={stick.sticker} />
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function renderStickersPdf(story: Story, images: string[]): Promise<Buffer> {
  return renderToBuffer(buildStickersDocument(story, images));
}

// ---------------------------------------------------------------------------
// Marque-pages : trois bandes à découper (A4 paysage).
// ---------------------------------------------------------------------------
const mark = StyleSheet.create({
  page: { flexDirection: "row", backgroundColor: "#ffffff", padding: 28, justifyContent: "space-around" },
  strip: {
    width: 165,
    height: 540,
    marginHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: STYLE_CONFIG.couleurs.texteClair,
    backgroundColor: STYLE_CONFIG.couleurs.fond,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  img: { width: 130, height: 180, objectFit: "cover", borderRadius: 12, marginBottom: 16 },
  t: { fontSize: 14, textAlign: "center", color: STYLE_CONFIG.couleurs.primaire, marginBottom: 8 },
  n: { fontSize: 11, textAlign: "center", color: STYLE_CONFIG.couleurs.texteClair },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: STYLE_CONFIG.couleurs.secondaire, marginTop: "auto" },
});

/** Trois marque-pages identiques à découper. */
export function buildBookmarkDocument(
  story: Story,
  childName: string,
  image: string | null,
): JSX.Element {
  return (
    <Document title={`${story.titre} — marque-pages`} author="Mon Livre Magique">
      <Page size="A4" orientation="landscape" style={mark.page}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={mark.strip}>
            {image ? <Image src={image} style={mark.img} /> : null}
            <Text style={mark.t}>{story.titre}</Text>
            <Text style={mark.n}>Les aventures de {childName}</Text>
            <View style={mark.dot} />
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function renderBookmarkPdf(
  story: Story,
  childName: string,
  image: string | null,
): Promise<Buffer> {
  return renderToBuffer(buildBookmarkDocument(story, childName, image));
}

// ---------------------------------------------------------------------------
// Produit deluxe : Affiche grand format A3 (le héros en très grand).
// ---------------------------------------------------------------------------
const a3 = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: STYLE_CONFIG.couleurs.fond,
    padding: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: 720, objectFit: "cover", borderRadius: 20, marginBottom: 40 },
  title: { fontSize: 48, textAlign: "center", color: STYLE_CONFIG.couleurs.primaire },
  sub: { fontSize: 20, textAlign: "center", color: STYLE_CONFIG.couleurs.texteClair, marginTop: 16 },
});

/** Affiche A3 grand format. */
export function buildPosterA3Document(story: Story, childName: string, image: string | null): JSX.Element {
  return (
    <Document title={`${story.titre} — affiche A3`} author="Mon Livre Magique">
      <Page size="A3" style={a3.page}>
        {image ? <Image src={image} style={a3.image} /> : null}
        <Text style={a3.title}>{story.titre}</Text>
        <Text style={a3.sub}>Les aventures de {childName}</Text>
      </Page>
    </Document>
  );
}

export async function renderPosterA3Pdf(story: Story, childName: string, image: string | null): Promise<Buffer> {
  return renderToBuffer(buildPosterA3Document(story, childName, image));
}

// ---------------------------------------------------------------------------
// Produit deluxe : Pack Fête d'anniversaire (invitation, banderole,
// étiquettes-cadeaux, cartes de remerciement) — plusieurs pages A4.
// ---------------------------------------------------------------------------
const fete = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: STYLE_CONFIG.couleurs.fond, padding: 40 },
  h1: { fontSize: 28, textAlign: "center", color: STYLE_CONFIG.couleurs.primaire, marginBottom: 4 },
  h2: { fontSize: 13, textAlign: "center", color: STYLE_CONFIG.couleurs.texteClair, marginBottom: 20 },
  invitImg: { width: 280, height: 200, objectFit: "cover", borderRadius: 16, marginBottom: 18, alignSelf: "center" },
  line: { fontSize: 14, color: STYLE_CONFIG.couleurs.texte, marginBottom: 14, alignSelf: "center", width: 360 },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  // Banderole : un fanion par lettre.
  fanion: {
    width: 86,
    height: 104,
    margin: 7,
    borderBottomLeftRadius: 43,
    borderBottomRightRadius: 43,
    backgroundColor: STYLE_CONFIG.couleurs.primaire,
    alignItems: "center",
    justifyContent: "center",
  },
  fanionTxt: { fontSize: 40, color: "#ffffff" },
  // Étiquettes-cadeaux.
  tag: {
    width: 150,
    height: 92,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: STYLE_CONFIG.couleurs.texteClair,
    backgroundColor: "#ffffff",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  tagImg: { width: 64, height: 64, objectFit: "cover", borderRadius: 10, marginRight: 10 },
  tagTxt: { fontSize: 11, color: STYLE_CONFIG.couleurs.texte },
  // Cartes de remerciement.
  merci: {
    width: 230,
    height: 150,
    margin: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#dbe2f6",
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  merciImg: { width: 70, height: 70, objectFit: "cover", borderRadius: 35, marginBottom: 8 },
  merciTxt: { fontSize: 12, textAlign: "center", color: STYLE_CONFIG.couleurs.texte },
});

/** Pack Fête : plusieurs planches A4 à imprimer et découper. */
export function buildPartyPackDocument(
  story: Story,
  childName: string,
  image: string | null,
): JSX.Element {
  const lettres = childName.toUpperCase().split("");
  return (
    <Document title={`Pack Fête — ${childName}`} author="Mon Livre Magique">
      {/* 1. Invitation */}
      <Page size="A4" style={fete.page}>
        <Text style={fete.h1}>La fête de {childName} !</Text>
        <Text style={fete.h2}>Tu es invité·e à une journée de contes et de magie</Text>
        {image ? <Image src={image} style={fete.invitImg} /> : null}
        <Text style={fete.line}>Quand : ______________________________________</Text>
        <Text style={fete.line}>Heure : ______________________________________</Text>
        <Text style={fete.line}>Où : _________________________________________</Text>
        <Text style={fete.line}>Réponse avant le : ___________________________</Text>
      </Page>

      {/* 2. Banderole au prénom */}
      <Page size="A4" orientation="landscape" style={fete.page}>
        <Text style={fete.h1}>Banderole à découper</Text>
        <Text style={fete.h2}>Découpe les fanions et relie-les avec une ficelle</Text>
        <View style={fete.row}>
          {lettres.map((l, i) => (
            <View key={i} style={fete.fanion}>
              <Text style={fete.fanionTxt}>{l}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* 3. Étiquettes-cadeaux */}
      <Page size="A4" style={fete.page}>
        <Text style={fete.h1}>Étiquettes-cadeaux</Text>
        <Text style={fete.h2}>À accrocher aux pochettes-surprises</Text>
        <View style={fete.row}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={fete.tag}>
              {image ? <Image src={image} style={fete.tagImg} /> : null}
              <Text style={fete.tagTxt}>Pour : ________{"\n"}{"\n"}De la part de {childName}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* 4. Cartes de remerciement */}
      <Page size="A4" style={fete.page}>
        <Text style={fete.h1}>Cartes de remerciement</Text>
        <Text style={fete.h2}>À offrir après la fête</Text>
        <View style={fete.row}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={fete.merci}>
              {image ? <Image src={image} style={fete.merciImg} /> : null}
              <Text style={fete.merciTxt}>Merci d'être venu·e à ma fête !{"\n"}— {childName}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function renderPartyPackPdf(
  story: Story,
  childName: string,
  image: string | null,
): Promise<Buffer> {
  return renderToBuffer(buildPartyPackDocument(story, childName, image));
}
