import type { Card } from '../types/lorcana';

export interface HandCardInstance {
    instanceId: string;
    card: Card;
    drawnOnTurn: number; // 0 for opening hand, 1, 2, 3... for turn draws
    isAltered?: boolean; // True if this card was received as a replacement during Alter
}

export interface HandAnalysisResult {
    totalCards: number;
    inkableCount: number;
    uninkableCount: number;
    inkablePercentage: number;
    turn1Plays: HandCardInstance[];
    turn2Plays: HandCardInstance[];
    turn3Plays: HandCardInstance[];
    averageCost: number;
    costDistribution: Record<number, number>;
    inkColors: Record<string, number>;
    typeDistribution: Record<string, number>;
}

export interface SimulatorState {
    hand: HandCardInstance[];
    drawPile: HandCardInstance[];
    selectedForAlter: Set<string>;
    hasAltered: boolean;
    turnNumber: number;
    history: Array<{
        turn: number;
        action: string;
        timestamp: number;
    }>;
}

/**
 * Expands a deck's card list into individual card instances based on required quantities.
 * Generates unique instance IDs for each individual card copy.
 */
export function expandDeck(
    deckCards: Array<{ card: Card; requiredQty: number }>,
): HandCardInstance[] {
    if (!deckCards || !Array.isArray(deckCards)) return [];

    const instances: HandCardInstance[] = [];
    for (const item of deckCards) {
        if (!item || !item.card) continue;
        const qty = Math.max(0, item.requiredQty || 0);
        for (let i = 0; i < qty; i++) {
            instances.push({
                instanceId: `${item.card.id || item.card.$id || 'card'}_inst_${instances.length}_${i}`,
                card: item.card,
                drawnOnTurn: 0,
            });
        }
    }
    return instances;
}

/**
 * Pure Fisher-Yates shuffle algorithm.
 * Accepts an optional random generator function for deterministic testing.
 */
export function shuffleDeck<T>(
    items: T[],
    rng: () => number = Math.random,
): T[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

/**
 * Deals an opening hand of up to handSize cards (default 7) from the top of the deck.
 */
export function dealOpeningHand(
    deck: HandCardInstance[],
    handSize = 7,
): { hand: HandCardInstance[]; drawPile: HandCardInstance[] } {
    if (!deck || deck.length === 0) {
        return { hand: [], drawPile: [] };
    }

    const size = Math.min(deck.length, Math.max(0, handSize));
    const hand = deck.slice(0, size).map((c) => ({ ...c, drawnOnTurn: 0 }));
    const drawPile = deck.slice(size);

    return { hand, drawPile };
}

/**
 * Executes the Disney Lorcana Alter (mulligan) mechanic:
 * 1. Selected cards from the hand are set aside.
 * 2. An equal number of replacement cards are drawn from the top of the draw pile.
 * 3. The altered cards are placed on the bottom of the draw pile and then shuffled.
 * 4. Hand size is preserved (up to available cards).
 */
export function alterHand(
    hand: HandCardInstance[],
    drawPile: HandCardInstance[],
    alterInstanceIds: Set<string> | string[],
    rng: () => number = Math.random,
): {
    newHand: HandCardInstance[];
    newDrawPile: HandCardInstance[];
    drawnCards: HandCardInstance[];
    alteredCards: HandCardInstance[];
} {
    const alterSet =
        alterInstanceIds instanceof Set
            ? alterInstanceIds
            : new Set(alterInstanceIds);

    if (alterSet.size === 0) {
        return {
            newHand: [...hand],
            newDrawPile: [...drawPile],
            drawnCards: [],
            alteredCards: [],
        };
    }

    const keptCards: HandCardInstance[] = [];
    const alteredCards: HandCardInstance[] = [];

    for (const card of hand) {
        if (alterSet.has(card.instanceId)) {
            alteredCards.push(card);
        } else {
            keptCards.push(card);
        }
    }

    const neededReplacements = alteredCards.length;
    const drawnCards = drawPile.slice(0, neededReplacements).map((c) => ({
        ...c,
        drawnOnTurn: 0,
        isAltered: true,
    }));
    const remainingDrawPile = drawPile.slice(neededReplacements);

    // Official Lorcana rule: Put altered cards on bottom, then shuffle the deck
    const updatedDrawPile = shuffleDeck(
        [...remainingDrawPile, ...alteredCards],
        rng,
    );

    return {
        newHand: [...keptCards, ...drawnCards],
        newDrawPile: updatedDrawPile,
        drawnCards,
        alteredCards,
    };
}

/**
 * Draws 1 card for the turn progression step.
 */
export function drawTurnCard(
    hand: HandCardInstance[],
    drawPile: HandCardInstance[],
    turnNumber: number,
): {
    newHand: HandCardInstance[];
    newDrawPile: HandCardInstance[];
    drawnCard: HandCardInstance | null;
} {
    if (!drawPile || drawPile.length === 0) {
        return {
            newHand: [...hand],
            newDrawPile: [],
            drawnCard: null,
        };
    }

    const topCard: HandCardInstance = {
        ...drawPile[0],
        drawnOnTurn: turnNumber,
    };

    return {
        newHand: [...hand, topCard],
        newDrawPile: drawPile.slice(1),
        drawnCard: topCard,
    };
}

/**
 * Analyzes the current hand for at-a-glance metrics:
 * - Inkable vs. Uninkable counts & percentages
 * - Turn 1, 2, 3 playable cards
 * - Average ink cost and cost distribution
 * - Ink colors breakdown
 */
export function analyzeHand(hand: HandCardInstance[]): HandAnalysisResult {
    const totalCards = hand.length;
    let inkableCount = 0;
    let uninkableCount = 0;
    let totalCost = 0;
    const turn1Plays: HandCardInstance[] = [];
    const turn2Plays: HandCardInstance[] = [];
    const turn3Plays: HandCardInstance[] = [];
    const costDistribution: Record<number, number> = {};
    const inkColors: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {};

    for (const item of hand) {
        const card = item.card;
        if (!card) continue;

        // Inkable check
        if (card.inkwell) {
            inkableCount++;
        } else {
            uninkableCount++;
        }

        // Cost distribution & plays
        const cost = typeof card.cost === 'number' ? card.cost : 0;
        totalCost += cost;
        costDistribution[cost] = (costDistribution[cost] || 0) + 1;

        if (cost === 1) turn1Plays.push(item);
        if (cost === 2) turn2Plays.push(item);
        if (cost === 3) turn3Plays.push(item);

        // Inks
        if (card.ink_color) {
            const colors = card.ink_color
                .split('/')
                .map((c) => c.trim().toLowerCase());
            for (const c of colors) {
                if (c) inkColors[c] = (inkColors[c] || 0) + 1;
            }
        }

        // Types
        if (Array.isArray(card.type)) {
            for (const t of card.type) {
                if (t) {
                    const norm = t.trim().toLowerCase();
                    typeDistribution[norm] = (typeDistribution[norm] || 0) + 1;
                }
            }
        }
    }

    const averageCost =
        totalCards > 0 ? Math.round((totalCost / totalCards) * 10) / 10 : 0;
    const inkablePercentage =
        totalCards > 0 ? Math.round((inkableCount / totalCards) * 100) : 0;

    return {
        totalCards,
        inkableCount,
        uninkableCount,
        inkablePercentage,
        turn1Plays,
        turn2Plays,
        turn3Plays,
        averageCost,
        costDistribution,
        inkColors,
        typeDistribution,
    };
}
