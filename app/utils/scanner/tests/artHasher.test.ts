import { describe, it, expect, beforeEach } from 'vitest';
import {
    hexHammingDistance,
    computeDHashFromGrayscale72,
    findBestVisualMatch,
    type CardArtHash,
} from '../artHasher';

describe('artHasher visual matching utilities', () => {
    describe('hexHammingDistance', () => {
        it('returns 0 for identical hashes', () => {
            const hash = 'a1b2c3d4e5f60718';
            expect(hexHammingDistance(hash, hash)).toBe(0);
        });

        it('returns 64 for inverted hashes', () => {
            const h1 = '0000000000000000';
            const h2 = 'ffffffffffffffff';
            expect(hexHammingDistance(h1, h2)).toBe(64);
        });

        it('calculates exact single-bit differences', () => {
            const h1 = '0000000000000000';
            const h2 = '0000000000000001'; // 1 bit flipped
            const h3 = '0000000000000007'; // 3 bits flipped (0111)
            expect(hexHammingDistance(h1, h2)).toBe(1);
            expect(hexHammingDistance(h1, h3)).toBe(3);
        });

        it('handles invalid or mismatched lengths gracefully with distance 64', () => {
            expect(hexHammingDistance('abc', 'def')).toBe(64);
            expect(hexHammingDistance('', '0000000000000000')).toBe(64);
        });
    });

    describe('computeDHashFromGrayscale72', () => {
        it('generates consistent 16-character hex hash from 72 pixel values', () => {
            // 8 rows of 9 pixels alternating high/low
            const pixels = new Uint8Array(72);
            for (let i = 0; i < 72; i++) {
                pixels[i] = i % 2 === 0 ? 255 : 0;
            }
            const hash = computeDHashFromGrayscale72(pixels);
            expect(hash).toHaveLength(16);
            expect(typeof hash).toBe('string');
        });
    });

    describe('findBestVisualMatch', () => {
        const mockCatalog: CardArtHash[] = [
            {
                id: 'ariel-on-human-legs',
                name: 'Ariel - On Human Legs',
                set: 'The First Chapter',
                number: 1,
                rarity: 'Common',
                artHash: '1122334455667788',
                fullHash: '0011223344556677',
            },
            {
                id: 'anna-braving-the-storm-9-218',
                name: 'Anna - Braving the Storm',
                set: 'Fabled',
                number: 218,
                rarity: 'Epic',
                artHash: 'aabbccddeeff0011',
                fullHash: '9988776655443322',
            },
            {
                id: 'cinderella-gentle-and-kind',
                name: 'Cinderella - Gentle and Kind',
                set: 'The First Chapter',
                number: 3,
                rarity: 'Uncommon',
                artHash: '1234567890abcdef',
                fullHash: 'fedcba0987654321',
            },
        ];

        it('returns exact match with distance 0 and confidence 1.0', () => {
            const match = findBestVisualMatch(
                'aabbccddeeff0011',
                '9988776655443322',
                mockCatalog,
            );
            expect(match).not.toBeNull();
            expect(match?.cardId).toBe('anna-braving-the-storm-9-218');
            expect(match?.artDistance).toBe(0);
            expect(match?.confidence).toBe(1);
        });

        it('matches within tolerance when live hash has minor noise/lighting shifts', () => {
            // Flip 2 bits from Anna's hash: 'aabbccddeeff0011' -> 'aabbccddeeff0013'
            const noisyHash = 'aabbccddeeff0013';
            const match = findBestVisualMatch(
                noisyHash,
                '9988776655443322',
                mockCatalog,
                14,
            );
            expect(match).not.toBeNull();
            expect(match?.cardId).toBe('anna-braving-the-storm-9-218');
            expect(match?.artDistance).toBe(1);
            expect(match?.confidence).toBeGreaterThan(0.95);
        });

        it('returns null when distance exceeds threshold', () => {
            const completelyDifferentHash = 'ffffffffffffffff';
            const match = findBestVisualMatch(
                completelyDifferentHash,
                null,
                mockCatalog,
                10,
            );
            expect(match).toBeNull();
        });

        it('returns null when catalog is empty', () => {
            const match = findBestVisualMatch('aabbccddeeff0011', null, []);
            expect(match).toBeNull();
        });
    });
});
