/**
 * Fichier d'impression du livre relié (Gelato, couverture rigide 28 × 21 cm à
 * l'italienne). Un seul PDF, dans l'ordre exigé par l'imprimeur :
 *
 *   1. couverture à plat : 4e de couverture + dos + 1re de couverture, avec les
 *      marges de rabat (618 × 256 mm) ;
 *   2. page de garde (blanche, non imprimée) ;
 *   3. 30 pages intérieures de 286 × 216 mm (28 × 21 cm + 3 mm de fond perdu) ;
 *   4. page de garde (blanche).
 *
 * Mise en page « album » : texte à gauche, illustration pleine page à droite.
 * Pages complémentaires (personnages, galerie, souvenir, dessin) pour arriver
 * aux 30 pages, puis « Fin ».
 */

import type { JSX } from "react";
import "server-only";
import path from "node:path";
import { Document, Page, Text, View, Image, renderToBuffer } from "@react-pdf/renderer";
import type { Story } from "./storySchema";
import {
  DOSSIER_POLICES,
  ENCRE,
  Etoile,
  NUIT,
  Ornement,
  PAPIER,
  pdfText,
  polices,
  tailleTexte,
  texteLivre,
} from "./pdf";

const MM = 72 / 25.4;
export const PAGES_INTERIEURES = 30;

// Couverture à plat (cf. dimensions Gelato du produit) : rabat 20 mm, carton
// 278 mm, charnière 8 mm, dos 6 mm.
const COUV_L = 618 * MM;
const COUV_H = 256 * MM;
const RABAT = 20 * MM;
const DOS_X = 306 * MM; // début du dos
const DOS_L = 6 * MM;
const FACE_X = DOS_X + DOS_L; // début de la 1re de couverture (avec charnière)

// Page intérieure avec fond perdu.
const PAGE_L = 286 * MM;
const PAGE_H = 216 * MM;
const MARGE = 20 * MM; // zone de sécurité (3 mm de coupe + 17 mm)

export interface ImagesImpression {
  couverture: string | null;
  pages: (string | null)[];
  /** Fiches dessinées des personnages (héros d'abord). */
  personnages: { nom: string; image: string }[];
}

function PageVide() {
  return <Page size={[PAGE_L, PAGE_H]} style={{ backgroundColor: "#FFFFFF" }} />;
}

export function buildPrintDocument(story: Story, prenom: string, images: ImagesImpression): JSX.Element {
  const f = polices();
  const sur = (t: string) => (f.texte === "Nunito" ? texteLivre(t) : pdfText(t));
  const titre = sur(story.titre);
  const nom = pdfText(prenom);
  const plein = { position: "absolute" as const, top: 0, left: 0, width: PAGE_L, height: PAGE_H - 1, objectFit: "cover" as const };
  const numero = (k: number, gauche: boolean) => (
    <Text
      style={{
        position: "absolute",
        bottom: 9 * MM,
        [gauche ? "left" : "right"]: 14 * MM,
        fontFamily: f.texte,
        fontSize: 9,
        color: "#8A90B4",
      }}
    >
      {k}
    </Text>
  );

  // --- Pages intérieures -----------------------------------------------------
  const interieures: JSX.Element[] = [];

  // p1 (droite) : « Ce livre appartient à »
  interieures.push(
    <Page key="dedicace" size={[PAGE_L, PAGE_H]} style={{ backgroundColor: PAPIER, alignItems: "center", justifyContent: "center", padding: MARGE }}>
      <View style={{ flexDirection: "row", marginBottom: 18 }}>
        <Etoile taille={12} />
        <View style={{ marginHorizontal: 10 }}><Etoile taille={18} couleur="#7D8CFF" /></View>
        <Etoile taille={12} />
      </View>
      <Text style={{ fontFamily: f.italique, fontSize: 24, color: ENCRE }}>Ce livre appartient à</Text>
      <Text style={{ fontFamily: f.titre, fontSize: 64, color: NUIT, marginTop: 12 }}>{nom}</Text>
      <Ornement />
      <Text style={{ fontFamily: f.texte, fontSize: 15, color: "#5B6598" }}>
        Une histoire inventée rien que pour toi.
      </Text>
    </Page>,
  );
  // p2 (gauche) : la couverture en grand, sans texte
  interieures.push(
    <Page key="frontispice" size={[PAGE_L, PAGE_H]} style={{ backgroundColor: NUIT }}>
      {images.couverture ? <Image src={images.couverture} style={plein} /> : null}
    </Page>,
  );
  // p3 (droite) : page de titre
  interieures.push(
    <Page key="titre" size={[PAGE_L, PAGE_H]} style={{ backgroundColor: PAPIER, alignItems: "center", justifyContent: "center", padding: MARGE * 1.5 }}>
      <Text style={{ fontFamily: f.italique, fontSize: 20, color: "#D4698C" }}>Il était une fois…</Text>
      <Text style={{ fontFamily: f.titre, fontSize: titre.length > 45 ? 34 : 42, color: NUIT, textAlign: "center", marginTop: 14, lineHeight: 1.15 }}>
        {titre}
      </Text>
      <Ornement />
      <Text style={{ fontFamily: f.italique, fontSize: 16, color: ENCRE }}>Une histoire écrite pour {nom}</Text>
    </Page>,
  );

  // Histoire : texte à gauche (pages paires), illustration à droite (impaires).
  story.pages.forEach((p, i) => {
    const kTexte = 4 + 2 * i;
    const texte = sur(p.texte);
    interieures.push(
      <Page key={`t${i}`} size={[PAGE_L, PAGE_H]} style={{ backgroundColor: PAPIER, paddingHorizontal: MARGE * 1.6, paddingVertical: MARGE, justifyContent: "center" }}>
        <Ornement />
        <Text style={{ fontFamily: f.texte, fontWeight: 500, fontSize: Math.min(tailleTexte(texte) + 8, 34), lineHeight: 1.5, color: ENCRE, textAlign: "center" }}>
          {texte}
        </Text>
        {numero(kTexte, true)}
      </Page>,
    );
    interieures.push(
      <Page key={`i${i}`} size={[PAGE_L, PAGE_H]} style={{ backgroundColor: NUIT }}>
        {images.pages[i] ? (
          <Image src={images.pages[i] as string} style={plein} />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: MARGE }}>
            <Text style={{ fontFamily: f.italique, fontSize: 14, color: "#C9D2F5", textAlign: "center" }}>✦ {pdfText(p.scene_illustration)}</Text>
          </View>
        )}
        {numero(kTexte + 1, false)}
      </Page>,
    );
  });

  // Pages complémentaires jusqu'à la 29e, la 30e (gauche) étant « Fin ».
  const complements: JSX.Element[] = [];
  if (images.personnages.length > 0) {
    complements.push(
      <Page key="perso" size={[PAGE_L, PAGE_H]} style={{ backgroundColor: PAPIER, padding: MARGE, alignItems: "center" }}>
        <Text style={{ fontFamily: f.titre, fontSize: 30, color: NUIT, marginTop: 8 }}>Les personnages de l'histoire</Text>
        <Ornement />
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
          {images.personnages.slice(0, 4).map((c) => (
            <View key={c.nom} style={{ width: 52 * MM, marginHorizontal: 5 * MM, alignItems: "center" }}>
              <Image src={c.image} style={{ width: 52 * MM, height: 52 * MM, objectFit: "cover", borderRadius: 14 }} />
              <Text style={{ fontFamily: f.titre, fontSize: 15, color: ENCRE, marginTop: 8, textAlign: "center" }}>{pdfText(c.nom)}</Text>
            </View>
          ))}
        </View>
      </Page>,
    );
  }
  const galerie = images.pages.filter((x): x is string => Boolean(x));
  for (let k = 0; k + 1 < galerie.length; k += 2) {
    complements.push(
      <Page key={`g${k}`} size={[PAGE_L, PAGE_H]} style={{ backgroundColor: PAPIER, padding: MARGE, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontFamily: f.italique, fontSize: 16, color: "#D4698C", marginBottom: 10 }}>Souvenirs d'aventure</Text>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          {[galerie[k], galerie[k + 1]].map((src, j) => (
            <Image key={j} src={src as string} style={{ width: 112 * MM, height: 70 * MM, objectFit: "cover", borderRadius: 12, marginHorizontal: 4 * MM }} />
          ))}
        </View>
      </Page>,
    );
  }
  const activites: [string, string][] = [
    ["Dessine ton moment préféré de l'histoire", ""],
    [`Et si l'aventure continuait ? Dessine la suite, ${nom} !`, ""],
    ["Ce livre a été lu pour la première fois le", "........ / ........ / ............   par ........................................"],
    ["Dessine-toi avec tes amis de l'histoire", ""],
  ];
  activites.forEach(([t, ligne], k) =>
    complements.push(
      <Page key={`a${k}`} size={[PAGE_L, PAGE_H]} style={{ backgroundColor: PAPIER, padding: MARGE }}>
        <Text style={{ fontFamily: f.titre, fontSize: 24, color: NUIT, textAlign: "center", marginTop: 6 }}>{t}</Text>
        {ligne ? (
          <Text style={{ fontFamily: f.texte, fontSize: 16, color: ENCRE, textAlign: "center", marginTop: 40 }}>{ligne}</Text>
        ) : (
          <View style={{ flex: 1, marginTop: 14, borderWidth: 2, borderColor: "#D9D2E9", borderStyle: "dashed", borderRadius: 18 }} />
        )}
      </Page>,
    ),
  );

  const restantes = PAGES_INTERIEURES - 1 - interieures.length;
  for (let k = 0; k < restantes; k++) {
    interieures.push(complements[k] ?? <PageVide key={`v${k}`} />);
  }

  // p30 (gauche) : Fin
  interieures.push(
    <Page key="fin" size={[PAGE_L, PAGE_H]} style={{ backgroundColor: PAPIER, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: f.titre, fontSize: 70, color: NUIT }}>Fin</Text>
      <Ornement />
      <Text style={{ fontFamily: f.italique, fontSize: 18, color: ENCRE }}>Et toi, {nom}, quelle sera ta prochaine aventure ?</Text>
    </Page>,
  );

  // --- Couverture à plat ------------------------------------------------------
  const face = { x: FACE_X, l: COUV_L - FACE_X };
  const couverture = (
    <Page key="couv" size={[COUV_L, COUV_H]} style={{ backgroundColor: NUIT }}>
      {/* 1re de couverture : l'illustration jusqu'au bord (rabat compris) */}
      {images.couverture ? (
        <Image src={images.couverture} style={{ position: "absolute", top: 0, left: face.x, width: face.l, height: COUV_H - 1, objectFit: "cover" }} />
      ) : null}
      <Image
        src={path.join(DOSSIER_POLICES, "voile.png")}
        style={{ position: "absolute", left: face.x, bottom: 0, width: face.l, height: COUV_H * 0.48 }}
      />
      <View style={{ position: "absolute", left: face.x + 22 * MM, width: 250 * MM, bottom: RABAT + 16 * MM, alignItems: "center" }}>
        <Text style={{ fontFamily: f.titre, fontSize: titre.length > 45 ? 30 : 38, color: "#FFFFFF", textAlign: "center", lineHeight: 1.15 }}>
          {titre}
        </Text>
        <Text style={{ fontFamily: f.italique, fontSize: 16, color: "#DCE3FF", marginTop: 10 }}>Une histoire écrite pour {nom}</Text>
      </View>
      {/* 4e de couverture : résumé (haut de page ; le bas est réservé au code-barres) */}
      <View style={{ position: "absolute", left: RABAT + 30 * MM, width: 218 * MM, top: RABAT + 30 * MM, alignItems: "center" }}>
        <View style={{ flexDirection: "row", marginBottom: 14 }}>
          <Etoile taille={10} couleur="#FFFFFF" />
          <View style={{ marginHorizontal: 8 }}><Etoile taille={14} couleur="#FF9FD6" /></View>
          <Etoile taille={10} couleur="#FFFFFF" />
        </View>
        <Text style={{ fontFamily: f.titre, fontSize: 20, color: "#FFFFFF", textAlign: "center" }}>{titre}</Text>
        <Text style={{ fontFamily: f.texte, fontSize: 12, color: "#C9D2F5", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
          {sur(story.pages[0]?.texte ?? "")}
        </Text>
        <Text style={{ fontFamily: f.texte, fontSize: 10, color: "#9FAEE0", marginTop: 24 }}>Une histoire unique, créée pour {nom} · encoreunehistoire.fr</Text>
      </View>
    </Page>
  );

  return (
    <Document title={titre} author="Encore une histoire">
      {couverture}
      <PageVide />
      {interieures}
      <PageVide />
    </Document>
  );
}

export async function renderPrintPdf(story: Story, prenom: string, images: ImagesImpression): Promise<Buffer> {
  return renderToBuffer(buildPrintDocument(story, prenom, images));
}

/** Nombre total de pages du fichier : couverture + garde + 30 + garde. */
export const PAGES_FICHIER = PAGES_INTERIEURES + 3;
export const pagesHistoireMax = Math.floor((PAGES_INTERIEURES - 4) / 2);
