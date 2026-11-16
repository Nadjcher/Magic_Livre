import { describe, expect, it } from "vitest";
import { jugerInventaire } from "@/lib/controleIllustrations";

const heros = { nom: "Léo" };
const pompon = { nom: "Pompon", description: "PLUSH TOY, never alive: a soft plush light grey rabbit with long pink ears" };
const poucet = { nom: "Poucet", description: "HUMAN BOY: a tiny cheerful fairy-tale boy the size of a toy figurine, red knitted bonnet" };
const bon = {
  hero: { count: 1, hair_same_color_as_reference: true, face_and_outfit_match_reference: true },
  characters: [
    { name: "Pompon", count: 1, species_seen: "grey rabbit", same_design_as_reference: true, size: "small", animal_ears_or_animal_head: true },
    { name: "Poucet", count: 1, species_seen: "boy", same_design_as_reference: true, size: "tiny", animal_ears_or_animal_head: false },
  ],
  plush_toys: [{ animal: "rabbit", color: "grey" }],
  other_humans: [],
  explicit_rule_violations: [],
  unexpected_characters: [],
  letters_or_text: false,
  blank_unpainted_area: false,
  style_consistent: true,
  frightening: false,
};

describe("jugerInventaire", () => {
  it("une image conforme passe", () => {
    expect(jugerInventaire(bon, heros, [pompon, poucet])).toEqual([]);
  });
  it("Poucet remplacé par un 2e lapin (page 8) : refusé", () => {
    const f = jugerInventaire(
      { ...bon, plush_toys: [{ animal: "rabbit" }, { animal: "rabbit" }], characters: [bon.characters[0]!, { name: "Poucet", count: 1, species_seen: "rabbit", same_design_as_reference: false, size: "small", animal_ears_or_animal_head: true }] },
      heros,
      [pompon, poucet],
    ).join(" ");
    expect(f).toContain("Only ONE plush toy");
    expect(f).toContain("Poucet is a human");
    expect(f).toContain("Poucet must be TINY");
  });
  it("le doudou devenu ours : refusé avec l'espèce", () => {
    const f = jugerInventaire({ ...bon, plush_toys: [{ animal: "bear", color: "brown" }], characters: [{ ...bon.characters[0]!, species_seen: "rabbit" }, bon.characters[1]!] }, heros, [pompon, poucet]).join(" ");
    expect(f).toContain("must be the plush rabbit of its reference sheet, not a bear");
  });
  it("le parent dessiné comme un enfant en pyjama : refusé", () => {
    const f = jugerInventaire({ ...bon, other_humans: [{ adult_or_child: "child", dressed_like_hero: true }] }, heros, [pompon], "Papa sits on the bed").join(" ");
    expect(f).toContain("parent must be an ADULT");
  });
  it("cheveux d'une autre couleur, personnage absent, héros en double", () => {
    const f = jugerInventaire({ ...bon, hero: { count: 2, hair_same_color_as_reference: false, hair_seen: "reddish" }, characters: [bon.characters[0]!] }, heros, [pompon, poucet]).join(" ");
    expect(f).toContain("only ONCE");
    expect(f).toContain("hair color");
    expect(f).toContain("Poucet is missing");
  });
});
