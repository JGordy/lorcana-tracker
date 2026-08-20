import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader } from '../loader';
import { authService, dbService } from '../../../services/appwrite.server';

vi.mock('../../../services/appwrite.server', () => ({
    authService: {
        getSessionUser: vi.fn(),
    },
    dbService: {
        getDecksWithProgress: vi.fn(),
        getCollection: vi.fn(),
    },
    COLLECTIONS: {
        CARDS: 'cards',
    },
}));

describe('Decks Route loader.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches decks and cards for unauthenticated user', async () => {
        vi.mocked(authService.getSessionUser).mockResolvedValueOnce(null);
        vi.mocked(dbService.getDecksWithProgress).mockResolvedValueOnce([
            { $id: 'd1', title: 'Deck 1' },
        ] as any);
        vi.mocked(dbService.getCollection).mockResolvedValueOnce([
            { id: 'c1', name: 'Card 1' },
        ] as any);

        const request = new Request('http://localhost:5173/decks?sort=name');
        const data = await loader({ request, params: {}, context: {} } as any);

        expect(data.user).toBeNull();
        expect(data.sort).toBe('name');
        expect(data.decks).toHaveLength(1);
        expect(data.cards).toHaveLength(1);
        expect(dbService.getDecksWithProgress).toHaveBeenCalledWith(
            null,
            'name',
            request,
        );
    });

    it('fetches decks and cards for logged in user', async () => {
        vi.mocked(authService.getSessionUser).mockResolvedValueOnce({
            $id: 'user-123',
        } as any);
        vi.mocked(dbService.getDecksWithProgress).mockResolvedValueOnce([]);
        vi.mocked(dbService.getCollection).mockResolvedValueOnce([]);

        const request = new Request('http://localhost:5173/decks');
        const data = await loader({ request, params: {}, context: {} } as any);

        expect(data.user?.$id).toBe('user-123');
        expect(data.sort).toBe('progress');
        expect(dbService.getDecksWithProgress).toHaveBeenCalledWith(
            'user-123',
            'progress',
            request,
        );
    });
});
