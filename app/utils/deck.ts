export interface UserCollectionItem {
  user_id: string;
  card_id: string;
  quantity: number;
  is_foil: boolean;
}

export interface DeckCard {
  deck_id: string;
  card_id: string;
  quantity: number;
}

export interface ProgressResult {
  percentage: number;
  ownedCount: number;
  totalCount: number;
  missingCards: Array<{
    cardId: string;
    required: number;
    owned: number;
    missing: number;
  }>;
}

/**
 * Calculates the user's collection completion progress for a given deck.
 * Sums foil and non-foil versions of owned cards, matches them against the deck list,
 * and outputs the percentage, missing cards, and absolute totals.
 *
 * @param userCollection User's inventory items
 * @param deckCards Deck requirements junction list
 */
export function calculateDeckProgress(
  userCollection: UserCollectionItem[],
  deckCards: DeckCard[]
): ProgressResult {
  // 1. Aggregate user collection quantities by card_id
  const ownedMap: Record<string, number> = {};
  for (const item of userCollection) {
    if (item.quantity > 0) {
      ownedMap[item.card_id] = (ownedMap[item.card_id] || 0) + item.quantity;
    }
  }

  let ownedCount = 0;
  let totalCount = 0;
  const missingCards: ProgressResult["missingCards"] = [];

  // 2. Compare deck requirements with owned counts
  for (const req of deckCards) {
    const requiredQty = req.quantity;
    totalCount += requiredQty;

    const ownedQty = ownedMap[req.card_id] || 0;
    const matching = Math.min(requiredQty, ownedQty);
    ownedCount += matching;

    if (ownedQty < requiredQty) {
      missingCards.push({
        cardId: req.card_id,
        required: requiredQty,
        owned: ownedQty,
        missing: requiredQty - ownedQty,
      });
    }
  }

  // 3. Compute progress percentage rounded to 1 decimal place
  const percentage = totalCount > 0 ? (ownedCount / totalCount) * 100 : 0;
  const roundedPercentage = Math.round(percentage * 10) / 10;

  return {
    percentage: roundedPercentage,
    ownedCount,
    totalCount,
    missingCards,
  };
}

/**
 * Normalizes card names into standardized slug IDs (lowercase, alphanumeric and hyphens only).
 * Ensures robust matching across varied API schemas.
 */
export function getCardSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove punctuation
    .trim()
    .replace(/[\s-]+/g, "-");    // collapse spaces and dashes to a single dash
}
