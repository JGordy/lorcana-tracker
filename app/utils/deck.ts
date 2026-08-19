export interface UserCollectionItem {
    user_id: string;
    card_id: string;
    quantity: number;
    is_foil: boolean;
}

export interface DeckCard {
    deck_id: string;
    card_id: string;
    quantity: number;
}

export interface ProgressResult {
    percentage: number;
    ownedCount: number;
    totalCount: number;
    missingCards: Array<{
        cardId: string;
        required: number;
        owned: number;
        missing: number;
    }>;
}

/**
 * Calculates the user's collection completion progress for a given deck.
 * Sums foil and non-foil versions of owned cards, matches them against the deck list,
 * and outputs the percentage, missing cards, and absolute totals.
 *
 * @param userCollection User's inventory items
 * @param deckCards Deck requirements junction list
 */
export function calculateDeckProgress(
    userCollection: UserCollectionItem[],
    deckCards: DeckCard[],
): ProgressResult {
    // 1. Aggregate user collection quantities by card_id
    const ownedMap: Record<string, number> = {};
    for (const item of userCollection) {
        if (item.quantity > 0) {
            ownedMap[item.card_id] =
                (ownedMap[item.card_id] || 0) + item.quantity;
        }
    }

    let ownedCount = 0;
    let totalCount = 0;
    const missingCards: ProgressResult['missingCards'] = [];

    // 2. Compare deck requirements with owned counts
    for (const req of deckCards) {
        const requiredQty = req.quantity;
        totalCount += requiredQty;

        const ownedQty = ownedMap[req.card_id] || 0;
        const matching = Math.min(requiredQty, ownedQty);
        ownedCount += matching;

        if (ownedQty < requiredQty) {
            missingCards.push({
                cardId: req.card_id,
                required: requiredQty,
                owned: ownedQty,
                missing: requiredQty - ownedQty,
            });
        }
    }

    // 3. Compute progress percentage rounded to 1 decimal place
    const percentage = totalCount > 0 ? (ownedCount / totalCount) * 100 : 0;
    const roundedPercentage = Math.round(percentage * 10) / 10;

    return {
        percentage: roundedPercentage,
        ownedCount,
        totalCount,
        missingCards,
    };
}

/**
 * Normalizes card names into standardized slug IDs (lowercase, alphanumeric and hyphens only).
 * Ensures robust matching across varied API schemas.
 */
export function getCardSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove punctuation
        .trim()
        .replace(/[\s-]+/g, '-'); // collapse spaces and dashes to a single dash
}

export interface DeckMetadata {
    format?: string;
    inks?: string[];
    description?: string;
    coverCardId?: string;
}

export const RARITY_RANK: Record<string, number> = {
    Enchanted: 7,
    Iconic: 6,
    Epic: 5,
    Legendary: 4,
    'Super Rare': 3,
    Rare: 2,
    Uncommon: 1,
    Common: 0,
};

export const RARITY_COLOR: Record<string, string> = {
    Enchanted: '#e879f9',
    Iconic: '#fbbf24',
    Epic: '#c084fc',
    Legendary: '#f59e0b',
    'Super Rare': '#38bdf8',
    Rare: '#4ade80',
    Uncommon: '#94a3b8',
    Common: '#64748b',
};

export const INK_HEX_MAP: Record<string, string> = {
    amber: '#F5B041',
    amethyst: '#AF7AC5',
    emerald: '#2ECC71',
    ruby: '#EC7063',
    sapphire: '#5DADE2',
    steel: '#A6ACAF',
};

export function parseDeckMetadata(desc: string | undefined): DeckMetadata {
    if (!desc) return { format: 'core', inks: [], description: '' };
    try {
        const parsed = JSON.parse(desc);
        if (
            parsed &&
            typeof parsed === 'object' &&
            ('format' in parsed ||
                'inks' in parsed ||
                'description' in parsed ||
                'coverCardId' in parsed)
        ) {
            return {
                format: parsed.format || 'core',
                inks: Array.isArray(parsed.inks) ? parsed.inks : [],
                description: parsed.description || '',
                coverCardId: parsed.coverCardId,
            };
        }
    } catch {
        // Not a JSON payload, treat whole string as plain text description
    }
    return { format: 'core', inks: [], description: desc };
}

export function getFeaturedDeckCard<
    T extends {
        id: string;
        $id?: string;
        rarity?: string;
        cost?: number;
        image_url?: string;
        name?: string;
    },
>(
    deckCards: Array<{ card: T; requiredQty?: number }>,
    coverCardId?: string,
): T | null {
    if (!deckCards || deckCards.length === 0) return null;
    if (coverCardId && coverCardId !== 'auto') {
        const found = deckCards.find(
            (dc) => dc.card.id === coverCardId || dc.card.$id === coverCardId,
        );
        if (found) return found.card;
    }
    // Highest rarity first, then highest cost
    const sorted = [...deckCards].sort((a, b) => {
        const rankA = RARITY_RANK[a.card.rarity || 'Common'] ?? -1;
        const rankB = RARITY_RANK[b.card.rarity || 'Common'] ?? -1;
        if (rankB !== rankA) return rankB - rankA;
        return (b.card.cost || 0) - (a.card.cost || 0);
    });
    return sorted[0]?.card || null;
}

export function getKeyDeckCards<
    T extends {
        id: string;
        $id?: string;
        rarity?: string;
        cost?: number;
        image_url?: string;
        name?: string;
        ink_color?: string;
    },
>(deckCards: Array<{ card: T; requiredQty?: number }>, limit = 4): T[] {
    if (!deckCards || deckCards.length === 0) return [];
    // Sort by highest rarity first, then highest ink cost
    const sorted = [...deckCards].sort((a, b) => {
        const rankA = RARITY_RANK[a.card.rarity || 'Common'] ?? -1;
        const rankB = RARITY_RANK[b.card.rarity || 'Common'] ?? -1;
        if (rankB !== rankA) return rankB - rankA;
        return (b.card.cost || 0) - (a.card.cost || 0);
    });

    const uniqueCards: T[] = [];
    const seenIds = new Set<string>();

    for (const dc of sorted) {
        if (!seenIds.has(dc.card.id)) {
            seenIds.add(dc.card.id);
            uniqueCards.push(dc.card);
            if (uniqueCards.length >= limit) break;
        }
    }

    return uniqueCards;
}
