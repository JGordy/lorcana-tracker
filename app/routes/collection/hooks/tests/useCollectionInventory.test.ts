import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCollectionInventory } from '../useCollectionInventory';
import type {
    Card as LorcanaCard,
    UserCollectionItemDoc,
} from '../../../../types/lorcana';

describe('useCollectionInventory', () => {
    const mockFetcher = {
        submit: vi.fn(),
        formData: null,
    } as any;

    const mockCardsLookup = {
        get: (id: string) =>
            id === 'card-1'
                ? ({ id: 'card-1', name: 'Mickey Mouse' } as LorcanaCard)
                : undefined,
    } as any;

    const initialCollection: UserCollectionItemDoc[] = [
        {
            $id: 'inv-1',
            user_id: 'user-1',
            card_id: 'card-1',
            quantity: 2,
            is_foil: false,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        window.alert = vi.fn();
    });

    it('initializes with server collection and calculates totals', () => {
        const { result } = renderHook(() =>
            useCollectionInventory({
                serverCollection: initialCollection,
                user: { $id: 'user-1' },
                fetcher: mockFetcher,
                cardsLookup: mockCardsLookup,
            }),
        );

        expect(result.current.totals.totalCardsOwned).toBe(2);
        expect(result.current.totals.uniqueCardsCount).toBe(1);
        expect(
            result.current.getCardQuantity(
                { id: 'card-1' } as LorcanaCard,
                false,
            ),
        ).toBe(2);
        expect(
            result.current.getCardQuantity(
                { id: 'card-1' } as LorcanaCard,
                true,
            ),
        ).toBe(0);
    });

    it('alerts user when unauthenticated user attempts to adjust quantity', () => {
        const { result } = renderHook(() =>
            useCollectionInventory({
                serverCollection: initialCollection,
                user: null,
                fetcher: mockFetcher,
                cardsLookup: mockCardsLookup,
            }),
        );

        act(() => {
            result.current.handleAdjustQuantity('card-1', false, 2, 1);
        });

        expect(window.alert).toHaveBeenCalledWith(
            expect.stringContaining('Please sign in'),
        );
        expect(mockFetcher.submit).not.toHaveBeenCalled();
    });

    it('updates quantity and submits form data when authenticated', () => {
        const { result } = renderHook(() =>
            useCollectionInventory({
                serverCollection: initialCollection,
                user: { $id: 'user-1' },
                fetcher: mockFetcher,
                cardsLookup: mockCardsLookup,
            }),
        );

        act(() => {
            result.current.handleAdjustQuantity('card-1', false, 2, 1);
        });

        expect(mockFetcher.submit).toHaveBeenCalledWith(
            {
                intent: 'update-quantity',
                userId: 'user-1',
                cardId: 'card-1',
                quantity: '3',
                isFoil: 'false',
            },
            { method: 'post' },
        );
        expect(result.current.totals.totalCardsOwned).toBe(3);
    });

    it('initializes from local storage inventory when server collection is empty', async () => {
        localStorage.setItem(
            'lorcana_user_inventory',
            JSON.stringify([
                {
                    $id: 'inv-local',
                    user_id: 'user-1',
                    card_id: 'card-1',
                    quantity: 4,
                    is_foil: false,
                },
            ]),
        );

        const { result } = renderHook(() =>
            useCollectionInventory({
                serverCollection: [],
                user: { $id: 'user-1' },
                fetcher: mockFetcher,
                cardsLookup: mockCardsLookup,
            }),
        );

        await act(async () => {});

        expect(result.current.totals.totalCardsOwned).toBe(4);
    });
});
