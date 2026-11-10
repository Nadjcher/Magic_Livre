/**
 * Génération du PDF imprimable d'un livre, côté serveur.
 *
 * Format A4 paysage, mise en page d'album : couverture pleine page, dédicace,
 * une page par page d'histoire (mises en page variées), « Fin », 4e de couverture. Aucun filigrane : ce PDF n'est produit qu'après
 * paiement validé.
 */

import type { JSX } from "react";
import { separerChapitre } from "./chapitre";
import "server-only";
import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Svg,
  Path,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Story } from "./storySchema";
import { STYLE_CONFIG } from "./style_config";

/**
 * La police intégrée des PDF ne connaît pas les espaces insécables (fines ou
 * normales) que la typographie française place avant « : ! ? ; » et dans les
 * guillemets : elles s'affichaient « / ». On les remplace par des espaces.
 */
export function pdfText(t: string): string {
  return t.replace(/[\u00A0\u202F\u2007\u2009]/g, " ");
}

/**
 * Pour le livre (polices Fraunces/Nunito, qui connaissent l'espace insécable) :
 * on garde « : ! ? ; » et les guillemets collés au mot, sans « : » orphelin en
 * début de ligne.
 */
export function texteLivre(t: string): string {
  return t
    .replace(/[\u202F\u2007\u2009]/g, "\u00A0")
    .replace(/ ([:;!?»])/g, "\u00A0$1")
    .replace(/« /g, "«\u00A0");
}

/** Version de l'histoire sûre pour le rendu PDF (texte et titre nettoyés). */
function pdfSafe(story: Story): Story {
  return {
    ...story,
    titre: pdfText(story.titre),
    pages: story.pages.map((p) => ({ ...p, texte: pdfText(p.texte) })),
  };
}

// ---------------------------------------------------------------------------
// Le livre : mise en page « album » (couverture pleine page, dédicace, pages
// variées, page « Fin », 4e de couverture), polices Fraunces + Nunito.
// ---------------------------------------------------------------------------

export const DOSSIER_POLICES = path.join(process.cwd(), "src", "pdf-assets");
let policesEnregistrees = false;
/** Enregistre les polices du livre (une seule fois). Repli : Helvetica. */
export function polices(): { titre: string; texte: string; italique: string } {
  if (!policesEnregistrees) {
    try {
      Font.register({ family: "Fraunces", src: path.join(DOSSIER_POLICES, "Fraunces-SemiBold.ttf"), fontWeight: 600 });
      Font.register({ family: "FrauncesItalic", src: path.join(DOSSIER_POLICES, "Fraunces-Italic.ttf") });
      Font.register({
        family: "Nunito",
        fonts: [
          { src: path.join(DOSSIER_POLICES, "Nunito-Medium.ttf"), fontWeight: 500 },
          { src: path.join(DOSSIER_POLICES, "Nunito-Bold.ttf"), fontWeight: 700 },
        ],
      });
      Font.registerHyphenationCallback((mot) => [mot]); // pas de coupure de mots
      policesEnregistrees = true;
    } catch {
      return { titre: "Helvetica-Bold", texte: "Helvetica", italique: "Helvetica-Oblique" };
    }
  }
  return { titre: "Fraunces", texte: "Nunito", italique: "FrauncesItalic" };
}

export const NUIT = "#1B2868";
export const PAPIER = "#FBF8F3";
export const ENCRE = "#2A2F4F";
export const ROSE = "#D4698C";

/** Taille du texte selon sa longueur (imagier très gros, mini-roman plus petit). */
export function tailleTexte(t: string): number {
  const n = t.length;
  if (n < 90) return 24;
  if (n < 180) return 20;
  if (n < 320) return 17;
  if (n < 520) return 14.5;
  return 12.5;
}

/** Petite étoile dessinée (ornement). */
export function Etoile({ taille = 14, couleur = ROSE }: { taille?: number; couleur?: string }) {
  return (
    <Svg width={taille} height={taille} viewBox="0 0 24 24">
      <Path d="M12 2l2.6 6.9L22 10l-5.6 4.6L18 22l-6-3.8L6 22l1.6-7.4L2 10l7.4-1.1z" fill={couleur} />
    </Svg>
  );
}

export function Ornement({ couleur = ROSE }: { couleur?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 14 }}>
      <View style={{ width: 60, height: 1, backgroundColor: couleur, opacity: 0.6 }} />
      <View style={{ marginHorizontal: 10 }}>
        <Etoile taille={12} couleur={couleur} />
      </View>
      <View style={{ width: 60, height: 1, backgroundColor: couleur, opacity: 0.6 }} />
    </View>
  );
}

/** Voile dégradé (bas de l'image) pour rendre le titre lisible : image PNG transparente. */
function Voile({ hauteur, enHaut = false }: { hauteur: number; enHaut?: boolean }) {
  return (
    <Image
      src={path.join(DOSSIER_POLICES, "voile.png")}
      style={{ position: "absolute", left: 0, width: 842, height: hauteur, ...(enHaut ? { top: 0, transform: "rotate(180deg)" } : { bottom: 0 }) }}
    />
  );
}

/** Prénom du héros imprimé en grand en haut de la couverture. */
export function PrenomCouverture({ prenom, police, largeur, gauche = 0, haut = 34 }: { prenom: string; police: string; largeur: number; gauche?: number; haut?: number }) {
  if (!prenom) return null;
  const taille = Math.min(64, (largeur * 0.8) / Math.max(prenom.length, 4) / 0.62);
  return (
    <Text style={{ position: "absolute", top: haut, left: gauche, width: largeur, textAlign: "center", fontFamily: police, fontSize: taille, letterSpacing: 2, color: "#FFFFFF" }}>
      {prenom.toUpperCase()}
    </Text>
  );
}

const plein = { position: "absolute" as const, top: 0, left: 0, width: 842, height: 595, objectFit: "cover" as const };

/**
 * Construit le document PDF (élément React) à partir d'une histoire.
 * Séparé du rendu binaire pour faciliter les tests unitaires.
 */
export function buildStoryDocument(story: Story, childName?: string): JSX.Element {
  const f = polices();
  story =
    f.texte === "Nunito"
      ? { ...story, titre: texteLivre(story.titre), pages: story.pages.map((p) => ({ ...p, texte: texteLivre(p.texte) })) }
      : pdfSafe(story);
  const prenom = childName ? pdfText(childName) : "";
  const date = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <Document title={story.titre} author="Encore une histoire">
      {/* Couverture pleine page */}
      <Page size="A4" orientation="landscape" style={{ backgroundColor: NUIT }}>
        {story.couvertureUrl ? <Image src={story.couvertureUrl} style={plein} /> : null}
        <Voile hauteur={300} />
        <View style={{ position: "absolute", left: 60, right: 60, bottom: 46, alignItems: "center" }}>
          <Text style={{ fontFamily: f.titre, fontSize: story.titre.length > 45 ? 32 : 40, color: "#FFFFFF", textAlign: "center", lineHeight: 1.15 }}>
            {story.titre}
          </Text>
          {prenom ? (
            <Text style={{ fontFamily: f.italique, fontSize: 16, color: "#DCE3FF", marginTop: 12 }}>
              Une histoire écrite pour {prenom}
            </Text>
          ) : null}
        </View>
        <Text style={{ position: "absolute", bottom: 18, right: 28, fontFamily: f.texte, fontSize: 9, color: "#FFFFFF", opacity: 0.8 }}>
          ENCORE UNE HISTOIRE
        </Text>
      </Page>

      {/* Dédicace */}
      <Page size="A4" orientation="landscape" style={{ backgroundColor: PAPIER, alignItems: "center", justifyContent: "center", padding: 80 }}>
        <View style={{ flexDirection: "row", marginBottom: 18 }}>
          <Etoile taille={10} />
          <View style={{ marginHorizontal: 8 }}>
            <Etoile taille={16} couleur="#7D8CFF" />
          </View>
          <Etoile taille={10} />
        </View>
        <Text style={{ fontFamily: f.italique, fontSize: 22, color: ENCRE }}>Ce livre appartient à</Text>
        <Text style={{ fontFamily: f.titre, fontSize: 60, color: NUIT, marginTop: 10 }}>{prenom || "…………………"}</Text>
        <Ornement />
        <Text style={{ fontFamily: f.texte, fontSize: 16, color: "#5B6598", textAlign: "center", lineHeight: 1.6 }}>
          Une histoire inventée rien que pour toi, en {date}.
        </Text>
      </Page>

      {/* Pages de l'histoire, mises en page en alternance */}
      {story.pages.map((p, index) => {
        const taille = tailleTexte(p.texte);
        const pleinePage = Boolean(p.imageUrl) && index % 2 === 0 && p.texte.length < 300;
        const numero = (
          <Text style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontFamily: f.texte, fontSize: 9, color: "#8A90B4" }}>
            {index + 1}
          </Text>
        );

        if (pleinePage) {
          return (
            <Page key={index} size="A4" orientation="landscape" style={{ backgroundColor: NUIT }}>
              <Image src={p.imageUrl as string} style={plein} />
              <View
                style={{
                  position: "absolute",
                  left: 70,
                  right: 70,
                  bottom: 34,
                  backgroundColor: "#FFFFFF",
                  opacity: 0.94,
                  borderRadius: 18,
                  paddingVertical: 16,
                  paddingHorizontal: 28,
                }}
              >
                <Text style={{ fontFamily: f.texte, fontWeight: 500, fontSize: taille, lineHeight: 1.45, color: ENCRE, textAlign: "center" }}>
                  {p.texte}
                </Text>
              </View>
              <Text style={{ position: "absolute", top: 16, right: 22, fontFamily: f.texte, fontSize: 9, color: "#FFFFFF" }}>
                {index + 1}
              </Text>
            </Page>
          );
        }

        // Page « album » : l'illustration ENTIÈRE (jamais recadrée) dans un
        // cadre arrondi, le texte dessous sur fond papier.
        const long = p.texte.length > 300;
        const hImage = long ? 300 : 392;
        return (
          <Page key={index} size="A4" orientation="landscape" style={{ backgroundColor: PAPIER, paddingTop: 34, paddingHorizontal: 60, alignItems: "center" }}>
            {p.imageUrl ? (
              <Image
                src={p.imageUrl}
                style={{ height: hImage, width: Math.round((hImage * 16) / 9), objectFit: "cover", borderRadius: 16 }}
              />
            ) : null}
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 }}>
              {separerChapitre(p.texte).chapitre ? (
                <Text style={{ fontFamily: f.titre, fontSize: 14, color: "#5B6598", marginBottom: 8, textAlign: "center" }}>
                  {separerChapitre(p.texte).chapitre}
                </Text>
              ) : null}
              <Text
                style={{
                  fontFamily: f.texte,
                  fontWeight: 500,
                  fontSize: p.imageUrl ? Math.min(taille + 2, long ? 13 : 22) : taille + 3,
                  lineHeight: 1.5,
                  color: ENCRE,
                  textAlign: "center",
                }}
              >
                {separerChapitre(p.texte).corps}
              </Text>
              {!p.imageUrl ? (
                <Text style={{ marginTop: 20, fontFamily: f.italique, fontSize: 10, color: "#8A90B4", textAlign: "center" }}>
                  ✦ {p.scene_illustration}
                </Text>
              ) : null}
            </View>
            {numero}
          </Page>
        );
      })}

      {/* Fin */}
      <Page size="A4" orientation="landscape" style={{ backgroundColor: PAPIER, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: f.titre, fontSize: 64, color: NUIT }}>Fin</Text>
        <Ornement />
        <Text style={{ fontFamily: f.italique, fontSize: 17, color: ENCRE, textAlign: "center", maxWidth: 520, lineHeight: 1.5 }}>
          {prenom ? `Et toi, ${prenom}, quelle sera ta prochaine aventure ?` : "Et toi, quelle sera ta prochaine aventure ?"}
        </Text>
      </Page>

      {/* 4e de couverture */}
      <Page size="A4" orientation="landscape" style={{ backgroundColor: NUIT, alignItems: "center", justifyContent: "center", padding: 90 }}>
        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <Etoile taille={9} couleur="#FFFFFF" />
          <View style={{ marginHorizontal: 10 }}>
            <Etoile taille={14} couleur="#FF9FD6" />
          </View>
          <Etoile taille={9} couleur="#FFFFFF" />
        </View>
        <Text style={{ fontFamily: f.titre, fontSize: 24, color: "#FFFFFF", textAlign: "center" }}>{story.titre}</Text>
        <Text style={{ fontFamily: f.texte, fontSize: 13, color: "#C9D2F5", textAlign: "center", marginTop: 18, lineHeight: 1.6, maxWidth: 520 }}>
          {story.pages[0]?.texte ?? ""}
        </Text>
        <Text style={{ position: "absolute", bottom: 40, fontFamily: f.texte, fontSize: 10, color: "#9FAEE0" }}>
          {prenom ? `Une histoire unique, créée pour ${prenom} · ` : ""}encoreunehistoire.fr
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Rend l'histoire en un buffer PDF prêt à être envoyé au client.
 */
export async function renderStoryPdf(story: Story, childName?: string): Promise<Buffer> {
  return renderToBuffer(buildStoryDocument(story, childName));
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
  story = pdfSafe(story);
  return (
    <Document title={`${story.titre} — à colorier`} author="Encore une histoire">
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
  story = pdfSafe(story);
  const image = story.couvertureUrl ?? story.pages[0]?.imageUrl ?? null;
  return (
    <Document title={`${story.titre} — poster`} author="Encore une histoire">
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
  story = pdfSafe(story);
  return (
    <Document title={`Invitation — ${childName}`} author="Encore une histoire">
      <Page size="A4" style={invit.page}>
        <Text style={invit.kicker}>Tu es invité·e à une grande aventure</Text>
        {image ? <Image src={image} style={invit.image} /> : null}
        <Text style={invit.title}>La fête de {childName} !</Text>
        <Text style={invit.sub}>Une journée de super-héros, de contes et de magie.</Text>
        <Text style={invit.ligne}>Quand : ______________________________________</Text>
        <Text style={invit.ligne}>Heure : ______________________________________</Text>
        <Text style={invit.ligne}>Où : _________________________________________</Text>
        <Text style={invit.ligne}>Réponse avant le : ___________________________</Text>
        <Text style={invit.foot}>Créé avec Encore une histoire</Text>
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
  story = pdfSafe(story);
  // On remplit la planche en répétant les illustrations disponibles.
  const base = images.length > 0 ? images : [];
  const cells: string[] = [];
  for (let i = 0; i < 12 && base.length > 0; i++) cells.push(base[i % base.length] as string);
  return (
    <Document title={`${story.titre} — autocollants`} author="Encore une histoire">
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
  story = pdfSafe(story);
  return (
    <Document title={`${story.titre} — marque-pages`} author="Encore une histoire">
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
  story = pdfSafe(story);
  return (
    <Document title={`${story.titre} — affiche A3`} author="Encore une histoire">
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
  story = pdfSafe(story);
  const lettres = childName.toUpperCase().split("");
  return (
    <Document title={`Pack Fête — ${childName}`} author="Encore une histoire">
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
