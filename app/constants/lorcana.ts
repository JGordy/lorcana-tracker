// ---------------------------------------------------------
// Disney Lorcana Master Domain Constants
// ---------------------------------------------------------

/**
 * Appwrite Database Collection Identifiers
 */
export const COLLECTIONS = {
    CARDS: 'cards',
    DECKS: 'decks',
    DECK_CARDS: 'deck_cards',
    USER_COLLECTIONS: 'user_collections',
    WISHLISTS: 'wishlists',
} as const;

/**
 * Reverse chronological release order of Lorcana sets (newest at the top)
 */
export const KNOWN_SETS: readonly string[] = [
    'Attack of the Vine!',
    'Wilds Unknown',
    'Winterspell',
    'Whispers in the Well',
    'Fabled',
    'Reign of Jafar',
    "Archazia's Island",
    'Azurite Sea',
    'Shimmering Skies',
    "Ursula's Return",
    'Into the Inklands',
    'Rise of the Floodborn',
    'The First Chapter',
];

/**
 * Numeric Set Code Index mapping (Lorcana Set # -> Set Title)
 */
export const SET_INDEX_MAP: Record<number, string> = {
    1: 'The First Chapter',
    2: 'Rise of the Floodborn',
    3: 'Into the Inklands',
    4: "Ursula's Return",
    5: 'Shimmering Skies',
    6: 'Azurite Sea',
    7: "Archazia's Island",
    8: 'Reign of Jafar',
    9: 'Fabled',
    10: 'Whispers in the Well',
    11: 'Winterspell',
    12: 'Wilds Unknown',
    13: 'Attack of the Vine!',
};

/**
 * Promo Set Code mapping
 */
export const PROMO_SET_NAMES: Record<string, string> = {
    P1: 'Promo Set 1',
    P2: 'Promo Set 2',
    P3: 'Promo Set 3',
    P4: 'Promo Set 4',
    PD1: 'PD1',
    CP: 'Challenge Promo',
    cp: 'Challenge Promo',
    C1: 'Challenge Promo Year 1',
    C2: 'Lorcana Challenge Year 3',
    D23: 'D23 Collection',
    DIS: 'EPCOT Festival of the Arts',
    CC1: 'Collector Club Promo',
    Q1: "Illumineer's Quest: Deep Trouble",
    Q2: "Illumineer's Quest: Palace Heist",
};

/**
 * Rarity to Theme Hex Color Palette Mapping
 */
export const RARITY_COLOR: Record<string, string> = {
    Enchanted: '#e879f9',
    Iconic: '#fbbf24',
    Epic: '#c084fc',
    Legendary: '#f59e0b',
    'Super Rare': '#38bdf8',
    Rare: '#4ade80',
    Uncommon: '#94a3b8',
    Common: '#64748b',
    Promo: '#ec4899',
};

/**
 * Ink Color Hex Mapping
 */
export const INK_HEX_MAP: Record<string, string> = {
    amber: '#F5B041',
    amethyst: '#AF7AC5',
    emerald: '#2ECC71',
    ruby: '#EC7063',
    sapphire: '#5DADE2',
    steel: '#A6ACAF',
};

/**
 * Core Format Legality Config & Display Labels
 * Standard Core Construction format (currently Sets 9–13 legal).
 * Centralized constant to easily update upon future format rotations (e.g. 2027).
 */
export const CORE_FORMAT_SET_RANGE_LABEL = 'Sets 9–13 Standard';

export const DECK_FORMAT_OPTIONS = [
    {
        value: 'core',
        label: `Core Legal (${CORE_FORMAT_SET_RANGE_LABEL})`,
    },
    {
        value: 'infinity',
        label: 'Infinity (All Sets & Promos)',
    },
] as const;
