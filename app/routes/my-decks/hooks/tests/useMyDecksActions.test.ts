import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMyDecksActions } from '../useMyDecksActions';

describe('useMyDecksActions', () => {
    const mockDecks: any[] = [
        {
            $id: 'deck-1',
            title: 'Sapphire Steel Ramp',
            description: 'Ramp deck',
            cards: [
                {
                    card: { id: 'c1', name: 'Develop Your Brain' },
                    requiredQty: 4,
                    ownedQty: 2,
                },
            ],
            progress: {
                percentage: 50,
                ownedCount: 2,
                totalCount: 4,
                missingCards: [],
            },
        },
    ];

    const mockCards: any[] = [{ id: 'c1', name: 'Develop Your Brain' }];

    const mockSubmit = vi.fn();
    const mockFetcher: any = { submit: vi.fn(), data: null };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('submits create-deck intent on handleCreateDeck', () => {
        const { result } = renderHook(() =>
            useMyDecksActions({
                decks: mockDecks,
                cards: mockCards,
                user: { $id: 'u1' },
                submit: mockSubmit,
                fetcher: mockFetcher,
            }),
        );

        act(() => {
            result.current.handleCreateDeck(
                'New Deck',
                'core',
                ['amber'],
                'Desc',
            );
        });

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                intent: 'create-deck',
                title: 'New Deck',
                userId: 'u1',
            }),
            { method: 'post' },
        );
    });
});
