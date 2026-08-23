import { type Card } from '../../../types/lorcana';
import { calculateDeckStats } from '../../../utils/deck';

export interface DeckCardItemInput {
    card: Card;
    requiredQty?: number;
    quantity?: number;
}

export interface CardGroupItem {
    card: Card;
    quantity: number;
}

export interface CardGroup {
    groupKey: string;
    label: string;
    totalCount: number;
    cards: CardGroupItem[];
}

export interface GraphicSummary {
    totalCards: number;
    inkableCount: number;
    uninkableCount: number;
    inkablePercentage: number;
    averageCost: number;
    costDistribution: Record<string, number>;
}

/**
 * Normalizes quantity from a deck card entry.
 */
export function getCardQuantity(item: DeckCardItemInput): number {
    if (typeof item.requiredQty === 'number') return item.requiredQty;
    if (typeof item.quantity === 'number') return item.quantity;
    return 1;
}

/**
 * Groups cards by their ink cost (1, 2, 3, 4, 5, 6, 7+).
 * If 0-cost cards exist, includes a '0' tier.
 */
export function groupCardsByCost(cards: DeckCardItemInput[]): CardGroup[] {
    const costMap: Record<string, CardGroupItem[]> = {
        '1': [],
        '2': [],
        '3': [],
        '4': [],
        '5': [],
        '6': [],
        '7+': [],
    };

    let hasZeroCost = false;

    for (const item of cards) {
        if (!item || !item.card) continue;
        const qty = getCardQuantity(item);
        const cost = typeof item.card.cost === 'number' ? item.card.cost : 0;

        if (cost === 0) {
            hasZeroCost = true;
            if (!costMap['0']) costMap['0'] = [];
            costMap['0'].push({ card: item.card, quantity: qty });
        } else {
            const key = cost >= 7 ? '7+' : String(cost);
            costMap[key].push({ card: item.card, quantity: qty });
        }
    }

    const tierKeys = hasZeroCost
        ? ['0', '1', '2', '3', '4', '5', '6', '7+']
        : ['1', '2', '3', '4', '5', '6', '7+'];

    const groups: CardGroup[] = [];

    for (const key of tierKeys) {
        const rawItems = costMap[key] || [];

        // Sort cards within group by cost ascending, then by name ascending
        const sortedItems = [...rawItems].sort((a, b) => {
            if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
            return a.card.name.localeCompare(b.card.name);
        });

        const totalCount = sortedItems.reduce((sum, i) => sum + i.quantity, 0);

        if (sortedItems.length > 0) {
            groups.push({
                groupKey: key,
                label: `${key} INK`,
                totalCount,
                cards: sortedItems,
            });
        }
    }

    return groups;
}

/**
 * Normalizes card type into standard Lorcana primary categories:
 * Characters, Actions, Items, Locations.
 */
export function getPrimaryCardType(card: Card): string {
    if (!card || !Array.isArray(card.type) || card.type.length === 0) {
        return 'Other';
    }

    const typesLower = card.type.map((t) => (t || '').toLowerCase().trim());
    if (typesLower.includes('character')) return 'Characters';
    if (typesLower.includes('action') || typesLower.includes('song'))
        return 'Actions';
    if (typesLower.includes('item')) return 'Items';
    if (typesLower.includes('location')) return 'Locations';

    return 'Other';
}

/**
 * Groups cards by their primary type (Characters, Actions, Items, Locations).
 */
export function groupCardsByType(cards: DeckCardItemInput[]): CardGroup[] {
    const typeOrder = ['Characters', 'Actions', 'Items', 'Locations', 'Other'];
    const typeMap: Record<string, CardGroupItem[]> = {
        Characters: [],
        Actions: [],
        Items: [],
        Locations: [],
        Other: [],
    };

    for (const item of cards) {
        if (!item || !item.card) continue;
        const qty = getCardQuantity(item);
        const primaryType = getPrimaryCardType(item.card);
        typeMap[primaryType].push({ card: item.card, quantity: qty });
    }

    const groups: CardGroup[] = [];

    for (const typeName of typeOrder) {
        const rawItems = typeMap[typeName] || [];
        if (rawItems.length === 0) continue;

        // Sort cards within type group by cost ascending, then by name ascending
        const sortedItems = [...rawItems].sort((a, b) => {
            if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
            return a.card.name.localeCompare(b.card.name);
        });

        const totalCount = sortedItems.reduce((sum, i) => sum + i.quantity, 0);

        groups.push({
            groupKey: typeName.toLowerCase(),
            label: typeName.toUpperCase(),
            totalCount,
            cards: sortedItems,
        });
    }

    return groups;
}

/**
 * Computes summary metrics for visual deck graphics.
 */
export function calculateGraphicSummary(
    cards: DeckCardItemInput[],
): GraphicSummary {
    const stats = calculateDeckStats(cards);
    const costDist: Record<string, number> = {};

    for (const [key, detail] of Object.entries(stats.costDistribution)) {
        costDist[key] = detail.count;
    }

    return {
        totalCards: stats.totalCards,
        inkableCount: stats.inkableCount,
        uninkableCount: stats.uninkableCount,
        inkablePercentage: stats.inkablePercentage,
        averageCost: stats.averageCost,
        costDistribution: costDist,
    };
}
