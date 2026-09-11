import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader } from '../loader';
import { authService, dbService } from '../../../services/appwrite.server';
import { COLLECTIONS } from '../../../types/lorcana';

vi.mock('../../../services/appwrite.server', () => ({
    authService: {
        getSessionUser: vi.fn(),
    },
    dbService: {
        getCollection: vi.fn(),
        getUserInventory: vi.fn(),
    },
}));

describe('Scan route loader', () => {
    const originalEnv = process.env.GEMINI_API_KEY;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-gemini-key';
    });

    it('loads catalog, user collection, and user details when authenticated', async () => {
        const mockUser = {
            $id: 'user-123',
            email: 'test@example.com',
            name: 'Illumineer',
        };
        const mockCards = [
            {
                id: 'card-1',
                name: 'Ariel - On Human Legs',
                set: 'The First Chapter',
                number: 1,
            },
        ];
        const mockInventory = [
            { card_id: 'card-1', quantity: 2, is_foil: false },
        ];

        vi.mocked(authService.getSessionUser).mockResolvedValue(
            mockUser as any,
        );
        vi.mocked(dbService.getCollection).mockResolvedValue(mockCards as any);
        vi.mocked(dbService.getUserInventory).mockResolvedValue(
            mockInventory as any,
        );

        const request = new Request('https://lorcana.app/scan');
        const data = await loader({ request });

        expect(authService.getSessionUser).toHaveBeenCalledWith(request);
        expect(dbService.getCollection).toHaveBeenCalledWith(
            COLLECTIONS.CARDS,
            [],
            request,
        );
        expect(dbService.getUserInventory).toHaveBeenCalledWith(
            'user-123',
            request,
        );

        expect(data.cards).toEqual(mockCards);
        expect(data.userCollection).toEqual(mockInventory);
        expect(data.user).toEqual(mockUser);
        expect(data.hasGeminiApiKey).toBe(true);
    });

    it('returns empty user collection when user is unauthenticated / guest', async () => {
        const mockCards = [
            {
                id: 'card-2',
                name: 'Rex - Protective Dinosaur',
                set: 'Wilds Unknown',
                number: 10,
            },
        ];

        vi.mocked(authService.getSessionUser).mockResolvedValue(null);
        vi.mocked(dbService.getCollection).mockResolvedValue(mockCards as any);

        const request = new Request('https://lorcana.app/scan');
        const data = await loader({ request });

        expect(authService.getSessionUser).toHaveBeenCalledWith(request);
        expect(dbService.getCollection).toHaveBeenCalledWith(
            COLLECTIONS.CARDS,
            [],
            request,
        );
        expect(dbService.getUserInventory).not.toHaveBeenCalled();

        expect(data.cards).toEqual(mockCards);
        expect(data.userCollection).toEqual([]);
        expect(data.user).toBeNull();
    });

    it('correctly sets hasGeminiApiKey to false when environment variable is unset', async () => {
        delete process.env.GEMINI_API_KEY;

        vi.mocked(authService.getSessionUser).mockResolvedValue(null);
        vi.mocked(dbService.getCollection).mockResolvedValue([]);

        const request = new Request('https://lorcana.app/scan');
        const data = await loader({ request });

        expect(data.hasGeminiApiKey).toBe(false);

        // Restore original env
        process.env.GEMINI_API_KEY = originalEnv;
    });
});
