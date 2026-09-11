import { describe, it, expect, vi } from 'vitest';
import {
    extractBase64Payload,
    matchVisionResultToCatalog,
    identifyCardWithGeminiVision,
} from '../geminiVision.server';
import type { Card } from '../../../types/lorcana';

const mockCatalog: Card[] = [
    {
        $id: 'elsa-spirit-of-winter',
        id: 'elsa-spirit-of-winter',
        name: 'Elsa - Spirit of Winter',
        set: 'The First Chapter',
        number: 42,
        ink_color: 'Amethyst',
        cost: 8,
        inkwell: false,
        strength: 4,
        willpower: 6,
        lore: 2,
        type: ['Character'],
        classifications: ['Floodborn', 'Hero', 'Queen', 'Sorcerer'],
        rarity: 'Legendary',
        image_url: 'https://api.lorcana.ravensburger.com/images/en/set1/42.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'tinker-bell-giant-fairy',
        id: 'tinker-bell-giant-fairy',
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
        classifications: ['Floodborn', 'Hero', 'Fairy'],
        rarity: 'Super Rare',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set1/193.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'anna-braving-the-storm',
        id: 'anna-braving-the-storm',
        name: 'Anna - Braving the Storm',
        set: "Ursula's Return",
        number: 137,
        ink_color: 'Sapphire',
        cost: 2,
        inkwell: true,
        strength: 1,
        willpower: 4,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Queen'],
        rarity: 'Common',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set4/137.jpg',
        formats: ['core', 'infinity'],
    },
    {
        $id: 'anna-braving-the-storm-9-218',
        id: 'anna-braving-the-storm-9-218',
        name: 'Anna - Braving the Storm',
        set: 'Fabled',
        number: 218,
        ink_color: 'Sapphire',
        cost: 2,
        inkwell: true,
        strength: 1,
        willpower: 4,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Queen'],
        rarity: 'Epic',
        image_url:
            'https://api.lorcana.ravensburger.com/images/en/set9/218.jpg',
        formats: ['core', 'infinity'],
    },
];

describe('extractBase64Payload', () => {
    it('extracts base64 data and mimeType from data URL', () => {
        const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE=';
        const result = extractBase64Payload(dataUrl);
        expect(result.mimeType).toBe('image/png');
        expect(result.base64).toBe('iVBORw0KGgoAAAANSUhEUgAAAAE=');
    });

    it('handles raw base64 strings with default jpeg mimeType', () => {
        const raw = 'dGVzdGJhc2U2NA==';
        const result = extractBase64Payload(raw);
        expect(result.mimeType).toBe('image/jpeg');
        expect(result.base64).toBe('dGVzdGJhc2U2NA==');
    });
});

describe('matchVisionResultToCatalog', () => {
    it('matches by set number and card number', () => {
        const match = matchVisionResultToCatalog(
            {
                name: 'Elsa',
                version: 'Spirit of Winter',
                setNumber: 1,
                cardNumber: 42,
            },
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.id).toBe('elsa-spirit-of-winter');
    });

    it('matches by full character name and version', () => {
        const match = matchVisionResultToCatalog(
            {
                name: 'Tinker Bell',
                version: 'Giant Fairy',
            },
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.id).toBe('tinker-bell-giant-fairy');
    });

    it('matches over-numbered Epic card by title and card number (resolving reprint collisions)', () => {
        const match = matchVisionResultToCatalog(
            {
                name: 'Anna',
                version: 'Braving the Storm',
                cardNumber: 218,
            },
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.rarity).toBe('Epic');
        expect(match?.number).toBe(218);
    });

    it('matches over-numbered card by title and rarity', () => {
        const match = matchVisionResultToCatalog(
            {
                name: 'Anna',
                version: 'Braving the Storm',
                rarity: 'Epic',
            },
            mockCatalog,
        );
        expect(match).not.toBeNull();
        expect(match?.id).toBe('anna-braving-the-storm-9-218');
        expect(match?.rarity).toBe('Epic');
    });

    it('returns null when card cannot be found', () => {
        const match = matchVisionResultToCatalog(
            {
                name: 'Unknown Character',
                setNumber: 99,
                cardNumber: 999,
            },
            mockCatalog,
        );
        expect(match).toBeNull();
    });
});

describe('identifyCardWithGeminiVision', () => {
    it('returns error when API key is missing', async () => {
        const origKey = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;

        const result = await identifyCardWithGeminiVision(
            'dGVzdA==',
            mockCatalog,
            '',
        );
        expect(result.success).toBe(false);
        expect(result.error).toContain('AI Vision is currently offline');

        if (origKey) process.env.GEMINI_API_KEY = origKey;
    });
});
