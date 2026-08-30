import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CardCatalogService } from '../catalog.client';

describe('CardCatalogService', () => {
    beforeEach(() => {
        CardCatalogService.clearCache();
        vi.resetAllMocks();
    });

    it('should fetch cards.json, memoize response, and build lookup map', async () => {
        const mockCards = [
            {
                $id: 'ariel-on-human-legs',
                id: 'ariel-on-human-legs',
                name: 'Ariel - On Human Legs',
                set: 'The First Chapter',
                number: 1,
                ink_color: 'Amber',
                cost: 4,
                inkwell: true,
                strength: 3,
                willpower: 4,
                lore: 2,
                type: ['Character'],
                classifications: ['Storyborn', 'Hero', 'Princess'],
                rarity: 'Uncommon',
                image_url: 'https://api.lorcana.ravensburger.com/images/1.jpg',
                formats: ['core', 'infinity'],
            },
        ];

        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => mockCards,
        });

        const cards = await CardCatalogService.getCards();
        expect(cards).toHaveLength(1);
        expect(cards[0].name).toBe('Ariel - On Human Legs');

        // Verify memoization (second call shouldn't call fetch again)
        const memoized = await CardCatalogService.getCards();
        expect(memoized).toBe(cards);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Verify lookup
        const card = CardCatalogService.getCardById('ariel-on-human-legs');
        expect(card).toBeDefined();
        expect(card?.name).toBe('Ariel - On Human Legs');
    });

    it('should handle fetch errors gracefully', async () => {
        global.fetch = vi
            .fn()
            .mockRejectedValueOnce(new Error('Network error'));

        const cards = await CardCatalogService.getCards();
        expect(cards).toEqual([]);
        expect(CardCatalogService.getCardById('any-id')).toBeUndefined();
    });
});
