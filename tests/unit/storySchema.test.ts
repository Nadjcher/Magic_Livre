import { describe, it, expect } from "vitest";
import { parseStory, storySchema } from "@/lib/storySchema";

function histoireValide(pages = 8) {
  return {
    titre: "Le voyage de Sami",
    pages: Array.from({ length: pages }, (_, i) => ({
      texte: `Page ${i + 1} : Sami avance.`,
      scene_illustration: "Sami marche sur un chemin fleuri.",
    })),
  };
}

describe("validation JSON de l'histoire", () => {
  it("valide une histoire bien formée", () => {
    const res = storySchema.safeParse(histoireValide(10));
    expect(res.success).toBe(true);
  });

  it("refuse moins de 8 pages", () => {
    expect(storySchema.safeParse(histoireValide(7)).success).toBe(false);
  });

  it("refuse plus de 12 pages", () => {
    expect(storySchema.safeParse(histoireValide(13)).success).toBe(false);
  });

  it("parse du JSON brut valide", () => {
    const raw = JSON.stringify(histoireValide(8));
    const res = parseStory(raw);
    expect(res.ok).toBe(true);
  });

  it("parse du JSON entouré de balises de code", () => {
    const raw = "```json\n" + JSON.stringify(histoireValide(9)) + "\n```";
    const res = parseStory(raw);
    expect(res.ok).toBe(true);
  });

  it("parse du JSON entouré de texte", () => {
    const raw = "Voici l'histoire :\n" + JSON.stringify(histoireValide(8)) + "\nMerci !";
    const res = parseStory(raw);
    expect(res.ok).toBe(true);
  });

  it("échoue proprement sur un JSON invalide", () => {
    const res = parseStory("ceci n'est pas du json");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toBeTruthy();
  });

  it("échoue proprement sur une structure incorrecte", () => {
    const res = parseStory(JSON.stringify({ titre: "x" }));
    expect(res.ok).toBe(false);
  });
});
