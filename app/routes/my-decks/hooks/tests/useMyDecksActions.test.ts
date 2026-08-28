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

    it('updates local state, syncs localStorage inventory, and submits quick-add on handleQuickAdd', () => {
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
            result.current.handleQuickAdd('c1', 4);
        });

        expect(mockFetcher.submit).toHaveBeenCalledWith(
            {
                intent: 'quick-add',
                userId: 'u1',
                cardId: 'c1',
                quantity: '4',
                isFoil: 'false',
            },
            { method: 'post' },
        );

        const storedInv = localStorage.getItem('lorcana_user_inventory');
        expect(storedInv).toBeTruthy();
        const parsedInv = JSON.parse(storedInv!);
        expect(parsedInv).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    card_id: 'c1',
                    quantity: 4,
                }),
            ]),
        );
    });

    it('optimistically updates local decks and localStorage on handleSaveDeckDetails', () => {
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
            result.current.handleSaveDeckDetails(
                mockDecks[0],
                'Updated Title',
                'core',
                ['amber', 'ruby'],
                'New Notes',
                'c1',
            );
        });

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                intent: 'update-deck-details',
                deckId: 'deck-1',
                title: 'Updated Title',
            }),
            { method: 'post' },
        );

        expect(result.current.localDecks[0]?.title).toBe('Updated Title');
        expect(result.current.localDecks[0]?.meta?.coverCardId).toBe('c1');
    });
});
