import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action } from '../action';
import { dbService } from '../../../services/appwrite.server';

vi.mock('../../../services/appwrite.server', () => ({
    authService: {
        logout: vi.fn(),
        anonymousLogin: vi.fn(),
    },
    dbService: {
        updateInventory: vi.fn(),
        createDeck: vi.fn(),
        updateDeckCards: vi.fn(),
        updateDeckDetails: vi.fn(),
        deleteDeck: vi.fn(),
    },
}));

describe('MyDecks Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles create-deck intent', async () => {
        vi.mocked(dbService.createDeck).mockResolvedValue({ $id: 'd1' } as any);

        const formData = new FormData();
        formData.append('intent', 'create-deck');
        formData.append('userId', 'u1');
        formData.append('title', 'Aggro');
        formData.append('cards', JSON.stringify([]));

        const request = new Request('http://localhost:3000/my-decks', {
            method: 'POST',
            body: formData,
        });

        const result = await action({ request } as any);
        expect(dbService.createDeck).toHaveBeenCalledWith(
            'u1',
            'Aggro',
            '',
            [],
            request,
        );
        expect(result).toEqual({ success: true, result: { $id: 'd1' } });
    });
});
