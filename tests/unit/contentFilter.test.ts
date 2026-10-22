import { describe, it, expect } from "vitest";
import { filterContent, filterStory } from "@/lib/contentFilter";

describe("filtre de contenu", () => {
  it("accepte une histoire douce", () => {
    const res = filterContent("Sami se promène et rencontre un gentil lapin.");
    expect(res.ok).toBe(true);
    expect(res.categories).toHaveLength(0);
  });

  it("refuse la violence", () => {
    const res = filterContent("Le méchant veut tuer le dragon avec un pistolet.");
    expect(res.ok).toBe(false);
    expect(res.categories).toContain("violence");
    expect(res.message).toMatch(/violence/);
  });

  it("refuse le contenu sexuel", () => {
    const res = filterContent("Une scène de sexe explicite.");
    expect(res.ok).toBe(false);
    expect(res.categories).toContain("sexuel");
  });

  it("refuse l'incitation dangereuse", () => {
    const res = filterContent("Il apprend à jouer avec des allumettes.");
    expect(res.ok).toBe(false);
    expect(res.categories).toContain("incitation_dangereuse");
  });

  it("ne produit pas de faux positif sur des mots innocents", () => {
    // « nu » ne doit pas matcher « nuage » ni « nuit ».
    expect(filterContent("Un joli nuage dans la nuit étoilée.").ok).toBe(true);
    // « sang » comme mot entier est refusé, mais pas « sanglier » tout seul.
    expect(filterContent("Un petit sanglier joue dans la forêt.").ok).toBe(true);
  });

  it("filtre une histoire complète (titre + pages)", () => {
    const res = filterStory({
      titre: "Une journée tranquille",
      pages: [
        { texte: "Il y a un cadavre dans le jardin.", scene_illustration: "jardin" },
      ],
    });
    expect(res.ok).toBe(false);
    expect(res.categories).toContain("violence");
  });
});
