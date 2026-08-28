import { describe, it, expect, beforeEach } from 'vitest';
import {
    saveCachedCollection,
    getCachedCollection,
    saveCachedDecks,
    getCachedDecks,
    enqueueInventoryMutation,
    getPendingInventoryMutations,
    clearInventoryQueue,
    enqueueDeckMutation,
    getPendingDeckMutations,
    clearDeckQueue,
    setOfflineModeStatus,
    getOfflineModeStatus,
    COLLECTION_CACHE_KEY,
    DECKS_CACHE_KEY,
    INVENTORY_QUEUE_KEY,
    DECK_QUEUE_KEY,
    OFFLINE_MODE_KEY,
} from '../offlineSync';

describe('offlineSync utilities', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('saves and reads cached collection items', () => {
        const mockCollection = [
            {
                $id: 'item-1',
                user_id: 'user-1',
                card_id: 'card-1',
                quantity: 4,
                is_foil: false,
            },
        ];
        saveCachedCollection(mockCollection as any);

        const retrieved = getCachedCollection();
        expect(retrieved).toEqual(mockCollection);
        expect(localStorage.getItem(COLLECTION_CACHE_KEY)).toBeTruthy();
    });

    it('saves and reads cached decks', () => {
        const mockDecks = [
            { $id: 'deck-1', title: 'Amber Ruby Aggro', is_active: true },
        ];
        saveCachedDecks(mockDecks as any);

        const retrieved = getCachedDecks();
        expect(retrieved).toEqual(mockDecks);
        expect(localStorage.getItem(DECKS_CACHE_KEY)).toBeTruthy();
    });

    it('enqueues inventory mutations and deduplicates pending items by cardId + isFoil', () => {
        enqueueInventoryMutation('card-1', 2, false);
        enqueueInventoryMutation('card-1', 4, false); // Latest state overrides previous
        enqueueInventoryMutation('card-2', 1, true);

        const pending = getPendingInventoryMutations();
        expect(pending).toHaveLength(2);
        expect(pending[0].cardId).toBe('card-1');
        expect(pending[0].quantity).toBe(4);
        expect(pending[1].cardId).toBe('card-2');
        expect(pending[1].isFoil).toBe(true);

        clearInventoryQueue();
        expect(getPendingInventoryMutations()).toEqual([]);
    });

    it('enqueues deck mutations and clears queue', () => {
        enqueueDeckMutation('create-deck', { title: 'Test Deck' });
        enqueueDeckMutation('delete-deck', { deckId: 'deck-1' });

        const pending = getPendingDeckMutations();
        expect(pending).toHaveLength(2);
        expect(pending[0].intent).toBe('create-deck');
        expect(pending[1].intent).toBe('delete-deck');

        clearDeckQueue();
        expect(getPendingDeckMutations()).toEqual([]);
    });

    it('sets and reads offline mode status', () => {
        expect(getOfflineModeStatus()).toBe(false);

        setOfflineModeStatus(true);
        expect(getOfflineModeStatus()).toBe(true);
        expect(localStorage.getItem(OFFLINE_MODE_KEY)).toBe('true');

        setOfflineModeStatus(false);
        expect(getOfflineModeStatus()).toBe(false);
        expect(localStorage.getItem(OFFLINE_MODE_KEY)).toBeNull();
    });
});
