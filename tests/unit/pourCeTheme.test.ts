import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { pourCeTheme } from "@/lib/bibliotheque";

const poucet = { type: "trame" as const, themes: ["petit-poucet", "classiques"], texte: "TRAME IMPOSÉE : suis-la case par case…" };
describe("exemples réservés à leur conte", () => {
  it("la trame du Petit Poucet ne sert jamais Jack et le haricot magique", () => {
    expect(pourCeTheme(poucet, "haricot-magique")).toBe(false);
    expect(pourCeTheme(poucet, undefined)).toBe(false);
  });
  it("elle sert le Petit Poucet", () => {
    expect(pourCeTheme(poucet, "petit-poucet")).toBe(true);
  });
  it("un exemple rangé seulement par catégorie reste partagé", () => {
    expect(pourCeTheme({ type: "trame", themes: ["aventures", "classiques"], texte: "Trame libre" }, "haricot-magique")).toBe(true);
    expect(pourCeTheme({ type: "extrait", themes: [], texte: "…" }, "haricot-magique")).toBe(true);
  });
});
