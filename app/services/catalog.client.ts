import type { Card } from '../types/lorcana';
import { buildCardsLookup } from '../utils/deck';

export class CardCatalogService {
    private static cards: Card[] | null = null;
    private static lookupMap: ReturnType<typeof buildCardsLookup<Card>> | null =
        null;
    private static fetchPromise: Promise<Card[]> | null = null;

    /**
     * Fetches cards.json once and memoizes the catalog array and lookup map in client memory.
     */
    static async getCards(): Promise<Card[]> {
        if (this.cards) return this.cards;
        if (this.fetchPromise) return this.fetchPromise;

        this.fetchPromise = (async () => {
            try {
                const res = await fetch('/cards.json');
                if (!res.ok) {
                    throw new Error(
                        `Failed to load card catalog: ${res.statusText}`,
                    );
                }
                const data: Card[] = await res.json();
                this.cards = data;
                this.lookupMap = buildCardsLookup(data);
                return this.cards;
            } catch (err) {
                this.fetchPromise = null;
                console.error(
                    '[CardCatalogService] Error fetching cards.json:',
                    err,
                );
                return [];
            }
        })();

        return this.fetchPromise;
    }

    /**
     * Resolves a card by ID, slug, or set/number combination using the in-memory lookup map.
     */
    static getCardById(id: string): Card | undefined {
        if (!this.lookupMap) return undefined;
        return this.lookupMap.get(id);
    }

    /**
     * Direct synchronous access to memoized cards list (if already fetched).
     */
    static getMemoizedCards(): Card[] | null {
        return this.cards;
    }

    /**
     * Resets in-memory cache (primarily for unit tests).
     */
    static clearCache(): void {
        this.cards = null;
        this.lookupMap = null;
        this.fetchPromise = null;
    }
}
