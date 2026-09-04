import { describe, it, expect } from 'vitest';
import type { Card as LorcanaCard } from '../../types/lorcana';
import {
    calculateSetProgress,
    getSetProgressMap,
    type SetProgressStats,
    type SetCollectionItemInput,
} from '../setCompletion';

const mockCards: LorcanaCard[] = [
    {
        $id: 'card-1',
        id: 'ariel-on-human-legs',
        name: 'Ariel - On Human Legs',
        set: 'The First Chapter',
        number: 1,
        ink_color: 'Amber',
        cost: 4,
        inkwell: true,
        lore: 2,
        strength: 3,
        willpower: 4,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Princess'],
        rarity: 'Uncommon',
        image_url: 'https://example.com/ariel.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: 1.5,
            usd_foil: 3.0,
        },
    },
    {
        $id: 'card-2',
        id: 'stitch-rock-star',
        name: 'Stitch - Rock Star',
        set: 'The First Chapter',
        number: 2,
        ink_color: 'Amber',
        cost: 6,
        inkwell: false,
        lore: 3,
        strength: 3,
        willpower: 5,
        type: ['Character'],
        classifications: ['Floodborn', 'Hero', 'Alien'],
        rarity: 'Super Rare',
        image_url: 'https://example.com/stitch.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: 10.0,
            usd_foil: 25.0,
        },
    },
    {
        $id: 'card-3',
        id: 'cinderella-ballroom-sensation',
        name: 'Cinderella - Ballroom Sensation',
        set: 'Rise of the Floodborn',
        number: 3,
        ink_color: 'Amber',
        cost: 1,
        inkwell: true,
        lore: 1,
        strength: 1,
        willpower: 2,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Princess'],
        rarity: 'Rare',
        image_url: 'https://example.com/cinderella.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: 2.0,
            usd_foil: 5.0,
        },
    },
    {
        $id: 'card-4',
        id: 'mickey-mouse-brave-little-tailor-promo',
        name: 'Mickey Mouse - Brave Little Tailor',
        set: 'Promo Set 1',
        number: 1,
        ink_color: 'Ruby',
        cost: 8,
        inkwell: false,
        lore: 4,
        strength: 5,
        willpower: 5,
        type: ['Character'],
        classifications: ['Dreamborn', 'Hero'],
        rarity: 'Promo',
        image_url: 'https://example.com/mickey-promo.jpg',
        formats: ['infinity'],
        prices: {
            usd: 50.0,
            usd_foil: null,
        },
    },
];

describe('setCompletion utils', () => {
    it('returns empty array when catalog is empty', () => {
        const stats = calculateSetProgress([], []);
        expect(stats).toEqual([]);
    });

    it('calculates 0% completion when user collection is empty', () => {
        const stats = calculateSetProgress(mockCards, []);
        expect(stats.length).toBe(3);

        const tfc = stats.find((s) => s.setName === 'The First Chapter');
        expect(tfc).toBeDefined();
        expect(tfc?.totalCardsInSet).toBe(2);
        expect(tfc?.uniqueCardsOwned).toBe(0);
        expect(tfc?.totalCardsOwned).toBe(0);
        expect(tfc?.standardCardsOwned).toBe(0);
        expect(tfc?.foilCardsOwned).toBe(0);
        expect(tfc?.completionPercentage).toBe(0);
        expect(tfc?.marketValue).toBe(0);
        expect(tfc?.setIndex).toBe(1);
    });

    it('calculates completion and does not double-count unique cards for standard + foil ownership', () => {
        const userCollection: SetCollectionItemInput[] = [
            // User owns 2 standard + 1 foil of Ariel
            { card_id: 'ariel-on-human-legs', quantity: 2, is_foil: false },
            { card_id: 'ariel-on-human-legs', quantity: 1, is_foil: true },
        ];

        const stats = calculateSetProgress(mockCards, userCollection);
        const tfc = stats.find((s) => s.setName === 'The First Chapter');

        expect(tfc).toBeDefined();
        // 1 unique out of 2 in set = 50%
        expect(tfc?.uniqueCardsOwned).toBe(1);
        expect(tfc?.totalCardsInSet).toBe(2);
        expect(tfc?.completionPercentage).toBe(50);
        expect(tfc?.standardCardsOwned).toBe(2);
        expect(tfc?.foilCardsOwned).toBe(1);
        expect(tfc?.totalCardsOwned).toBe(3);

        // Value: (2 std * $1.50) + (1 foil * $3.00) = $3.00 + $3.00 = $6.00
        expect(tfc?.marketValue).toBe(6.0);
    });

    it('calculates 100% completion when all unique cards in set are owned', () => {
        const userCollection: SetCollectionItemInput[] = [
            { card_id: 'ariel-on-human-legs', quantity: 1, is_foil: false },
            { card_id: 'stitch-rock-star', quantity: 1, is_foil: true },
        ];

        const stats = calculateSetProgress(mockCards, userCollection);
        const tfc = stats.find((s) => s.setName === 'The First Chapter');

        expect(tfc?.uniqueCardsOwned).toBe(2);
        expect(tfc?.totalCardsInSet).toBe(2);
        expect(tfc?.completionPercentage).toBe(100);
        // Value: (1 * 1.5) + (1 * 25) = 26.5
        expect(tfc?.marketValue).toBe(26.5);
    });

    it('handles foil price fallback when foil price is null', () => {
        const userCollection: SetCollectionItemInput[] = [
            // Mickey promo has usd: 50, usd_foil: null
            {
                card_id: 'mickey-mouse-brave-little-tailor-promo',
                quantity: 2,
                is_foil: true,
            },
        ];

        const stats = calculateSetProgress(mockCards, userCollection);
        const promo = stats.find((s) => s.setName === 'Promo Set 1');

        expect(promo?.uniqueCardsOwned).toBe(1);
        expect(promo?.totalCardsInSet).toBe(1);
        expect(promo?.completionPercentage).toBe(100);
        // Fallback to std price: 2 * $50 = $100
        expect(promo?.marketValue).toBe(100);
    });

    it('sorts core sets chronologically by setIndex (Set 1, Set 2) followed by promo sets', () => {
        const stats = calculateSetProgress(mockCards, []);
        expect(stats.map((s) => s.setName)).toEqual([
            'The First Chapter', // Set 1
            'Rise of the Floodborn', // Set 2
            'Promo Set 1', // Promo
        ]);
        expect(stats[0].setIndex).toBe(1);
        expect(stats[1].setIndex).toBe(2);
        expect(stats[2].setIndex).toBeUndefined();
    });

    it('ignores zero or negative quantity items in collection', () => {
        const userCollection: SetCollectionItemInput[] = [
            { card_id: 'ariel-on-human-legs', quantity: 0, is_foil: false },
            { card_id: 'stitch-rock-star', quantity: -1, is_foil: true },
        ];

        const stats = calculateSetProgress(mockCards, userCollection);
        const tfc = stats.find((s) => s.setName === 'The First Chapter');
        expect(tfc?.uniqueCardsOwned).toBe(0);
        expect(tfc?.totalCardsOwned).toBe(0);
        expect(tfc?.marketValue).toBe(0);
    });

    it('creates a lookup map via getSetProgressMap', () => {
        const stats = calculateSetProgress(mockCards, []);
        const map = getSetProgressMap(stats);

        expect(map.has('The First Chapter')).toBe(true);
        expect(map.get('The First Chapter')?.setIndex).toBe(1);
        expect(map.has('Rise of the Floodborn')).toBe(true);
        expect(map.has('Promo Set 1')).toBe(true);
        expect(map.get('Nonexistent Set')).toBeUndefined();
    });
});
