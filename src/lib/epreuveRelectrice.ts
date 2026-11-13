/**
 * Jeu d'épreuve de la relectrice d'images (livres de test du 13 novembre) :
 *  - dix images aux défauts connus, à refuser POUR LA BONNE RAISON (la
 *    correction doit nommer le défaut, sinon la page refaite ne le corrige pas) ;
 *  - dix bonnes images, à accepter (une relectrice trop sévère ferait refaire
 *    une image sur deux sans qu'on le sache).
 * À lancer seulement après une modification de la relectrice : environ 0,60 $.
 * Né d'un vrai incident : pendant des semaines, la relectrice laissait tout
 * passer sans relire, et personne ne le voyait.
 */

import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { verifier } from "./controleIllustrations";
import { grillePour } from "./bibleVisuelle";

const DOSSIER = path.join(process.cwd(), "src", "epreuve");

interface Cas {
  id: string;
  image: string;
  style: string;
  scene: string;
  heros: string;
  tenue: string;
  cast: { nom: string; image: string; description: string }[];
  defaut: string;
  attendu: "refusée" | "acceptée";
  /** Mots dont l'un au moins doit figurer dans la correction (motif du refus). */
  motif: string[];
}

export interface ResultatEpreuve {
  id: string;
  defaut: string;
  attendu: "refusée" | "acceptée";
  verdict: "refusée" | "acceptée" | "non vérifiée";
  correction: string;
  /** Verdict attendu ET, pour un refus, motif juste. */
  juste: boolean;
}

const lire = async (f: string) => ({ base64: (await readFile(path.join(DOSSIER, f))).toString("base64"), mime: "image/jpeg" });

export async function lancerEpreuve(): Promise<{ resultats: ResultatEpreuve[]; reussie: boolean }> {
  const cas = JSON.parse(await readFile(path.join(DOSSIER, "cas.json"), "utf8")) as Cas[];
  const resultats = await Promise.all(
    cas.map(async (c): Promise<ResultatEpreuve> => {
      const v = await verifier(
        { nom: "Léo", description: c.tenue, image: await lire(c.heros) },
        await Promise.all(c.cast.slice(0, 3).map(async (x) => ({ nom: x.nom, description: x.description, image: await lire(x.image) }))),
        await lire(c.image),
        c.scene,
        grillePour(c.style),
      );
      const verdict = v.nonVerifiee ? "non vérifiée" : v.ok ? "acceptée" : "refusée";
      const correction = v.fix.toLowerCase();
      const motifJuste = c.motif.length === 0 || c.motif.some((m) => correction.includes(m.toLowerCase()));
      return { id: c.id, defaut: c.defaut, attendu: c.attendu, verdict, correction: v.fix, juste: verdict === c.attendu && (c.attendu === "acceptée" || motifJuste) };
    }),
  );
  return { resultats, reussie: resultats.every((r) => r.juste) };
}
