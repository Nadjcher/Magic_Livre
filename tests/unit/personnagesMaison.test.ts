import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { correspondance, PERSONNAGES_MAISON, recopie } from "@/lib/personnagesMaison";

describe("personnages maison", () => {
  it("reconnaît l'espèce écrite en tête du visuel", () => {
    expect(correspondance("DRAGON: a big red dragon")?.id).toBe("dragon");
    expect(correspondance("BABY DRAGON: tiny")?.id).toBe("dragon");
    expect(correspondance("RED FOX: a fox")?.id).toBe("renard");
  });
  it("ne prend jamais un doudou ni un humain", () => {
    expect(correspondance("PLUSH TOY, never alive: a grey plush rabbit")).toBeUndefined();
    expect(correspondance("HUMAN BOY: a tiny boy")).toBeUndefined();
    expect(correspondance("a dragon without species prefix")).toBeUndefined();
  });
  it("chaque visuel commence par son espèce en majuscules, et chaque id est unique", () => {
    for (const p of PERSONNAGES_MAISON) expect(correspondance(p.visuel)?.id).toBe(p.id);
    expect(new Set(PERSONNAGES_MAISON.map((p) => p.id)).size).toBe(PERSONNAGES_MAISON.length);
  });
  it("un dragon rouge demandé n'est pas le dragon maison", () => {
    const maison = PERSONNAGES_MAISON.find((p) => p.id === "dragon")!.visuel;
    expect(recopie(maison, maison)).toBe(true);
    expect(recopie(`${maison}, with a tiny satchel`, maison)).toBe(true);
    expect(recopie("DRAGON: a big red dragon with golden wings", maison)).toBe(false);
  });
});
