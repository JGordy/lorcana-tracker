import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    getCardUnitPrice,
    getCardBestPrice,
    calculateCollectionValuation,
    calculateDeckCost,
} from '../valuation';
import type { Card as LorcanaCard } from '../../types/lorcana';
import { buildCardsLookup } from '../deck';

describe('Valuation Utilities', () => {
    describe('formatCurrency', () => {
        it('formats positive numbers to USD standard currency', () => {
            expect(formatCurrency(1245.5)).toBe('$1,245.50');
            expect(formatCurrency(0.5)).toBe('$0.50');
            expect(formatCurrency(0)).toBe('$0.00');
        });

        it('returns fallback string for null, undefined, or NaN values', () => {
            expect(formatCurrency(null)).toBe('—');
            expect(formatCurrency(undefined)).toBe('—');
            expect(formatCurrency(NaN)).toBe('—');
            expect(formatCurrency(null, 'N/A')).toBe('N/A');
        });
    });

    describe('getCardUnitPrice & getCardBestPrice', () => {
        const standardCard: LorcanaCard = {
            id: 'crd-1',
            $id: 'crd-1',
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
            classifications: ['Storyborn', 'Hero'],
            rarity: 'Uncommon',
            image_url: '',
            formats: ['core', 'infinity'],
            prices: {
                usd: 0.25,
                usd_foil: 1.5,
            },
        };

        const foilOnlyCard: LorcanaCard = {
            id: 'crd-enchanted',
            $id: 'crd-enchanted',
            name: 'Elsa - Spirit of Winter (Enchanted)',
            set: 'The First Chapter',
            number: 205,
            ink_color: 'Amethyst',
            cost: 8,
            inkwell: false,
            strength: 4,
            willpower: 6,
            lore: 3,
            type: ['Character'],
            classifications: ['Floodborn'],
            rarity: 'Enchanted',
            image_url: '',
            formats: ['core', 'infinity'],
            prices: {
                usd: null,
                usd_foil: 450.0,
            },
        };

        const unpricedCard: LorcanaCard = {
            id: 'crd-unpriced',
            $id: 'crd-unpriced',
            name: 'Unpriced Promo',
            set: 'Promo Set 1',
            number: 1,
            ink_color: 'Steel',
            cost: 2,
            inkwell: true,
            strength: 2,
            willpower: 2,
            lore: 1,
            type: ['Character'],
            classifications: [],
            rarity: 'Promo',
            image_url: '',
            formats: ['infinity'],
        };

        it('returns regular price for non-foil and foil price for foil items', () => {
            expect(getCardUnitPrice(standardCard, false)).toBe(0.25);
            expect(getCardUnitPrice(standardCard, true)).toBe(1.5);
        });

        it('falls back to standard price for foil request if foil price is null', () => {
            const onlyStandard: LorcanaCard = {
                ...standardCard,
                prices: { usd: 3.5, usd_foil: null },
            };
            expect(getCardUnitPrice(onlyStandard, true)).toBe(3.5);
        });

        it('handles foil-only cards properly', () => {
            expect(getCardUnitPrice(foilOnlyCard, true)).toBe(450.0);
            expect(getCardUnitPrice(foilOnlyCard, false)).toBeNull();
        });

        it('returns null for unpriced cards or missing card objects', () => {
            expect(getCardUnitPrice(unpricedCard, false)).toBeNull();
            expect(getCardUnitPrice(null, false)).toBeNull();
        });

        it('resolves best price among regular and foil', () => {
            expect(getCardBestPrice(standardCard)).toBe(1.5);
            expect(getCardBestPrice(foilOnlyCard)).toBe(450.0);
            expect(getCardBestPrice(unpricedCard)).toBeNull();
            expect(getCardBestPrice(null)).toBeNull();
        });
    });

    describe('calculateCollectionValuation', () => {
        const cardsCatalog: LorcanaCard[] = [
            {
                id: 'tink-giant',
                $id: 'tink-giant',
                name: 'Tinker Bell - Giant Fairy',
                set: 'The First Chapter',
                number: 193,
                ink_color: 'Steel',
                cost: 6,
                inkwell: true,
                strength: 4,
                willpower: 5,
                lore: 2,
                type: ['Character'],
                classifications: ['Floodborn'],
                rarity: 'Super Rare',
                image_url: '',
                formats: ['core', 'infinity'],
                prices: { usd: 8.0, usd_foil: 18.0 },
            },
            {
                id: 'stitch-rock-star',
                $id: 'stitch-rock-star',
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
                classifications: ['Floodborn'],
                rarity: 'Super Rare',
                image_url: '',
                formats: ['core', 'infinity'],
                prices: { usd: 5.0, usd_foil: 12.0 },
            },
            {
                id: 'mickey-rogue',
                $id: 'mickey-rogue',
                name: 'Mickey Mouse - Wayward Sorcerer',
                set: 'The First Chapter',
                number: 115,
                ink_color: 'Amethyst',
                cost: 4,
                inkwell: true,
                strength: 3,
                willpower: 4,
                lore: 2,
                type: ['Character'],
                classifications: ['Dreamborn'],
                rarity: 'Super Rare',
                image_url: '',
                formats: ['core', 'infinity'],
                prices: { usd: 3.0, usd_foil: null },
            },
            {
                id: 'elsa-enchanted',
                $id: 'elsa-enchanted',
                name: 'Elsa - Spirit of Winter (Enchanted)',
                set: 'The First Chapter',
                number: 205,
                ink_color: 'Amethyst',
                cost: 8,
                inkwell: false,
                strength: 4,
                willpower: 6,
                lore: 3,
                type: ['Character'],
                classifications: ['Floodborn'],
                rarity: 'Enchanted',
                image_url: '',
                formats: ['core', 'infinity'],
                prices: { usd: null, usd_foil: 400.0 },
            },
        ];

        const cardsLookup = buildCardsLookup(cardsCatalog);

        it('calculates accurate valuation totals, foil splits, and top gems', () => {
            const userCollection = [
                {
                    user_id: 'user-1',
                    card_id: 'tink-giant',
                    quantity: 2,
                    is_foil: false,
                }, // 2 * $8 = $16
                {
                    user_id: 'user-1',
                    card_id: 'tink-giant',
                    quantity: 1,
                    is_foil: true,
                }, // 1 * $18 = $18
                {
                    user_id: 'user-1',
                    card_id: 'stitch-rock-star',
                    quantity: 4,
                    is_foil: false,
                }, // 4 * $5 = $20
                {
                    user_id: 'user-1',
                    card_id: 'elsa-enchanted',
                    quantity: 1,
                    is_foil: true,
                }, // 1 * $400 = $400
                {
                    user_id: 'user-1',
                    card_id: 'unknown-card',
                    quantity: 3,
                    is_foil: false,
                }, // unpriced
            ];

            const result = calculateCollectionValuation(
                userCollection,
                cardsLookup,
            );

            expect(result.standardValue).toBe(36.0); // 16 + 20
            expect(result.foilValue).toBe(418.0); // 18 + 400
            expect(result.totalValue).toBe(454.0); // 36 + 418
            expect(result.standardCount).toBe(9); // 2 + 4 + 3
            expect(result.foilCount).toBe(2); // 1 + 1
            expect(result.totalOwnedCount).toBe(11);
            expect(result.uniqueOwnedCount).toBe(4);
            expect(result.pricedCount).toBe(8);
            expect(result.unpricedCount).toBe(3);

            // Top gems sorted by unit price descending
            expect(result.topGems.length).toBe(4);
            expect(result.topGems[0].card.name).toBe(
                'Elsa - Spirit of Winter (Enchanted)',
            );
            expect(result.topGems[0].unitPrice).toBe(400.0);
            expect(result.topGems[0].totalValue).toBe(400.0);
            expect(result.topGems[1].card.name).toBe(
                'Tinker Bell - Giant Fairy',
            );
            expect(result.topGems[1].isFoil).toBe(true);
            expect(result.topGems[1].unitPrice).toBe(18.0);
        });

        it('returns zero totals gracefully for empty collections', () => {
            const result = calculateCollectionValuation([], cardsLookup);
            expect(result.totalValue).toBe(0);
            expect(result.standardValue).toBe(0);
            expect(result.foilValue).toBe(0);
            expect(result.topGems).toEqual([]);
        });
    });

    describe('calculateDeckCost', () => {
        const deckCards = [
            {
                card: {
                    id: 'card-a',
                    name: 'Card A',
                    prices: { usd: 10.0, usd_foil: 25.0 },
                } as LorcanaCard,
                requiredQty: 4,
                ownedQty: 2,
            }, // Need 2 ($20). Total Req 4 ($40)
            {
                card: {
                    id: 'card-b',
                    name: 'Card B',
                    prices: { usd: 2.5, usd_foil: 5.0 },
                } as LorcanaCard,
                requiredQty: 4,
                ownedQty: 4,
            }, // Need 0 ($0). Total Req 4 ($10)
            {
                card: {
                    id: 'card-c',
                    name: 'Card C',
                    prices: { usd: null, usd_foil: null },
                } as LorcanaCard,
                requiredQty: 2,
                ownedQty: 0,
            }, // Unpriced
        ];

        it('calculates total deck market cost and cost to finish missing cards', () => {
            const costResult = calculateDeckCost(deckCards);

            expect(costResult.totalDeckCost).toBe(50.0); // (4 * 10) + (4 * 2.5)
            expect(costResult.costToFinish).toBe(20.0); // 2 * 10
            expect(costResult.missingCardsValuationCount).toBe(2);
            expect(costResult.missingCardsTotalCount).toBe(4); // 2 of Card A + 2 of Card C
            expect(costResult.pricedCardsCount).toBe(8);
            expect(costResult.totalRequiredCards).toBe(10);
        });

        it('handles zero or empty deck lists safely', () => {
            const costResult = calculateDeckCost([]);
            expect(costResult.totalDeckCost).toBe(0);
            expect(costResult.costToFinish).toBe(0);
        });
    });
});
