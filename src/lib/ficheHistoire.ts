/**
 * La fiche d'une histoire (texte des pages, scènes à dessiner, distribution),
 * contrôlée par le CODE avant toute image : gratuit, instantané, et appliqué à
 * toutes les histoires (histoires toutes prêtes comme idées libres).
 *
 * Deux temps :
 * - `consoliderFiche` corrige seul ce qui peut l'être sans IA : chaque scène
 *   rappelle l'apparence de chaque personnage présent (sinon le dessinateur
 *   l'invente : Poucet devenu lapin), la liste des présents suit la scène,
 *   un personnage qui n'apparaît jamais n'a pas de fiche dessinée (0,045 $
 *   économisés) ;
 * - `verifierFiche` liste ce qu'il faut faire corriger par l'IA (texte trop
 *   long pour la page, marqueur oublié, personnage protégé…) : seules les
 *   pages fautives sont réécrites.
 */

import type { Story } from "./storySchema";
import { findProtectedNames } from "./protectedCharacters";

export interface ProblemeFiche {
  /** Page concernée (1 = première page), absente si le problème touche tout le livre. */
  page?: number;
  /** true : à corriger avant les images ; false : simple signalement. */
  grave: boolean;
  message: string;
}

/** Nombre maximal de personnages secondaires dessinés (au-delà, les images se mélangent). */
export const CAST_MAX = 5;

/**
 * Caractères maximum d'une page de texte selon l'âge : au-delà, le texte ne
 * tient plus sur la page carrée à une taille lisible à voix haute.
 */
export function caracteresMax(age: number): number {
  if (age <= 3) return 200;
  if (age <= 6) return 420;
  return 650;
}

const echapper = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const nomDans = (nom: string, texte: string) => new RegExp(`(^|[^\\p{L}])${echapper(nom)}([^\\p{L}]|$)`, "iu").test(texte);

/**
 * Rappel court de l'apparence d'un personnage, tiré de sa fiche : l'espèce
 * (en majuscules en tête) et ses premiers traits, sans les longues parenthèses.
 */
export function signature(visuel: string): string {
  const sansParentheses = visuel.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").replace(/\s+([,;.])/g, "$1").trim();
  const mots = sansParentheses.split(" ");
  let court = "";
  for (const m of mots) {
    if ((court + " " + m).length > 150) break;
    court = court ? `${court} ${m}` : m;
  }
  return court.replace(/[,;:\s]+$/, "");
}

/** Corrections automatiques, sans IA. Ne retire jamais de texte : n'ajoute que des précisions aux scènes. */
export function consoliderFiche(story: Story): Story {
  const cast0 = story.cast ?? [];
  const texteTotal = [story.couvertureScene ?? "", ...story.pages.map((p) => `${p.texte} ${p.scene_illustration} ${(p.presents ?? []).join(" ")}`)].join(" ");
  // Un personnage qui n'apparaît nulle part n'a pas besoin de fiche dessinée.
  const utiles = cast0.filter((c) => nomDans(c.nom, texteTotal));
  // Au-delà de 4 : on garde les plus présents.
  const presence = (nom: string) => story.pages.filter((p) => nomDans(nom, p.scene_illustration) || p.presents?.some((x) => x.toLowerCase() === nom.toLowerCase())).length;
  const cast = utiles.length > CAST_MAX ? [...utiles].sort((a, b) => presence(b.nom) - presence(a.nom)).slice(0, CAST_MAX) : utiles;
  const noms = new Set(cast.map((c) => c.nom.toLowerCase()));

  const pages = story.pages.map((p) => {
    // Présents : ceux déclarés qui existent, plus ceux que la scène nomme.
    const declares = (p.presents ?? []).filter((x) => noms.has(x.toLowerCase()));
    const nommes = cast.filter((c) => nomDans(c.nom, p.scene_illustration)).map((c) => c.nom);
    const presents = [...new Set([...declares, ...nommes])];
    // Chaque personnage présent est décrit dans la scène elle-même.
    let scene = p.scene_illustration.trim();
    const rappels = presents
      .map((nom) => cast.find((c) => c.nom.toLowerCase() === nom.toLowerCase()))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .filter((c) => !scene.toLowerCase().includes(signature(c.visuel).toLowerCase().slice(0, 40)))
      .map((c) => `${c.nom} = ${signature(c.visuel)}`);
    if (rappels.length) scene = `${scene.replace(/[.\s]+$/, "")}. Characters in this picture, exactly as on their reference sheets: ${rappels.join("; ")}.`;
    return { ...p, presents: p.presents || presents.length ? presents : p.presents, scene_illustration: scene };
  });
  return { ...story, cast: story.cast ? cast : undefined, pages };
}

/** Personnages secondaires visibles au plus sur une image d'idée libre (le héros en plus). */
export const PRESENTS_MAX = 2;

const PELUCHE = /\b(plush|teddy|cuddly toy|stuffed)\b/i;

/**
 * Idée libre : chaque image est cadrée par le code, comme une planche validée.
 * Au plus deux personnages secondaires (ceux que la scène nomme d'abord), la
 * liste exacte de ce qui est visible, ni foule ni figurants, et une seule
 * peluche. Le dessinateur confond au-delà de trois personnages : on ne lui
 * laisse plus le choix. (Pas pour les histoires toutes prêtes : leurs scènes
 * sont déjà validées une à une.)
 */
export function cadrerScenes(story: Story): Story {
  const cast = story.cast ?? [];
  const peluches = cast.some((c) => PELUCHE.test(c.visuel));
  const pages = story.pages.map((p) => {
    const presents = p.presents ?? [];
    const nommes = presents.filter((n) => nomDans(n, p.scene_illustration));
    const gardes = [...new Set([...nommes, ...presents])].slice(0, PRESENTS_MAX);
    const visibles = ["the hero (once)", ...gardes].join(", ");
    const regle =
      `ONLY these characters are visible: ${visibles}. No other people, animals or creatures, no crowd, no background figures.` +
      (peluches ? " At most ONE plush toy in the picture." : "");
    const scene = `${p.scene_illustration.trim().replace(/[.\s]+$/, "")}. ${regle}`;
    return { ...p, presents: p.presents ? gardes : p.presents, scene_illustration: scene };
  });
  return { ...story, pages };
}

/** Ce que l'IA doit corriger avant les images (et les simples signalements). */
export function verifierFiche(story: Story, opts: { age: number; prenom: string }): ProblemeFiche[] {
  const problemes: ProblemeFiche[] = [];
  const max = caracteresMax(opts.age);
  const marqueur = /\{[a-z_]+\}|\[\[\w*\]\]/i;

  if (marqueur.test(story.titre)) problemes.push({ grave: true, message: "Le titre contient un marqueur non remplacé." });
  const protegesTitre = findProtectedNames(story.titre);
  if (protegesTitre.length) problemes.push({ grave: true, message: `Le titre cite un personnage protégé (${protegesTitre.join(", ")}).` });

  story.pages.forEach((p, i) => {
    const page = i + 1;
    const texte = p.texte.trim();
    if (texte.length > max) {
      problemes.push({ page, grave: true, message: `Texte trop long pour la page (${texte.length} caractères, ${max} au plus) : raccourcir sans perdre l'action.` });
    }
    if (marqueur.test(texte)) problemes.push({ page, grave: true, message: "Le texte contient un marqueur non remplacé." });
    // Le texte seulement : en anglais, la scène emploie des mots courants (« stitch » : un point de couture).
    const proteges = findProtectedNames(texte);
    if (proteges.length) problemes.push({ page, grave: true, message: `Personnage ou marque protégés (${proteges.join(", ")}) : les remplacer par une invention.` });
    if (p.scene_illustration.trim().length < 40) {
      problemes.push({ page, grave: true, message: "La scène à dessiner est vide ou trop vague : décrire le décor, les personnages présents et l'action." });
    }
    if ((p.presents?.length ?? 0) > PRESENTS_MAX) {
      problemes.push({ page, grave: false, message: `Trop de personnages sur l'image (${p.presents!.length}) : ${PRESENTS_MAX} au plus, le héros en plus.` });
    }
    // Un personnage du texte absent de l'image : le lecteur ne le verra pas (signalement).
    for (const c of story.cast ?? []) {
      const dansTexte = nomDans(c.nom, texte);
      const dansImage = nomDans(c.nom, p.scene_illustration) || p.presents?.some((x) => x.toLowerCase() === c.nom.toLowerCase());
      if (dansTexte && !dansImage) problemes.push({ page, grave: false, message: `${c.nom} est dans le texte mais pas sur l'image.` });
    }
  });

  if (!story.pages.some((p) => nomDans(opts.prenom, p.texte))) {
    problemes.push({ grave: true, message: `Le prénom ${opts.prenom} n'apparaît dans aucune page.` });
  }
  for (const c of story.cast ?? []) {
    // L'espèce en tête, en majuscules (« CRAB: … », « HUMAN BOY: … ») : sinon le dessinateur hésite.
    if (!/^[A-Z][A-Z' -]{2,}/.test(c.visuel.trim())) {
      problemes.push({ grave: true, message: `La fiche de ${c.nom} doit commencer par son espèce en majuscules (ex. « CRAB: … »).` });
    }
  }
  return problemes;
}

/** Les problèmes graves, formulés pour la réécriture ciblée. */
export function correctionsFiche(problemes: ProblemeFiche[]): string[] {
  return problemes.filter((p) => p.grave).map((p) => `${p.page ? `p. ${p.page} : ` : ""}${p.message}`);
}
