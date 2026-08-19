import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDatabases = {
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
};

vi.mock('../utils/appwrite/server', () => ({
    createAdminClient: () => ({
        databases: mockDatabases,
    }),
    createSessionClient: () => ({
        databases: mockDatabases,
    }),
}));

vi.mock('../utils/appwrite/config', () => ({
    appwriteConfig: {
        isConfigured: true,
        databaseId: 'test_db',
    },
}));

import { dbService } from './appwrite.server';
import { COLLECTIONS } from '../types/lorcana';

describe('dbService (Server-Side)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCollection', () => {
        it('should load cards catalog when collection is CARDS', async () => {
            const cards = await dbService.getCollection(COLLECTIONS.CARDS);
            expect(Array.isArray(cards)).toBe(true);
        });

        it('should fetch documents from databases service for other collections', async () => {
            mockDatabases.listDocuments.mockResolvedValueOnce({
                documents: [{ $id: 'deck-1', title: 'Amethyst Deck' }],
                total: 1,
            });

            const docs = await dbService.getCollection(COLLECTIONS.DECKS);
            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                'test_db',
                'decks',
                expect.any(Array),
            );
            expect(docs).toHaveLength(1);
        });

        it('should return empty array gracefully on 404 or 503 transient errors', async () => {
            mockDatabases.listDocuments.mockRejectedValueOnce({
                code: 503,
                message: 'timeout',
            });

            const docs = await dbService.getCollection(COLLECTIONS.DECKS);
            expect(docs).toEqual([]);
        });
    });

    describe('updateInventory', () => {
        it('should delete document if quantity is 0 or less', async () => {
            mockDatabases.listDocuments.mockResolvedValueOnce({
                documents: [
                    {
                        $id: 'inv-1',
                        user_id: 'user-1',
                        card_id: 'mickey-card',
                        quantity: 1,
                        is_foil: false,
                    },
                ],
                total: 1,
            });
            mockDatabases.deleteDocument.mockResolvedValueOnce({});

            const result = await dbService.updateInventory(
                'user-1',
                'mickey-card',
                0,
                false,
            );
            expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
                'test_db',
                'user_collections',
                'inv-1',
            );
            expect(result.quantity).toBe(0);
        });

        it('should update document if quantity is greater than 0 and document exists', async () => {
            mockDatabases.listDocuments.mockResolvedValueOnce({
                documents: [
                    {
                        $id: 'inv-1',
                        user_id: 'user-1',
                        card_id: 'mickey-card',
                        quantity: 1,
                        is_foil: false,
                    },
                ],
                total: 1,
            });
            mockDatabases.updateDocument.mockResolvedValueOnce({
                $id: 'inv-1',
                user_id: 'user-1',
                card_id: 'mickey-card',
                quantity: 3,
                is_foil: false,
            });

            const result = await dbService.updateInventory(
                'user-1',
                'mickey-card',
                3,
                false,
            );
            expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
                'test_db',
                'user_collections',
                'inv-1',
                { quantity: 3 },
            );
            expect(result.quantity).toBe(3);
        });

        it('should delete all duplicate documents if quantity is 0 or less', async () => {
            mockDatabases.listDocuments.mockResolvedValueOnce({
                documents: [
                    {
                        $id: 'inv-1',
                        user_id: 'user-1',
                        card_id: 'mickey-card',
                        quantity: 1,
                        is_foil: false,
                    },
                    {
                        $id: 'inv-2',
                        user_id: 'user-1',
                        card_id: 'mickey-card',
                        quantity: 1,
                        is_foil: false,
                    },
                ],
                total: 2,
            });
            mockDatabases.deleteDocument.mockResolvedValue({});

            const result = await dbService.updateInventory(
                'user-1',
                'mickey-card',
                0,
                false,
            );
            expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
                'test_db',
                'user_collections',
                'inv-1',
            );
            expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
                'test_db',
                'user_collections',
                'inv-2',
            );
            expect(result.quantity).toBe(0);
        });

        it('should update the primary document and delete duplicate documents when quantity is greater than 0', async () => {
            mockDatabases.listDocuments.mockResolvedValueOnce({
                documents: [
                    {
                        $id: 'inv-1',
                        user_id: 'user-1',
                        card_id: 'mickey-card',
                        quantity: 1,
                        is_foil: false,
                    },
                    {
                        $id: 'inv-2',
                        user_id: 'user-1',
                        card_id: 'mickey-card',
                        quantity: 1,
                        is_foil: false,
                    },
                ],
                total: 2,
            });
            mockDatabases.updateDocument.mockResolvedValueOnce({
                $id: 'inv-1',
                user_id: 'user-1',
                card_id: 'mickey-card',
                quantity: 3,
                is_foil: false,
            });
            mockDatabases.deleteDocument.mockResolvedValue({});

            const result = await dbService.updateInventory(
                'user-1',
                'mickey-card',
                3,
                false,
            );
            expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
                'test_db',
                'user_collections',
                'inv-1',
                { quantity: 3 },
            );
            expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
                'test_db',
                'user_collections',
                'inv-2',
            );
            expect(result.quantity).toBe(3);
        });

        it('should create document if not found on update', async () => {
            mockDatabases.listDocuments.mockResolvedValueOnce({
                documents: [],
                total: 0,
            });
            mockDatabases.createDocument.mockResolvedValueOnce({
                $id: 'new-inv-doc',
                user_id: 'user-1',
                card_id: 'mickey-card',
                quantity: 2,
                is_foil: false,
            });

            const result = await dbService.updateInventory(
                'user-1',
                'mickey-card',
                2,
                false,
            );
            expect(mockDatabases.createDocument).toHaveBeenCalled();
            expect(result.quantity).toBe(2);
        });
    });

    describe('Deck Management Services', () => {
        it('should create deck and deck card junctions enforcing 1-4 quantity bounds', async () => {
            mockDatabases.createDocument.mockResolvedValue({});

            const result = await dbService.createDeck(
                'user-1',
                'Ruby/Steel Rush',
                'Aggro deck',
                [
                    { cardId: 'card-1', quantity: 5 }, // should clamp to 4
                    { cardId: 'card-2', quantity: 0 }, // should clamp to 1
                ],
            );

            expect(result.deck.title).toBe('Ruby/Steel Rush');
            expect(result.deckCards[0].quantity).toBe(4);
            expect(result.deckCards[1].quantity).toBe(1);
            expect(mockDatabases.createDocument).toHaveBeenCalled();
        });

        it('should update deck details successfully', async () => {
            mockDatabases.updateDocument.mockResolvedValueOnce({
                $id: 'deck-1',
                title: 'New Deck Title',
                description: 'Updated notes',
            });

            const result = await dbService.updateDeckDetails(
                'deck-1',
                'user-1',
                'New Deck Title',
                'Updated notes',
            );

            expect(result.title).toBe('New Deck Title');
            expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
                'test_db',
                'decks',
                'deck-1',
                { title: 'New Deck Title', description: 'Updated notes' },
            );
        });

        it('should delete deck and its deck cards', async () => {
            mockDatabases.listDocuments.mockResolvedValueOnce({
                documents: [{ $id: 'dc-1', deck_id: 'deck-1' }],
                total: 1,
            });
            mockDatabases.deleteDocument.mockResolvedValue({});

            const result = await dbService.deleteDeck('deck-1', 'user-1');

            expect(result).toBe(true);
            expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
                'test_db',
                'decks',
                'deck-1',
            );
        });

        it('should update deck cards by removing old cards and inserting new ones', async () => {
            mockDatabases.listDocuments.mockResolvedValueOnce({
                documents: [{ $id: 'dc-old-1', deck_id: 'deck-1' }],
                total: 1,
            });
            mockDatabases.deleteDocument.mockResolvedValue({});
            mockDatabases.createDocument.mockResolvedValue({});

            const result = await dbService.updateDeckCards('deck-1', 'user-1', [
                { cardId: 'card-new', quantity: 3 },
            ]);

            expect(result).toHaveLength(1);
            expect(result[0].quantity).toBe(3);
            expect(mockDatabases.deleteDocument).toHaveBeenCalled();
            expect(mockDatabases.createDocument).toHaveBeenCalled();
        });

        it('should return empty array for getUserDecksWithProgress if userId is empty', async () => {
            const result = await dbService.getUserDecksWithProgress('');
            expect(result).toEqual([]);
        });
    });
});
