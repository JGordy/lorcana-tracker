import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action } from '../action';
import { authService, dbService } from '../../../services/appwrite.server';

vi.mock('../../../services/appwrite.server', () => ({
    authService: {
        logout: vi.fn(),
        anonymousLogin: vi.fn(),
    },
    dbService: {
        updateInventory: vi.fn(),
        createDeck: vi.fn(),
    },
}));

describe('Decks Route action.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles logout intent', async () => {
        vi.mocked(authService.logout).mockResolvedValueOnce({
            cookieHeader: 'session=expired',
        });

        const formData = new FormData();
        formData.set('intent', 'logout');
        const request = new Request('http://localhost:5173/decks', {
            method: 'POST',
            body: formData,
        });

        const res: any = await action({
            request,
            params: {},
            context: {},
        } as any);
        expect(res.data).toEqual({ success: true });
    });

    it('handles quick-add intent', async () => {
        vi.mocked(dbService.updateInventory).mockResolvedValueOnce({
            $id: 'inv-1',
            quantity: 3,
        } as any);

        const formData = new FormData();
        formData.set('intent', 'quick-add');
        formData.set('userId', 'user-1');
        formData.set('cardId', 'card-1');
        formData.set('quantity', '3');
        formData.set('isFoil', 'false');

        const request = new Request('http://localhost:5173/decks', {
            method: 'POST',
            body: formData,
        });

        const res = await action({ request, params: {}, context: {} } as any);
        expect(res).toEqual({
            success: true,
            updatedItem: { $id: 'inv-1', quantity: 3 },
        });
    });

    it('handles import-deck intent', async () => {
        vi.mocked(dbService.createDeck).mockResolvedValueOnce({
            $id: 'deck-99',
            title: 'New Deck',
        } as any);

        const formData = new FormData();
        formData.set('intent', 'import-deck');
        formData.set('userId', 'user-1');
        formData.set('title', 'New Deck');
        formData.set('description', 'User imported custom deck');
        formData.set('cards', JSON.stringify([{ cardId: 'c1', quantity: 4 }]));

        const request = new Request('http://localhost:5173/decks', {
            method: 'POST',
            body: formData,
        });

        const res = await action({ request, params: {}, context: {} } as any);
        expect(res).toEqual({
            success: true,
            result: { $id: 'deck-99', title: 'New Deck' },
        });
    });

    it('handles clone-deck intent', async () => {
        vi.mocked(dbService.createDeck).mockResolvedValueOnce({
            $id: 'deck-100',
            title: 'Cloned Deck',
        } as any);

        const formData = new FormData();
        formData.set('intent', 'clone-deck');
        formData.set('userId', 'user-1');
        formData.set('title', 'Cloned Deck');
        formData.set('description', 'Cloned description');
        formData.set('cards', JSON.stringify([{ cardId: 'c1', quantity: 4 }]));

        const request = new Request('http://localhost:5173/decks', {
            method: 'POST',
            body: formData,
        });

        const res = await action({ request, params: {}, context: {} } as any);
        expect(res).toEqual({
            success: true,
            cloned: true,
            result: { $id: 'deck-100', title: 'Cloned Deck' },
        });
    });
});
