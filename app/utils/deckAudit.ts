import type {
    Card as LorcanaCard,
    DeckWithProgress,
    UserCollectionItemDoc,
} from '../types/lorcana';
import { buildCardsLookup } from './deck';

export interface ActiveDeckConflict {
    card: LorcanaCard;
    totalRequired: number;
    totalOwned: number;
    deficit: number;
    decks: Array<{
        deckId: string;
        deckTitle: string;
        requiredQty: number;
    }>;
}

export interface DeckAuditResult {
    activeDecksCount: number;
    totalActiveCardsCount: number;
    totalConflictCardsCount: number;
    totalDeficitCount: number;
    conflicts: ActiveDeckConflict[];
    is100PercentBuildable: boolean;
}

/**
 * Calculates physical card conflicts across all currently active/physically built decks.
 * Consolidates standard and foil versions in the user's collection.
 */
export function calculatePhysicalDeckAudit(
    activeDecks: DeckWithProgress[],
    userCollection: UserCollectionItemDoc[],
    cardsCatalog?: LorcanaCard[],
    inventoryMap?: Map<string, number>,
): DeckAuditResult {
    const cardsLookup = cardsCatalog ? buildCardsLookup(cardsCatalog) : null;

    // 1. Calculate total owned quantities (standard + foil) per canonical card ID
    const ownedMap = new Map<string, number>();
    for (const item of userCollection || []) {
        if (item.quantity > 0) {
            let canonicalId = item.card_id;
            if (cardsLookup) {
                const resolved = cardsLookup.get(item.card_id);
                if (resolved) canonicalId = resolved.id;
            }
            ownedMap.set(
                canonicalId,
                (ownedMap.get(canonicalId) || 0) + item.quantity,
            );
            if (item.card_id !== canonicalId) {
                ownedMap.set(
                    item.card_id,
                    (ownedMap.get(item.card_id) || 0) + item.quantity,
                );
            }
        }
    }

    if (inventoryMap) {
        for (const [cardId, qty] of inventoryMap.entries()) {
            if (qty > 0) {
                let canonicalId = cardId;
                if (cardsLookup) {
                    const resolved = cardsLookup.get(cardId);
                    if (resolved) canonicalId = resolved.id;
                }
                const current = ownedMap.get(canonicalId) || 0;
                const maxQty = Math.max(current, qty);
                ownedMap.set(canonicalId, maxQty);
                if (cardId !== canonicalId) {
                    ownedMap.set(cardId, maxQty);
                }
            }
        }
    }

    // 2. Aggregate card requirements across active decks
    const aggregatedMap = new Map<
        string,
        {
            card: LorcanaCard;
            totalRequired: number;
            decks: Array<{
                deckId: string;
                deckTitle: string;
                requiredQty: number;
            }>;
        }
    >();

    let totalActiveCardsCount = 0;

    for (const deck of activeDecks) {
        for (const entry of deck.cards) {
            if (entry.requiredQty <= 0) continue;

            let canonicalId = entry.card.id || entry.card.$id;
            if (cardsLookup) {
                const resolved = cardsLookup.get(canonicalId);
                if (resolved) canonicalId = resolved.id;
            }

            totalActiveCardsCount += entry.requiredQty;

            if (!aggregatedMap.has(canonicalId)) {
                aggregatedMap.set(canonicalId, {
                    card: entry.card,
                    totalRequired: entry.requiredQty,
                    decks: [
                        {
                            deckId: deck.$id || deck.id,
                            deckTitle: deck.title,
                            requiredQty: entry.requiredQty,
                        },
                    ],
                });
            } else {
                const existing = aggregatedMap.get(canonicalId)!;
                existing.totalRequired += entry.requiredQty;
                existing.decks.push({
                    deckId: deck.$id || deck.id,
                    deckTitle: deck.title,
                    requiredQty: entry.requiredQty,
                });
            }
        }
    }

    // 3. Compare required vs owned and flag deficits
    const conflicts: ActiveDeckConflict[] = [];
    let totalDeficitCount = 0;

    for (const [canonicalId, data] of aggregatedMap.entries()) {
        const totalOwned =
            ownedMap.get(canonicalId) ||
            ownedMap.get(data.card.id) ||
            (data.card.$id ? ownedMap.get(data.card.$id) : 0) ||
            0;

        if (data.totalRequired > totalOwned) {
            const deficit = data.totalRequired - totalOwned;
            totalDeficitCount += deficit;
            conflicts.push({
                card: data.card,
                totalRequired: data.totalRequired,
                totalOwned,
                deficit,
                decks: data.decks,
            });
        }
    }

    // 4. Sort conflicts by highest deficit first, then card name
    conflicts.sort((a, b) => {
        if (b.deficit !== a.deficit) {
            return b.deficit - a.deficit;
        }
        return a.card.name.localeCompare(b.card.name);
    });

    return {
        activeDecksCount: activeDecks.length,
        totalActiveCardsCount,
        totalConflictCardsCount: conflicts.length,
        totalDeficitCount,
        conflicts,
        is100PercentBuildable: activeDecks.length > 0 && conflicts.length === 0,
    };
}

/**
 * Formats missing physical copies into TCGPlayer Mass Entry plain text format (<deficit> <cardName>).
 */
export function formatTcgPlayerPhysicalShoppingList(
    conflicts: ActiveDeckConflict[],
): string {
    return conflicts.map((c) => `${c.deficit} ${c.card.name}`).join('\n');
}

/**
 * Formats missing physical copies into a proxy checklist formatted for printing.
 */
export function formatProxyPrintList(
    conflicts: ActiveDeckConflict[],
    activeDecks: DeckWithProgress[],
): string {
    const header = [
        '==================================================',
        'LORCANA TRACKER - PHYSICAL DECK PROXY PRINT LIST',
        `Active Decks (${activeDecks.length}): ${activeDecks.map((d) => d.title).join(', ')}`,
        `Generated: ${new Date().toLocaleDateString()}`,
        '==================================================',
        '',
    ].join('\n');

    if (conflicts.length === 0) {
        return `${header}\nNo conflicts found! All active decks are 100% buildable from your collection.`;
    }

    const items = conflicts.map((c) => {
        const deckBreakdown = c.decks
            .map((d) => `${d.deckTitle} (${d.requiredQty}×)`)
            .join(', ');
        return `[ ] ${c.deficit}× ${c.card.name} (Short ${c.deficit} of ${c.totalRequired} needed across: ${deckBreakdown})`;
    });

    return `${header}${items.join('\n')}\n\nTotal Proxies Needed: ${conflicts.reduce(
        (sum, c) => sum + c.deficit,
        0,
    )} copies across ${conflicts.length} unique cards.`;
}
