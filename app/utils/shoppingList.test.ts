import { describe, it, expect } from 'vitest';
import {
    getMissingCards,
    formatTcgPlayerMassEntry,
    formatMarkdownShoppingList,
    formatPlainTextShoppingList,
    getTcgPlayerMassEntryUrl,
    getTcgPlayerCardSearchUrl,
    getCardmarketWantsUrl,
} from './shoppingList';
import type { DeckWithProgress } from '../types/lorcana';

describe('shoppingList utils', () => {
    const mockDeck: DeckWithProgress = {
        $id: 'deck-1',
        id: 'deck-1',
        title: 'Amber Ruby Aggro',
        description: 'Aggro deck',
        creator_id: 'user-1',
        is_public: true,
        progress: {
            percentage: 50,
            ownedCount: 3,
            totalCount: 6,
            missingCards: [],
        },
        cards: [
            {
                card: {
                    $id: 'maui-hero-to-all',
                    id: 'maui-hero-to-all',
                    name: 'Maui - Hero to All',
                    set: 'The First Chapter',
                    number: 115,
                    ink_color: 'Ruby',
                    cost: 5,
                    inkwell: false,
                    strength: 6,
                    willpower: 5,
                    lore: 0,
                    type: ['Character'],
                    classifications: ['Storyborn', 'Hero', 'Deity'],
                    rarity: 'Rare',
                    image_url: 'https://example.com/maui.jpg',
                    formats: ['core', 'infinity'],
                },
                requiredQty: 4,
                ownedQty: 2,
            },
            {
                card: {
                    $id: 'stitch-rock-star',
                    id: 'stitch-rock-star',
                    name: 'Stitch - Rock Star',
                    set: 'The First Chapter',
                    number: 23,
                    ink_color: 'Amber',
                    cost: 6,
                    inkwell: true,
                    strength: 3,
                    willpower: 5,
                    lore: 3,
                    type: ['Character'],
                    classifications: ['Floodborn', 'Hero', 'Alien'],
                    rarity: 'Super Rare',
                    image_url: 'https://example.com/stitch.jpg',
                    formats: ['core', 'infinity'],
                },
                requiredQty: 2,
                ownedQty: 1,
            },
            {
                card: {
                    $id: 'be-our-guest',
                    id: 'be-our-guest',
                    name: 'Be Our Guest',
                    set: 'The First Chapter',
                    number: 28,
                    ink_color: 'Amber',
                    cost: 2,
                    inkwell: true,
                    strength: null,
                    willpower: null,
                    lore: 0,
                    type: ['Action', 'Song'],
                    classifications: [],
                    rarity: 'Common',
                    image_url: 'https://example.com/bog.jpg',
                    formats: ['core', 'infinity'],
                },
                requiredQty: 4,
                ownedQty: 4, // Fully owned, should NOT be in missing list
            },
        ],
    };

    it('extracts only missing cards and computes missing quantities correctly', () => {
        const missing = getMissingCards(mockDeck);
        expect(missing).toHaveLength(2);

        // Amber sorted before Ruby
        expect(missing[0].card.name).toBe('Stitch - Rock Star');
        expect(missing[0].missingQty).toBe(1);
        expect(missing[0].requiredQty).toBe(2);
        expect(missing[0].ownedQty).toBe(1);

        expect(missing[1].card.name).toBe('Maui - Hero to All');
        expect(missing[1].missingQty).toBe(2);
        expect(missing[1].requiredQty).toBe(4);
        expect(missing[1].ownedQty).toBe(2);
    });

    it('returns empty array if all cards are owned', () => {
        const fullDeck: DeckWithProgress = {
            ...mockDeck,
            cards: mockDeck.cards.map((c) => ({
                ...c,
                ownedQty: c.requiredQty,
            })),
        };
        const missing = getMissingCards(fullDeck);
        expect(missing).toEqual([]);
    });

    it('formats TCGPlayer mass entry text correctly', () => {
        const missing = getMissingCards(mockDeck);
        const tcgText = formatTcgPlayerMassEntry(missing);
        expect(tcgText).toBe('1 Stitch - Rock Star\n2 Maui - Hero to All');
    });

    it('formats Markdown shopping list checklist', () => {
        const missing = getMissingCards(mockDeck);
        const mdText = formatMarkdownShoppingList(mockDeck.title, missing);
        expect(mdText).toContain('### Shopping List: Amber Ruby Aggro');
        expect(mdText).toContain(
            '**Total Missing Cards:** 3 across 2 unique card(s)',
        );
        expect(mdText).toContain(
            '- [ ] **1x** Stitch - Rock Star [Amber] (Super Rare)',
        );
        expect(mdText).toContain(
            '- [ ] **2x** Maui - Hero to All [Ruby] (Rare)',
        );
    });

    it('formats Plain text shopping list', () => {
        const missing = getMissingCards(mockDeck);
        const plainText = formatPlainTextShoppingList(mockDeck.title, missing);
        expect(plainText).toContain('Shopping List: Amber Ruby Aggro');
        expect(plainText).toContain('Total Missing: 3 (2 unique cards)');
        expect(plainText).toContain(
            '1x Stitch - Rock Star (Amber) - Need 1 (Own 1/2)',
        );
    });

    it('generates direct TCGPlayer Mass Entry URL', () => {
        const url = getTcgPlayerMassEntryUrl();
        expect(url).toBe('https://www.tcgplayer.com/massentry');
    });

    it('generates direct TCGPlayer Card search URL', () => {
        const url = getTcgPlayerCardSearchUrl('Maui - Hero to All');
        expect(url).toBe(
            'https://www.tcgplayer.com/search/disney-lorcana/product?q=Maui%20-%20Hero%20to%20All',
        );
    });

    it('generates Cardmarket Wants URL', () => {
        expect(getCardmarketWantsUrl()).toBe(
            'https://www.cardmarket.com/en/Lorcana/Wants',
        );
    });
});
