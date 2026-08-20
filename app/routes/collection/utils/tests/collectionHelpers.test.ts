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
    });
});
