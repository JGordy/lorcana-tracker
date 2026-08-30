import { describe, it, expect } from 'vitest';
import {
    encodeDeckToString,
    decodeStringToDeck,
    generateDeckShareUrl,
    parseDeckFromUrl,
    type DeckCodeCard,
} from '../deck-code';

describe('deck-code utility', () => {
    const sampleCards: DeckCodeCard[] = [
        { set: 1, number: 45, count: 4 },
        { set: 1, number: 102, count: 3 },
        { set: 2, number: 14, count: 4 },
        { set: 2, number: 88, count: 2 },
    ];
    const sampleTitle = 'Ruby Amethyst Control';

    it('should encode and decode a deck payload in a lossless round trip', () => {
        const encoded = encodeDeckToString(sampleCards, sampleTitle);
        expect(encoded).toBeTypeOf('string');
        expect(encoded.length).toBeGreaterThan(0);

        const decoded = decodeStringToDeck(encoded);
        expect(decoded).not.toBeNull();
        expect(decoded?.title).toBe(sampleTitle);
        expect(decoded?.cards).toEqual(sampleCards);
    });

    it('should handle deck encoding without a title', () => {
        const encoded = encodeDeckToString(sampleCards);
        const decoded = decodeStringToDeck(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded?.title).toBeUndefined();
        expect(decoded?.cards).toEqual(sampleCards);
    });

    it('should generate valid share URL with #d= hash parameter', () => {
        const url = generateDeckShareUrl(
            sampleCards,
            sampleTitle,
            'https://lorcana-tracker.app',
        );
        expect(url).toContain('https://lorcana-tracker.app/deck#d=');

        const parsed = parseDeckFromUrl(url);
        expect(parsed).not.toBeNull();
        expect(parsed?.title).toBe(sampleTitle);
        expect(parsed?.cards).toEqual(sampleCards);
    });

    it('should parse deck parameter from query string ?d= as fallback', () => {
        const encoded = encodeDeckToString(sampleCards, sampleTitle);
        const url = `https://lorcana-tracker.app/deck?d=${encoded}`;

        const parsed = parseDeckFromUrl(url);
        expect(parsed).not.toBeNull();
        expect(parsed?.title).toBe(sampleTitle);
        expect(parsed?.cards).toEqual(sampleCards);
    });

    it('should handle corrupted or invalid encoded strings safely', () => {
        expect(decodeStringToDeck('')).toBeNull();
        expect(decodeStringToDeck('invalid_garbage_!!!')).toBeNull();
        expect(parseDeckFromUrl('')).toBeNull();
        expect(
            parseDeckFromUrl('https://lorcana-tracker.app/deck#d=corrupt'),
        ).toBeNull();
    });

    it('should ignore invalid card format entries gracefully', () => {
        const decoded = decodeStringToDeck(
            'Ruby Control|1-45:4,invalid-entry,2-14:3',
        );
        expect(decoded).not.toBeNull();
        expect(decoded?.title).toBe('Ruby Control');
        expect(decoded?.cards).toEqual([
            { set: 1, number: 45, count: 4 },
            { set: 2, number: 14, count: 3 },
        ]);
    });
});
