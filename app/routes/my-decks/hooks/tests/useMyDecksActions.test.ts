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

    it('toggles deck active state and persists to localStorage and backend on handleToggleDeckActive', () => {
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
            result.current.handleToggleDeckActive(mockDecks[0]);
        });

        expect(result.current.localDecks[0]?.is_active).toBe(true);
        expect(result.current.localDecks[0]?.meta?.is_active).toBe(true);
        const parsedDesc = JSON.parse(
            result.current.localDecks[0]?.description || '{}',
        );
        expect(parsedDesc.is_active).toBe(true);

        const storedActive = localStorage.getItem('lorcana_active_deck_ids');
        expect(storedActive).toBeTruthy();
        expect(JSON.parse(storedActive!)).toContain('deck-1');

        expect(mockFetcher.submit).toHaveBeenCalledWith(
            expect.objectContaining({
                intent: 'update-deck-details',
                deckId: 'deck-1',
                description: expect.stringContaining('"is_active":true'),
            }),
            { method: 'post' },
        );
    });
});
