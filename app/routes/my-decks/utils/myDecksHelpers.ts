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
) {
    return localDecks
        .filter((deck) => {
            const meta = parseDeckMetadata(deck.description);
            const desc = meta.description.toLowerCase();
            const title = deck.title.toLowerCase();
            const q = searchQuery.toLowerCase();
            return title.includes(q) || desc.includes(q);
        })
        .map((deck) => {
            const meta = parseDeckMetadata(deck.description);

            // Resolve any cards that fell back to Unknown Card
            const resolvedCards = (deck.cards || []).map((dc: any) => {
                if (
                    dc.card &&
                    dc.card.name !== 'Unknown Card' &&
                    dc.card.image_url
                ) {
                    return dc;
                }
                const resolved =
                    cardsLookup.get(dc.card?.id) ||
                    cardsLookup.get(dc.card?.$id) ||
                    dc.card;
                return {
                    ...dc,
                    card: resolved,
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

            const totalCards = resolvedCards.reduce(
                (sum: number, c: any) => sum + c.requiredQty,
                0,
            );

            return {
                ...deck,
                cards: resolvedCards,
                meta,
                is_active: Boolean(meta.is_active),
                displayInks,
                isCoreLegal,
                totalCardsCount: totalCards,
            };
        });
}
