import { describe, it, expect } from "vitest";
import { postProcessCardLegality, type Card, SET_NAME_TO_INDEX } from "./lorcana";

describe("Lorcana Types & Utilities", () => {
  it("should have correct set index mappings for core sets (Set 9+)", () => {
    expect(SET_NAME_TO_INDEX["Fabled"]).toBe(9);
    expect(SET_NAME_TO_INDEX["Whispers in the Well"]).toBe(10);
    expect(SET_NAME_TO_INDEX["Winterspell"]).toBe(11);
    expect(SET_NAME_TO_INDEX["Wilds Unknown"]).toBe(12);
    expect(SET_NAME_TO_INDEX["Attack of the Vine!"]).toBe(13);
  });

  it("should mark cards from sets 9+ as core legal", () => {
    const cards: Card[] = [
      {
        $id: "card-1",
        id: "woody-helping-a-friend",
        name: "Woody - Helping a Friend",
        set: "Attack of the Vine!",
        number: 1,
        ink_color: "Amber",
        cost: 2,
        inkwell: true,
        strength: 2,
        willpower: 3,
        lore: 1,
        type: ["Character"],
        classifications: ["Storyborn", "Hero", "Toy"],
        rarity: "Common",
        image_url: "",
        formats: [],
      },
    ];

    const processed = postProcessCardLegality(cards);
    expect(processed[0].formats).toContain("core");
    expect(processed[0].formats).toContain("infinity");
  });

  it("should mark reprinted cards from older sets as core legal if present in set 9+", () => {
    const cards: Card[] = [
      {
        $id: "card-old",
        id: "mickey-mouse-brave-little-tailor",
        name: "Mickey Mouse - Brave Little Tailor",
        set: "The First Chapter",
        number: 115,
        ink_color: "Ruby",
        cost: 8,
        inkwell: true,
        strength: 5,
        willpower: 5,
        lore: 4,
        type: ["Character"],
        classifications: ["Storyborn", "Hero"],
        rarity: "Legendary",
        image_url: "",
        formats: [],
      },
      {
        $id: "card-reprint",
        id: "mickey-mouse-brave-little-tailor-fabled",
        name: "Mickey Mouse - Brave Little Tailor",
        set: "Fabled",
        number: 40,
        ink_color: "Ruby",
        cost: 8,
        inkwell: true,
        strength: 5,
        willpower: 5,
        lore: 4,
        type: ["Character"],
        classifications: ["Storyborn", "Hero"],
        rarity: "Legendary",
        image_url: "",
        formats: [],
      },
    ];

    const processed = postProcessCardLegality(cards);
    expect(processed[0].formats).toContain("core"); // Old version gets core status via reprint matching
    expect(processed[1].formats).toContain("core");
  });

  it("should mark older cards without set 9+ reprints as infinity only", () => {
    const cards: Card[] = [
      {
        $id: "card-unique-old",
        id: "unique-first-chapter-card",
        name: "Unique First Chapter Card",
        set: "The First Chapter",
        number: 1,
        ink_color: "Amber",
        cost: 1,
        inkwell: true,
        strength: 1,
        willpower: 1,
        lore: 1,
        type: ["Character"],
        classifications: ["Storyborn"],
        rarity: "Common",
        image_url: "",
        formats: [],
      },
    ];

    const processed = postProcessCardLegality(cards);
    expect(processed[0].formats).toEqual(["infinity"]);
    expect(processed[0].formats).not.toContain("core");
  });
});
