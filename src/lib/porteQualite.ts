/**
 * LA porte de sortie d'un livre : aucun livre ne devient lisible, téléchargeable
 * ou imprimable sans l'avoir passée. Une seule règle, lue partout (fin de
 * fabrication, déblocage après achat, PDF, envoi à l'imprimeur) :
 *
 *   un livre sort seulement si toutes ses images attendues existent, ont été
 *   vérifiées, et qu'aucune n'est restée fautive.
 *
 * Un contrôle en panne ne vaut jamais « conforme » : une image non vérifiée
 * retient le livre, comme une image fautive. Le livre retenu attend dans
 * l'atelier (« Illustrations à relire ») ; le parent est prévenu.
 *
 * Fonction pure (aucun accès réseau ni base) : testée dans tests/unit/porteQualite.test.ts.
 */

import type { Story } from "./storySchema";

export interface VerdictPorte {
  ok: boolean;
  /** Pourquoi le livre est retenu (pour l'atelier et l'alerte). */
  raisons: string[];
  /** Les images concernées (-1 : la couverture). */
  pages: number[];
}

const nom = (i: number) => (i === -1 ? "couverture" : `page ${i + 1}`);

export function porteQualite(
  story: Story,
  o: {
    /** Pages illustrées d'un aperçu gratuit (en plus de la couverture). */
    pagesApercu: number;
    /** Le dessin est activé sur ce site (sinon aucun livre n'a d'image : rien à exiger). */
    imagesAttendues: boolean;
    /** La vérification des images est activée : son absence retient alors le livre. */
    controleAttendu: boolean;
  },
): VerdictPorte {
  const raisons: string[] = [];
  const pages = new Set<number>();
  if (!o.imagesAttendues) return { ok: true, raisons, pages: [] };

  // 1. Toutes les images attendues existent. (Épisode de série : une seule image, la couverture.)
  const attendues = story.serie ? [] : story.apercu ? story.pages.slice(0, o.pagesApercu) : story.pages;
  const manquantes = [...(story.couvertureUrl ? [] : [-1]), ...attendues.map((p, i) => (p.imageUrl ? null : i)).filter((i): i is number => i !== null)];
  if (manquantes.length) {
    raisons.push(`image manquante : ${manquantes.map(nom).join(", ")}`);
    manquantes.forEach((i) => pages.add(i));
  }

  // L'atelier a regardé ce livre et l'a laissé partir : seules les images manquantes le retiennent encore.
  if (story.valideAtelier) return { ok: raisons.length === 0, raisons, pages: [...pages].sort((a, b) => a - b) };

  // 2. Aucune image signalée par la vérification.
  const signalees = [...(story.imagesARevoir ?? []), ...(story.controleImages?.douteuses ?? [])];
  if (signalees.length) {
    raisons.push(`image restée fautive après tous les essais : ${[...new Set(signalees)].map(nom).join(", ")}`);
    signalees.forEach((i) => pages.add(i));
  }

  // La fiche de l'enfant, dont tout le livre découle, ressemble à sa photo.
  if (o.controleAttendu && story.ficheEcart) raisons.push(`la fiche de l'enfant ne ressemble pas assez à sa photo : ${story.ficheEcart}`);

  // 3. La vérification a réellement eu lieu, sur toutes les images.
  if (o.controleAttendu && !story.serie) {
    const c = story.controleImages;
    if (!c) raisons.push("les images n'ont pas été vérifiées (contrôle interrompu ou indisponible)");
    else if ((c.nonVerifiees ?? 0) > 0) raisons.push(`${c.nonVerifiees} image(s) non vérifiée(s) (contrôle indisponible)`);
  }

  return { ok: raisons.length === 0, raisons, pages: [...pages].sort((a, b) => a - b) };
}
