import { Query } from "node-appwrite";
import { appwriteConfig } from "../utils/appwrite/config";
import {
  createSessionClient,
  createAdminClient,
} from "../utils/appwrite/server";
import {
  calculateDeckProgress,
  type DeckCard,
} from "../utils/deck";
import {
  type Card,
  type UserCollectionItemDoc,
  type Deck,
  type DeckCardDoc,
  type DeckWithProgress,
  COLLECTIONS,
  SET_INDEX_MAP,
  postProcessCardLegality,
} from "../types/lorcana";

export { authService } from "./auth.server";
export {
  type Card,
  type UserCollectionItemDoc,
  type Deck,
  type DeckCardDoc,
  type DeckWithProgress,
  COLLECTIONS,
  SET_INDEX_MAP,
  postProcessCardLegality,
} from "../types/lorcana";

export const isConfigured = appwriteConfig.isConfigured;

// In-Memory Server Cache for Cards
let cachedCards: Card[] | null = null;

export async function getCardsCatalog(): Promise<Card[]> {
  if (cachedCards) {
    return cachedCards;
  }

  try {
    const fs = await import("fs");
    const path = await import("path");
    const devUrl = new URL("../../public/cards.json", import.meta.url);
    const prodUrl = new URL("../client/cards.json", import.meta.url);
    let rawData = "";
    if (fs.existsSync(prodUrl)) {
      rawData = fs.readFileSync(prodUrl, "utf8");
    } else if (fs.existsSync(devUrl)) {
      rawData = fs.readFileSync(devUrl, "utf8");
    } else {
      const fallbackPath = path.join(process.cwd(), "public", "cards.json");
      rawData = fs.readFileSync(fallbackPath, "utf8");
    }
    const parsed: Card[] = JSON.parse(rawData);
    cachedCards = postProcessCardLegality(parsed);
    return cachedCards;
  } catch (e) {
    console.error("Failed to load cards catalog:", e);
    return [];
  }
}

// ---------------------------------------------------------
// Database & Collection Services (Server-Side)
// ---------------------------------------------------------
export const dbService = {
  async getCollection<T>(
    collectionId: string,
    queries: string[] = [],
    request?: Request
  ): Promise<T[]> {
    if (collectionId === COLLECTIONS.CARDS) {
      const cards = await getCardsCatalog();
      return cards as unknown as T[];
    }

    if (!appwriteConfig.isConfigured) {
      return [];
    }

    try {
      const { databases } = request ? createSessionClient(request) : createAdminClient();
      const response = await databases.listDocuments(appwriteConfig.databaseId, collectionId, queries);
      return response.documents as unknown as T[];
    } catch (error: any) {
      if (
        error?.code === 404 ||
        error?.code === 503 ||
        error?.code === 504 ||
        error?.code === 502 ||
        error?.type === "database_not_found" ||
        error?.type === "collection_not_found"
      ) {
        console.warn(`[Appwrite Server] Collection '${collectionId}' query returned ${error?.code || "error"} — returning empty array.`);
        return [];
      }
      console.error(`Error fetching collection ${collectionId}:`, error);
      return [];
    }
  },

  async getUserInventory(userId: string, request?: Request): Promise<UserCollectionItemDoc[]> {
    return this.getCollection<UserCollectionItemDoc>(
      COLLECTIONS.USER_COLLECTIONS,
      [Query.equal("user_id", userId)],
      request
    );
  },

  async updateInventory(
    userId: string,
    cardId: string,
    quantity: number,
    isFoil: boolean,
    request?: Request
  ): Promise<UserCollectionItemDoc> {
    const docId = `${userId}_${cardId.replace(/[^a-zA-Z0-9]/g, "-")}_${isFoil ? "foil" : "normal"}`;

    const { databases } = request ? createSessionClient(request) : createAdminClient();

    try {
      if (quantity <= 0) {
        try {
          await databases.deleteDocument(appwriteConfig.databaseId, COLLECTIONS.USER_COLLECTIONS, docId);
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }
        return { $id: docId, user_id: userId, card_id: cardId, quantity: 0, is_foil: isFoil };
      }

      return (await databases.updateDocument(
        appwriteConfig.databaseId,
        COLLECTIONS.USER_COLLECTIONS,
        docId,
        { quantity }
      )) as unknown as UserCollectionItemDoc;
    } catch (error: any) {
      if (error.code === 404) {
        return (await databases.createDocument(
          appwriteConfig.databaseId,
          COLLECTIONS.USER_COLLECTIONS,
          docId,
          {
            user_id: userId,
            card_id: cardId,
            quantity,
            is_foil: isFoil,
          }
        )) as unknown as UserCollectionItemDoc;
      }
      throw error;
    }
  },

  async getDecksWithProgress(
    userId: string | null,
    sort: "progress" | "missing_cost" | "name" = "progress",
    request?: Request
  ): Promise<DeckWithProgress[]> {
    const [cards, userCollection] = await Promise.all([
      this.getCollection<Card>(COLLECTIONS.CARDS, [], request),
      userId
        ? this.getCollection<UserCollectionItemDoc>(
            COLLECTIONS.USER_COLLECTIONS,
            [Query.equal("user_id", userId)],
            request
          )
        : Promise.resolve([]),
    ]);

    const ownedMap = new Map<string, number>();
    for (const item of userCollection) {
      ownedMap.set(item.card_id, (ownedMap.get(item.card_id) || 0) + item.quantity);
    }

    const cardBySetAndNumber = new Map<string, Card>();
    for (const card of cards) {
      const key = `${card.set.toLowerCase()}_${card.number}`;
      cardBySetAndNumber.set(key, card);
    }

    const resolvedDecks: DeckWithProgress[] = [];

    // Fetch trending decks from api-lorcana.com
    let apiDecks: any[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("https://api-lorcana.com/decks/trending", {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        apiDecks = await res.json();
      }
    } catch (err) {
      console.warn("Failed to fetch trending decks from api-lorcana.com:", err);
    }

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
            const parts = apiCard.dreamborn.split("-");
            if (parts.length === 2) {
              const setNum = parseInt(parts[0], 10);
              const cardNum = parseInt(parts[1], 10);
              const setName = SET_INDEX_MAP[setNum];
              if (setName) {
                const lookupKey = `${setName.toLowerCase()}_${cardNum}`;
                const cardDetails = cardBySetAndNumber.get(lookupKey);
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
                    ownedQty: ownedMap.get(cardDetails.id) || 0,
                  });
                }
              }
            }
          }
        }

        const progress = calculateDeckProgress(userCollection, deckJunctions);

        resolvedDecks.push({
          $id: apiDeck.uuid,
          id: apiDeck.uuid,
          title: apiDeck.name || "Trending Deck",
          description: `Trending metagame deck created by ${apiDeck.creator_name || "Unknown"}. Views: ${apiDeck.views || 0}, Likes: ${apiDeck.likes || 0}.`,
          creator_id: apiDeck.creator || "unknown",
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
        this.getCollection<Deck>(COLLECTIONS.DECKS, [Query.equal("is_public", true)], request),
        this.getCollection<DeckCardDoc>(COLLECTIONS.DECK_CARDS, [], request),
      ]);

      const cardsMap = new Map<string, Card>();
      for (const card of cards) {
        cardsMap.set(card.id, card);
      }

      for (const deck of decks) {
        if (resolvedDecks.some((rd) => rd.id === deck.$id || rd.id === deck.id)) {
          continue;
        }

        const deckJunctions = allDeckCards.filter((dc) => dc.deck_id === deck.$id || deck.id === dc.deck_id);
        const progress = calculateDeckProgress(userCollection, deckJunctions);
        const cardsInDeck = deckJunctions.map((dc) => {
          const cardDetails = cardsMap.get(dc.card_id) || {
            $id: dc.card_id,
            id: dc.card_id,
            name: "Unknown Card",
            set: "Unknown",
            number: 0,
            ink_color: "Neutral",
            cost: 0,
            inkwell: true,
            strength: null,
            willpower: null,
            lore: 0,
            type: [],
            classifications: [],
            rarity: "Common",
            image_url: "",
            formats: ["core", "infinity"],
          };
          return {
            card: cardDetails,
            requiredQty: dc.quantity,
            ownedQty: ownedMap.get(dc.card_id) || 0,
          };
        });

        resolvedDecks.push({
          ...deck,
          progress,
          cards: cardsInDeck,
          is_trending: false,
        });
      }
    } catch (e) {
      console.warn("Failed to load user decks from database:", e);
    }

    return resolvedDecks.sort((a, b) => {
      if (sort === "progress") {
        if (b.progress.percentage !== a.progress.percentage) {
          return b.progress.percentage - a.progress.percentage;
        }
        return b.progress.totalCount - a.progress.totalCount;
      }

      if (sort === "missing_cost") {
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
    request?: Request
  ): Promise<{ deck: Deck; deckCards: DeckCardDoc[] }> {
    const deckId = `deck-${Date.now()}`;
    const newDeck: Deck = {
      $id: deckId,
      id: deckId,
      title,
      description,
      creator_id: userId,
      is_public: true,
    };

    const newDeckCards: DeckCardDoc[] = cards.map((c, index) => ({
      $id: `dc-${deckId}-${index}`,
      deck_id: deckId,
      card_id: c.cardId,
      quantity: c.quantity,
    }));

    const { databases } = request ? createSessionClient(request) : createAdminClient();

    try {
      await databases.createDocument(appwriteConfig.databaseId, COLLECTIONS.DECKS, deckId, {
        id: deckId,
        title,
        description,
        creator_id: userId,
        is_public: true,
      });

      const promises = newDeckCards.map((dc) =>
        databases.createDocument(appwriteConfig.databaseId, COLLECTIONS.DECK_CARDS, dc.$id, {
          deck_id: dc.deck_id,
          card_id: dc.card_id,
          quantity: dc.quantity,
        })
      );
      await Promise.all(promises);

      return { deck: newDeck, deckCards: newDeckCards };
    } catch (error: any) {
      console.error("Failed to create deck in Appwrite:", error);
      throw error;
    }
  },
};
