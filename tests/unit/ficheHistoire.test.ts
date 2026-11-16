import { describe, expect, it } from "vitest";
import { consoliderFiche, signature, verifierFiche, correctionsFiche } from "@/lib/ficheHistoire";
import { HISTOIRES_MAITRESSES, remplir, type Personnalisation } from "@/lib/histoiresMaitresses";
import type { Story } from "@/lib/storySchema";

const poucet = {
  nom: "Poucet",
  visuel: "HUMAN BOY: a tiny cheerful fairy-tale boy the size of a toy figurine (about 25 cm tall), red knitted bonnet, brown wool jacket, grey patched trousers",
};
const pompon = { nom: "Pompon", visuel: "PLUSH TOY, never alive: a soft plush light grey rabbit with long pink ears" };

const livre = (pages: Partial<Story["pages"][number]>[], cast = [pompon, poucet]): Story =>
  ({
    titre: "Les cailloux tordus de Léo",
    pages: pages.map((p) => ({ texte: "Léo marche dans la forêt.", scene_illustration: "A soft storybook forest at night, warm glow.", ...p })),
    cast,
  }) as Story;

describe("consoliderFiche", () => {
  it("décrit dans la scène un personnage seulement nommé (page 8 : Poucet devenu lapin)", () => {
    const s = consoliderFiche(livre([{ scene_illustration: "Léo walks with Pompon beside tiny Poucet (knee-high) along glowing pebbles." }]));
    const scene = s.pages[0]!.scene_illustration;
    expect(scene).toContain("Poucet = HUMAN BOY");
    expect(scene).toContain("red knitted bonnet");
    expect(scene).toContain("Pompon = PLUSH TOY");
    expect(s.pages[0]!.presents).toEqual(expect.arrayContaining(["Poucet", "Pompon"]));
  });

  it("ne répète pas une description déjà présente", () => {
    const sig = signature(poucet.visuel);
    const s = consoliderFiche(livre([{ scene_illustration: `In the forest, Poucet, ${sig}, points the way.` }]));
    expect(s.pages[0]!.scene_illustration.match(/HUMAN BOY/g)?.length).toBe(1);
  });

  it("retire de la distribution un personnage qui n'apparaît jamais (une fiche de moins à dessiner)", () => {
    const s = consoliderFiche(livre([{ scene_illustration: "Léo hugs Pompon in bed, lamp-lit bedroom." }], [pompon, poucet, { nom: "Zéphyr", visuel: "DRAGON: a small green dragon" }]));
    expect(s.cast?.map((c) => c.nom)).toEqual(["Pompon"]);
  });

  it("retire des présents un nom qui n'est pas dans la distribution", () => {
    const s = consoliderFiche(livre([{ scene_illustration: "Léo hugs Pompon.", presents: ["Pompon", "Inconnu"] }]));
    expect(s.pages[0]!.presents).toEqual(["Pompon"]);
  });
});

describe("verifierFiche", () => {
  it("signale un texte trop long, un marqueur oublié et une fiche sans espèce", () => {
    const pb = verifierFiche(
      livre([{ texte: `Léo ${"marche longtemps dans la forêt sombre. ".repeat(14)}` }, { texte: "Léo dit bonjour à {doudou}." }], [{ nom: "Bulle", visuel: "a small blue fish" }]),
      { age: 5, prenom: "Léo" },
    );
    const txt = correctionsFiche(pb).join(" | ");
    expect(txt).toContain("p. 1 : Texte trop long");
    expect(txt).toContain("p. 2 : Le texte contient un marqueur");
    expect(txt).toContain("Bulle doit commencer par son espèce");
  });

  it("une fiche propre ne donne aucune erreur grave", () => {
    const pb = verifierFiche(livre([{ scene_illustration: "Léo hugs Pompon in a cosy bedroom, warm lamp light." }]), { age: 5, prenom: "Léo" });
    expect(pb.filter((p) => p.grave)).toEqual([]);
  });
});

describe("histoires toutes prêtes", () => {
  const perso: Personnalisation = {
    prenom: "Léo",
    fille: false,
    doudou: "Pompon",
    sonDoudou: "son lapin",
    doudouVisuel: "a soft plush light grey rabbit with long pink ears",
    parent: "Papa",
    passages: {},
  };
  for (const h of HISTOIRES_MAITRESSES) {
    it(`« ${h.id} » passe le vérificateur sans erreur grave`, () => {
      const story = consoliderFiche({
        titre: remplir(h.titre, perso, h),
        pages: h.pages.map((p) => ({
          texte: remplir(p.texte, perso, h),
          scene_illustration: remplir(p.scene, perso, h),
          presents: p.presents?.map((x) => remplir(x, perso, h)),
        })),
        cast: [{ nom: "Pompon", visuel: `PLUSH TOY, never alive: ${perso.doudouVisuel}` }, ...h.cast],
      } as Story);
      const graves = verifierFiche(story, { age: h.ageMin, prenom: "Léo" }).filter((p) => p.grave);
      expect(graves.map((p) => `${p.page ?? "-"} ${p.message}`)).toEqual([]);
    });
  }
});
