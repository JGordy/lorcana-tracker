import type { Card as LorcanaCard } from '../types/lorcana';
import { type UserCollectionItem, type buildCardsLookup } from './deck';

export interface TopGemItem {
    card: LorcanaCard;
    isFoil: boolean;
    quantity: number;
    unitPrice: number;
    totalValue: number;
}

export interface CollectionValuationResult {
    totalValue: number;
    standardValue: number;
    foilValue: number;
    standardCount: number;
    foilCount: number;
    totalOwnedCount: number;
    uniqueOwnedCount: number;
    pricedCount: number;
    unpricedCount: number;
    topGems: TopGemItem[];
}

export interface DeckCostResult {
    totalDeckCost: number;
    costToFinish: number;
    missingCardsValuationCount: number;
    missingCardsTotalCount: number;
    pricedCardsCount: number;
    totalRequiredCards: number;
}

/**
 * Formats a number to USD currency (e.g. $1,234.56, $0.25).
 * Returns fallback (default: "—") when amount is null/undefined/NaN.
 */
export function formatCurrency(
    amount: number | null | undefined,
    fallback = '—',
): string {
    if (amount == null || isNaN(amount)) {
        return fallback;
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Resolves the unit market price for a card given its foil condition.
 * For foil cards, falls back to standard price if foil price is absent.
 */
export function getCardUnitPrice(
    card: LorcanaCard | undefined | null,
    isFoil: boolean,
): number | null {
    if (!card?.prices) return null;

    if (isFoil) {
        if (card.prices.usd_foil != null && !isNaN(card.prices.usd_foil)) {
            return card.prices.usd_foil;
        }
        if (card.prices.usd != null && !isNaN(card.prices.usd)) {
            return card.prices.usd;
        }
        return null;
    }

    if (card.prices.usd != null && !isNaN(card.prices.usd)) {
        return card.prices.usd;
    }

    return null;
}

/**
 * Gets the highest available market price for a card (useful for general sorting / highlights).
 */
export function getCardBestPrice(
    card: LorcanaCard | undefined | null,
): number | null {
    if (!card?.prices) return null;
    const standard =
        card.prices.usd != null && !isNaN(card.prices.usd)
            ? card.prices.usd
            : null;
    const foil =
        card.prices.usd_foil != null && !isNaN(card.prices.usd_foil)
            ? card.prices.usd_foil
            : null;

    if (standard != null && foil != null) return Math.max(standard, foil);
    return standard ?? foil ?? null;
}

/**
 * Calculates comprehensive collection market valuation, including standard vs foil split,
 * priced coverage, and ranked Top Value Gems.
 */
export function calculateCollectionValuation(
    userCollection: UserCollectionItem[],
    cardsLookup: ReturnType<typeof buildCardsLookup<LorcanaCard>>,
): CollectionValuationResult {
    let standardValue = 0;
    let foilValue = 0;
    let standardCount = 0;
    let foilCount = 0;
    let pricedCount = 0;
    let unpricedCount = 0;

    const uniqueOwnedIds = new Set<string>();
    const gemsList: TopGemItem[] = [];

    for (const item of userCollection) {
        if (!item || item.quantity <= 0) continue;

        const qty = item.quantity;
        const isFoil = Boolean(item.is_foil);
        const resolvedCard = cardsLookup.get(item.card_id);

        if (isFoil) {
            foilCount += qty;
        } else {
            standardCount += qty;
        }

        const canonicalId = resolvedCard ? resolvedCard.id : item.card_id;
        uniqueOwnedIds.add(canonicalId);

        if (!resolvedCard) {
            unpricedCount += qty;
            continue;
        }

        const unitPrice = getCardUnitPrice(resolvedCard, isFoil);
        if (unitPrice != null && unitPrice > 0) {
            const itemTotal = unitPrice * qty;
            if (isFoil) {
                foilValue += itemTotal;
            } else {
                standardValue += itemTotal;
            }
            pricedCount += qty;

            gemsList.push({
                card: resolvedCard,
                isFoil,
                quantity: qty,
                unitPrice,
                totalValue: itemTotal,
            });
        } else {
            unpricedCount += qty;
        }
    }

    // Sort gems by highest unit market price, then total owned value
    gemsList.sort((a, b) => {
        if (b.unitPrice !== a.unitPrice) {
            return b.unitPrice - a.unitPrice;
        }
        return b.totalValue - a.totalValue;
    });

    const topGems = gemsList.slice(0, 10);
    const totalValue = Math.round((standardValue + foilValue) * 100) / 100;

    return {
        totalValue,
        standardValue: Math.round(standardValue * 100) / 100,
        foilValue: Math.round(foilValue * 100) / 100,
        standardCount,
        foilCount,
        totalOwnedCount: standardCount + foilCount,
        uniqueOwnedCount: uniqueOwnedIds.size,
        pricedCount,
        unpricedCount,
        topGems,
    };
}

/**
 * Calculates estimated deck market cost and cost to complete missing cards.
 */
export function calculateDeckCost(
    deckCards: Array<{
        card: LorcanaCard;
        requiredQty?: number;
        quantity?: number;
        ownedQty?: number;
    }>,
): DeckCostResult {
    let totalDeckCost = 0;
    let costToFinish = 0;
    let missingCardsValuationCount = 0;
    let missingCardsTotalCount = 0;
    let pricedCardsCount = 0;
    let totalRequiredCards = 0;

    if (Array.isArray(deckCards)) {
        for (const entry of deckCards) {
            const card = entry?.card;
            if (!card) continue;

            const reqQty =
                typeof entry.requiredQty === 'number'
                    ? entry.requiredQty
                    : typeof entry.quantity === 'number'
                      ? entry.quantity
                      : 1;
            const ownedQty =
                typeof entry.ownedQty === 'number' ? entry.ownedQty : 0;
            const missingQty = Math.max(0, reqQty - ownedQty);

            totalRequiredCards += reqQty;
            missingCardsTotalCount += missingQty;

            // Use standard price (or foil price fallback) for deck building valuation
            const unitPrice =
                getCardUnitPrice(card, false) ?? getCardUnitPrice(card, true);

            if (unitPrice != null && unitPrice > 0) {
                totalDeckCost += unitPrice * reqQty;
                pricedCardsCount += reqQty;

                if (missingQty > 0) {
                    costToFinish += unitPrice * missingQty;
                    missingCardsValuationCount += missingQty;
                }
            }
        }
    }

    return {
        totalDeckCost: Math.round(totalDeckCost * 100) / 100,
        costToFinish: Math.round(costToFinish * 100) / 100,
        missingCardsValuationCount,
        missingCardsTotalCount,
        pricedCardsCount,
        totalRequiredCards,
    };
}
