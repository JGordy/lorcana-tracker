import {
    type UserCollectionItem,
    type DeckCard,
    type ProgressResult,
} from '../utils/deck';

// Lorcana Inks Configuration Constant
export const ALL_INKS = [
    { id: 'amber', name: 'Amber', hex: '#F5B041' },
    { id: 'amethyst', name: 'Amethyst', hex: '#AF7AC5' },
    { id: 'emerald', name: 'Emerald', hex: '#2ECC71' },
    { id: 'ruby', name: 'Ruby', hex: '#EC7063' },
    { id: 'sapphire', name: 'Sapphire', hex: '#5DADE2' },
    { id: 'steel', name: 'Steel', hex: '#A6ACAF' },
] as const;

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

export { COLLECTIONS, SET_INDEX_MAP } from '../constants';

export const SET_NAME_TO_INDEX: Record<string, number> = {
    'The First Chapter': 1,
    'Rise of the Floodborn': 2,
    'Into the Inklands': 3,
    "Ursula's Return": 4,
    'Shimmering Skies': 5,
    'Azurite Sea': 6,
    "Archazia's Island": 7,
    'Reign of Jafar': 8,
    Fabled: 9,
    'Whispers in the Well': 10,
    Winterspell: 11,
    'Wilds Unknown': 12,
    'Attack of the Vine!': 13,
    'Format Coconut': 14,
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
        const isCore =
            (setIdx !== undefined && setIdx >= 9) ||
            legalCardNames.has(card.name.toLowerCase().trim());
        card.formats = isCore ? ['core', 'infinity'] : ['infinity'];
    }
    return cards;
}
