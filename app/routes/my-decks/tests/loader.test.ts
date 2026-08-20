import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader } from '../loader';
import { authService, dbService } from '../../../services/appwrite.server';

vi.mock('../../../services/appwrite.server', () => ({
    authService: {
        getSessionUser: vi.fn(),
    },
    dbService: {
        getUserDecksWithProgress: vi.fn(),
        getCollection: vi.fn(),
    },
    COLLECTIONS: {
        CARDS: 'cards',
    },
}));

describe('MyDecks Loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads decks and cards for authenticated user', async () => {
        const mockUser = { $id: 'user-1' };
        vi.mocked(authService.getSessionUser).mockResolvedValue(
            mockUser as any,
        );
        vi.mocked(dbService.getUserDecksWithProgress).mockResolvedValue([
            'deck-1',
        ] as any);
        vi.mocked(dbService.getCollection).mockResolvedValue(['card-1'] as any);

        const request = new Request('http://localhost:3000/my-decks?sort=name');
        const result = await loader({ request } as any);

        expect(dbService.getUserDecksWithProgress).toHaveBeenCalledWith(
            'user-1',
            'name',
            request,
        );
        expect(result).toEqual({
            user: mockUser,
            decks: ['deck-1'],
            cards: ['card-1'],
            sort: 'name',
        });
    });
});
