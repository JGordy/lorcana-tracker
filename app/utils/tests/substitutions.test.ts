import { describe, it, expect } from 'vitest';
import {
    extractCardKeywords,
    calculateSubstitutionScore,
    findCardSubstitutions,
} from '../substitutions';
import type { Card } from '../../types/lorcana';

const mockTargetMaui: Card = {
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
    classifications: ['Storyborn', 'Hero', 'Deity', 'Rush'],
    rarity: 'Rare',
    image_url: 'https://api.lorcana.ravensburger.com/images/maui.jpg',
    formats: ['core', 'infinity'],
    prices: { usd: 18.5, usd_foil: 28.0 },
};

const mockZeus: Card = {
    $id: 'zeus-god-of-lightning',
    id: 'zeus-god-of-lightning',
    name: 'Zeus - God of Lightning',
    set: 'The First Chapter',
    number: 130,
    ink_color: 'Ruby',
    cost: 5,
    inkwell: true,
    strength: 0,
    willpower: 4,
    lore: 2,
    type: ['Character'],
    classifications: ['Storyborn', 'Deity', 'Rush', 'Challenger'],
    rarity: 'Rare',
    image_url: 'https://api.lorcana.ravensburger.com/images/zeus.jpg',
    formats: ['core', 'infinity'],
    prices: { usd: 0.75, usd_foil: 2.0 },
};

const mockDragonFire: Card = {
    $id: 'dragon-fire',
    id: 'dragon-fire',
    name: 'Dragon Fire',
    set: 'The First Chapter',
    number: 132,
    ink_color: 'Ruby',
    cost: 5,
    inkwell: false,
    strength: null,
    willpower: null,
    lore: 0,
    type: ['Action'],
    classifications: [],
    rarity: 'Uncommon',
    image_url: 'https://api.lorcana.ravensburger.com/images/dragonfire.jpg',
    formats: ['core', 'infinity'],
    prices: { usd: 0.5, usd_foil: 1.5 },
};

const mockArielSinger: Card = {
    $id: 'ariel-spectacular-singer',
    id: 'ariel-spectacular-singer',
    name: 'Ariel - Spectacular Singer',
    set: 'The First Chapter',
    number: 2,
    ink_color: 'Amber',
    cost: 3,
    inkwell: true,
    strength: 2,
    willpower: 3,
    lore: 1,
    type: ['Character'],
    classifications: ['Storyborn', 'Hero', 'Princess'],
    rarity: 'Super Rare',
    image_url: 'https://api.lorcana.ravensburger.com/images/ariel.jpg',
    formats: ['core', 'infinity'],
    prices: { usd: 12.0, usd_foil: 22.0 },
};

const mockCinderellaSinger: Card = {
    $id: 'cinderella-ballroom-sensation',
    id: 'cinderella-ballroom-sensation',
    name: 'Cinderella - Ballroom Sensation',
    set: 'Rise of the Floodborn',
    number: 3,
    ink_color: 'Amber',
    cost: 1,
    inkwell: true,
    strength: 1,
    willpower: 2,
    lore: 1,
    type: ['Character'],
    classifications: ['Dreamborn', 'Hero', 'Princess', 'Singer'],
    rarity: 'Rare',
    image_url: 'https://api.lorcana.ravensburger.com/images/cinderella.jpg',
    formats: ['core', 'infinity'],
    prices: { usd: 1.25, usd_foil: 4.5 },
};

const mockSongBeOurGuest: Card = {
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
    rarity: 'Uncommon',
    image_url: 'https://api.lorcana.ravensburger.com/images/beourguest.jpg',
    formats: ['core', 'infinity'],
    prices: { usd: 0.35, usd_foil: 1.0 },
};

const mockSongOneJumpAhead: Card = {
    $id: 'one-jump-ahead',
    id: 'one-jump-ahead',
    name: 'One Jump Ahead',
    set: 'The First Chapter',
    number: 164,
    ink_color: 'Sapphire',
    cost: 2,
    inkwell: true,
    strength: null,
    willpower: null,
    lore: 0,
    type: ['Action', 'Song'],
    classifications: [],
    rarity: 'Uncommon',
    image_url: 'https://api.lorcana.ravensburger.com/images/onejump.jpg',
    formats: ['core', 'infinity'],
    prices: { usd: 0.4, usd_foil: 1.2 },
};

describe('Substitutions Utility', () => {
    describe('extractCardKeywords', () => {
        it('extracts keywords from classifications', () => {
            const kws = extractCardKeywords(mockTargetMaui);
            expect(kws).toContain('Rush');
            expect(kws).toContain('Hero');
            expect(kws).toContain('Storyborn');
        });

        it('extracts Song from card type', () => {
            const kws = extractCardKeywords(mockSongBeOurGuest);
            expect(kws).toContain('Song');
        });

        it('extracts Singer from card name if not in classifications', () => {
            const kws = extractCardKeywords(mockArielSinger);
            expect(kws).toContain('Singer');
            expect(kws).toContain('Princess');
        });
    });

    describe('calculateSubstitutionScore', () => {
        it('scores high compatibility for Zeus replacing Maui', () => {
            const result = calculateSubstitutionScore(
                mockZeus,
                mockTargetMaui,
                {
                    ownedQty: 4,
                },
            );

            expect(result.score).toBeGreaterThan(60);
            expect(result.reasons).toContain('Same Type (Character)');
            expect(result.reasons).toContain('Exact Cost (5)');
            expect(result.reasons).toContain('Both have Rush');
            expect(result.reasons).toContain('In Collection (4 owned)');
            expect(result.priceDifference).toBeCloseTo(17.75, 2);
            expect(result.percentSavings).toBeGreaterThan(90);
        });

        it('rewards Song-to-Song matches with extra bonus', () => {
            const result = calculateSubstitutionScore(
                mockSongOneJumpAhead,
                mockSongBeOurGuest,
            );
            expect(result.reasons).toContain('Both are Songs');
            expect(result.score).toBeGreaterThan(50);
        });

        it('handles cards without prices safely', () => {
            const unpricedCard: Card = {
                ...mockZeus,
                prices: undefined,
            };
            const result = calculateSubstitutionScore(
                unpricedCard,
                mockTargetMaui,
            );
            expect(result.priceDifference).toBeNull();
            expect(result.percentSavings).toBeNull();
            expect(result.score).toBeGreaterThan(0);
        });
    });

    describe('findCardSubstitutions', () => {
        const catalog: Card[] = [
            mockTargetMaui,
            mockZeus,
            mockDragonFire,
            mockArielSinger,
            mockCinderellaSinger,
            mockSongBeOurGuest,
            mockSongOneJumpAhead,
        ];

        const mockDeck = {
            cards: [{ card: mockTargetMaui, requiredQty: 4, ownedQty: 0 }],
            displayInks: ['Ruby', 'Amber'],
            meta: { inks: ['Ruby', 'Amber'], format: 'core' },
        };

        it('returns ranked substitutes matching ink color and role', () => {
            const subs = findCardSubstitutions(
                mockTargetMaui,
                mockDeck,
                catalog,
                [{ card_id: mockZeus.id, quantity: 2 }],
            );

            expect(subs.length).toBeGreaterThan(0);
            // Zeus should rank #1 because it has same cost (5), same ink (Ruby), Rush, and is owned
            expect(subs[0].card.id).toBe(mockZeus.id);
            expect(subs[0].ownedQty).toBe(2);
            expect(subs[0].reasons).toContain('Both have Rush');
        });

        it('excludes the target card itself', () => {
            const subs = findCardSubstitutions(
                mockTargetMaui,
                mockDeck,
                catalog,
            );
            expect(subs.some((s) => s.card.id === mockTargetMaui.id)).toBe(
                false,
            );
        });

        it('excludes cards already maxed at 4x in the deck', () => {
            const deckWithMaxedZeus = {
                ...mockDeck,
                cards: [
                    { card: mockTargetMaui, requiredQty: 4 },
                    { card: mockZeus, requiredQty: 4 },
                ],
            };

            const subs = findCardSubstitutions(
                mockTargetMaui,
                deckWithMaxedZeus,
                catalog,
            );
            expect(subs.some((s) => s.card.id === mockZeus.id)).toBe(false);
        });

        it('filters by onlyOwned when option is enabled', () => {
            const subs = findCardSubstitutions(
                mockTargetMaui,
                mockDeck,
                catalog,
                [{ card_id: mockDragonFire.id, quantity: 3 }],
                { onlyOwned: true },
            );

            expect(subs.every((s) => s.ownedQty > 0)).toBe(true);
            expect(subs.some((s) => s.card.id === mockDragonFire.id)).toBe(
                true,
            );
            expect(subs.some((s) => s.card.id === mockZeus.id)).toBe(false);
        });

        it('correctly aggregates owned quantities across normal, foil, and alias entries in userCollection', () => {
            const subs = findCardSubstitutions(
                mockTargetMaui,
                mockDeck,
                catalog,
                [
                    { card_id: mockZeus.id, quantity: 3 },
                    { card_id: `${mockZeus.id}-foil`, quantity: 1 } as any,
                ],
            );

            const zeusSub = subs.find((s) => s.card.id === mockZeus.id);
            expect(zeusSub).toBeDefined();
            expect(zeusSub?.ownedQty).toBe(4);
        });

        it('filters by exactCostOnly when requested', () => {
            const subs = findCardSubstitutions(
                mockTargetMaui,
                mockDeck,
                catalog,
                [],
                { exactCostOnly: true },
            );

            expect(subs.every((s) => s.card.cost === 5)).toBe(true);
        });
    });
});
