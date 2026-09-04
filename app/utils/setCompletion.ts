import { SET_INDEX_MAP } from '../constants/lorcana';
import type { Card as LorcanaCard } from '../types/lorcana';
import { buildCardsLookup } from './deck';
import { getCardUnitPrice } from './valuation';

export interface SetProgressStats {
    setName: string;
    setIndex?: number;
    totalCardsInSet: number;
    uniqueCardsOwned: number;
    totalCardsOwned: number;
    standardCardsOwned: number;
    foilCardsOwned: number;
    completionPercentage: number;
    marketValue: number;
}

export type SetCollectionItemInput = {
    card_id: string;
    quantity: number;
    is_foil?: boolean;
    user_id?: string;
};

const SET_NAME_TO_INDEX: Record<string, number> = Object.entries(
    SET_INDEX_MAP,
).reduce(
    (acc, [idx, name]) => {
        acc[name.trim()] = Number(idx);
        return acc;
    },
    {} as Record<string, number>,
);

/**
 * Calculates per-set progress, completion percentages, card counts, and market value.
 * Sets are sorted chronologically by numeric release code (Set 1 to Set 13+),
 * followed by Promo and special sets sorted alphabetically.
 */
export function calculateSetProgress(
    cardsCatalog: LorcanaCard[],
    userCollection: SetCollectionItemInput[],
    cardsLookup?:
        | ReturnType<typeof buildCardsLookup<LorcanaCard>>
        | Map<string, LorcanaCard>,
): SetProgressStats[] {
    if (!cardsCatalog || cardsCatalog.length === 0) {
        return [];
    }

    const lookup = cardsLookup ?? buildCardsLookup(cardsCatalog);

    // 1. Group catalog cards by set
    const setCardsMap = new Map<string, LorcanaCard[]>();
    for (const card of cardsCatalog) {
        if (!card.set) continue;
        const setName = card.set.trim();
        let list = setCardsMap.get(setName);
        if (!list) {
            list = [];
            setCardsMap.set(setName, list);
        }
        list.push(card);
    }

    // 2. Pre-aggregate user collection by canonical card ID
    const ownedMap = new Map<
        string,
        { standardQty: number; foilQty: number }
    >();

    for (const item of userCollection) {
        if (!item || item.quantity <= 0) continue;
        const resolvedCard = lookup.get(item.card_id);
        const canonicalId =
            resolvedCard?.id || resolvedCard?.$id || item.card_id;

        let entry = ownedMap.get(canonicalId);
        if (!entry) {
            entry = { standardQty: 0, foilQty: 0 };
            ownedMap.set(canonicalId, entry);
        }

        if (item.is_foil) {
            entry.foilQty += item.quantity;
        } else {
            entry.standardQty += item.quantity;
        }
    }

    // 3. Compute stats for each set
    const statsList: SetProgressStats[] = [];

    for (const [setName, setCards] of setCardsMap.entries()) {
        const totalCardsInSet = setCards.length;
        let uniqueCardsOwned = 0;
        let standardCardsOwned = 0;
        let foilCardsOwned = 0;
        let marketValue = 0;

        for (const card of setCards) {
            const canonicalId = card.id || card.$id;
            const owned = ownedMap.get(canonicalId) || {
                standardQty: 0,
                foilQty: 0,
            };
            const ownedQty = owned.standardQty + owned.foilQty;

            if (ownedQty > 0) {
                uniqueCardsOwned++;
            }

            standardCardsOwned += owned.standardQty;
            foilCardsOwned += owned.foilQty;

            if (owned.standardQty > 0) {
                const stdPrice = getCardUnitPrice(card, false) || 0;
                marketValue += owned.standardQty * stdPrice;
            }

            if (owned.foilQty > 0) {
                const foilPrice = getCardUnitPrice(card, true) || 0;
                marketValue += owned.foilQty * foilPrice;
            }
        }

        const totalCardsOwned = standardCardsOwned + foilCardsOwned;
        const completionPercentage =
            totalCardsInSet > 0
                ? Math.round((uniqueCardsOwned / totalCardsInSet) * 100)
                : 0;
        const roundedMarketValue = Math.round(marketValue * 100) / 100;
        const setIndex = SET_NAME_TO_INDEX[setName];

        statsList.push({
            setName,
            setIndex,
            totalCardsInSet,
            uniqueCardsOwned,
            totalCardsOwned,
            standardCardsOwned,
            foilCardsOwned,
            completionPercentage,
            marketValue: roundedMarketValue,
        });
    }

    // 4. Sort sets chronologically by release number (1 to 13+), followed by promo sets alphabetically
    statsList.sort((a, b) => {
        if (a.setIndex !== undefined && b.setIndex !== undefined) {
            return a.setIndex - b.setIndex;
        }
        if (a.setIndex !== undefined) return -1;
        if (b.setIndex !== undefined) return 1;
        return a.setName.localeCompare(b.setName);
    });

    return statsList;
}

/**
 * Creates an O(1) lookup map of set name to SetProgressStats.
 */
export function getSetProgressMap(
    stats: SetProgressStats[],
): Map<string, SetProgressStats> {
    const map = new Map<string, SetProgressStats>();
    for (const s of stats) {
        map.set(s.setName, s);
    }
    return map;
}
