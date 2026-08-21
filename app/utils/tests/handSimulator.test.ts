import { describe, it, expect } from 'vitest';
import {
    expandDeck,
    shuffleDeck,
    dealOpeningHand,
    alterHand,
    drawTurnCard,
    analyzeHand,
    type HandCardInstance,
} from '../handSimulator';
import type { Card } from '../../types/lorcana';

const mockCardA: Card = {
    $id: 'card-a',
    id: 'card-a',
    name: 'Minnie Mouse - Beloved Princess',
    set: 'The First Chapter',
    number: 1,
    ink_color: 'Amber',
    cost: 2,
    inkwell: true,
    strength: 2,
    willpower: 3,
    lore: 1,
    type: ['Character'],
    classifications: ['Storyborn', 'Princess'],
    rarity: 'Common',
    image_url: 'https://example.com/minnie.jpg',
    formats: ['core', 'infinity'],
};

const mockCardB: Card = {
    $id: 'card-b',
    id: 'card-b',
    name: 'Elsa - Spirit of Winter',
    set: 'The First Chapter',
    number: 2,
    ink_color: 'Amethyst',
    cost: 8,
    inkwell: false,
    strength: 4,
    willpower: 6,
    lore: 2,
    type: ['Character'],
    classifications: ['Floodborn', 'Hero', 'Queen', 'Sorcerer'],
    rarity: 'Legendary',
    image_url: 'https://example.com/elsa.jpg',
    formats: ['core', 'infinity'],
};

const mockCardC: Card = {
    $id: 'card-c',
    id: 'card-c',
    name: "Pascal - Rapunzel's Companion",
    set: 'The First Chapter',
    number: 3,
    ink_color: 'Emerald',
    cost: 1,
    inkwell: true,
    strength: 1,
    willpower: 1,
    lore: 1,
    type: ['Character'],
    classifications: ['Storyborn', 'Ally'],
    rarity: 'Uncommon',
    image_url: 'https://example.com/pascal.jpg',
    formats: ['core', 'infinity'],
};

const mockCardD: Card = {
    $id: 'card-d',
    id: 'card-d',
    name: 'Friends on the Other Side',
    set: 'The First Chapter',
    number: 4,
    ink_color: 'Amethyst',
    cost: 3,
    inkwell: true,
    strength: null,
    willpower: null,
    lore: 0,
    type: ['Action', 'Song'],
    classifications: [],
    rarity: 'Common',
    image_url: 'https://example.com/friends.jpg',
    formats: ['core', 'infinity'],
};

describe('handSimulator utilities', () => {
    describe('expandDeck', () => {
        it('expands deck cards according to requiredQty with unique instanceIds', () => {
            const deck = [
                { card: mockCardA, requiredQty: 3 },
                { card: mockCardB, requiredQty: 2 },
            ];
            const expanded = expandDeck(deck);
            expect(expanded).toHaveLength(5);
            expect(expanded.map((c) => c.card.name)).toEqual([
                'Minnie Mouse - Beloved Princess',
                'Minnie Mouse - Beloved Princess',
                'Minnie Mouse - Beloved Princess',
                'Elsa - Spirit of Winter',
                'Elsa - Spirit of Winter',
            ]);
            const ids = new Set(expanded.map((c) => c.instanceId));
            expect(ids.size).toBe(5);
        });

        it('handles empty or invalid inputs gracefully', () => {
            expect(expandDeck([])).toEqual([]);
            // @ts-expect-error test invalid args
            expect(expandDeck(null)).toEqual([]);
            // @ts-expect-error test invalid args
            expect(expandDeck(undefined)).toEqual([]);
            // @ts-expect-error test invalid array item
            expect(expandDeck([{ card: null, requiredQty: 4 }])).toEqual([]);
        });
    });

    describe('shuffleDeck', () => {
        it('shuffles array without modifying length or losing elements', () => {
            const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const shuffled = shuffleDeck(items);
            expect(shuffled).toHaveLength(items.length);
            expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
        });

        it('supports deterministic custom RNG', () => {
            const items = ['A', 'B', 'C', 'D'];
            // Fixed reverse RNG
            const shuffled = shuffleDeck(items, () => 0);
            expect(shuffled).toHaveLength(4);
        });
    });

    describe('dealOpeningHand', () => {
        it('deals 7 cards and puts remaining into drawPile', () => {
            const deck = expandDeck([
                { card: mockCardA, requiredQty: 4 },
                { card: mockCardB, requiredQty: 4 },
                { card: mockCardC, requiredQty: 4 },
            ]); // 12 cards total

            const { hand, drawPile } = dealOpeningHand(deck, 7);
            expect(hand).toHaveLength(7);
            expect(drawPile).toHaveLength(5);
            expect(hand.every((c) => c.drawnOnTurn === 0)).toBe(true);
        });

        it('handles small decks with fewer than 7 cards', () => {
            const deck = expandDeck([{ card: mockCardA, requiredQty: 3 }]);
            const { hand, drawPile } = dealOpeningHand(deck, 7);
            expect(hand).toHaveLength(3);
            expect(drawPile).toHaveLength(0);
        });

        it('handles empty deck', () => {
            const { hand, drawPile } = dealOpeningHand([], 7);
            expect(hand).toEqual([]);
            expect(drawPile).toEqual([]);
        });
    });

    describe('alterHand', () => {
        it('returns identical hand and drawPile when 0 cards are selected for alter', () => {
            const deck = expandDeck([
                { card: mockCardA, requiredQty: 4 },
                { card: mockCardB, requiredQty: 4 },
            ]);
            const { hand, drawPile } = dealOpeningHand(deck, 7);
            const res = alterHand(hand, drawPile, new Set());

            expect(res.newHand).toHaveLength(7);
            expect(res.newDrawPile).toHaveLength(1);
            expect(res.drawnCards).toHaveLength(0);
            expect(res.alteredCards).toHaveLength(0);
        });

        it('replaces chosen cards from top of drawPile and reshuffles altered cards', () => {
            const deck = expandDeck([
                { card: mockCardA, requiredQty: 6 },
                { card: mockCardB, requiredQty: 6 },
            ]); // 12 cards total, 7 in hand, 5 in drawPile
            const { hand, drawPile } = dealOpeningHand(deck, 7);

            // Select first 2 cards to alter
            const toAlter = new Set([hand[0].instanceId, hand[1].instanceId]);
            const res = alterHand(hand, drawPile, toAlter);

            expect(res.newHand).toHaveLength(7);
            expect(res.alteredCards).toHaveLength(2);
            expect(res.drawnCards).toHaveLength(2);
            expect(res.drawnCards.every((c) => c.isAltered === true)).toBe(
                true,
            );
            // Draw pile total size should still be original draw pile size (5 cards: 3 remaining + 2 altered)
            expect(res.newDrawPile).toHaveLength(5);
        });

        it('handles full 7-card alter', () => {
            const deck = expandDeck([
                { card: mockCardA, requiredQty: 7 },
                { card: mockCardB, requiredQty: 7 },
            ]); // 14 cards
            const { hand, drawPile } = dealOpeningHand(deck, 7);

            const allIds = new Set(hand.map((c) => c.instanceId));
            const res = alterHand(hand, drawPile, allIds);

            expect(res.newHand).toHaveLength(7);
            expect(res.alteredCards).toHaveLength(7);
            expect(res.drawnCards).toHaveLength(7);
            expect(res.newDrawPile).toHaveLength(7);
        });
    });

    describe('drawTurnCard', () => {
        it('draws top card from drawPile and appends to hand with turnNumber', () => {
            const deck = expandDeck([
                { card: mockCardA, requiredQty: 4 },
                { card: mockCardB, requiredQty: 4 },
            ]);
            const { hand, drawPile } = dealOpeningHand(deck, 7);

            const res = drawTurnCard(hand, drawPile, 2);
            expect(res.newHand).toHaveLength(8);
            expect(res.newDrawPile).toHaveLength(0);
            expect(res.drawnCard?.drawnOnTurn).toBe(2);
        });

        it('handles empty draw pile gracefully without error', () => {
            const hand: HandCardInstance[] = [];
            const drawPile: HandCardInstance[] = [];

            const res = drawTurnCard(hand, drawPile, 2);
            expect(res.newHand).toHaveLength(0);
            expect(res.drawnCard).toBeNull();
        });
    });

    describe('analyzeHand', () => {
        it('accurately computes inkable vs uninkable counts and percentages', () => {
            const hand: HandCardInstance[] = [
                { instanceId: '1', card: mockCardA, drawnOnTurn: 0 }, // cost 2, inkable
                { instanceId: '2', card: mockCardA, drawnOnTurn: 0 }, // cost 2, inkable
                { instanceId: '3', card: mockCardB, drawnOnTurn: 0 }, // cost 8, uninkable
                { instanceId: '4', card: mockCardC, drawnOnTurn: 0 }, // cost 1, inkable
                { instanceId: '5', card: mockCardD, drawnOnTurn: 0 }, // cost 3, inkable
            ];

            const stats = analyzeHand(hand);
            expect(stats.totalCards).toBe(5);
            expect(stats.inkableCount).toBe(4);
            expect(stats.uninkableCount).toBe(1);
            expect(stats.inkablePercentage).toBe(80); // 4/5 = 80%
            expect(stats.turn1Plays).toHaveLength(1);
            expect(stats.turn1Plays[0].card.name).toBe(
                "Pascal - Rapunzel's Companion",
            );
            expect(stats.turn2Plays).toHaveLength(2);
            expect(stats.turn3Plays).toHaveLength(1);
            // Average cost: (2+2+8+1+3)/5 = 16/5 = 3.2
            expect(stats.averageCost).toBe(3.2);
            expect(stats.inkColors).toEqual({
                amber: 2,
                amethyst: 2,
                emerald: 1,
            });
            expect(stats.typeDistribution).toEqual({
                character: 4,
                action: 1,
                song: 1,
            });
        });

        it('handles empty hand analysis', () => {
            const stats = analyzeHand([]);
            expect(stats.totalCards).toBe(0);
            expect(stats.inkableCount).toBe(0);
            expect(stats.uninkableCount).toBe(0);
            expect(stats.inkablePercentage).toBe(0);
            expect(stats.averageCost).toBe(0);
        });
    });
});
