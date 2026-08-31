import { describe, it, expect } from 'vitest';
import {
    getInkBadgeStyle,
    sortSets,
    sortCards,
    INK_COLORS,
    SPECIAL_RARITIES,
} from '../collectionHelpers';
import type { Card as LorcanaCard } from '../../../../types/lorcana';

describe('collectionHelpers', () => {
    describe('getInkBadgeStyle', () => {
        it('returns fallback styling when ink color is null or empty', () => {
            const style = getInkBadgeStyle(null);
            expect(style.color).toBe('#ffffff');
            expect(style.backgroundColor).toBe('rgba(255,255,255,0.05)');
        });

        it('returns matching ink color style when primary ink matches known colors', () => {
            const amberStyle = getInkBadgeStyle('Amber/Steel');
            expect(amberStyle.color).toBe(INK_COLORS.amber);
            expect(amberStyle.backgroundColor).toBe(`${INK_COLORS.amber}1F`);
        });

        it('handles unknown ink colors gracefully', () => {
            const unknownStyle = getInkBadgeStyle('Unknown');
            expect(unknownStyle.color).toBe('#ffffff');
        });
    });

    describe('SPECIAL_RARITIES', () => {
        it('contains expected special rarities', () => {
            expect(SPECIAL_RARITIES.has('Enchanted')).toBe(true);
            expect(SPECIAL_RARITIES.has('Epic')).toBe(true);
            expect(SPECIAL_RARITIES.has('Iconic')).toBe(true);
            expect(SPECIAL_RARITIES.has('Promo')).toBe(true);
            expect(SPECIAL_RARITIES.has('Common')).toBe(false);
        });
    });

    describe('sortSets', () => {
        it('sorts sets based on KNOWN_SETS order and falls back to alphabetical', () => {
            const sets = [
                'Unknown Set B',
                'The First Chapter',
                'Unknown Set A',
                'Rise of the Floodborn',
            ];
            const sorted = sortSets(sets);
            expect(sorted[0]).toBe('Rise of the Floodborn');
            expect(sorted[1]).toBe('The First Chapter');
            expect(sorted[2]).toBe('Unknown Set A');
            expect(sorted[3]).toBe('Unknown Set B');
        });
    });

    describe('sortCards', () => {
        it('sorts cards by set release order and then by card number', () => {
            const mockCards = [
                {
                    id: 'c2',
                    set: 'The First Chapter',
                    number: 10,
                } as LorcanaCard,
                {
                    id: 'c1',
                    set: 'The First Chapter',
                    number: 2,
                } as LorcanaCard,
                {
                    id: 'c3',
                    set: 'Rise of the Floodborn',
                    number: 1,
                } as LorcanaCard,
            ];
            const sorted = sortCards(mockCards);
            expect(sorted[0].id).toBe('c3');
            expect(sorted[1].id).toBe('c1');
            expect(sorted[2].id).toBe('c2');
        });

        it('sorts cards by price descending with ownership awareness', () => {
            const mickey = {
                id: 'mickey',
                name: 'Mickey Mouse',
                set: 'The First Chapter',
                number: 115,
                prices: { usd: 13.18, usd_foil: 82.01 },
            } as LorcanaCard;

            const shereKhan = {
                id: 'shere-khan',
                name: 'Shere Khan',
                set: 'Rise of the Floodborn',
                number: 212,
                prices: { usd: null, usd_foil: 61.89 },
            } as LorcanaCard;

            const cards = [mickey, shereKhan];

            // 1. Without ownership options (default catalog behavior): Mickey has $82.01 foil > Shere Khan $61.89
            const defaultSorted = sortCards(cards, 'price_desc');
            expect(defaultSorted[0].id).toBe('mickey');
            expect(defaultSorted[1].id).toBe('shere-khan');

            // 2. With owned filter where user owns 1 standard Mickey ($13.18) and 1 foil Shere Khan ($61.89)
            const mockGetQty = (card: LorcanaCard, isFoil: boolean) => {
                if (card.id === 'mickey') return isFoil ? 0 : 1;
                if (card.id === 'shere-khan') return isFoil ? 1 : 0;
                return 0;
            };

            const ownedSorted = sortCards(cards, 'price_desc', {
                selectedOwnership: 'owned',
                getCardQuantity: mockGetQty,
            });

            // Shere Khan ($61.89 foil owned) should now sort ABOVE Mickey ($13.18 standard owned)
            expect(ownedSorted[0].id).toBe('shere-khan');
            expect(ownedSorted[1].id).toBe('mickey');
        });
    });
});
