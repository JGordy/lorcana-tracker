import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeckActions } from '../useDeckActions';

describe('useDeckActions', () => {
    const mockFetcher: any = { submit: vi.fn() };
    const mockCloneFetcher: any = { submit: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
        window.alert = vi.fn();
    });

    const mockDeck: any = {
        $id: 'deck-1',
        title: 'Ruby Sapphire',
        description: 'Control deck',
        cards: [
            {
                card: { id: 'c1', name: 'Mickey Mouse', set: 'The First Chapter', number: 1 },
                requiredQty: 4,
            },
        ],
    };

    it('alerts guest user when attempting to clone deck', () => {
        const { result } = renderHook(() =>
            useDeckActions({ user: null, fetcher: mockFetcher, cloneFetcher: mockCloneFetcher }),
        );

        result.current.handleCloneDeck(mockDeck);
        expect(window.alert).toHaveBeenCalledWith(
            'Please sign in or use demo login to save decks to your personal library.',
        );
        expect(mockCloneFetcher.submit).not.toHaveBeenCalled();
    });

    it('submits clone deck payload for logged in user', () => {
        const { result } = renderHook(() =>
            useDeckActions({
                user: { $id: 'user-1' },
                fetcher: mockFetcher,
                cloneFetcher: mockCloneFetcher,
            }),
        );

        result.current.handleCloneDeck(mockDeck);

        expect(mockCloneFetcher.submit).toHaveBeenCalledWith(
            {
                intent: 'clone-deck',
                userId: 'user-1',
                title: 'Ruby Sapphire (Copy)',
                description: 'Cloned from Ruby Sapphire. Control deck',
                cards: JSON.stringify([{ cardId: 'c1', quantity: 4 }]),
            },
            { method: 'post' },
        );
    });

    it('exports deck to clipboard and sets copy feedback', async () => {
        const { result } = renderHook(() =>
            useDeckActions({
                user: { $id: 'user-1' },
                fetcher: mockFetcher,
                cloneFetcher: mockCloneFetcher,
            }),
        );

        act(() => {
            result.current.handleExportDeck(mockDeck);
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            '4 Mickey Mouse (001-001)',
        );
        expect(result.current.copyFeedback).toBe('deck-1');
    });

    it('submits quick add inventory update for logged in user', () => {
        const { result } = renderHook(() =>
            useDeckActions({
                user: { $id: 'user-1' },
                fetcher: mockFetcher,
                cloneFetcher: mockCloneFetcher,
            }),
        );

        result.current.handleQuickAdd('c1', 2);

        expect(mockFetcher.submit).toHaveBeenCalledWith(
            {
                intent: 'quick-add',
                userId: 'user-1',
                cardId: 'c1',
                quantity: '3',
                isFoil: 'false',
            },
            { method: 'post' },
        );
    });
});
