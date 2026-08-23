import { describe, it, expect } from 'vitest';
import {
    groupCardsByCost,
    groupCardsByType,
    calculateGraphicSummary,
    getPrimaryCardType,
} from '../graphicHelpers';
import type { Card } from '../../../../types/lorcana';

const mockCard = (overrides: Partial<Card> = {}): Card => ({
    $id: 'card-1',
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
    classifications: ['Hero', 'Princess'],
    rarity: 'Uncommon',
    image_url: 'https://api.lorcana.ravensburger.com/images/en/001/001.png',
    formats: ['core', 'infinity'],
    ...overrides,
});

describe('graphicHelpers', () => {
    describe('groupCardsByCost', () => {
        it('groups cards into correct cost buckets and sorts by cost then name', () => {
            const card1 = mockCard({ id: 'c1', name: 'Zebra', cost: 1 });
            const card2 = mockCard({ id: 'c2', name: 'Alpha', cost: 1 });
            const card3 = mockCard({ id: 'c3', name: 'Dragon', cost: 7 });
            const card4 = mockCard({ id: 'c4', name: 'Giant', cost: 9 });

            const deckCards = [
                { card: card1, requiredQty: 4 },
                { card: card2, requiredQty: 2 },
                { card: card3, requiredQty: 3 },
                { card: card4, requiredQty: 1 },
            ];

            const groups = groupCardsByCost(deckCards);

            // 1 Ink group
            const group1 = groups.find((g) => g.groupKey === '1');
            expect(group1).toBeDefined();
            expect(group1?.totalCount).toBe(6);
            expect(group1?.cards[0].card.name).toBe('Alpha'); // sorted alphabetically
            expect(group1?.cards[1].card.name).toBe('Zebra');

            // 7+ Ink group (cost 7 and 9 combined)
            const group7 = groups.find((g) => g.groupKey === '7+');
            expect(group7).toBeDefined();
            expect(group7?.totalCount).toBe(4);
            expect(group7?.cards[0].card.name).toBe('Dragon'); // cost 7 before cost 9
            expect(group7?.cards[1].card.name).toBe('Giant');
        });

        it('includes 0 Ink group if 0-cost cards exist', () => {
            const card0 = mockCard({
                id: 'c0',
                name: 'Zero Cost Item',
                cost: 0,
                type: ['Item'],
            });
            const groups = groupCardsByCost([{ card: card0, requiredQty: 3 }]);

            const group0 = groups.find((g) => g.groupKey === '0');
            expect(group0).toBeDefined();
            expect(group0?.totalCount).toBe(3);
        });
    });

    describe('getPrimaryCardType & groupCardsByType', () => {
        it('identifies primary card type correctly', () => {
            expect(getPrimaryCardType(mockCard({ type: ['Character'] }))).toBe(
                'Characters',
            );
            expect(
                getPrimaryCardType(mockCard({ type: ['Action', 'Song'] })),
            ).toBe('Actions');
            expect(getPrimaryCardType(mockCard({ type: ['Item'] }))).toBe(
                'Items',
            );
            expect(getPrimaryCardType(mockCard({ type: ['Location'] }))).toBe(
                'Locations',
            );
        });

        it('groups cards by type with correct total quantities', () => {
            const charCard = mockCard({
                id: 'c1',
                name: 'Char',
                type: ['Character'],
                cost: 2,
            });
            const actionCard = mockCard({
                id: 'c2',
                name: 'Song',
                type: ['Action', 'Song'],
                cost: 3,
            });
            const itemCard = mockCard({
                id: 'c3',
                name: 'Lantern',
                type: ['Item'],
                cost: 2,
            });

            const deckCards = [
                { card: charCard, requiredQty: 4 },
                { card: actionCard, requiredQty: 3 },
                { card: itemCard, requiredQty: 2 },
            ];

            const groups = groupCardsByType(deckCards);

            const charGroup = groups.find((g) => g.label === 'CHARACTERS');
            expect(charGroup?.totalCount).toBe(4);

            const actionGroup = groups.find((g) => g.label === 'ACTIONS');
            expect(actionGroup?.totalCount).toBe(3);

            const itemGroup = groups.find((g) => g.label === 'ITEMS');
            expect(itemGroup?.totalCount).toBe(2);
        });
    });

    describe('calculateGraphicSummary', () => {
        it('calculates total cards, inkable percentage, and average cost accurately', () => {
            const inkable = mockCard({ cost: 2, inkwell: true });
            const uninkable = mockCard({ cost: 4, inkwell: false });

            const deckCards = [
                { card: inkable, requiredQty: 3 },
                { card: uninkable, requiredQty: 1 },
            ];

            const summary = calculateGraphicSummary(deckCards);
            expect(summary.totalCards).toBe(4);
            expect(summary.inkableCount).toBe(3);
            expect(summary.uninkableCount).toBe(1);
            expect(summary.inkablePercentage).toBe(75);
            expect(summary.averageCost).toBe(2.5);
        });
    });
});
