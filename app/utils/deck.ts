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
    cardsCatalog?: Array<{ id: string; $id?: string; name: string }>,
): ProgressResult {
    const cardsLookup = cardsCatalog ? buildCardsLookup(cardsCatalog) : null;

    // 1. Aggregate user collection quantities by card_id, canonical card_id, and base slug
    const ownedMap: Record<string, number> = {};
    for (const item of userCollection) {
        if (item.quantity > 0) {
            ownedMap[item.card_id] =
                (ownedMap[item.card_id] || 0) + item.quantity;

            if (cardsLookup) {
                const resolvedCard = cardsLookup.get(item.card_id);
                if (resolvedCard && resolvedCard.id !== item.card_id) {
                    ownedMap[resolvedCard.id] =
                        (ownedMap[resolvedCard.id] || 0) + item.quantity;
                }
            } else {
                const baseSlug = getCardSlug(
                    item.card_id
                        .replace(/-(set|promo)-[a-z0-9]+-\d+$/i, '')
                        .replace(/-\d+-\d+$/i, ''),
                );
                if (baseSlug && baseSlug !== item.card_id) {
                    ownedMap[baseSlug] =
                        (ownedMap[baseSlug] || 0) + item.quantity;
                }
            }
        }
    }

    let ownedCount = 0;
    let totalCount = 0;
    const missingCards: ProgressResult['missingCards'] = [];

    // 2. Compare deck requirements with owned counts
    for (const req of deckCards) {
        const requiredQty = req.quantity;
        totalCount += requiredQty;

        let canonicalId = req.card_id;
        if (cardsLookup) {
            const resolved = cardsLookup.get(req.card_id);
            if (resolved) canonicalId = resolved.id;
        }

        const reqSlug = getCardSlug(
            req.card_id
                .replace(/-(set|promo)-[a-z0-9]+-\d+$/i, '')
                .replace(/-\d+-\d+$/i, ''),
        );
        const ownedQty =
            ownedMap[canonicalId] ||
            ownedMap[req.card_id] ||
            (reqSlug ? ownedMap[reqSlug] : 0) ||
            0;
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

export function buildCardsLookup<
    T extends { id: string; $id?: string; name: string },
>(cards: T[]) {
    const map = new Map<string, T>();
    for (const card of cards) {
        map.set(card.id, card);
        if (card.$id) map.set(card.$id, card);

        const baseSlug = getCardSlug(card.name);
        if (baseSlug && !map.has(baseSlug)) {
            map.set(baseSlug, card);
        }

        const alphaNum = card.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (alphaNum && !map.has(alphaNum)) {
            map.set(alphaNum, card);
        }
    }

    return {
        get(cardId: string): T | undefined {
            if (!cardId) return undefined;
            if (map.has(cardId)) return map.get(cardId);

            const slug = getCardSlug(cardId);
            if (map.has(slug)) return map.get(slug);

            // Strip set/promo/number suffixes (e.g. -set-13-3, -12-15, -12-205, -p3-53, -15)
            const strippedSlug = getCardSlug(
                cardId
                    .replace(/-(set|promo)-[a-z0-9]+-\d+$/i, '')
                    .replace(/-\d+-\d+$/i, '')
                    .replace(/-\d+$/i, ''),
            );
            if (strippedSlug && map.has(strippedSlug))
                return map.get(strippedSlug);

            // Try alphanumeric string (handles apostrophes and hyphens)
            const alphaNum = cardId.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (alphaNum && map.has(alphaNum)) return map.get(alphaNum);

            const strippedAlphaNum = strippedSlug
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
            if (strippedAlphaNum && map.has(strippedAlphaNum))
                return map.get(strippedAlphaNum);

            // Fuzzy substring matching
            const targetClean = getCardSlug(cardId).replace(/-/g, ' ');
            for (const card of cards) {
                const cardNameClean = getCardSlug(card.name).replace(/-/g, ' ');
                if (
                    cardNameClean &&
                    (targetClean.includes(cardNameClean) ||
                        cardNameClean.includes(targetClean))
                ) {
                    return card;
                }
            }

            return undefined;
        },
    };
}

export interface DeckMetadata {
    format: 'core' | 'infinity';
    inks: string[];
    description: string;
    coverCardId?: string;
    is_active?: boolean;
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

export { RARITY_COLOR, INK_HEX_MAP } from '../constants';

export function parseDeckMetadata(desc: string | undefined): DeckMetadata {
    if (!desc)
        return { format: 'core', inks: [], description: '', is_active: false };
    try {
        const parsed = JSON.parse(desc);
        if (
            parsed &&
            typeof parsed === 'object' &&
            ('format' in parsed ||
                'inks' in parsed ||
                'description' in parsed ||
                'coverCardId' in parsed ||
                'is_active' in parsed)
        ) {
            return {
                format: parsed.format === 'infinity' ? 'infinity' : 'core',
                inks: Array.isArray(parsed.inks) ? parsed.inks : [],
                description: parsed.description || '',
                coverCardId: parsed.coverCardId,
                is_active: Boolean(parsed.is_active),
            };
        }
    } catch {
        // Not a JSON payload, treat whole string as plain text description
    }
    return { format: 'core', inks: [], description: desc, is_active: false };
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

export interface CostTierDetail {
    cost: number;
    count: number;
    inkable: number;
    uninkable: number;
    inkDistribution: Record<string, number>;
    cards: Array<{ card: any; quantity: number }>;
}

export interface DeckStatsResult {
    totalCards: number;
    averageCost: number;
    inkableCount: number;
    uninkableCount: number;
    inkablePercentage: number;
    costDistribution: Record<string, CostTierDetail>;
    earlyCurveCount: number;
    typeDistribution: Record<string, number>;
}

/**
 * Calculates complete 60-card deck statistics, including cost distribution curve,
 * inkable/uninkable breakdown, ink color distribution, average cost, and early curve count.
 */
export function calculateDeckStats(deckCards: any[]): DeckStatsResult {
    let totalCards = 0;
    let totalCost = 0;
    let inkableCount = 0;
    let uninkableCount = 0;
    let earlyCurveCount = 0;
    const costDistribution: Record<string, CostTierDetail> = {};
    const typeDistribution: Record<string, number> = {};

    if (Array.isArray(deckCards)) {
        for (const entry of deckCards) {
            const card = entry?.card || entry;
            const qty =
                typeof entry?.requiredQty === 'number'
                    ? entry.requiredQty
                    : typeof entry?.quantity === 'number'
                      ? entry.quantity
                      : 1;

            if (!card) continue;

            const cost = typeof card.cost === 'number' ? card.cost : 0;
            const isInkable = Boolean(card.inkwell);
            const tierKey = cost >= 7 ? '7+' : String(cost);
            const inkColor = (
                card.ink_color ||
                card.magic ||
                card.ink ||
                card.color ||
                'steel'
            )
                .toString()
                .trim()
                .toLowerCase();

            totalCards += qty;
            totalCost += cost * qty;

            if (isInkable) {
                inkableCount += qty;
            } else {
                uninkableCount += qty;
            }

            if (cost === 1 || cost === 2) {
                earlyCurveCount += qty;
            }

            // Types
            if (Array.isArray(card.type)) {
                for (const t of card.type) {
                    if (t) {
                        const norm = t.trim().toLowerCase();
                        typeDistribution[norm] =
                            (typeDistribution[norm] || 0) + qty;
                    }
                }
            }

            if (!costDistribution[tierKey]) {
                costDistribution[tierKey] = {
                    cost: cost >= 7 ? 7 : cost,
                    count: 0,
                    inkable: 0,
                    uninkable: 0,
                    inkDistribution: {},
                    cards: [],
                };
            }

            costDistribution[tierKey].count += qty;
            if (isInkable) {
                costDistribution[tierKey].inkable += qty;
            } else {
                costDistribution[tierKey].uninkable += qty;
            }
            costDistribution[tierKey].inkDistribution[inkColor] =
                (costDistribution[tierKey].inkDistribution[inkColor] || 0) +
                qty;
            costDistribution[tierKey].cards.push({ card, quantity: qty });
        }
    }

    const averageCost =
        totalCards > 0 ? Math.round((totalCost / totalCards) * 10) / 10 : 0;
    const inkablePercentage =
        totalCards > 0 ? Math.round((inkableCount / totalCards) * 100) : 0;

    return {
        totalCards,
        averageCost,
        inkableCount,
        uninkableCount,
        inkablePercentage,
        costDistribution,
        earlyCurveCount,
        typeDistribution,
    };
}
