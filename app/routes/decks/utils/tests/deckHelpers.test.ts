import { describe, it, expect } from 'vitest';
import { getInkBadgeStyle, filterDecks } from '../deckHelpers';

describe('deckHelpers', () => {
    describe('getInkBadgeStyle', () => {
        it('returns correct color styles for amber', () => {
            const style = getInkBadgeStyle('amber');
            expect(style.color).toBe('#F5B041');
            expect(style.textTransform).toBe('uppercase');
        });

        it('returns default slate for unknown ink', () => {
            const style = getInkBadgeStyle('unknown');
            expect(style.color).toBe('#94a3b8');
        });
    });

    describe('filterDecks', () => {
        const mockDecks: any[] = [
            {
                $id: 'd1',
                title: 'Amber Ruby Aggro',
                description: 'Fast lore deck',
                cards: [{ card: { formats: ['core', 'infinity'] } }],
            },
            {
                $id: 'd2',
                title: 'Sapphire Steel Control',
                description: 'Late game ramp',
                cards: [{ card: { formats: ['infinity'] } }],
            },
        ];

        it('filters decks by search query matching title', () => {
            const result = filterDecks(mockDecks, 'Amber');
            expect(result).toHaveLength(1);
            expect(result[0].$id).toBe('d1');
        });

        it('filters decks by search query matching description', () => {
            const result = filterDecks(mockDecks, 'ramp');
            expect(result).toHaveLength(1);
            expect(result[0].$id).toBe('d2');
        });

        it('calculates isCoreLegal correctly', () => {
            const result = filterDecks(mockDecks, '');
            expect(result[0].isCoreLegal).toBe(true);
            expect(result[1].isCoreLegal).toBe(false);
        });
    });
});
