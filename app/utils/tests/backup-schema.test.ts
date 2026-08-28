import { describe, it, expect } from 'vitest';
import { parseAndValidateBackup, BackupSchema } from '../backup-schema';

describe('BackupSchema validation', () => {
    const validBackup = {
        version: 1,
        exported_at: '2026-08-28T10:00:00.000Z',
        collection: {
            'ariel-on-human-legs': { normal: 4, foil: 1 },
            'stitch-rock-star': { normal: 2, foil: 0 },
        },
        decks: [
            {
                title: 'Ruby Amethyst Control',
                cards: [
                    { card_id: 'ariel-on-human-legs', quantity: 4 },
                    { card_id: 'stitch-rock-star', quantity: 2 },
                ],
            },
        ],
    };

    it('should validate a correct JSON backup payload', () => {
        const jsonStr = JSON.stringify(validBackup);
        const parsed = parseAndValidateBackup(jsonStr);

        expect(parsed.version).toBe(1);
        expect(parsed.collection['ariel-on-human-legs']).toEqual({
            normal: 4,
            foil: 1,
        });
        expect(parsed.decks?.length).toBe(1);
    });

    it('should reject backup payload with invalid schema version', () => {
        const invalid = { ...validBackup, version: 99 };
        expect(() => parseAndValidateBackup(JSON.stringify(invalid))).toThrow();
    });

    it('should reject payload with negative card quantities', () => {
        const invalid = {
            ...validBackup,
            collection: {
                'ariel-on-human-legs': { normal: -5, foil: 0 },
            },
        };
        expect(() => parseAndValidateBackup(JSON.stringify(invalid))).toThrow();
    });

    it('should reject corrupted JSON input', () => {
        expect(() => parseAndValidateBackup('invalid json content')).toThrow();
    });
});
