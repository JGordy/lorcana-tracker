import type { UserCollectionItemDoc, DeckWithProgress } from '../types/lorcana';

export const COLLECTION_CACHE_KEY = 'lorcana_user_collection_cache';
export const DECKS_CACHE_KEY = 'lorcana_user_decks_cache';
export const INVENTORY_QUEUE_KEY = 'lorcana_inventory_queue';
export const DECK_QUEUE_KEY = 'lorcana_deck_queue';
export const OFFLINE_MODE_KEY = 'lorcana_offline_mode';

export interface PendingInventoryMutation {
    cardId: string;
    quantity: number;
    isFoil: boolean;
    timestamp: number;
}

export interface PendingDeckMutation {
    intent: string;
    payload: Record<string, any>;
    timestamp: number;
}

// ---------------------------------------------------------
// Collection Cache
// ---------------------------------------------------------
export function saveCachedCollection(items: UserCollectionItemDoc[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(COLLECTION_CACHE_KEY, JSON.stringify(items));
    } catch (e) {
        console.warn('[OfflineSync] Failed to save collection cache:', e);
    }
}

export function getCachedCollection(): UserCollectionItemDoc[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(COLLECTION_CACHE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// ---------------------------------------------------------
// Decks Cache
// ---------------------------------------------------------
export function saveCachedDecks(decks: DeckWithProgress[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(DECKS_CACHE_KEY, JSON.stringify(decks));
    } catch (e) {
        console.warn('[OfflineSync] Failed to save decks cache:', e);
    }
}

export function getCachedDecks(): DeckWithProgress[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(DECKS_CACHE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// ---------------------------------------------------------
// Inventory Queue
// ---------------------------------------------------------
export function enqueueInventoryMutation(
    cardId: string,
    quantity: number,
    isFoil: boolean,
): void {
    if (typeof window === 'undefined') return;
    try {
        const queue = getPendingInventoryMutations();
        const filtered = queue.filter(
            (m) => !(m.cardId === cardId && m.isFoil === isFoil),
        );
        filtered.push({
            cardId,
            quantity,
            isFoil,
            timestamp: Date.now(),
        });
        localStorage.setItem(INVENTORY_QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.warn('[OfflineSync] Failed to enqueue inventory mutation:', e);
    }
}

export function getPendingInventoryMutations(): PendingInventoryMutation[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(INVENTORY_QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function clearInventoryQueue(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(INVENTORY_QUEUE_KEY);
    } catch (e) {
        console.warn('[OfflineSync] Failed to clear inventory queue:', e);
    }
}

// ---------------------------------------------------------
// Deck Queue
// ---------------------------------------------------------
export function enqueueDeckMutation(
    intent: string,
    payload: Record<string, any>,
): void {
    if (typeof window === 'undefined') return;
    try {
        const queue = getPendingDeckMutations();
        queue.push({
            intent,
            payload,
            timestamp: Date.now(),
        });
        localStorage.setItem(DECK_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.warn('[OfflineSync] Failed to enqueue deck mutation:', e);
    }
}

export function getPendingDeckMutations(): PendingDeckMutation[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(DECK_QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function clearDeckQueue(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(DECK_QUEUE_KEY);
    } catch (e) {
        console.warn('[OfflineSync] Failed to clear deck queue:', e);
    }
}

// ---------------------------------------------------------
// Offline Mode State Helpers
// ---------------------------------------------------------
export function setOfflineModeStatus(isOffline: boolean): void {
    if (typeof window === 'undefined') return;
    try {
        if (isOffline) {
            localStorage.setItem(OFFLINE_MODE_KEY, 'true');
        } else {
            localStorage.removeItem(OFFLINE_MODE_KEY);
        }
    } catch (e) {
        console.warn('[OfflineSync] Failed to set offline status:', e);
    }
}

export function getOfflineModeStatus(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(OFFLINE_MODE_KEY) === 'true';
    } catch {
        return false;
    }
}
