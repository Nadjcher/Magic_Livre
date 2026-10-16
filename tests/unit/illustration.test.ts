import { describe, it, expect } from "vitest";
import {
  buildIllustrationPrompt,
  ILLUSTRATION_STYLES,
} from "@/lib/style_config";

describe("construction du prompt d'illustration", () => {
  it("inclut le fragment de style choisi", () => {
    const p = buildIllustrationPrompt({ style: "manga", scene: "un renard court" });
    expect(p).toContain(ILLUSTRATION_STYLES.manga.prompt);
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
    expect(p).toContain("no violence");
  });

  it("propose exactement trois styles", () => {
    expect(Object.keys(ILLUSTRATION_STYLES).sort()).toEqual([
      "aventure",
      "feerique",
      "manga",
    ]);
  });
});
