import { describe, it, expect } from 'vitest';
import {
    calculatePhysicalDeckAudit,
    formatTcgPlayerPhysicalShoppingList,
    formatProxyPrintList,
    type ActiveDeckConflict,
} from '../deckAudit';
import type {
    DeckWithProgress,
    Card as LorcanaCard,
    UserCollectionItemDoc,
} from '../../types/lorcana';

const cardMimFox: LorcanaCard = {
    $id: 'madam-mim-fox',
    id: 'madam-mim-fox',
    name: 'Madam Mim - Fox',
    set: 'Rise of the Floodborn',
    number: 45,
    ink_color: 'Amethyst',
    cost: 3,
    inkwell: true,
    strength: 4,
    willpower: 3,
    lore: 1,
    type: ['Character'],
    classifications: ['Storyborn', 'Sorcerer'],
    rarity: 'Super Rare',
    image_url: 'https://example.com/mim.jpg',
    formats: ['core', 'infinity'],
};

const cardStitch: LorcanaCard = {
    $id: 'stitch-rock-star',
    id: 'stitch-rock-star',
    name: 'Stitch - Rock Star',
    set: 'The First Chapter',
    number: 23,
    ink_color: 'Amber',
    cost: 6,
    inkwell: false,
    strength: 3,
    willpower: 5,
    lore: 2,
    type: ['Character'],
    classifications: ['Floodborn', 'Hero', 'Alien'],
    rarity: 'Legendary',
    image_url: 'https://example.com/stitch.jpg',
    formats: ['core', 'infinity'],
};

const mockDeck1: DeckWithProgress = {
    $id: 'deck-1',
    id: 'deck-1',
    title: 'Amethyst Ruby Bounce',
    description: '',
    creator_id: 'user-1',
    is_public: true,
    progress: {
        percentage: 100,
        ownedCount: 8,
        totalCount: 8,
        missingCards: [],
    },
    cards: [
        { card: cardMimFox, requiredQty: 4, ownedQty: 4 },
        { card: cardStitch, requiredQty: 4, ownedQty: 4 },
    ],
};

const mockDeck2: DeckWithProgress = {
    $id: 'deck-2',
    id: 'deck-2',
    title: 'Amber Steel Aggro',
    description: '',
    creator_id: 'user-1',
    is_public: true,
    progress: {
        percentage: 100,
        ownedCount: 4,
        totalCount: 4,
        missingCards: [],
    },
    cards: [{ card: cardMimFox, requiredQty: 4, ownedQty: 4 }],
};

describe('calculatePhysicalDeckAudit', () => {
    it('returns 100% buildable when collection has sufficient copies across active decks', () => {
        // User owns 8 Mim Fox (4 normal + 4 foil) and 4 Stitch
        const collection: UserCollectionItemDoc[] = [
            {
                $id: 'inv-1',
                user_id: 'u1',
                card_id: 'madam-mim-fox',
                quantity: 4,
                is_foil: false,
            },
            {
                $id: 'inv-2',
                user_id: 'u1',
                card_id: 'madam-mim-fox',
                quantity: 4,
                is_foil: true,
            },
            {
                $id: 'inv-3',
                user_id: 'u1',
                card_id: 'stitch-rock-star',
                quantity: 4,
                is_foil: false,
            },
        ];

        const audit = calculatePhysicalDeckAudit(
            [mockDeck1, mockDeck2],
            collection,
        );

        expect(audit.activeDecksCount).toBe(2);
        expect(audit.totalConflictCardsCount).toBe(0);
        expect(audit.totalDeficitCount).toBe(0);
        expect(audit.is100PercentBuildable).toBe(true);
        expect(audit.conflicts).toHaveLength(0);
    });

    it('identifies physical conflicts when total required exceeds total owned', () => {
        // Required across active decks: 8 Mim Fox (Deck 1: 4, Deck 2: 4), 4 Stitch (Deck 1: 4)
        // Collection owns: 5 Mim Fox (3 normal + 2 foil), 2 Stitch (2 normal)
        const collection: UserCollectionItemDoc[] = [
            {
                $id: 'inv-1',
                user_id: 'u1',
                card_id: 'madam-mim-fox',
                quantity: 3,
                is_foil: false,
            },
            {
                $id: 'inv-2',
                user_id: 'u1',
                card_id: 'madam-mim-fox',
                quantity: 2,
                is_foil: true,
            },
            {
                $id: 'inv-3',
                user_id: 'u1',
                card_id: 'stitch-rock-star',
                quantity: 2,
                is_foil: false,
            },
        ];

        const audit = calculatePhysicalDeckAudit(
            [mockDeck1, mockDeck2],
            collection,
        );

        expect(audit.activeDecksCount).toBe(2);
        expect(audit.totalActiveCardsCount).toBe(12);
        expect(audit.totalConflictCardsCount).toBe(2);
        expect(audit.totalDeficitCount).toBe(5); // 3 Mim Fox + 2 Stitch
        expect(audit.is100PercentBuildable).toBe(false);

        // Highest deficit first: Mim Fox (deficit 3) before Stitch (deficit 2)
        expect(audit.conflicts[0].card.name).toBe('Madam Mim - Fox');
        expect(audit.conflicts[0].totalRequired).toBe(8);
        expect(audit.conflicts[0].totalOwned).toBe(5);
        expect(audit.conflicts[0].deficit).toBe(3);
        expect(audit.conflicts[0].decks).toHaveLength(2);

        expect(audit.conflicts[1].card.name).toBe('Stitch - Rock Star');
        expect(audit.conflicts[1].totalRequired).toBe(4);
        expect(audit.conflicts[1].totalOwned).toBe(2);
        expect(audit.conflicts[1].deficit).toBe(2);
        expect(audit.conflicts[1].decks).toHaveLength(1);
    });

    it('uses inventoryMap and deck card ownedQty when userCollection is empty or offline', () => {
        // mockDeck1 requires 4 Mim Fox, 4 Stitch. mockDeck2 requires 4 Mim Fox. Total required: 8 Mim Fox, 4 Stitch.
        // inventoryMap provides 8 Mim Fox and 4 Stitch.
        const inventoryMap = new Map([
            ['madam-mim-fox', 8],
            ['stitch-rock-star', 4],
        ]);

        const audit = calculatePhysicalDeckAudit(
            [mockDeck1, mockDeck2],
            [],
            undefined,
            inventoryMap,
        );

        expect(audit.activeDecksCount).toBe(2);
        expect(audit.totalConflictCardsCount).toBe(0);
        expect(audit.totalDeficitCount).toBe(0);
        expect(audit.is100PercentBuildable).toBe(true);
    });

    it('correctly sums standard and foil copies from userCollection and inventoryMap', () => {
        // mockDeck2 requires 4 Mim Fox.
        // userCollection has 3 normal Mim Fox, and inventoryMap has 4 (3 normal + 1 foil summed).
        const collection: UserCollectionItemDoc[] = [
            {
                $id: 'inv-1',
                user_id: 'u1',
                card_id: 'madam-mim-fox',
                quantity: 3,
                is_foil: false,
            },
            {
                $id: 'inv-2',
                user_id: 'u1',
                card_id: 'madam-mim-fox',
                quantity: 1,
                is_foil: true,
            },
        ];

        const audit = calculatePhysicalDeckAudit([mockDeck2], collection);

        expect(audit.activeDecksCount).toBe(1);
        expect(audit.totalConflictCardsCount).toBe(0);
        expect(audit.totalDeficitCount).toBe(0);
        expect(audit.is100PercentBuildable).toBe(true);
    });

    it('handles empty active decks list gracefully', () => {
        const audit = calculatePhysicalDeckAudit([], []);
        expect(audit.activeDecksCount).toBe(0);
        expect(audit.totalActiveCardsCount).toBe(0);
        expect(audit.totalConflictCardsCount).toBe(0);
        expect(audit.is100PercentBuildable).toBe(false);
    });
});

describe('formatTcgPlayerPhysicalShoppingList', () => {
    it('formats conflicts into TCGPlayer mass entry lines', () => {
        const conflicts: ActiveDeckConflict[] = [
            {
                card: cardMimFox,
                totalRequired: 8,
                totalOwned: 5,
                deficit: 3,
                decks: [],
            },
            {
                card: cardStitch,
                totalRequired: 4,
                totalOwned: 2,
                deficit: 2,
                decks: [],
            },
        ];

        const formatted = formatTcgPlayerPhysicalShoppingList(conflicts);
        expect(formatted).toBe('3 Madam Mim - Fox\n2 Stitch - Rock Star');
    });
});

describe('formatProxyPrintList', () => {
    it('formats proxy print list header and items correctly', () => {
        const conflicts: ActiveDeckConflict[] = [
            {
                card: cardMimFox,
                totalRequired: 8,
                totalOwned: 5,
                deficit: 3,
                decks: [
                    {
                        deckId: 'deck-1',
                        deckTitle: 'Amethyst Ruby Bounce',
                        requiredQty: 4,
                    },
                    {
                        deckId: 'deck-2',
                        deckTitle: 'Amber Steel Aggro',
                        requiredQty: 4,
                    },
                ],
            },
        ];

        const formatted = formatProxyPrintList(conflicts, [
            mockDeck1,
            mockDeck2,
        ]);
        expect(formatted).toContain(
            'LORCANA TRACKER - PHYSICAL DECK PROXY PRINT LIST',
        );
        expect(formatted).toContain('3× Madam Mim - Fox');
        expect(formatted).toContain('Amethyst Ruby Bounce (4×)');
        expect(formatted).toContain('Total Proxies Needed: 3 copies');
    });
});
