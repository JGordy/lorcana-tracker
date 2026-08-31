import type { Card as LorcanaCard } from '../../../types/lorcana';
import { parseDeckMetadata } from '../../../utils/deck';

export const ALL_INKS = [
    { id: 'amber', name: 'Amber', hex: '#F5B041' },
    { id: 'amethyst', name: 'Amethyst', hex: '#AF7AC5' },
    { id: 'emerald', name: 'Emerald', hex: '#2ECC71' },
    { id: 'ruby', name: 'Ruby', hex: '#EC7063' },
    { id: 'sapphire', name: 'Sapphire', hex: '#5DADE2' },
    { id: 'steel', name: 'Steel', hex: '#A6ACAF' },
] as const;

export function serializeDeckMetadata(
    format: 'core' | 'infinity',
    inks: string[],
    description: string,
    coverCardId?: string,
    is_active?: boolean,
): string {
    return JSON.stringify({
        format,
        inks,
        description,
        coverCardId,
        is_active,
    });
}

export function processMyDecks(
    localDecks: any[],
    searchQuery: string,
    cardsLookup: { get: (id: string) => LorcanaCard | undefined },
    inventoryMap?: Map<string, number>,
) {
    return localDecks
        .filter((deck) => {
            const meta = deck.meta || parseDeckMetadata(deck.description);
            const desc = (meta.description || '').toLowerCase();
            const title = (deck.title || '').toLowerCase();
            const q = searchQuery.toLowerCase();
            return title.includes(q) || desc.includes(q);
        })
        .map((deck) => {
            const meta = deck.meta || parseDeckMetadata(deck.description);
            const is_active =
                deck.is_active !== undefined
                    ? Boolean(deck.is_active)
                    : Boolean(meta.is_active);

            // Resolve any cards that fell back to Unknown Card
            const resolvedCards = (deck.cards || []).map((dc: any) => {
                const cardId = dc.card?.id || dc.card?.$id;
                const invQty =
                    inventoryMap && cardId ? inventoryMap.get(cardId) || 0 : 0;
                const ownedQty = Math.max(dc.ownedQty || 0, invQty);

                if (
                    dc.card &&
                    dc.card.name !== 'Unknown Card' &&
                    dc.card.image_url
                ) {
                    return { ...dc, ownedQty };
                }
                const resolved =
                    cardsLookup.get(dc.card?.id) ||
                    cardsLookup.get(dc.card?.$id) ||
                    dc.card;
                return {
                    ...dc,
                    card: resolved,
                    ownedQty,
                };
            });

            // Calculate active inks: combine chosen deck inks and any inks in added cards
            const cardInks = Array.from(
                new Set(
                    resolvedCards.flatMap((dc: any) =>
                        dc.card?.ink_color ? dc.card.ink_color.split('/') : [],
                    ),
                ),
            ).map((i) => (i as string).toLowerCase().trim());

            const VALID_LORCANA_INKS = new Set([
                'amber',
                'amethyst',
                'emerald',
                'ruby',
                'sapphire',
                'steel',
            ]);

            const combinedInks = Array.from(
                new Set([...(meta.inks || []), ...cardInks]),
            )
                .map((i) => i.toLowerCase().trim())
                .filter((i) => VALID_LORCANA_INKS.has(i));

            const displayInks = combinedInks.length > 0 ? combinedInks : [];

            const isCoreLegal =
                meta.format === 'core' &&
                (resolvedCards.length === 0 ||
                    resolvedCards.every((dc: any) =>
                        dc.card?.formats?.includes('core'),
                    ));

            let ownedCount = 0;
            let totalCards = 0;
            const missingCards: Array<{
                cardId: string;
                required: number;
                owned: number;
                missing: number;
            }> = [];

            resolvedCards.forEach((dc: any) => {
                const req = dc.requiredQty || 0;
                const own = dc.ownedQty || 0;
                totalCards += req;
                const matched = Math.min(req, own);
                ownedCount += matched;

                if (own < req) {
                    missingCards.push({
                        cardId: dc.card?.id || dc.card?.$id || 'unknown',
                        required: req,
                        owned: own,
                        missing: req - own,
                    });
                }
            });

            const percentage =
                totalCards === 0
                    ? 0
                    : Math.round((ownedCount / totalCards) * 100);

            const progress = {
                percentage,
                ownedCount,
                totalCount: totalCards,
                missingCards,
            };

            return {
                ...deck,
                cards: resolvedCards,
                progress,
                meta: {
                    ...meta,
                    is_active,
                },
                is_active,
                displayInks,
                isCoreLegal,
                totalCardsCount: totalCards,
            };
        });
}
