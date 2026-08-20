import { Query, ID } from 'node-appwrite';
import { appwriteConfig } from '../utils/appwrite/config';
import {
    createSessionClient,
    createAdminClient,
} from '../utils/appwrite/server';
import {
    calculateDeckProgress,
    buildCardsLookup,
    type DeckCard,
} from '../utils/deck';
import {
    type Card,
    type UserCollectionItemDoc,
    type Deck,
    type DeckCardDoc,
    type DeckWithProgress,
    COLLECTIONS,
    SET_INDEX_MAP,
    postProcessCardLegality,
} from '../types/lorcana';

export { authService } from './auth.server';
export {
    type Card,
    type UserCollectionItemDoc,
    type Deck,
    type DeckCardDoc,
    type DeckWithProgress,
    COLLECTIONS,
    SET_INDEX_MAP,
    postProcessCardLegality,
} from '../types/lorcana';

export const isConfigured = appwriteConfig.isConfigured;

// In-Memory Server Cache for Cards
let cachedCards: Card[] | null = null;

export async function getCardsCatalog(): Promise<Card[]> {
    if (cachedCards) {
        return cachedCards;
    }

    try {
        const fs = await import('fs');
        const path = await import('path');
        const devUrl = new URL('../../public/cards.json', import.meta.url);
        const prodUrl = new URL('../client/cards.json', import.meta.url);
        let rawData = '';
        if (fs.existsSync(prodUrl)) {
            rawData = fs.readFileSync(prodUrl, 'utf8');
        } else if (fs.existsSync(devUrl)) {
            rawData = fs.readFileSync(devUrl, 'utf8');
        } else {
            const fallbackPath = path.join(
                process.cwd(),
                'public',
                'cards.json',
            );
            rawData = fs.readFileSync(fallbackPath, 'utf8');
        }
        const parsed: Card[] = JSON.parse(rawData);
        cachedCards = postProcessCardLegality(parsed);
        return cachedCards;
    } catch (e) {
        console.error('Failed to load cards catalog:', e);
        return [];
    }
}

// In-Memory Server Cache for Trending Decks
let cachedTrendingDecks: any[] = [];
let lastTrendingFetchTime = 0;
const TRENDING_CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache

export async function fetchTrendingDecks(): Promise<any[]> {
    const now = Date.now();
    if (
        cachedTrendingDecks.length > 0 &&
        now - lastTrendingFetchTime < TRENDING_CACHE_TTL
    ) {
        return cachedTrendingDecks;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch('https://api-lorcana.com/decks/trending', {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                cachedTrendingDecks = data;
                lastTrendingFetchTime = now;
                return cachedTrendingDecks;
            }
        }
    } catch (err: any) {
        if (err.name === 'AbortError') {
            console.warn(
                `[Trending Decks] Fetch from api-lorcana.com timed out (2.5s) — ${
                    cachedTrendingDecks.length > 0
                        ? 'serving cached trending decks'
                        : 'proceeding with database decks'
                }.`,
            );
        } else {
            console.warn(
                `[Trending Decks] Failed to fetch from api-lorcana.com: ${err.message}`,
            );
        }
    }

    return cachedTrendingDecks;
}

// ---------------------------------------------------------
// Database & Collection Services (Server-Side)
// ---------------------------------------------------------
export const dbService = {
    async getCollection<T>(
        collectionId: string,
        queries: string[] = [],
        request?: Request,
    ): Promise<T[]> {
        if (collectionId === COLLECTIONS.CARDS) {
            const cards = await getCardsCatalog();
            return cards as unknown as T[];
        }

        if (!appwriteConfig.isConfigured) {
            return [];
        }

        try {
            const { databases } = request
                ? createSessionClient(request)
                : createAdminClient();

            const hasLimit = queries.some(
                (q) => typeof q === 'string' && q.includes('"method":"limit"'),
            );

            if (hasLimit) {
                const response = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    collectionId,
                    queries,
                );
                return response.documents as unknown as T[];
            }

            const allDocs: T[] = [];
            const pageSize = 5000;
            let offset = 0;
            let total = 0;

            do {
                const response = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    collectionId,
                    [...queries, Query.limit(pageSize), Query.offset(offset)],
                );
                allDocs.push(...(response.documents as unknown as T[]));
                total = response.total ?? response.documents.length;
                offset += pageSize;
            } while (allDocs.length < total);

            return allDocs;
        } catch (error: any) {
            if (
                error?.code === 404 ||
                error?.code === 503 ||
                error?.code === 504 ||
                error?.code === 502 ||
                error?.type === 'database_not_found' ||
                error?.type === 'collection_not_found'
            ) {
                console.warn(
                    `[Appwrite Server] Collection '${collectionId}' query returned ${error?.code || 'error'} — returning empty array.`,
                );
                return [];
            }
            console.error(`Error fetching collection ${collectionId}:`, error);
            return [];
        }
    },

    async getUserInventory(
        userId: string,
        request?: Request,
    ): Promise<UserCollectionItemDoc[]> {
        const rawDocs = await this.getCollection<UserCollectionItemDoc>(
            COLLECTIONS.USER_COLLECTIONS,
            [Query.equal('user_id', userId)],
            request,
        );

        const cards = await getCardsCatalog();
        const cardsLookup = buildCardsLookup(cards);

        let databases: any = null;
        try {
            databases = request
                ? createSessionClient(request).databases
                : appwriteConfig.apiKey
                  ? createAdminClient().databases
                  : null;
        } catch {
            databases = null;
        }

        // Consolidate legacy card IDs to canonical card IDs & write-back standardize in Appwrite
        const consolidatedMap = new Map<string, UserCollectionItemDoc>();
        const writeBackTasks: Array<Promise<any>> = [];

        for (const doc of rawDocs) {
            const resolvedCard = cardsLookup.get(doc.card_id);
            const canonicalId = resolvedCard ? resolvedCard.id : doc.card_id;
            const key = `${canonicalId}_${doc.is_foil ? 'foil' : 'normal'}`;

            if (consolidatedMap.has(key)) {
                const existing = consolidatedMap.get(key)!;
                const chosenQty =
                    doc.card_id === canonicalId
                        ? doc.quantity
                        : existing.card_id === canonicalId
                          ? existing.quantity
                          : Math.max(existing.quantity, doc.quantity);
                consolidatedMap.set(key, {
                    ...existing,
                    card_id: canonicalId,
                    quantity: chosenQty,
                });

                if (databases) {
                    writeBackTasks.push(
                        databases
                            .updateDocument(
                                appwriteConfig.databaseId,
                                COLLECTIONS.USER_COLLECTIONS,
                                existing.$id,
                                { card_id: canonicalId, quantity: chosenQty },
                            )
                            .catch(() => null),
                    );
                    writeBackTasks.push(
                        databases
                            .deleteDocument(
                                appwriteConfig.databaseId,
                                COLLECTIONS.USER_COLLECTIONS,
                                doc.$id,
                            )
                            .catch(() => null),
                    );
                }
            } else {
                consolidatedMap.set(key, {
                    ...doc,
                    card_id: canonicalId,
                });

                if (doc.card_id !== canonicalId && databases) {
                    writeBackTasks.push(
                        databases
                            .updateDocument(
                                appwriteConfig.databaseId,
                                COLLECTIONS.USER_COLLECTIONS,
                                doc.$id,
                                { card_id: canonicalId },
                            )
                            .catch(() => null),
                    );
                }
            }
        }

        if (writeBackTasks.length > 0) {
            Promise.all(writeBackTasks).catch(() => null);
        }

        return Array.from(consolidatedMap.values());
    },

    async updateInventory(
        userId: string,
        cardId: string,
        quantity: number,
        isFoil: boolean,
        request?: Request,
    ): Promise<UserCollectionItemDoc> {
        let databases = request
            ? createSessionClient(request).databases
            : createAdminClient().databases;

        // If admin client is available, prefer admin client for robust mutation permissions
        if (appwriteConfig.apiKey) {
            databases = createAdminClient().databases;
        }

        try {
            const cards = await getCardsCatalog();
            const cardsLookup = buildCardsLookup(cards);
            const resolvedCard = cardsLookup.get(cardId);
            const canonicalCardId = resolvedCard ? resolvedCard.id : cardId;

            // Find all existing user collection documents by user_id and is_foil
            const allUserDocs = await this.getCollection<UserCollectionItemDoc>(
                COLLECTIONS.USER_COLLECTIONS,
                [
                    Query.equal('user_id', userId),
                    Query.equal('is_foil', isFoil),
                ],
                request,
            );

            const matchingDocs = allUserDocs.filter((doc) => {
                if (doc.card_id === canonicalCardId || doc.card_id === cardId)
                    return true;
                const docResolved = cardsLookup.get(doc.card_id);
                return docResolved && docResolved.id === canonicalCardId;
            });

            if (quantity <= 0) {
                if (matchingDocs.length > 0) {
                    await Promise.all(
                        matchingDocs.map((doc) =>
                            databases
                                .deleteDocument(
                                    appwriteConfig.databaseId,
                                    COLLECTIONS.USER_COLLECTIONS,
                                    doc.$id,
                                )
                                .catch((e: any) => {
                                    if (e.code !== 404) throw e;
                                }),
                        ),
                    );
                }
                return {
                    $id: matchingDocs[0]?.$id || ID.unique(),
                    user_id: userId,
                    card_id: canonicalCardId,
                    quantity: 0,
                    is_foil: isFoil,
                };
            }

            if (matchingDocs.length > 0) {
                const canonicalDoc = matchingDocs.find(
                    (d) => d.card_id === canonicalCardId,
                );
                const primaryDoc = canonicalDoc || matchingDocs[0];
                const duplicates = matchingDocs.filter(
                    (d) => d.$id !== primaryDoc.$id,
                );

                // Clean up any extraneous duplicate documents in parallel
                if (duplicates.length > 0) {
                    await Promise.all(
                        duplicates.map((doc) =>
                            databases
                                .deleteDocument(
                                    appwriteConfig.databaseId,
                                    COLLECTIONS.USER_COLLECTIONS,
                                    doc.$id,
                                )
                                .catch((e: any) => {
                                    if (e.code !== 404) throw e;
                                }),
                        ),
                    );
                }

                const updatePayload: Record<string, any> = { quantity };
                if (primaryDoc.card_id !== canonicalCardId) {
                    updatePayload.card_id = canonicalCardId;
                }

                return (await databases.updateDocument(
                    appwriteConfig.databaseId,
                    COLLECTIONS.USER_COLLECTIONS,
                    primaryDoc.$id,
                    updatePayload,
                )) as unknown as UserCollectionItemDoc;
            } else {
                const newDocId = ID.unique();
                return (await databases.createDocument(
                    appwriteConfig.databaseId,
                    COLLECTIONS.USER_COLLECTIONS,
                    newDocId,
                    {
                        user_id: userId,
                        card_id: canonicalCardId,
                        quantity,
                        is_foil: isFoil,
                    },
                )) as unknown as UserCollectionItemDoc;
            }
        } catch (error: any) {
            console.error('Failed to update inventory in Appwrite:', error);
            throw error;
        }
    },

    async getDecksWithProgress(
        userId: string | null,
        sort: 'progress' | 'missing_cost' | 'name' = 'progress',
        request?: Request,
    ): Promise<DeckWithProgress[]> {
        const [cards, userCollection] = await Promise.all([
            this.getCollection<Card>(COLLECTIONS.CARDS, [], request),
            userId
                ? this.getUserInventory(userId, request)
                : Promise.resolve([]),
        ]);

        const ownedMap = new Map<string, number>();
        for (const item of userCollection) {
            ownedMap.set(
                item.card_id,
                (ownedMap.get(item.card_id) || 0) + item.quantity,
            );
        }

        const cardBySetAndNumber = new Map<string, Card>();
        for (const card of cards) {
            const key = `${card.set.toLowerCase()}_${card.number}`;
            cardBySetAndNumber.set(key, card);
        }

        const resolvedDecks: DeckWithProgress[] = [];

        // Fetch trending decks from api-lorcana.com with in-memory caching & safe timeout
        const apiDecks = await fetchTrendingDecks();

        if (Array.isArray(apiDecks) && apiDecks.length > 0) {
            for (const apiDeck of apiDecks) {
                const deckJunctions: DeckCard[] = [];
                const cardsInDeck: Array<{
                    card: Card;
                    requiredQty: number;
                    ownedQty: number;
                }> = [];

                if (Array.isArray(apiDeck.cards)) {
                    for (const apiCard of apiDeck.cards) {
                        if (!apiCard.dreamborn) continue;
                        const parts = apiCard.dreamborn.split('-');
                        if (parts.length === 2) {
                            const setNum = parseInt(parts[0], 10);
                            const cardNum = parseInt(parts[1], 10);
                            const setName = SET_INDEX_MAP[setNum];
                            if (setName) {
                                const lookupKey = `${setName.toLowerCase()}_${cardNum}`;
                                const cardDetails =
                                    cardBySetAndNumber.get(lookupKey);
                                const qty = apiCard.count || 0;

                                if (cardDetails) {
                                    deckJunctions.push({
                                        deck_id: apiDeck.uuid,
                                        card_id: cardDetails.id,
                                        quantity: qty,
                                    });
                                    cardsInDeck.push({
                                        card: cardDetails,
                                        requiredQty: qty,
                                        ownedQty:
                                            ownedMap.get(cardDetails.id) || 0,
                                    });
                                }
                            }
                        }
                    }
                }

                const progress = calculateDeckProgress(
                    userCollection,
                    deckJunctions,
                    cards,
                );

                resolvedDecks.push({
                    $id: apiDeck.uuid,
                    id: apiDeck.uuid,
                    title: apiDeck.name || 'Trending Deck',
                    description: `Trending metagame deck created by ${apiDeck.creator_name || 'Unknown'}. Views: ${apiDeck.views || 0}, Likes: ${apiDeck.likes || 0}.`,
                    creator_id: apiDeck.creator || 'unknown',
                    is_public: !apiDeck.is_private,
                    progress,
                    cards: cardsInDeck,
                    youtube: apiDeck.youtube,
                    likes: apiDeck.likes,
                    views: apiDeck.views,
                    creator_name: apiDeck.creator_name,
                    is_trending: true,
                });
            }
        }

        // Load Appwrite database decks
        try {
            const [decks, allDeckCards] = await Promise.all([
                this.getCollection<Deck>(
                    COLLECTIONS.DECKS,
                    [Query.equal('is_public', true)],
                    request,
                ),
                this.getCollection<DeckCardDoc>(
                    COLLECTIONS.DECK_CARDS,
                    [],
                    request,
                ),
            ]);
            const cardsLookup = buildCardsLookup(cards);

            for (const deck of decks) {
                if (
                    resolvedDecks.some(
                        (rd) => rd.id === deck.$id || rd.id === deck.id,
                    )
                ) {
                    continue;
                }

                const deckJunctions = allDeckCards.filter(
                    (dc) => dc.deck_id === deck.$id || deck.id === dc.deck_id,
                );
                const progress = calculateDeckProgress(
                    userCollection,
                    deckJunctions,
                    cards,
                );
                const cardsInDeck = deckJunctions.map((dc) => {
                    const cardDetails = cardsLookup.get(dc.card_id) || {
                        $id: dc.card_id,
                        id: dc.card_id,
                        name: 'Unknown Card',
                        set: 'Unknown',
                        number: 0,
                        ink_color: 'Neutral',
                        cost: 0,
                        inkwell: true,
                        strength: null,
                        willpower: null,
                        lore: 0,
                        type: [],
                        classifications: [],
                        rarity: 'Common',
                        image_url: '',
                        formats: ['core', 'infinity'],
                    };
                    const canonicalId = cardDetails.id;
                    const ownedQty =
                        ownedMap.get(canonicalId) ||
                        ownedMap.get(dc.card_id) ||
                        0;

                    return {
                        card: cardDetails,
                        requiredQty: dc.quantity,
                        ownedQty,
                    };
                });

                resolvedDecks.push({
                    ...deck,
                    progress,
                    cards: cardsInDeck,
                    is_trending: false,
                });
            }
        } catch (error) {
            console.error(
                'Failed to load Appwrite public decks with progress:',
                error,
            );
        }

        // Apply requested sorting
        if (sort === 'progress') {
            resolvedDecks.sort(
                (a, b) => b.progress.percentage - a.progress.percentage,
            );
        } else if (sort === 'name') {
            resolvedDecks.sort((a, b) => a.title.localeCompare(b.title));
        }

        return resolvedDecks;
    },

    async getPublicDecksWithProgress(
        userId: string | null,
        sort: 'progress' | 'missing_cost' | 'name' = 'progress',
        request?: Request,
    ): Promise<DeckWithProgress[]> {
        return this.getDecksWithProgress(userId, sort, request);
    },

    async getUserDecksWithProgress(
        userId: string,
        sort: 'progress' | 'missing_cost' | 'name' = 'progress',
        request?: Request,
    ): Promise<DeckWithProgress[]> {
        if (!userId) return [];

        const [cards, userCollection, userDecks, allDeckCards] =
            await Promise.all([
                this.getCollection<Card>(COLLECTIONS.CARDS, [], request),
                this.getUserInventory(userId, request),
                this.getCollection<Deck>(
                    COLLECTIONS.DECKS,
                    [Query.equal('creator_id', userId)],
                    request,
                ),
                this.getCollection<DeckCardDoc>(
                    COLLECTIONS.DECK_CARDS,
                    [],
                    request,
                ),
            ]);

        const cardsLookup = buildCardsLookup(cards);

        let databases: any = null;
        try {
            databases = request
                ? createSessionClient(request).databases
                : appwriteConfig.apiKey
                  ? createAdminClient().databases
                  : null;
        } catch {
            databases = null;
        }

        const deckCardsTasks: Array<Promise<any>> = [];
        const deckCardMap = new Map<string, DeckCardDoc>();
        const sanitizedDeckCards: DeckCardDoc[] = [];

        for (const dc of allDeckCards) {
            const cardDetails = cardsLookup.get(dc.card_id);
            const canonicalId = cardDetails ? cardDetails.id : dc.card_id;
            const key = `${dc.deck_id}_${canonicalId}`;

            if (deckCardMap.has(key)) {
                const existing = deckCardMap.get(key)!;
                const mergedQty = Math.min(
                    4,
                    Math.max(existing.quantity, dc.quantity),
                );
                existing.quantity = mergedQty;

                if (databases) {
                    deckCardsTasks.push(
                        databases
                            .updateDocument(
                                appwriteConfig.databaseId,
                                COLLECTIONS.DECK_CARDS,
                                existing.$id,
                                { card_id: canonicalId, quantity: mergedQty },
                            )
                            .catch(() => null),
                    );
                    deckCardsTasks.push(
                        databases
                            .deleteDocument(
                                appwriteConfig.databaseId,
                                COLLECTIONS.DECK_CARDS,
                                dc.$id,
                            )
                            .catch(() => null),
                    );
                }
            } else {
                const updatedDoc = { ...dc, card_id: canonicalId };
                deckCardMap.set(key, updatedDoc);
                sanitizedDeckCards.push(updatedDoc);

                if (dc.card_id !== canonicalId && databases) {
                    deckCardsTasks.push(
                        databases
                            .updateDocument(
                                appwriteConfig.databaseId,
                                COLLECTIONS.DECK_CARDS,
                                dc.$id,
                                { card_id: canonicalId },
                            )
                            .catch(() => null),
                    );
                }
            }
        }

        if (deckCardsTasks.length > 0) {
            Promise.all(deckCardsTasks).catch(() => null);
        }

        const ownedMap = new Map<string, number>();
        for (const item of userCollection) {
            ownedMap.set(
                item.card_id,
                (ownedMap.get(item.card_id) || 0) + item.quantity,
            );
        }

        const resolvedDecks: DeckWithProgress[] = [];

        for (const deck of userDecks) {
            const deckJunctions = sanitizedDeckCards.filter(
                (dc) => dc.deck_id === deck.$id || deck.id === dc.deck_id,
            );
            const progress = calculateDeckProgress(
                userCollection,
                deckJunctions,
                cards,
            );
            const cardsInDeck = deckJunctions.map((dc) => {
                const cardDetails = cardsLookup.get(dc.card_id) || {
                    $id: dc.card_id,
                    id: dc.card_id,
                    name: 'Unknown Card',
                    set: 'Unknown',
                    number: 0,
                    ink_color: 'Neutral',
                    cost: 0,
                    inkwell: true,
                    strength: null,
                    willpower: null,
                    lore: 0,
                    type: [],
                    classifications: [],
                    rarity: 'Common',
                    image_url: '',
                    formats: ['core', 'infinity'],
                };
                const canonicalId = cardDetails.id;
                const ownedQty =
                    ownedMap.get(canonicalId) || ownedMap.get(dc.card_id) || 0;

                return {
                    card: cardDetails,
                    requiredQty: dc.quantity,
                    ownedQty,
                };
            });

            resolvedDecks.push({
                ...deck,
                progress,
                cards: cardsInDeck,
                is_trending: false,
            });
        }

        return resolvedDecks.sort((a, b) => {
            if (sort === 'progress') {
                if (b.progress.percentage !== a.progress.percentage) {
                    return b.progress.percentage - a.progress.percentage;
                }
                return b.progress.totalCount - a.progress.totalCount;
            }

            if (sort === 'missing_cost') {
                const missingA = a.progress.totalCount - a.progress.ownedCount;
                const missingB = b.progress.totalCount - b.progress.ownedCount;
                if (missingA !== missingB) {
                    return missingA - missingB;
                }
                return b.progress.percentage - a.progress.percentage;
            }

            return a.title.localeCompare(b.title);
        });
    },

    async createDeck(
        userId: string,
        title: string,
        description: string,
        cards: Array<{ cardId: string; quantity: number }>,
        request?: Request,
    ): Promise<{ deck: Deck; deckCards: DeckCardDoc[] }> {
        const deckId = ID.unique();
        const newDeck: Deck = {
            $id: deckId,
            id: deckId,
            title,
            description,
            creator_id: userId,
            is_public: true,
        };

        const newDeckCards: DeckCardDoc[] = cards.map((c) => ({
            $id: ID.unique(),
            deck_id: deckId,
            card_id: c.cardId,
            quantity: Math.min(Math.max(c.quantity, 1), 4),
        }));

        const { databases } = request
            ? createSessionClient(request)
            : createAdminClient();

        try {
            await databases.createDocument(
                appwriteConfig.databaseId,
                COLLECTIONS.DECKS,
                deckId,
                {
                    id: deckId,
                    title,
                    description,
                    creator_id: userId,
                    is_public: true,
                },
            );

            const promises = newDeckCards.map((dc) =>
                databases.createDocument(
                    appwriteConfig.databaseId,
                    COLLECTIONS.DECK_CARDS,
                    dc.$id,
                    {
                        deck_id: dc.deck_id,
                        card_id: dc.card_id,
                        quantity: dc.quantity,
                    },
                ),
            );
            await Promise.all(promises);

            return { deck: newDeck, deckCards: newDeckCards };
        } catch (error: any) {
            console.error('Failed to create deck in Appwrite:', error);
            throw error;
        }
    },

    async updateDeckCards(
        deckId: string,
        userId: string,
        cards: Array<{ cardId: string; quantity: number }>,
        request?: Request,
    ): Promise<DeckCardDoc[]> {
        const { databases } = request
            ? createSessionClient(request)
            : createAdminClient();

        try {
            // 1. Fetch existing cards for this deck
            const existingDeckCards = await this.getCollection<DeckCardDoc>(
                COLLECTIONS.DECK_CARDS,
                [Query.equal('deck_id', deckId)],
                request,
            );

            const existingMap = new Map<string, DeckCardDoc>();
            for (const doc of existingDeckCards) {
                existingMap.set(doc.card_id, doc);
            }

            const targetMap = new Map<string, number>();
            for (const item of cards) {
                if (item.quantity > 0) {
                    targetMap.set(
                        item.cardId,
                        Math.min(Math.max(item.quantity, 1), 4),
                    );
                }
            }

            const tasks: Promise<any>[] = [];
            const resultCards: DeckCardDoc[] = [];

            // A. Deletions: documents that exist in DB but not in the incoming cards
            for (const [cardId, existingDoc] of existingMap.entries()) {
                if (!targetMap.has(cardId)) {
                    tasks.push(
                        databases
                            .deleteDocument(
                                appwriteConfig.databaseId,
                                COLLECTIONS.DECK_CARDS,
                                existingDoc.$id,
                            )
                            .catch(() => null), // Gracefully handle if already deleted concurrently
                    );
                }
            }

            // B. Updates and Insertions
            for (const [cardId, targetQty] of targetMap.entries()) {
                const existingDoc = existingMap.get(cardId);

                if (existingDoc) {
                    if (existingDoc.quantity !== targetQty) {
                        // Only update if quantity actually changed
                        tasks.push(
                            databases
                                .updateDocument(
                                    appwriteConfig.databaseId,
                                    COLLECTIONS.DECK_CARDS,
                                    existingDoc.$id,
                                    {
                                        quantity: targetQty,
                                    },
                                )
                                .catch((err) => {
                                    // If doc was missing or deleted concurrently, recreate it
                                    if (err?.code === 404) {
                                        return databases.createDocument(
                                            appwriteConfig.databaseId,
                                            COLLECTIONS.DECK_CARDS,
                                            ID.unique(),
                                            {
                                                deck_id: deckId,
                                                card_id: cardId,
                                                quantity: targetQty,
                                            },
                                        );
                                    }
                                    throw err;
                                }),
                        );
                    }
                    resultCards.push({
                        ...existingDoc,
                        quantity: targetQty,
                    });
                } else {
                    // Create new document
                    const newDocId = ID.unique();
                    const newDoc: DeckCardDoc = {
                        $id: newDocId,
                        deck_id: deckId,
                        card_id: cardId,
                        quantity: targetQty,
                    };
                    tasks.push(
                        databases.createDocument(
                            appwriteConfig.databaseId,
                            COLLECTIONS.DECK_CARDS,
                            newDocId,
                            {
                                deck_id: deckId,
                                card_id: cardId,
                                quantity: targetQty,
                            },
                        ),
                    );
                    resultCards.push(newDoc);
                }
            }

            await Promise.all(tasks);
            return resultCards;
        } catch (error: any) {
            console.error('Failed to update deck cards in Appwrite:', error);
            throw error;
        }
    },

    async updateDeckDetails(
        deckId: string,
        userId: string,
        title: string,
        description: string,
        request?: Request,
    ): Promise<Deck> {
        const { databases } = request
            ? createSessionClient(request)
            : createAdminClient();

        try {
            return (await databases.updateDocument(
                appwriteConfig.databaseId,
                COLLECTIONS.DECKS,
                deckId,
                {
                    title,
                    description,
                },
            )) as unknown as Deck;
        } catch (error: any) {
            console.error('Failed to update deck in Appwrite:', error);
            throw error;
        }
    },

    async deleteDeck(
        deckId: string,
        userId: string,
        request?: Request,
    ): Promise<boolean> {
        const { databases } = request
            ? createSessionClient(request)
            : createAdminClient();

        try {
            const existingDeckCards = await this.getCollection<DeckCardDoc>(
                COLLECTIONS.DECK_CARDS,
                [Query.equal('deck_id', deckId)],
                request,
            );

            await Promise.all(
                existingDeckCards.map((dc) =>
                    databases
                        .deleteDocument(
                            appwriteConfig.databaseId,
                            COLLECTIONS.DECK_CARDS,
                            dc.$id,
                        )
                        .catch(() => null),
                ),
            );

            await databases.deleteDocument(
                appwriteConfig.databaseId,
                COLLECTIONS.DECKS,
                deckId,
            );

            return true;
        } catch (error: any) {
            console.error('Failed to delete deck in Appwrite:', error);
            throw error;
        }
    },
};
