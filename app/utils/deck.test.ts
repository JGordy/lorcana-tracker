import { describe, it, expect } from 'vitest';
import {
    calculateDeckProgress,
    getCardSlug,
    parseDeckMetadata,
    getFeaturedDeckCard,
    getKeyDeckCards,
    INK_HEX_MAP,
    RARITY_RANK,
    RARITY_COLOR,
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

describe('getCardSlug', () => {
    it('should convert names into lowercase hyphenated slugs', () => {
        expect(getCardSlug('Mickey Mouse - Brave Little Tailor')).toBe(
            'mickey-mouse-brave-little-tailor',
        );
        expect(getCardSlug("Ursula - Deceiver of All's")).toBe(
            'ursula-deceiver-of-alls',
        );
    });

    it('should strip special characters and trim excess whitespace', () => {
        expect(getCardSlug('  Elsa, Snow Queen (Enchanted)  ')).toBe(
            'elsa-snow-queen-enchanted',
        );
        expect(getCardSlug('Robin Hood: Champion of Sherwood')).toBe(
            'robin-hood-champion-of-sherwood',
        );
    });
});

describe('parseDeckMetadata', () => {
    it('should return default metadata for empty or undefined input', () => {
        expect(parseDeckMetadata(undefined)).toEqual({
            format: 'core',
            inks: [],
            description: '',
        });
        expect(parseDeckMetadata('')).toEqual({
            format: 'core',
            inks: [],
            description: '',
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
    });

    it('should fallback to plain text description for non-JSON strings', () => {
        const plainText = 'This is just a regular legacy description string.';
        const result = parseDeckMetadata(plainText);
        expect(result).toEqual({
            format: 'core',
            inks: [],
            description: plainText,
        });
    });
});

describe('getFeaturedDeckCard', () => {
    const cardCommon = {
        id: 'card-1',
        name: 'Minnie Mouse',
        rarity: 'Common',
        cost: 2,
    };
    const cardRare = {
        id: 'card-2',
        name: 'Simba - Returned King',
        rarity: 'Rare',
        cost: 4,
    };
    const cardLegendaryLowCost = {
        id: 'card-3',
        name: 'Maleficent - Dragon',
        rarity: 'Legendary',
        cost: 5,
    };
    const cardLegendaryHighCost = {
        id: 'card-4',
        name: 'Hades - Infernal King',
        rarity: 'Legendary',
        cost: 8,
    };

    it('should return null for empty deck cards list', () => {
        expect(getFeaturedDeckCard([])).toBeNull();
    });

    it('should pick explicitly chosen coverCardId when provided', () => {
        const deckCards = [
            { card: cardLegendaryHighCost },
            { card: cardCommon },
            { card: cardRare },
        ];

        const featured = getFeaturedDeckCard(deckCards, 'card-2');
        expect(featured).toEqual(cardRare);
    });

    it('should pick highest rarity card automatically when coverCardId is auto or undefined', () => {
        const deckCards = [
            { card: cardCommon },
            { card: cardRare },
            { card: cardLegendaryLowCost },
        ];

        const featured = getFeaturedDeckCard(deckCards);
        expect(featured).toEqual(cardLegendaryLowCost);

        const featuredAuto = getFeaturedDeckCard(deckCards, 'auto');
        expect(featuredAuto).toEqual(cardLegendaryLowCost);
    });

    it('should tie-break by highest ink cost when multiple cards share the highest rarity', () => {
        const deckCards = [
            { card: cardLegendaryLowCost },
            { card: cardLegendaryHighCost },
            { card: cardRare },
        ];

        const featured = getFeaturedDeckCard(deckCards);
        expect(featured).toEqual(cardLegendaryHighCost);
    });
});

describe('getKeyDeckCards', () => {
    const card1 = {
        id: 'c1',
        name: 'Card 1',
        rarity: 'Common',
        cost: 1,
        ink_color: 'Amber',
    };
    const card2 = {
        id: 'c2',
        name: 'Card 2',
        rarity: 'Rare',
        cost: 3,
        ink_color: 'Amber',
    };
    const card3 = {
        id: 'c3',
        name: 'Card 3',
        rarity: 'Super Rare',
        cost: 4,
        ink_color: 'Ruby',
    };
    const card4 = {
        id: 'c4',
        name: 'Card 4',
        rarity: 'Legendary',
        cost: 6,
        ink_color: 'Ruby',
    };
    const card5 = {
        id: 'c5',
        name: 'Card 5',
        rarity: 'Legendary',
        cost: 7,
        ink_color: 'Ruby',
    };

    it('should return empty array for empty deck list', () => {
        expect(getKeyDeckCards([])).toEqual([]);
    });

    it('should return unique key cards ranked by rarity then cost up to limit', () => {
        const deckCards = [
            { card: card1 },
            { card: card2 },
            { card: card3 },
            { card: card4 },
            { card: card5 },
        ];

        const keyCards = getKeyDeckCards(deckCards, 3);
        expect(keyCards).toHaveLength(3);
        // Ranked: card5 (Legendary 7), card4 (Legendary 6), card3 (Super Rare 4)
        expect(keyCards[0]).toEqual(card5);
        expect(keyCards[1]).toEqual(card4);
        expect(keyCards[2]).toEqual(card3);
    });

    it('should deduplicate multiple copies of the same card', () => {
        const deckCards = [
            { card: card4 },
            { card: card4 }, // Duplicate copy
            { card: card3 },
            { card: card2 },
        ];

        const keyCards = getKeyDeckCards(deckCards, 4);
        expect(keyCards).toHaveLength(3);
        expect(keyCards.map((c) => c.id)).toEqual(['c4', 'c3', 'c2']);
    });
});

describe('INK_HEX_MAP and RARITY constants', () => {
    it('should have valid hex codes for all 6 core inks', () => {
        expect(INK_HEX_MAP.amber).toBe('#F5B041');
        expect(INK_HEX_MAP.amethyst).toBe('#AF7AC5');
        expect(INK_HEX_MAP.emerald).toBe('#2ECC71');
        expect(INK_HEX_MAP.ruby).toBe('#EC7063');
        expect(INK_HEX_MAP.sapphire).toBe('#5DADE2');
        expect(INK_HEX_MAP.steel).toBe('#A6ACAF');
    });

    it('should rank Enchanted > Iconic > Epic > Legendary > Super Rare > Rare > Uncommon > Common', () => {
        expect(RARITY_RANK['Enchanted']).toBeGreaterThan(
            RARITY_RANK['Legendary'],
        );
        expect(RARITY_RANK['Legendary']).toBeGreaterThan(
            RARITY_RANK['Super Rare'],
        );
        expect(RARITY_RANK['Super Rare']).toBeGreaterThan(RARITY_RANK['Rare']);
        expect(RARITY_RANK['Rare']).toBeGreaterThan(RARITY_RANK['Common']);
    });
});
