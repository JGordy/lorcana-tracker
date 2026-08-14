import { Client, Account, Databases, ID, Query } from "appwrite";
import { calculateDeckProgress, getCardSlug, type UserCollectionItem, type DeckCard, type ProgressResult } from "../utils/deck";

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


// ---------------------------------------------------------
// Appwrite Client Initialization
// ---------------------------------------------------------
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || "lorcana_tracker";

export const COLLECTIONS = {
  CARDS: "cards",
  USER_COLLECTIONS: "user_collections",
  DECKS: "decks",
  DECK_CARDS: "deck_cards",
};

// Check if Appwrite is configured
export const isConfigured = !!PROJECT_ID && PROJECT_ID !== "PLACEHOLDER";

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



export const client = new Client();
if (isConfigured) {
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
}

export const account = new Account(client);
export const databases = new Databases(client);

// ---------------------------------------------------------
// Mock Data (Fallback for Local Testing/Demo)
// ---------------------------------------------------------
const RAW_MOCK_CARDS = [
  {
    $id: "mickey-mouse-brave-little-tailor",
    id: "mickey-mouse-brave-little-tailor",
    name: "Mickey Mouse - Brave Little Tailor",
    set: "The First Chapter",
    number: 115,
    ink_color: "Ruby",
    cost: 8,
    rarity: "Legendary",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_e74ef94562b9440e8dd95ada098728d6.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "elsa-spirit-of-winter",
    id: "elsa-spirit-of-winter",
    name: "Elsa - Spirit of Winter",
    set: "The First Chapter",
    number: 42,
    ink_color: "Amethyst",
    cost: 8,
    rarity: "Legendary",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_04bca46a8e2d4e9ba0fbdbfc6c99e51e.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "maleficent-monstrous-dragon",
    id: "maleficent-monstrous-dragon",
    name: "Maleficent - Monstrous Dragon",
    set: "The First Chapter",
    number: 113,
    ink_color: "Ruby",
    cost: 9,
    rarity: "Legendary",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_f27f48f1eb8642a39de3ea91df67ccfc.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "maui-hero-to-all",
    id: "maui-hero-to-all",
    name: "Maui - Hero to All",
    set: "The First Chapter",
    number: 114,
    ink_color: "Ruby",
    cost: 5,
    rarity: "Rare",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_407bb2a4ff5c4d46b0e4e76cbc2be949.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "a-whole-new-world",
    id: "a-whole-new-world",
    name: "A Whole New World",
    set: "The First Chapter",
    number: 195,
    ink_color: "Steel",
    cost: 5,
    rarity: "Super Rare",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_3a299da6bf864690a188f07aeb55ffdf.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "be-prepared",
    id: "be-prepared",
    name: "Be Prepared",
    set: "The First Chapter",
    number: 104,
    ink_color: "Ruby",
    cost: 7,
    rarity: "Rare",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_69b75104832b4cd6ada38b185f7bd579.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "stitch-carefree-surfer",
    id: "stitch-carefree-surfer",
    name: "Stitch - Carefree Surfer",
    set: "The First Chapter",
    number: 24,
    ink_color: "Amber",
    cost: 7,
    rarity: "Legendary",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_fdaea5bd7f31497a8284771dd57894cf.avif?1755540238",
    formats: ["core", "infinity"],
  },
  {
    $id: "tinker-bell-giant-fairy",
    id: "tinker-bell-giant-fairy",
    name: "Tinker Bell - Giant Fairy",
    set: "The First Chapter",
    number: 193,
    ink_color: "Steel",
    cost: 6,
    rarity: "Super Rare",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_5fb3a8282fa34c2bbeb9a56b4ccc7e36.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "cinderella-stouthearted",
    id: "cinderella-stouthearted",
    name: "Cinderella - Stouthearted",
    set: "Rise of the Floodborn",
    number: 177,
    ink_color: "Steel",
    cost: 7,
    rarity: "Super Rare",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_ac32bfe50af84f459d9cc9d4c0d659ef.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "flynn-rider-his-own-biggest-fan",
    id: "flynn-rider-his-own-biggest-fan",
    name: "Flynn Rider - His Own Biggest Fan",
    set: "Rise of the Floodborn",
    number: 82,
    ink_color: "Emerald",
    cost: 4,
    rarity: "Rare",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_ce8e3338542f433193eaf3a3737ba1c4.avif?1709690747",
    formats: ["core", "infinity"],
  },
  {
    $id: "belle-strange-but-special",
    id: "belle-strange-but-special",
    name: "Belle - Strange but Special",
    set: "The First Chapter",
    number: 142,
    ink_color: "Sapphire",
    cost: 4,
    rarity: "Legendary",
    image_url: "https://cards.lorcast.io/card/digital/normal/crd_63c2ca66eeea417b9079d833e0fd88d4.avif?1709690747",
    formats: ["core", "infinity"],
  },
];

const MOCK_CARDS: Card[] = RAW_MOCK_CARDS.map(c => ({
  ...c,
  inkwell: true,
  strength: 5,
  willpower: 5,
  lore: 2,
  type: ["Character"],
  classifications: ["Storyborn", "Hero"],
}));

const MOCK_DECKS: Deck[] = [
  {
    $id: "deck-1",
    id: "deck-1",
    title: "Amber/Emerald Toys (Set 13)",
    description: "An aggressive toy-based midrange deck utilizing the synergy between Woody and Meilin Lee, focusing on lore rushes.",
    creator_id: "system-1",
    is_public: true,
  },
  {
    $id: "deck-2",
    id: "deck-2",
    title: "Emerald/Steel Darkwing (Set 13)",
    description: "A removal-heavy deck that wins through board manipulation and evasive damage.",
    creator_id: "system-1",
    is_public: true,
  },
  {
    $id: "deck-3",
    id: "deck-3",
    title: "Amethyst/Steel Monsters (Set 13)",
    description: "A powerful control deck showcasing Monsters Inc. characters like Sulley and Mike Wazowski, using massive strength control.",
    creator_id: "system-1",
    is_public: true,
  },
  {
    $id: "deck-4",
    id: "deck-4",
    title: "Amber/Ruby Toy Story (Set 13)",
    description: "A highly thematic and competitive Toy Story deck featuring Woody's leadership and Sid Phillips' toy surgeon modifications.",
    creator_id: "system-1",
    is_public: true,
  },
];

const MOCK_DECK_CARDS: DeckCardDoc[] = [
  // Amber/Emerald Toys (Set 13) - 15 cards * 4 copies = 60 cards
  { $id: "dc1-1", deck_id: "deck-1", card_id: "woody-helping-a-friend", quantity: 4 },
  { $id: "dc1-2", deck_id: "deck-1", card_id: "ming-lee-proud-parent", quantity: 4 },
  { $id: "dc1-3", deck_id: "deck-1", card_id: "isabela-madrigal-kind-cultivator", quantity: 4 },
  { $id: "dc1-4", deck_id: "deck-1", card_id: "tyler-nguyen-baker-4-town-fan", quantity: 4 },
  { $id: "dc1-5", deck_id: "deck-1", card_id: "rabbit-hunny-paladin", quantity: 4 },
  { $id: "dc1-6", deck_id: "deck-1", card_id: "celia-mae-friendly-receptionist", quantity: 4 },
  { $id: "dc1-7", deck_id: "deck-1", card_id: "meilin-lee-lead-vocalist", quantity: 4 },
  { $id: "dc1-8", deck_id: "deck-1", card_id: "priya-mangal-serious-music-lover", quantity: 4 },
  { $id: "dc1-9", deck_id: "deck-1", card_id: "carl-fredricksen-loving-husband", quantity: 4 },
  { $id: "dc1-10", deck_id: "deck-1", card_id: "ellie-fredricksen-loving-wife", quantity: 4 },
  { $id: "dc1-11", deck_id: "deck-1", card_id: "buzz-lightyear-grounded", quantity: 4 },
  { $id: "dc1-12", deck_id: "deck-1", card_id: "buzz-lightyear-providing-cover", quantity: 4 },
  { $id: "dc1-13", deck_id: "deck-1", card_id: "gopher-hunny-cook", quantity: 4 },
  { $id: "dc1-14", deck_id: "deck-1", card_id: "russell-senior-wilderness-explorer", quantity: 4 },
  { $id: "dc1-15", deck_id: "deck-1", card_id: "rapunzel-tower-defender", quantity: 4 },

  // Emerald/Steel Darkwing (Set 13) - 15 cards * 4 copies = 60 cards
  { $id: "dc2-1", deck_id: "deck-2", card_id: "tod-clever-fox", quantity: 4 },
  { $id: "dc2-2", deck_id: "deck-2", card_id: "russell-junior-wilderness-explorer", quantity: 4 },
  { $id: "dc2-3", deck_id: "deck-2", card_id: "roo-hunny-rogue", quantity: 4 },
  { $id: "dc2-4", deck_id: "deck-2", card_id: "winifred-exasperated-elephant", quantity: 4 },
  { $id: "dc2-5", deck_id: "deck-2", card_id: "aladdin-doing-his-part", quantity: 4 },
  { $id: "dc2-6", deck_id: "deck-2", card_id: "madam-mim-hummingbird", quantity: 4 },
  { $id: "dc2-7", deck_id: "deck-2", card_id: "minnie-mouse-curious-adventurer", quantity: 4 },
  { $id: "dc2-8", deck_id: "deck-2", card_id: "kevin-flightless-bird", quantity: 4 },
  { $id: "dc2-9", deck_id: "deck-2", card_id: "violet-parr-super-resilient", quantity: 4 },
  { $id: "dc2-10", deck_id: "deck-2", card_id: "aladdin-created-by-the-vine", quantity: 4 },
  { $id: "dc2-11", deck_id: "deck-2", card_id: "willie-the-giant-created-by-the-vine", quantity: 4 },
  { $id: "dc2-12", deck_id: "deck-2", card_id: "sprout-experiment-509", quantity: 4 },
  { $id: "dc2-13", deck_id: "deck-2", card_id: "stitch-protector-of-frogs", quantity: 4 },
  { $id: "dc2-14", deck_id: "deck-2", card_id: "sheriff-of-nottingham-vine-slayer", quantity: 4 },
  { $id: "dc2-15", deck_id: "deck-2", card_id: "mata-meat-hut-waitress", quantity: 4 },

  // Amethyst/Steel Monsters (Set 13) - 15 cards * 4 copies = 60 cards
  { $id: "dc3-1", deck_id: "deck-3", card_id: "fflewddur-fflam-luckless-bard", quantity: 4 },
  { $id: "dc3-2", deck_id: "deck-3", card_id: "maleficent-exultant-spellcaster", quantity: 4 },
  { $id: "dc3-3", deck_id: "deck-3", card_id: "winnie-the-pooh-hunny-archmage", quantity: 4 },
  { $id: "dc3-4", deck_id: "deck-3", card_id: "panic-hammer-enthusiast", quantity: 4 },
  { $id: "dc3-5", deck_id: "deck-3", card_id: "lumpy-hunny-druid", quantity: 4 },
  { $id: "dc3-6", deck_id: "deck-3", card_id: "abu-wise-sultan", quantity: 4 },
  { $id: "dc3-7", deck_id: "deck-3", card_id: "meilin-lee-superficially-obedient", quantity: 4 },
  { $id: "dc3-8", deck_id: "deck-3", card_id: "genie-hard-to-grasp", quantity: 4 },
  { $id: "dc3-9", deck_id: "deck-3", card_id: "violet-parr-force-field-practice", quantity: 4 },
  { $id: "dc3-10", deck_id: "deck-3", card_id: "dr-hamsterviel-evil-observer", quantity: 4 },
  { $id: "dc3-11", deck_id: "deck-3", card_id: "owl-hunny-ranger", quantity: 4 },
  { $id: "dc3-12", deck_id: "deck-3", card_id: "megavolt-electrical-menace", quantity: 4 },
  { $id: "dc3-13", deck_id: "deck-3", card_id: "darkwing-duck-shadowy-superhero", quantity: 4 },
  { $id: "dc3-14", deck_id: "deck-3", card_id: "omnidroid-scanning-for-threats", quantity: 4 },
  { $id: "dc3-15", deck_id: "deck-3", card_id: "flynn-rider-high-climbing-rogue", quantity: 4 },

  // Amber/Ruby Toy Story (Set 13) - 15 cards * 4 copies = 60 cards
  { $id: "dc4-1", deck_id: "deck-4", card_id: "woody-leader-of-the-toys", quantity: 4 },
  { $id: "dc4-2", deck_id: "deck-4", card_id: "woody-helping-a-friend", quantity: 4 },
  { $id: "dc4-3", deck_id: "deck-4", card_id: "woody-town-sheriff", quantity: 4 },
  { $id: "dc4-4", deck_id: "deck-4", card_id: "rex-protective-dinosaur", quantity: 4 },
  { $id: "dc4-5", deck_id: "deck-4", card_id: "woody-waiting-for-a-friend", quantity: 4 },
  { $id: "dc4-6", deck_id: "deck-4", card_id: "woody-jungle-guide", quantity: 4 },
  { $id: "dc4-7", deck_id: "deck-4", card_id: "sid-phillips-toy-surgeon", quantity: 4 },
  { $id: "dc4-8", deck_id: "deck-4", card_id: "jingle-joe-sid-s-toy", quantity: 4 },
  { $id: "dc4-9", deck_id: "deck-4", card_id: "wind-up-frog-sid-s-toy", quantity: 4 },
  { $id: "dc4-10", deck_id: "deck-4", card_id: "roller-bob-sid-s-toy", quantity: 4 },
  { $id: "dc4-11", deck_id: "deck-4", card_id: "hand-in-the-box-sid-s-toy", quantity: 4 },
  { $id: "dc4-12", deck_id: "deck-4", card_id: "babyhead-leader-of-sid-s-toys", quantity: 4 },
  { $id: "dc4-13", deck_id: "deck-4", card_id: "bouncing-ducky-sid-s-toy", quantity: 4 },
  { $id: "dc4-14", deck_id: "deck-4", card_id: "pterodactyl-janie-doll-sid-s-toy", quantity: 4 },
  { $id: "dc4-15", deck_id: "deck-4", card_id: "isabela-madrigal-kind-cultivator", quantity: 4 },
];

// Helper to parse cookies
export function parseCookies(cookieString: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;
  cookieString.split(";").forEach((pair) => {
    const parts = pair.split("=");
    const key = parts[0]?.trim();
    const val = parts[1]?.trim();
    if (key && val) {
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}

export function getMockDecks(cookieHeader?: string | null): Deck[] {
  let userDecks: Deck[] = [];
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const cookieVal = cookies["lorcana_user_decks"];
    if (cookieVal) {
      try {
        userDecks = JSON.parse(cookieVal);
      } catch (e) {}
    }
  } else if (typeof window !== "undefined") {
    const stored = localStorage.getItem("lorcana_user_decks");
    if (stored) {
      try {
        userDecks = JSON.parse(stored);
      } catch (e) {}
    }
  }
  return [...MOCK_DECKS, ...userDecks];
}

export function getMockDeckCards(cookieHeader?: string | null): DeckCardDoc[] {
  let userDeckCards: DeckCardDoc[] = [];
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const cookieVal = cookies["lorcana_user_deck_cards"];
    if (cookieVal) {
      try {
        userDeckCards = JSON.parse(cookieVal);
      } catch (e) {}
    }
  } else if (typeof window !== "undefined") {
    const stored = localStorage.getItem("lorcana_user_deck_cards");
    if (stored) {
      try {
        userDeckCards = JSON.parse(stored);
      } catch (e) {}
    }
  }
  return [...MOCK_DECK_CARDS, ...userDeckCards];
}


// Helper to initialize user inventory with full cookie support for SSR
const getMockUserInventory = (cookieHeader?: string | null): UserCollectionItemDoc[] => {
  // 1. If cookie is present (runs on server or client), parse it
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const cookieVal = cookies["lorcana_user_inventory"];
    if (cookieVal) {
      try {
        return JSON.parse(cookieVal);
      } catch (e) {
        console.error("Failed to parse user inventory from cookie", e);
      }
    }
  }

  // 2. Fallback to client-side localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("lorcana_user_inventory");
    if (stored) {
      return JSON.parse(stored);
    }
  }

  // 3. Fallback defaults
  const defaults: UserCollectionItemDoc[] = [
    { $id: "inv-1", user_id: "mock-user-123", card_id: "mickey-mouse-brave-little-tailor", quantity: 1, is_foil: false },
    { $id: "inv-2", user_id: "mock-user-123", card_id: "mickey-mouse-brave-little-tailor", quantity: 1, is_foil: true },
    { $id: "inv-3", user_id: "mock-user-123", card_id: "maui-hero-to-all", quantity: 3, is_foil: false },
    { $id: "inv-4", user_id: "mock-user-123", card_id: "a-whole-new-world", quantity: 1, is_foil: false },
    { $id: "inv-5", user_id: "mock-user-123", card_id: "tinker-bell-giant-fairy", quantity: 4, is_foil: false },
  ];

  if (typeof window !== "undefined") {
    localStorage.setItem("lorcana_user_inventory", JSON.stringify(defaults));
    document.cookie = `lorcana_user_inventory=${encodeURIComponent(JSON.stringify(defaults))}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  return defaults;
};

const saveMockUserInventory = (inventory: UserCollectionItemDoc[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("lorcana_user_inventory", JSON.stringify(inventory));
    document.cookie = `lorcana_user_inventory=${encodeURIComponent(JSON.stringify(inventory))}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
};

const saveMockDecks = (decks: Deck[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("lorcana_user_decks", JSON.stringify(decks));
    document.cookie = `lorcana_user_decks=${encodeURIComponent(JSON.stringify(decks))}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
};

const saveMockDeckCards = (deckCards: DeckCardDoc[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("lorcana_user_deck_cards", JSON.stringify(deckCards));
    document.cookie = `lorcana_user_deck_cards=${encodeURIComponent(JSON.stringify(deckCards))}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
};


// ---------------------------------------------------------
// Core Authentication Services
// ---------------------------------------------------------
export const authService = {
  async getSessionUser() {
    if (!isConfigured) {
      // Mock session user
      return {
        $id: "mock-user-123",
        email: "lorcana.player@example.com",
        name: "GlimmerForge Player",
      };
    }
    try {
      return await account.get();
    } catch {
      return null;
    }
  },

  async anonymousLogin() {
    if (!isConfigured) {
      console.log("Mock: Logged in anonymously");
      return this.getSessionUser();
    }
    try {
      return await account.createAnonymousSession();
    } catch (error) {
      console.error("Anonymous login failed", error);
      throw error;
    }
  },

  async logout() {
    if (!isConfigured) {
      console.log("Mock: Logged out");
      return;
    }
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error("Logout failed", error);
      throw error;
    }
  },
};

// ---------------------------------------------------------
// Database & Collection Services
// ---------------------------------------------------------
export const dbService = {
  /**
   * Fetch all records of a specific collection.
   */
  async getCollection<T>(
    collectionId: string,
    queries: string[] = [],
    cookieHeader?: string | null
  ): Promise<T[]> {
    if (!isConfigured) {
      // Return Mock Collections
      if (collectionId === COLLECTIONS.CARDS) {
        let cards: Card[] = [];
        if (typeof window === "undefined") {
          // Server-side (Node.js): Read the minified public/cards.json file directly using relative module URL paths
          try {
            const fs = await import("fs");
            const path = await import("path");
            
            const devUrl = new URL("../../public/cards.json", import.meta.url);
            const prodUrl = new URL("../client/cards.json", import.meta.url);
            
            let rawData = "";
            if (fs.existsSync(prodUrl)) {
              rawData = fs.readFileSync(prodUrl, "utf8");
            } else if (fs.existsSync(devUrl)) {
              rawData = fs.readFileSync(devUrl, "utf8");
            } else {
              const fallbackPath = path.join(process.cwd(), "public", "cards.json");
              rawData = fs.readFileSync(fallbackPath, "utf8");
            }
            
            cards = JSON.parse(rawData);
          } catch (e) {
            console.error("Server failed to load public/cards.json:", e);
            cards = MOCK_CARDS;
          }
        } else {
          // Client-side: Read from cache or fetch
          const cached = localStorage.getItem("lorcana_cards_cache_v6");
          if (cached) {
            cards = JSON.parse(cached);
          } else {
            // If no cache, fetch the local minified public/cards.json asset
            try {
              const response = await fetch("/cards.json");
              if (!response.ok) throw new Error("Local cards.json asset failed to load");
              cards = await response.json();
              localStorage.setItem("lorcana_cards_cache_v6", JSON.stringify(cards));
            } catch (error) {
              console.warn("Failed to fetch local cards database. Falling back to mock cards.", error);
              cards = MOCK_CARDS;
            }
          }
        }

        return postProcessCardLegality(cards) as unknown as T[];
      }
      if (collectionId === COLLECTIONS.DECKS) {
        return getMockDecks(cookieHeader) as unknown as T[];
      }
      if (collectionId === COLLECTIONS.DECK_CARDS) {
        return getMockDeckCards(cookieHeader) as unknown as T[];
      }
      if (collectionId === COLLECTIONS.USER_COLLECTIONS) {
        return getMockUserInventory(cookieHeader) as unknown as T[];
      }
      return [];
    }

    try {
      // Cards always come from the local JSON asset — not stored in Appwrite
      if (collectionId === COLLECTIONS.CARDS) {
        let cards: Card[] = [];
        if (typeof window === "undefined") {
          try {
            const fs = await import("fs");
            const path = await import("path");
            const devUrl = new URL("../../public/cards.json", import.meta.url);
            const prodUrl = new URL("../client/cards.json", import.meta.url);
            let rawData = "";
            if (fs.existsSync(prodUrl)) {
              rawData = fs.readFileSync(prodUrl, "utf8");
            } else if (fs.existsSync(devUrl)) {
              rawData = fs.readFileSync(devUrl, "utf8");
            } else {
              const fallbackPath = path.join(process.cwd(), "public", "cards.json");
              rawData = fs.readFileSync(fallbackPath, "utf8");
            }
            cards = JSON.parse(rawData);
          } catch (e) {
            console.error("Server failed to load public/cards.json:", e);
            cards = MOCK_CARDS;
          }
        } else {
          const cached = localStorage.getItem("lorcana_cards_cache_v6");
          if (cached) {
            cards = JSON.parse(cached);
          } else {
            try {
              const response = await fetch("/cards.json");
              if (!response.ok) throw new Error("Local cards.json asset failed to load");
              cards = await response.json();
              localStorage.setItem("lorcana_cards_cache_v6", JSON.stringify(cards));
            } catch (error) {
              console.warn("Failed to fetch local cards database. Falling back to mock cards.", error);
              cards = MOCK_CARDS;
            }
          }
        }
        return postProcessCardLegality(cards) as unknown as T[];
      }

      const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
      return response.documents as unknown as T[];
    } catch (error: any) {
      // Gracefully fall back to mock data if the database/collection isn't provisioned yet
      if (error?.code === 404 || error?.type === "database_not_found" || error?.type === "collection_not_found") {
        console.warn(`[Appwrite] Collection '${collectionId}' not found — falling back to mock data.`);
        if (collectionId === COLLECTIONS.DECKS) return getMockDecks(cookieHeader) as unknown as T[];
        if (collectionId === COLLECTIONS.DECK_CARDS) return getMockDeckCards(cookieHeader) as unknown as T[];
        if (collectionId === COLLECTIONS.USER_COLLECTIONS) return getMockUserInventory(cookieHeader) as unknown as T[];
        return [];
      }
      console.error(`Error fetching collection ${collectionId}:`, error);
      throw error;
    }
  },

  /**
   * Add or update quantity in the user's inventory
   */
  async updateInventory(
    userId: string,
    cardId: string,
    quantity: number,
    isFoil: boolean,
    cookieHeader?: string | null
  ): Promise<UserCollectionItemDoc> {
    if (!isConfigured) {
      const inventory = getMockUserInventory(cookieHeader);
      const existingIdx = inventory.findIndex(
        (item) => item.card_id === cardId && item.is_foil === isFoil && item.user_id === userId
      );

      let updatedItem: UserCollectionItemDoc;
      if (existingIdx > -1) {
        if (quantity <= 0) {
          updatedItem = inventory.splice(existingIdx, 1)[0];
          updatedItem.quantity = 0;
        } else {
          inventory[existingIdx].quantity = quantity;
          updatedItem = inventory[existingIdx];
        }
      } else {
        if (quantity <= 0) {
          updatedItem = { $id: `temp-${Date.now()}`, user_id: userId, card_id: cardId, quantity: 0, is_foil: isFoil };
        } else {
          const newItem: UserCollectionItemDoc = {
            $id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            card_id: cardId,
            quantity,
            is_foil: isFoil,
          };
          inventory.push(newItem);
          updatedItem = newItem;
        }
      }
      saveMockUserInventory(inventory);
      return updatedItem;
    }

    // Appwrite Implementation
    const docId = `${userId}_${cardId.replace(/[^a-zA-Z0-9]/g, "-")}_${isFoil ? "foil" : "normal"}`;

    try {
      if (quantity <= 0) {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_COLLECTIONS, docId);
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }
        return { $id: docId, user_id: userId, card_id: cardId, quantity: 0, is_foil: isFoil };
      }

      return (await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USER_COLLECTIONS,
        docId,
        { quantity }
      )) as unknown as UserCollectionItemDoc;
    } catch (error: any) {
      // Fall back to mock if DB not provisioned yet
      if (error?.code === 404 && (error?.type === "database_not_found" || error?.type === "collection_not_found")) {
        console.warn("[Appwrite] user_collections not provisioned — falling back to mock updateInventory.");
        return this.updateInventory(userId, cardId, quantity, isFoil, cookieHeader);
      }
      if (error.code === 404) {
        return (await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_COLLECTIONS,
          docId,
          {
            user_id: userId,
            card_id: cardId,
            quantity,
            is_foil: isFoil,
          }
        )) as unknown as UserCollectionItemDoc;
      }
      throw error;
    }
  },

  /**
   * Retrieves all public decks, maps them against the user's collection,
   * calculates percentage completion, and sorts them accordingly.
   */
  async getDecksWithProgress(
    userId: string | null,
    sort: "progress" | "missing_cost" | "name" = "progress",
    cookieHeader?: string | null
  ): Promise<DeckWithProgress[]> {
    // 1. Fetch user collection and master cards catalog
    const [cards, userCollection] = await Promise.all([
      this.getCollection<Card>(COLLECTIONS.CARDS, [], cookieHeader),
      userId ? this.getCollection<UserCollectionItemDoc>(COLLECTIONS.USER_COLLECTIONS, [Query.equal("user_id", userId)], cookieHeader) : Promise.resolve([]),
    ]);

    // Create lookup index maps for efficiency
    const ownedMap = new Map<string, number>();
    for (const item of userCollection) {
      ownedMap.set(item.card_id, (ownedMap.get(item.card_id) || 0) + item.quantity);
    }

    const cardBySetAndNumber = new Map<string, Card>();
    for (const card of cards) {
      const key = `${card.set.toLowerCase()}_${card.number}`;
      cardBySetAndNumber.set(key, card);
    }

    const resolvedDecks: DeckWithProgress[] = [];

    // 2. Fetch trending decks from api-lorcana.com
    let apiDecks: any[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("https://api-lorcana.com/decks/trending", {
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        apiDecks = await res.json();
      } else {
        console.warn("api-lorcana.com trending endpoint returned status:", res.status);
      }
    } catch (err) {
      console.warn("Failed to fetch trending decks from api-lorcana.com (using local backup):", err);
    }

    // 3. Process API decks if available
    if (Array.isArray(apiDecks) && apiDecks.length > 0) {
      for (const apiDeck of apiDecks) {
        const deckJunctions: DeckCard[] = [];
        const cardsInDeck: Array<{
          card: Card;
          requiredQty: number;
          ownedQty: number;
        }> = [];

        if (Array.isArray(apiDeck.cards)) {
          for (const apiCard of apiDeck.cards) {
            if (!apiCard.dreamborn) continue;
            const parts = apiCard.dreamborn.split("-");
            if (parts.length === 2) {
              const setNum = parseInt(parts[0], 10);
              const cardNum = parseInt(parts[1], 10);
              const setName = SET_INDEX_MAP[setNum];
              if (setName) {
                const lookupKey = `${setName.toLowerCase()}_${cardNum}`;
                const cardDetails = cardBySetAndNumber.get(lookupKey);
                const qty = apiCard.count || 0;
                
                if (cardDetails) {
                  deckJunctions.push({
                    deck_id: apiDeck.uuid,
                    card_id: cardDetails.id,
                    quantity: qty,
                  });
                  cardsInDeck.push({
                    card: cardDetails,
                    requiredQty: qty,
                    ownedQty: ownedMap.get(cardDetails.id) || 0,
                  });
                } else {
                  // Fallback placeholder card if not found in catalog
                  const placeholderId = `missing-${apiCard.dreamborn}`;
                  deckJunctions.push({
                    deck_id: apiDeck.uuid,
                    card_id: placeholderId,
                    quantity: qty,
                  });
                  cardsInDeck.push({
                    card: {
                      $id: placeholderId,
                      id: placeholderId,
                      name: `Unknown Card (${apiCard.dreamborn})`,
                      set: setName,
                      number: cardNum,
                      ink_color: "Neutral",
                      cost: 0,
                      inkwell: true,
                      strength: null,
                      willpower: null,
                      lore: 0,
                      type: [],
                      classifications: [],
                      rarity: "Common",
                      image_url: "",
                      formats: setNum >= 9 ? ["core", "infinity"] : ["infinity"],
                    },
                    requiredQty: qty,
                    ownedQty: 0,
                  });
                }
              }
            }
          }
        }

        const progress = calculateDeckProgress(userCollection, deckJunctions);

        resolvedDecks.push({
          $id: apiDeck.uuid,
          id: apiDeck.uuid,
          title: apiDeck.name || "Trending Deck",
          description: `Trending metagame deck created by ${apiDeck.creator_name || "Unknown"}. Views: ${apiDeck.views || 0}, Likes: ${apiDeck.likes || 0}.`,
          creator_id: apiDeck.creator || "unknown",
          is_public: !apiDeck.is_private,
          progress,
          cards: cardsInDeck,
          youtube: apiDeck.youtube,
          likes: apiDeck.likes,
          views: apiDeck.views,
          creator_name: apiDeck.creator_name,
          is_trending: true,
        });
      }
    }

    // 4. Load database & mock decks (including pre-seeded Set 13 decks and user imported decks)
    {
      const [decks, allDeckCards] = await Promise.all([
        this.getCollection<Deck>(COLLECTIONS.DECKS, [Query.equal("is_public", true)], cookieHeader),
        this.getCollection<DeckCardDoc>(COLLECTIONS.DECK_CARDS, [], cookieHeader),
      ]);

      const cardsMap = new Map<string, Card>();
      for (const card of cards) {
        cardsMap.set(card.id, card);
      }

      for (const deck of decks) {
        // Prevent duplicates
        if (resolvedDecks.some((rd) => rd.id === deck.$id || rd.id === deck.id)) {
          continue;
        }

        const deckJunctions = allDeckCards.filter((dc) => dc.deck_id === deck.$id || deck.id === dc.deck_id);
        const progress = calculateDeckProgress(userCollection, deckJunctions);
        const cardsInDeck = deckJunctions.map((dc) => {
          const cardDetails = cardsMap.get(dc.card_id) || {
            $id: dc.card_id,
            id: dc.card_id,
            name: "Unknown Card",
            set: "Unknown",
            number: 0,
            ink_color: "Neutral",
            cost: 0,
            inkwell: true,
            strength: null,
            willpower: null,
            lore: 0,
            type: [],
            classifications: [],
            rarity: "Common",
            image_url: "",
            formats: ["core", "infinity"],
          };
          return {
            card: cardDetails,
            requiredQty: dc.quantity,
            ownedQty: ownedMap.get(dc.card_id) || 0,
          };
        });

        resolvedDecks.push({
          ...deck,
          progress,
          cards: cardsInDeck,
          is_trending: false,
        });
      }
    }

    // 5. Sort decks
    return resolvedDecks.sort((a, b) => {
      if (sort === "progress") {
        if (b.progress.percentage !== a.progress.percentage) {
          return b.progress.percentage - a.progress.percentage;
        }
        return b.progress.totalCount - a.progress.totalCount;
      }

      if (sort === "missing_cost") {
        const missingA = a.progress.totalCount - a.progress.ownedCount;
        const missingB = b.progress.totalCount - b.progress.ownedCount;
        if (missingA !== missingB) {
          return missingA - missingB;
        }
        return b.progress.percentage - a.progress.percentage;
      }

      return a.title.localeCompare(b.title);
    });
  },

  async createDeck(
    userId: string,
    title: string,
    description: string,
    cards: Array<{ cardId: string; quantity: number }>,
    cookieHeader?: string | null
  ): Promise<{ deck: Deck; deckCards: DeckCardDoc[] }> {
    const deckId = `deck-${Date.now()}`;
    const newDeck: Deck = {
      $id: deckId,
      id: deckId,
      title,
      description,
      creator_id: userId,
      is_public: true,
    };

    const newDeckCards: DeckCardDoc[] = cards.map((c, index) => ({
      $id: `dc-${deckId}-${index}`,
      deck_id: deckId,
      card_id: c.cardId,
      quantity: c.quantity,
    }));

    if (!isConfigured) {
      let userDecks: Deck[] = [];
      let userDeckCards: DeckCardDoc[] = [];

      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        const decksVal = cookies["lorcana_user_decks"];
        if (decksVal) {
          try {
            userDecks = JSON.parse(decksVal);
          } catch (e) {}
        }
        const deckCardsVal = cookies["lorcana_user_deck_cards"];
        if (deckCardsVal) {
          try {
            userDeckCards = JSON.parse(deckCardsVal);
          } catch (e) {}
        }
      }

      userDecks.push(newDeck);
      userDeckCards.push(...newDeckCards);

      saveMockDecks(userDecks);
      saveMockDeckCards(userDeckCards);

      return { deck: newDeck, deckCards: newDeckCards };
    }

    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.DECKS, deckId, {
        id: deckId,
        title,
        description,
        creator_id: userId,
        is_public: true,
      });

      const promises = newDeckCards.map((dc) =>
        databases.createDocument(DATABASE_ID, COLLECTIONS.DECK_CARDS, dc.$id, {
          deck_id: dc.deck_id,
          card_id: dc.card_id,
          quantity: dc.quantity,
        })
      );
      await Promise.all(promises);

      return { deck: newDeck, deckCards: newDeckCards };
    } catch (error: any) {
      // Fall back to mock storage if DB not provisioned yet
      if (error?.code === 404 || error?.type === "database_not_found" || error?.type === "collection_not_found") {
        console.warn("[Appwrite] Decks collection not provisioned — falling back to mock createDeck.");
        saveMockDecks([newDeck]);
        saveMockDeckCards(newDeckCards);
        return { deck: newDeck, deckCards: newDeckCards };
      }
      console.error("Failed to create deck in Appwrite:", error);
      throw error;
    }
  },
};
