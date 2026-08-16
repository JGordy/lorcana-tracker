import { type UserCollectionItem, type DeckCard, type ProgressResult } from "../utils/deck";

// ---------------------------------------------------------
// TypeScript Schema Types
// ---------------------------------------------------------
export interface Card {
  $id: string;
  id: string; // card unique slug ID, e.g. "mickey-mouse-brave-little-tailor"
  name: string;
  set: string;
  number: number;
  ink_color: string;
  cost: number;
  inkwell: boolean;
  strength: number | null;
  willpower: number | null;
  lore: number;
  type: string[];
  classifications: string[];
  rarity: string;
  image_url: string;
  formats: string[]; // e.g. ["core", "infinity"]
}

export interface UserCollectionItemDoc extends UserCollectionItem {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Deck {
  $id: string;
  id: string;
  title: string;
  description: string;
  creator_id: string;
  is_public: boolean;
}

export interface DeckCardDoc extends DeckCard {
  $id: string;
}

export interface DeckWithProgress extends Deck {
  progress: ProgressResult;
  cards: Array<{
    card: Card;
    requiredQty: number;
    ownedQty: number;
  }>;
  youtube?: string;
  likes?: number;
  views?: number;
  creator_name?: string;
  is_trending?: boolean;
}

export const COLLECTIONS = {
  CARDS: "cards",
  USER_COLLECTIONS: "user_collections",
  DECKS: "decks",
  DECK_CARDS: "deck_cards",
};

export const SET_INDEX_MAP: Record<number, string> = {
  1: "The First Chapter",
  2: "Rise of the Floodborn",
  3: "Into the Inklands",
  4: "Ursula's Return",
  5: "Shimmering Skies",
  6: "Azurite Sea",
  7: "Archazia's Island",
  8: "Reign of Jafar",
  9: "Fabled",
  10: "Whispers in the Well",
  11: "Winterspell",
  12: "Wilds Unknown",
  13: "Attack of the Vine!",
  14: "Format Coconut",
};

export const SET_NAME_TO_INDEX: Record<string, number> = {
  "The First Chapter": 1,
  "Rise of the Floodborn": 2,
  "Into the Inklands": 3,
  "Ursula's Return": 4,
  "Shimmering Skies": 5,
  "Azurite Sea": 6,
  "Archazia's Island": 7,
  "Reign of Jafar": 8,
  "Fabled": 9,
  "Whispers in the Well": 10,
  "Winterspell": 11,
  "Wilds Unknown": 12,
  "Attack of the Vine!": 13,
  "Format Coconut": 14,
};

export function postProcessCardLegality(cards: Card[]): Card[] {
  const legalCardNames = new Set<string>();
  for (const card of cards) {
    const setIdx = SET_NAME_TO_INDEX[card.set];
    if (setIdx && setIdx >= 9) {
      legalCardNames.add(card.name.toLowerCase().trim());
    }
  }

  for (const card of cards) {
    const setIdx = SET_NAME_TO_INDEX[card.set];
    const isCore = (setIdx !== undefined && setIdx >= 9) || legalCardNames.has(card.name.toLowerCase().trim());
    card.formats = isCore ? ["core", "infinity"] : ["infinity"];
  }
  return cards;
}
