import { describe, it, expect } from 'vitest';
import { serializeDeckMetadata, processMyDecks } from '../myDecksHelpers';

describe('myDecksHelpers', () => {
    it('serializes deck metadata to JSON string correctly', () => {
        const result = serializeDeckMetadata(
            'core',
            ['amber', 'ruby'],
            'Aggro deck',
            'card-1',
        );
        const parsed = JSON.parse(result);
        expect(parsed).toEqual({
            format: 'core',
            inks: ['amber', 'ruby'],
            description: 'Aggro deck',
            coverCardId: 'card-1',
        });
    });

    it('processes local decks and resolves metadata, inks, and core legality', () => {
        const mockDecks = [
            {
                $id: 'd1',
                title: 'Amber Ruby Aggro',
                description: JSON.stringify({
                    format: 'core',
                    inks: ['amber', 'ruby'],
                    description: 'Fast deck',
                }),
                cards: [
                    {
                        card: {
                            id: 'c1',
                            name: 'Stitch',
                            ink_color: 'Amber',
                            formats: ['core', 'infinity'],
                        },
                        requiredQty: 4,
                        ownedQty: 4,
                    },
                ],
            },
        ];

        const lookup = new Map();
        const processed = processMyDecks(mockDecks, 'Amber', lookup);

        expect(processed).toHaveLength(1);
        expect(processed[0].displayInks).toContain('amber');
        expect(processed[0].isCoreLegal).toBe(true);
        expect(processed[0].totalCardsCount).toBe(4);
    });
});
