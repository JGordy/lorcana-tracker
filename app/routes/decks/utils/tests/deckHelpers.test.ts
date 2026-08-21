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

    describe('filterDecks & completion filtering', () => {
        const mockDecks: any[] = [
            {
                $id: 'd1',
                title: 'Amber Ruby Aggro',
                description: 'Fast lore deck',
                cards: [{ card: { formats: ['core', 'infinity'] } }],
                progress: {
                    percentage: 100,
                    ownedCount: 60,
                    totalCount: 60,
                    missingCards: [],
                },
            },
            {
                $id: 'd2',
                title: 'Sapphire Steel Control',
                description: 'Late game ramp',
                cards: [{ card: { formats: ['infinity'] } }],
                progress: {
                    percentage: 85,
                    ownedCount: 51,
                    totalCount: 60,
                    missingCards: [],
                },
            },
            {
                $id: 'd3',
                title: 'Emerald Amethyst Bounce',
                description: 'Budget build',
                cards: [{ card: { formats: ['core', 'infinity'] } }],
                progress: {
                    percentage: 40,
                    ownedCount: 24,
                    totalCount: 60,
                    missingCards: [],
                },
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

        it('filters decks by ready completion filter', () => {
            const result = filterDecks(mockDecks, '', undefined, 'ready');
            expect(result).toHaveLength(1);
            expect(result[0].$id).toBe('d1');
        });

        it('filters decks by near complete filter', () => {
            const result = filterDecks(mockDecks, '', undefined, 'near');
            expect(result).toHaveLength(1);
            expect(result[0].$id).toBe('d2');
        });

        it('filters decks by in_progress filter', () => {
            const result = filterDecks(mockDecks, '', undefined, 'in_progress');
            expect(result).toHaveLength(1);
            expect(result[0].$id).toBe('d3');
        });
    });
});
