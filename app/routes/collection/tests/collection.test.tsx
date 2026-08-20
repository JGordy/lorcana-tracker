import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader, action } from '../collection';
import { authService, dbService } from '../../../services/appwrite.server';

vi.mock('../../../services/appwrite.server', () => ({
    authService: {
        getSessionUser: vi.fn(),
    },
    dbService: {
        getCollection: vi.fn(),
        getUserInventory: vi.fn(),
        updateInventory: vi.fn(),
    },
    COLLECTIONS: {
        CARDS: 'cards',
        USER_COLLECTIONS: 'user_collections',
    },
}));

describe('Collection Route (Loader & Action)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('loader', () => {
        it('fetches cards catalog and empty inventory when user is unauthenticated', async () => {
            vi.mocked(authService.getSessionUser).mockResolvedValueOnce(null);
            vi.mocked(dbService.getCollection).mockResolvedValueOnce([
                { id: 'c1', name: 'Card 1' },
            ] as any);

            const request = new Request('http://localhost:5173/collection');
            const data = await loader({
                request,
                params: {},
                context: {},
            } as any);

            expect(data.user).toBeNull();
            expect(data.cards).toHaveLength(1);
            expect(data.userCollection).toEqual([]);
            expect(dbService.getUserInventory).not.toHaveBeenCalled();
        });

        it('fetches cards catalog and user inventory when user is logged in', async () => {
            vi.mocked(authService.getSessionUser).mockResolvedValueOnce({
                $id: 'user-123',
            } as any);
            vi.mocked(dbService.getCollection).mockResolvedValueOnce([
                { id: 'c1', name: 'Card 1' },
            ] as any);
            vi.mocked(dbService.getUserInventory).mockResolvedValueOnce([
                { card_id: 'c1', quantity: 4, is_foil: false },
            ] as any);

            const request = new Request('http://localhost:5173/collection');
            const data = await loader({
                request,
                params: {},
                context: {},
            } as any);

            expect(data.user?.$id).toBe('user-123');
            expect(data.cards).toHaveLength(1);
            expect(data.userCollection).toHaveLength(1);
            expect(dbService.getUserInventory).toHaveBeenCalledWith(
                'user-123',
                request,
            );
        });
    });

    describe('action', () => {
        it('handles update-quantity intent successfully', async () => {
            vi.mocked(authService.getSessionUser).mockResolvedValueOnce({
                $id: 'user-123',
            } as any);
            vi.mocked(dbService.updateInventory).mockResolvedValueOnce({
                $id: 'inv-1',
                quantity: 3,
            } as any);

            const formData = new FormData();
            formData.set('intent', 'update-quantity');
            formData.set('cardId', 'card-1');
            formData.set('quantity', '3');
            formData.set('isFoil', 'false');

            const request = new Request('http://localhost:5173/collection', {
                method: 'POST',
                body: formData,
            });

            const result = await action({
                request,
                params: {},
                context: {},
            } as any);

            expect(result).toEqual({
                success: true,
                item: { $id: 'inv-1', quantity: 3 },
            });
            expect(dbService.updateInventory).toHaveBeenCalledWith(
                'user-123',
                'card-1',
                3,
                false,
                request,
            );
        });

        it('returns success: false for unknown intent', async () => {
            const formData = new FormData();
            formData.set('intent', 'unknown-intent');

            const request = new Request('http://localhost:5173/collection', {
                method: 'POST',
                body: formData,
            });

            const result = await action({
                request,
                params: {},
                context: {},
            } as any);
            expect(result).toEqual({ success: false });
        });
    });
});
