import { describe, it, expect } from 'vitest';
import {
    calculateDeckProgress,
    getFeaturedDeckCard,
    getKeyDeckCards,
    calculateDeckStats,
    parseDeckMetadata,
} from '../deck';

describe('deck utils', () => {
    const mockCard1: any = {
        id: 'c1',
        name: 'Stitch - Rock Star',
        rarity: 'Legendary',
        cost: 6,
        inkwell: true,
        type: ['Character'],
    };

    const mockCard2: any = {
        id: 'c2',
        name: 'Dragon Fire',
        rarity: 'Uncommon',
        cost: 5,
        inkwell: false,
        type: ['Action', 'Song'],
    };

    const mockCard3: any = {
        id: 'c3',
        name: 'Pascal - Rapunzel Companion',
        rarity: 'Common',
        cost: 1,
        inkwell: true,
        type: ['Character'],
    };

    describe('calculateDeckProgress', () => {
        it('calculates completion percentage and missing cards accurately', () => {
            const userColl = [
                { user_id: 'u1', card_id: 'c1', quantity: 2, is_foil: false },
                { user_id: 'u1', card_id: 'c2', quantity: 4, is_foil: true },
            ];
            const deckCards = [
                { deck_id: 'd1', card_id: 'c1', quantity: 4 },
                { deck_id: 'd1', card_id: 'c2', quantity: 4 },
            ];

            const res = calculateDeckProgress(userColl, deckCards);
            expect(res.totalCount).toBe(8);
            expect(res.ownedCount).toBe(6); // 2 + 4
            expect(res.percentage).toBe(75);
            expect(res.missingCards).toHaveLength(1);
            expect(res.missingCards[0].cardId).toBe('c1');
            expect(res.missingCards[0].missing).toBe(2);
        });
    });

    describe('parseDeckMetadata', () => {
        it('should return default metadata for empty or undefined input', () => {
            expect(parseDeckMetadata(undefined)).toEqual({
                format: 'core',
                inks: [],
                description: '',
                is_active: false,
            });
            expect(parseDeckMetadata('')).toEqual({
                format: 'core',
                inks: [],
                description: '',
                is_active: false,
            });
        });

        it('should correctly parse valid JSON payload with format, inks, description, and coverCardId', () => {
            const payload = JSON.stringify({
                format: 'infinity',
                inks: ['Amber', 'Ruby'],
                description: 'Hyper aggressive Amber Ruby deck',
                coverCardId: 'sid-phillips-toy-surgeon',
            });

            const result = parseDeckMetadata(payload);
            expect(result).toEqual({
                format: 'infinity',
                inks: ['Amber', 'Ruby'],
                description: 'Hyper aggressive Amber Ruby deck',
                coverCardId: 'sid-phillips-toy-surgeon',
                is_active: false,
            });
        });

        it('should handle partial JSON payloads gracefully', () => {
            const payload = JSON.stringify({
                inks: ['Amethyst'],
            });

            const result = parseDeckMetadata(payload);
            expect(result.format).toBe('core');
            expect(result.inks).toEqual(['Amethyst']);
            expect(result.description).toBe('');
            expect(result.is_active).toBe(false);
        });

        it('should fallback to plain text description for non-JSON strings', () => {
            const plainText =
                'This is just a regular legacy description string.';
            const result = parseDeckMetadata(plainText);
            expect(result).toEqual({
                format: 'core',
                inks: [],
                description: plainText,
                is_active: false,
            });
        });
    });

    describe('getFeaturedDeckCard & getKeyDeckCards', () => {
        it('returns highest rarity card', () => {
            const cards = [
                { card: mockCard2, requiredQty: 4 },
                { card: mockCard1, requiredQty: 2 },
            ];
            const featured = getFeaturedDeckCard(cards);
            expect(featured?.name).toBe('Stitch - Rock Star');

            const keyCards = getKeyDeckCards(cards, 2);
            expect(keyCards).toHaveLength(2);
            expect(keyCards[0].name).toBe('Stitch - Rock Star');
        });
    });

    describe('calculateDeckStats', () => {
        it('accurately calculates deck cost distribution, inkable percentages, and averages', () => {
            const deckCards = [
                { card: mockCard1, requiredQty: 4 }, // cost 6, inkable
                { card: mockCard2, requiredQty: 4 }, // cost 5, uninkable
                { card: mockCard3, requiredQty: 4 }, // cost 1, inkable
            ];

            const stats = calculateDeckStats(deckCards);

            expect(stats.totalCards).toBe(12);
            expect(stats.inkableCount).toBe(8);
            expect(stats.uninkableCount).toBe(4);
            expect(stats.inkablePercentage).toBe(67); // 8/12 = 66.6% -> 67%
            // Avg cost: (6*4 + 5*4 + 1*4)/12 = (24 + 20 + 4)/12 = 48/12 = 4.0
            expect(stats.averageCost).toBe(4);
            expect(stats.earlyCurveCount).toBe(4); // 4 cost-1 cards
            expect(stats.costDistribution['1'].count).toBe(4);
            expect(stats.costDistribution['5'].count).toBe(4);
            expect(stats.costDistribution['6'].count).toBe(4);
            expect(stats.costDistribution['5'].uninkable).toBe(4);
            expect(stats.costDistribution['1'].inkable).toBe(4);
            expect(stats.costDistribution['1'].inkDistribution.steel).toBe(4);
        });

        it('handles empty deck cards gracefully', () => {
            const stats = calculateDeckStats([]);
            expect(stats.totalCards).toBe(0);
            expect(stats.averageCost).toBe(0);
            expect(stats.inkableCount).toBe(0);
            expect(stats.uninkableCount).toBe(0);
            expect(stats.earlyCurveCount).toBe(0);
        });
    });
});
