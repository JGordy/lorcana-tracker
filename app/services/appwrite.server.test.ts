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
            mockDatabases.deleteDocument.mockResolvedValueOnce({});

            const result = await dbService.updateInventory(
                'user-1',
                'mickey-card',
                0,
                false,
            );
            expect(mockDatabases.deleteDocument).toHaveBeenCalled();
            expect(result.quantity).toBe(0);
        });

        it('should update document if quantity is greater than 0', async () => {
            mockDatabases.updateDocument.mockResolvedValueOnce({
                $id: 'user-1_mickey-card_normal',
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
            expect(mockDatabases.updateDocument).toHaveBeenCalled();
            expect(result.quantity).toBe(3);
        });

        it('should create document if not found on update', async () => {
            mockDatabases.updateDocument.mockRejectedValueOnce({ code: 404 });
            mockDatabases.createDocument.mockResolvedValueOnce({
                $id: 'user-1_mickey-card_normal',
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
});
