import { describe, it, expect } from "vitest";
import {
  buildIllustrationPrompt,
  ILLUSTRATION_STYLES,
} from "@/lib/style_config";
import { consigneStylePour } from "@/lib/bibleVisuelle";

describe("construction du prompt d'illustration", () => {
  it("inclut la fiche du style choisi (bible visuelle)", () => {
    const p = buildIllustrationPrompt({ style: "manga", scene: "un renard court" });
    expect(p).toContain(consigneStylePour("manga"));
    expect(p.toLowerCase()).toContain("scene: un renard court");
  });

  it("intègre le nom du héros et l'apparence quand ils sont fournis", () => {
    const p = buildIllustrationPrompt({
      style: "aventure",
      scene: "sur la plage",
      heroName: "Sami",
      appearance: "cheveux bruns, yeux verts",
    });
    expect(p).toContain("Sami");
    expect(p).toContain("cheveux bruns, yeux verts");
  });

  it("ajoute toujours le socle de sécurité enfant", () => {
    const p = buildIllustrationPrompt({ style: "feerique", scene: "une forêt" });
    expect(p).toContain("no text");
    expect(p).toContain("FORBIDDEN");
    expect(p).toContain("anything frightening");
  });

  it("construit une fiche personnage cohérente et la réutilise", () => {
    const p = buildIllustrationPrompt({
      style: "feerique",
      scene: "dans la forêt",
      heroName: "Lila",
      appearance: "renarde orange",
    });
    expect(p).toContain("Lila");
    expect(p).toContain("renarde orange");
    expect(p).toContain("NEVER MIX TWO CHARACTERS");
  });

  it("propose le catalogue de styles attendu", () => {
    expect(Object.keys(ILLUSTRATION_STYLES).sort()).toEqual([
      "anim3d",
      "aquarelle",
      "aventure",
      "bd",
      "classique",
      "crayon",
      "feerique",
      "maison",
      "manga",
      "papier",
      "pastel",
      "pixel",
      "realiste",
    ]);
  });

  it("chaque style a un libellé, une description et un prompt non vides", () => {
    for (const style of Object.values(ILLUSTRATION_STYLES)) {
      expect(style.label.length).toBeGreaterThan(0);
      expect(style.description.length).toBeGreaterThan(0);
      expect(style.prompt.length).toBeGreaterThan(0);
    }
  });
});
