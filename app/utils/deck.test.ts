import { describe, it, expect } from 'vitest';
import {
    calculateDeckProgress,
    type UserCollectionItem,
    type DeckCard,
} from './deck';

describe('calculateDeckProgress', () => {
    it('should return 0% progress when user collection is empty', () => {
        const deckCards: DeckCard[] = [
            { deck_id: 'deck-1', card_id: 'card-A', quantity: 4 },
            { deck_id: 'deck-1', card_id: 'card-B', quantity: 2 },
        ];
        const userCollection: UserCollectionItem[] = [];

        const result = calculateDeckProgress(userCollection, deckCards);

        expect(result.percentage).toBe(0);
        expect(result.ownedCount).toBe(0);
        expect(result.totalCount).toBe(6);
        expect(result.missingCards).toHaveLength(2);
        expect(result.missingCards).toContainEqual({
            cardId: 'card-A',
            required: 4,
            owned: 0,
            missing: 4,
        });
    });

    it('should correctly sum foil and non-foil card quantities in inventory', () => {
        const deckCards: DeckCard[] = [
            { deck_id: 'deck-1', card_id: 'card-A', quantity: 4 },
        ];
        const userCollection: UserCollectionItem[] = [
            {
                user_id: 'user-1',
                card_id: 'card-A',
                quantity: 2,
                is_foil: false,
            },
            {
                user_id: 'user-1',
                card_id: 'card-A',
                quantity: 1,
                is_foil: true,
            },
        ];

        const result = calculateDeckProgress(userCollection, deckCards);

        expect(result.percentage).toBe(75); // 3 out of 4 is 75%
        expect(result.ownedCount).toBe(3);
        expect(result.totalCount).toBe(4);
        expect(result.missingCards).toHaveLength(1);
        expect(result.missingCards[0]).toEqual({
            cardId: 'card-A',
            required: 4,
            owned: 3,
            missing: 1,
        });
    });

    it('should cap matching card quantities at the required deck counts (no overflow from surplus)', () => {
        const deckCards: DeckCard[] = [
            { deck_id: 'deck-1', card_id: 'card-A', quantity: 2 },
            { deck_id: 'deck-1', card_id: 'card-B', quantity: 2 },
        ];
        // User has 5 copies of card-A (surplus) and 0 of card-B
        const userCollection: UserCollectionItem[] = [
            {
                user_id: 'user-1',
                card_id: 'card-A',
                quantity: 5,
                is_foil: false,
            },
        ];

        const result = calculateDeckProgress(userCollection, deckCards);

        // Should only count 2 copies of card-A, total matches is 2 out of 4 = 50%
        expect(result.percentage).toBe(50);
        expect(result.ownedCount).toBe(2);
        expect(result.totalCount).toBe(4);
        expect(result.missingCards).toHaveLength(1); // Only card-B is missing
        expect(result.missingCards[0]).toEqual({
            cardId: 'card-B',
            required: 2,
            owned: 0,
            missing: 2,
        });
    });

    it('should return 100% and empty missing list if user owns all cards', () => {
        const deckCards: DeckCard[] = [
            { deck_id: 'deck-1', card_id: 'card-A', quantity: 2 },
            { deck_id: 'deck-1', card_id: 'card-B', quantity: 1 },
        ];
        const userCollection: UserCollectionItem[] = [
            {
                user_id: 'user-1',
                card_id: 'card-A',
                quantity: 2,
                is_foil: false,
            },
            {
                user_id: 'user-1',
                card_id: 'card-B',
                quantity: 3,
                is_foil: true,
            }, // surplus foil
        ];

        const result = calculateDeckProgress(userCollection, deckCards);

        expect(result.percentage).toBe(100);
        expect(result.ownedCount).toBe(3);
        expect(result.totalCount).toBe(3);
        expect(result.missingCards).toHaveLength(0);
    });
});
