import type { Card as LorcanaCard, DeckWithProgress } from '../types/lorcana';

export interface MissingCardItem {
    card: LorcanaCard;
    requiredQty: number;
    ownedQty: number;
    missingQty: number;
}

/**
 * Extracts the list of missing cards from a deck with their required, owned, and missing quantities.
 */
export function getMissingCards(deck: DeckWithProgress): MissingCardItem[] {
    if (!deck || !Array.isArray(deck.cards)) return [];

    const missingList: MissingCardItem[] = [];

    for (const dc of deck.cards) {
        if (!dc.card) continue;
        const requiredQty = dc.requiredQty || 0;
        const ownedQty = dc.ownedQty || 0;
        if (ownedQty < requiredQty) {
            missingList.push({
                card: dc.card,
                requiredQty,
                ownedQty,
                missingQty: requiredQty - ownedQty,
            });
        }
    }

    // Sort by ink color then name for clean presentation
    return missingList.sort((a, b) => {
        const inkA = a.card.ink_color || '';
        const inkB = b.card.ink_color || '';
        if (inkA !== inkB) return inkA.localeCompare(inkB);
        return a.card.name.localeCompare(b.card.name);
    });
}

/**
 * Formats missing cards for TCGPlayer Mass Entry.
 * Standard format: "<Quantity> <Card Name>" (one entry per line).
 * Example:
 * 4 Maui - Hero to All
 * 2 A Whole New World
 */
export function formatTcgPlayerMassEntry(
    missingCards: MissingCardItem[],
): string {
    if (!missingCards || missingCards.length === 0) return '';

    return missingCards
        .map((item) => `${item.missingQty} ${item.card.name}`)
        .join('\n');
}

/**
 * Formats missing cards into a clean Markdown checklist / table.
 */
export function formatMarkdownShoppingList(
    deckTitle: string,
    missingCards: MissingCardItem[],
): string {
    if (!missingCards || missingCards.length === 0) {
        return `### Shopping List: ${deckTitle}\n\nAll cards are in your collection! Ready to play! 🎉`;
    }

    const totalMissing = missingCards.reduce(
        (acc, item) => acc + item.missingQty,
        0,
    );
    const lines = [
        `### Shopping List: ${deckTitle}`,
        `**Total Missing Cards:** ${totalMissing} across ${missingCards.length} unique card(s)\n`,
    ];

    for (const item of missingCards) {
        const ink = item.card.ink_color ? ` [${item.card.ink_color}]` : '';
        const rarity = item.card.rarity ? ` (${item.card.rarity})` : '';
        const setInfo = item.card.set ? ` - ${item.card.set}` : '';
        lines.push(
            `- [ ] **${item.missingQty}x** ${item.card.name}${ink}${rarity}${setInfo} *(Own ${item.ownedQty}/${item.requiredQty})*`,
        );
    }

    return lines.join('\n');
}

/**
 * Formats missing cards as a simple plain text list.
 */
export function formatPlainTextShoppingList(
    deckTitle: string,
    missingCards: MissingCardItem[],
): string {
    if (!missingCards || missingCards.length === 0) {
        return `Shopping List: ${deckTitle}\nAll cards owned! Ready to play!`;
    }

    const totalMissing = missingCards.reduce(
        (acc, item) => acc + item.missingQty,
        0,
    );
    const lines = [
        `Shopping List: ${deckTitle}`,
        `Total Missing: ${totalMissing} (${missingCards.length} unique cards)`,
        '----------------------------------------',
    ];

    for (const item of missingCards) {
        lines.push(
            `${item.missingQty}x ${item.card.name} (${item.card.ink_color || 'Neutral'}) - Need ${item.missingQty} (Own ${item.ownedQty}/${item.requiredQty})`,
        );
    }

    return lines.join('\n');
}

/**
 * Generates direct TCGPlayer Mass Entry URL.
 */
export function getTcgPlayerMassEntryUrl(): string {
    return 'https://www.tcgplayer.com/massentry';
}

/**
 * Generates direct TCGPlayer search URL for an individual card.
 */
export function getTcgPlayerCardSearchUrl(cardName: string): string {
    return `https://www.tcgplayer.com/search/disney-lorcana/product?q=${encodeURIComponent(cardName)}`;
}

/**
 * Generates Cardmarket Wants List URL for Lorcana.
 */
export function getCardmarketWantsUrl(): string {
    return 'https://www.cardmarket.com/en/Lorcana/Wants';
}
