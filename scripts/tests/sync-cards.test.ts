import { describe, it, expect } from 'vitest';
// @ts-expect-error sync-cards is a CommonJS script without type definitions
import {
    getCardSlug,
    buildLorcastLookups,
    normalizeCard,
} from '../sync-cards.js';

describe('sync-cards.js', () => {
    describe('getCardSlug', () => {
        it('normalizes card names into clean URL slugs', () => {
            expect(getCardSlug('Ariel - On Human Legs')).toBe(
                'ariel-on-human-legs',
            );
            expect(getCardSlug("Ursula's Return")).toBe('ursulas-return');
        });
    });

    describe('buildLorcastLookups & normalizeCard', () => {
        const mockLorcastCards = [
            {
                tcgplayer_id: 494102,
                name: 'Ariel',
                version: 'On Human Legs',
                collector_number: '1',
                set: { code: '1', name: 'The First Chapter' },
                prices: { usd: '0.15', usd_foil: '0.90' },
                purchase_uris: {
                    tcgplayer: 'https://www.tcgplayer.com/product/494102',
                },
            },
        ];

        const mockLorcanaJsonCard = {
            fullName: 'Ariel - On Human Legs',
            name: 'Ariel',
            version: 'On Human Legs',
            setCode: '1',
            number: 1,
            rarity: 'Uncommon',
            color: 'Amber',
            cost: 4,
            inkwell: true,
            strength: 3,
            willpower: 4,
            lore: 2,
            type: 'Character',
            subtypes: ['Storyborn', 'Hero', 'Princess'],
            images: {
                full: 'https://example.com/ariel.jpg',
            },
            externalLinks: {
                tcgPlayerId: 494102,
                tcgPlayerUrl: 'https://www.tcgplayer.com/product/494102',
                cardmarketUrl: 'https://www.cardmarket.com/ariel',
            },
        };

        it('enriches normalized cards with Lorcast pricing and store links', () => {
            const lookup = buildLorcastLookups(mockLorcastCards);
            const usedSlugs = new Set();
            const normalized = normalizeCard(
                mockLorcanaJsonCard,
                usedSlugs,
                lookup,
            );

            expect(normalized.id).toBe('ariel-on-human-legs');
            expect(normalized.prices).toEqual({
                usd: 0.15,
                usd_foil: 0.9,
            });
            expect(normalized.tcgplayer_url).toBe(
                'https://www.tcgplayer.com/product/494102',
            );
            expect(normalized.cardmarket_url).toBe(
                'https://www.cardmarket.com/ariel',
            );
        });

        it('handles unpriced and missing lookup entries safely', () => {
            const usedSlugs = new Set();
            const normalized = normalizeCard(
                {
                    fullName: 'Unknown Card',
                    setCode: '99',
                    number: 99,
                },
                usedSlugs,
                null,
            );

            expect(normalized.prices).toEqual({
                usd: null,
                usd_foil: null,
            });
            expect(normalized.tcgplayer_url).toBeUndefined();
        });
    });
});
