import { describe, expect, it } from "vitest";
import { elision } from "@/lib/titrePrenom";

describe("« de » ou « d' » devant un prénom", () => {
  it.each([
    ["Inès", true], ["Hugo", true], ["Éloïse", true], ["Anne-Sophie", true], ["Yves", true], ["Ulysse", true],
    ["Yann", false], ["Yasmine", false], ["Léo", false], ["Jean-Baptiste", false],
  ])("%s → d' : %s", (n, attendu) => expect(elision(n as string)).toBe(attendu));
});
