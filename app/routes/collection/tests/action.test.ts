import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action } from '../action';
import { authService, dbService } from '../../../services/appwrite.server';

vi.mock('../../../services/appwrite.server', () => ({
    authService: {
        getSessionUser: vi.fn(),
    },
    dbService: {
        updateInventory: vi.fn(),
    },
}));

describe('Collection Route action.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

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
