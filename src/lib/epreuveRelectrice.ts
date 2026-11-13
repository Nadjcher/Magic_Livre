/**
 * Jeu d'épreuve de la relectrice d'images : dix images aux défauts connus
 * (tirées des livres de test du 13 novembre). Après toute modification de la
 * relectrice, elle doit les refuser TOUTES. Coût : environ 0,30 $ par passage.
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
}

export interface ResultatEpreuve {
  id: string;
  defaut: string;
  verdict: "refusée" | "acceptée" | "non vérifiée";
  correction: string;
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
      return {
        id: c.id,
        defaut: c.defaut,
        verdict: v.nonVerifiee ? "non vérifiée" : v.ok ? "acceptée" : "refusée",
        correction: v.fix,
      };
    }),
  );
  return { resultats, reussie: resultats.every((r) => r.verdict === "refusée") };
}
