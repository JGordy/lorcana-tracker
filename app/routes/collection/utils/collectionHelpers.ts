import { KNOWN_SETS } from '../../../constants';
import type { Card as LorcanaCard } from '../../../types/lorcana';

export const INK_COLORS: Record<string, string> = {
    amber: '#F5B041',
    amethyst: '#AF7AC5',
    emerald: '#2ECC71',
    ruby: '#EC7063',
    sapphire: '#5DADE2',
    steel: '#A6ACAF',
};

export function getInkBadgeStyle(inkColorString: string | null) {
    if (!inkColorString) {
        return {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.15)',
            color: '#ffffff',
            textTransform: 'uppercase' as const,
            fontWeight: 700,
            letterSpacing: '0.5px',
        };
    }

    const primaryInk = inkColorString.split('/')[0].trim().toLowerCase();
    const hex = INK_COLORS[primaryInk] || '#ffffff';

    return {
        backgroundColor: `${hex}1F`, // ~12% opacity background
        borderColor: `${hex}66`, // ~40% opacity border
        color: hex,
        textTransform: 'uppercase' as const,
        fontWeight: 700,
        letterSpacing: '0.5px',
    };
}

export const SPECIAL_RARITIES = new Set([
    'Enchanted',
    'Epic',
    'Iconic',
    'Promo',
]);

export function sortSets(databaseSets: string[]): string[] {
    return [...databaseSets].sort((a, b) => {
        const idxA = KNOWN_SETS.indexOf(a);
        const idxB = KNOWN_SETS.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
}

import { getCardBestPrice } from '../../../utils/valuation';

export function getCardSortPrice(
    card: LorcanaCard,
    selectedOwnership?: string,
    getCardQuantity?: (card: LorcanaCard, isFoil: boolean) => number,
): number | null {
    if (getCardQuantity) {
        const qtyNormal = getCardQuantity(card, false);
        const qtyFoil = getCardQuantity(card, true);

        if (selectedOwnership === 'owned') {
            if (qtyFoil > 0 && qtyNormal > 0) {
                const pFoil = card.prices?.usd_foil ?? card.prices?.usd ?? null;
                const pNorm = card.prices?.usd ?? null;
                if (pFoil != null && pNorm != null)
                    return Math.max(pFoil, pNorm);
                return pFoil ?? pNorm;
            }
            if (qtyFoil > 0) {
                return card.prices?.usd_foil ?? card.prices?.usd ?? null;
            }
            if (qtyNormal > 0) {
                return card.prices?.usd ?? null;
            }
        } else if (selectedOwnership === 'foil') {
            return card.prices?.usd_foil ?? card.prices?.usd ?? null;
        } else if (selectedOwnership === 'non_foil') {
            return card.prices?.usd ?? null;
        }
    }

    return getCardBestPrice(card);
}

export interface SortCardsOptions {
    selectedOwnership?: string;
    getCardQuantity?: (card: LorcanaCard, isFoil: boolean) => number;
}

export function sortCards(
    cards: LorcanaCard[],
    sortBy: string = 'default',
    options?: SortCardsOptions,
): LorcanaCard[] {
    const { selectedOwnership, getCardQuantity } = options || {};

    return [...cards].sort((a, b) => {
        if (sortBy === 'price_desc') {
            const priceA =
                getCardSortPrice(a, selectedOwnership, getCardQuantity) ?? -1;
            const priceB =
                getCardSortPrice(b, selectedOwnership, getCardQuantity) ?? -1;
            if (priceB !== priceA) return priceB - priceA;
            return a.name.localeCompare(b.name);
        }

        if (sortBy === 'price_asc') {
            const priceA = getCardSortPrice(
                a,
                selectedOwnership,
                getCardQuantity,
            );
            const priceB = getCardSortPrice(
                b,
                selectedOwnership,
                getCardQuantity,
            );
            if (priceA == null && priceB == null) return 0;
            if (priceA == null) return 1;
            if (priceB == null) return -1;
            if (priceA !== priceB) return priceA - priceB;
            return a.name.localeCompare(b.name);
        }

        if (sortBy === 'cost_asc') {
            if (a.cost !== b.cost) return a.cost - b.cost;
            return a.name.localeCompare(b.name);
        }

        if (sortBy === 'cost_desc') {
            if (a.cost !== b.cost) return b.cost - a.cost;
            return a.name.localeCompare(b.name);
        }

        if (sortBy === 'name_asc') {
            return a.name.localeCompare(b.name);
        }

        // Default set + collector number sorting
        const idxA = KNOWN_SETS.indexOf(a.set);
        const idxB = KNOWN_SETS.indexOf(b.set);
        if (idxA !== -1 && idxB !== -1) {
            if (idxA !== idxB) {
                return idxA - idxB;
            }
        } else if (idxA !== -1) {
            return -1;
        } else if (idxB !== -1) {
            return 1;
        } else {
            const setComp = a.set.localeCompare(b.set);
            if (setComp !== 0) return setComp;
        }
        return a.number - b.number;
    });
}
