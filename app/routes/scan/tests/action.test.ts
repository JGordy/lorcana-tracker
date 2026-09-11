import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action } from '../action';
import {
    authService,
    dbService,
    getCardsCatalog,
} from '../../../services/appwrite.server';
import { identifyCardWithGeminiVision } from '../../../utils/scanner/geminiVision.server';

vi.mock('../../../services/appwrite.server', () => ({
    authService: {
        getSessionUser: vi.fn(),
    },
    dbService: {
        updateInventory: vi.fn(),
    },
    getCardsCatalog: vi.fn(),
}));

vi.mock('../../../utils/scanner/geminiVision.server', () => ({
    identifyCardWithGeminiVision: vi.fn(),
}));

describe('Scan route action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('gemini-vision intent', () => {
        it('returns error when image payload is missing', async () => {
            const formData = new FormData();
            formData.set('intent', 'gemini-vision');

            const request = new Request('https://lorcana.app/scan', {
                method: 'POST',
                body: formData,
            });

            const result = await action({ request });
            expect(result).toEqual({
                success: false,
                card: null,
                error: 'No image payload provided for AI vision identification.',
            });
        });

        it('identifies card using Gemini Vision when image is provided', async () => {
            const mockCatalog = [{ id: 'card-1', name: 'Mickey Mouse' }];
            const mockVisionResult = {
                success: true,
                card: mockCatalog[0],
                confidence: 'high',
            };

            vi.mocked(getCardsCatalog).mockResolvedValue(mockCatalog as any);
            vi.mocked(identifyCardWithGeminiVision).mockResolvedValue(
                mockVisionResult as any,
            );

            const formData = new FormData();
            formData.set('intent', 'gemini-vision');
            formData.set('image', 'data:image/jpeg;base64,mockbase64image');

            const request = new Request('https://lorcana.app/scan', {
                method: 'POST',
                body: formData,
            });

            const result = await action({ request });

            expect(getCardsCatalog).toHaveBeenCalled();
            expect(identifyCardWithGeminiVision).toHaveBeenCalledWith(
                'data:image/jpeg;base64,mockbase64image',
                mockCatalog,
            );
            expect(result).toEqual(mockVisionResult);
        });
    });

    describe('update-quantity intent', () => {
        it('updates inventory with authenticated session user id', async () => {
            const mockUser = { $id: 'user-789' };
            vi.mocked(authService.getSessionUser).mockResolvedValue(
                mockUser as any,
            );
            vi.mocked(dbService.updateInventory).mockResolvedValue({
                $id: 'inv-1',
                card_id: 'card-1',
                quantity: 3,
                is_foil: false,
            } as any);

            const formData = new FormData();
            formData.set('intent', 'update-quantity');
            formData.set('cardId', 'card-1');
            formData.set('quantity', '3');
            formData.set('isFoil', 'false');

            const request = new Request('https://lorcana.app/scan', {
                method: 'POST',
                body: formData,
            });

            const result = await action({ request });

            expect(authService.getSessionUser).toHaveBeenCalledWith(request);
            expect(dbService.updateInventory).toHaveBeenCalledWith(
                'user-789',
                'card-1',
                3,
                false,
                request,
            );
            expect(result).toEqual({
                success: true,
                item: {
                    $id: 'inv-1',
                    card_id: 'card-1',
                    quantity: 3,
                    is_foil: false,
                },
            });
        });

        it('falls back to userId from form data when session user is null (guest/cookie mode)', async () => {
            vi.mocked(authService.getSessionUser).mockResolvedValue(null);
            vi.mocked(dbService.updateInventory).mockResolvedValue({
                $id: 'inv-guest',
                card_id: 'card-foil-1',
                quantity: 1,
                is_foil: true,
            } as any);

            const formData = new FormData();
            formData.set('intent', 'update-quantity');
            formData.set('userId', 'guest-cookie-id');
            formData.set('cardId', 'card-foil-1');
            formData.set('quantity', '1');
            formData.set('isFoil', 'true');

            const request = new Request('https://lorcana.app/scan', {
                method: 'POST',
                body: formData,
            });

            const result = await action({ request });

            expect(dbService.updateInventory).toHaveBeenCalledWith(
                'guest-cookie-id',
                'card-foil-1',
                1,
                true,
                request,
            );
            expect(result).toEqual({
                success: true,
                item: {
                    $id: 'inv-guest',
                    card_id: 'card-foil-1',
                    quantity: 1,
                    is_foil: true,
                },
            });
        });
    });

    it('returns error for unknown intent', async () => {
        const formData = new FormData();
        formData.set('intent', 'invalid-action');

        const request = new Request('https://lorcana.app/scan', {
            method: 'POST',
            body: formData,
        });

        const result = await action({ request });
        expect(result).toEqual({ success: false, error: 'Unknown intent' });
    });
});
