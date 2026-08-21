import type {
    Card as LorcanaCard,
    DeckWithProgress,
} from '../../../types/lorcana';
import { parseDeckMetadata } from '../../../utils/deck';

export const VALID_LORCANA_INKS = new Set([
    'amber',
    'amethyst',
    'emerald',
    'ruby',
    'sapphire',
    'steel',
]);

// Helper to map Lorcana ink colors to custom hex styling
export function getInkBadgeStyle(color: string) {
    const normalized = color.toLowerCase();
    let hex = '#94a3b8'; // default slate

    switch (normalized) {
        case 'amber':
            hex = '#F5B041'; // Vibrant Gold-Amber
            break;
        case 'amethyst':
            hex = '#AF7AC5'; // Vibrant Amethyst Violet
            break;
        case 'emerald':
            hex = '#2ECC71'; // Jade Emerald Green
            break;
        case 'ruby':
            hex = '#EC7063'; // Ruby Crimson
            break;
        case 'sapphire':
            hex = '#5DADE2'; // Sapphire Blue
            break;
        case 'steel':
            hex = '#A6ACAF'; // Steel Metallic Grey
            break;
    }

    return {
        backgroundColor: `${hex}1F`, // ~12% opacity background
        borderColor: `${hex}66`, // ~40% opacity border
        color: hex,
        textTransform: 'uppercase' as const,
        fontWeight: 700,
        letterSpacing: '0.5px',
    };
}

export interface ProcessedDeck extends DeckWithProgress {
    isCoreLegal: boolean;
    displayDescription: string;
    displayInks: string[];
    meta: {
        format: 'core' | 'infinity';
        inks: string[];
        description: string;
        coverCardId?: string;
    };
}

export type CompletionFilter = 'all' | 'ready' | 'near' | 'in_progress';

export function isDeckMatchingCompletion(
    deck: DeckWithProgress,
    filter: CompletionFilter,
): boolean {
    if (!filter || filter === 'all') return true;
    const total = deck.progress?.totalCount || 0;
    const owned = deck.progress?.ownedCount || 0;
    const pct = deck.progress?.percentage || 0;
    const missing = total - owned;

    if (filter === 'ready') {
        return pct >= 100 || (total > 0 && owned >= total);
    }
    if (filter === 'near') {
        const isReady = pct >= 100 || (total > 0 && owned >= total);
        return !isReady && (pct >= 80 || missing <= 4);
    }
    if (filter === 'in_progress') {
        const isReady = pct >= 100 || (total > 0 && owned >= total);
        const isNear = !isReady && (pct >= 80 || missing <= 4);
        return !isReady && !isNear;
    }
    return true;
}

export function getCompletionCounts(decks: DeckWithProgress[]) {
    let ready = 0;
    let near = 0;
    let inProgress = 0;

    for (const deck of decks) {
        const total = deck.progress?.totalCount || 0;
        const owned = deck.progress?.ownedCount || 0;
        const pct = deck.progress?.percentage || 0;
        const missing = total - owned;

        if (pct >= 100 || (total > 0 && owned >= total)) {
            ready++;
        } else if (pct >= 80 || missing <= 4) {
            near++;
        } else {
            inProgress++;
        }
    }

    return {
        all: decks.length,
        ready,
        near,
        in_progress: inProgress,
    };
}

// Filter decks locally based on deck title, creator, descriptions, and completion
export function filterDecks(
    decks: DeckWithProgress[],
    searchQuery: string,
    cardsLookup?: { get: (id: string) => LorcanaCard | undefined },
    completionFilter: CompletionFilter = 'all',
): ProcessedDeck[] {
    const query = searchQuery.trim().toLowerCase();

    return decks
        .filter((deck) => {
            if (!isDeckMatchingCompletion(deck, completionFilter)) {
                return false;
            }
            const meta = parseDeckMetadata(deck.description);
            const titleMatch = deck.title.toLowerCase().includes(query);
            const descMatch = meta.description.toLowerCase().includes(query);
            const cardMatch = (deck.cards || []).some((dc) => {
                const cardName = dc.card?.name || '';
                return cardName.toLowerCase().includes(query);
            });
            return titleMatch || descMatch || cardMatch;
        })
        .map((deck) => {
            const meta = parseDeckMetadata(deck.description);

            // Resolve cards if cardsLookup is available
            const resolvedCards = (deck.cards || []).map((dc) => {
                if (
                    dc.card &&
                    dc.card.name !== 'Unknown Card' &&
                    dc.card.image_url
                ) {
                    return dc;
                }
                const resolved =
                    (cardsLookup &&
                        (cardsLookup.get(dc.card?.id) ||
                            cardsLookup.get((dc.card as any)?.$id))) ||
                    dc.card;
                return {
                    ...dc,
                    card: resolved || dc.card,
                };
            });

            // Normalize and deduplicate active inks
            const cardInks = resolvedCards.flatMap((dc) =>
                dc.card?.ink_color ? dc.card.ink_color.split('/') : [],
            );
            const normalizedInks = [...(meta.inks || []), ...cardInks].map(
                (i) => i.toLowerCase().trim(),
            );

            const displayInks = Array.from(new Set(normalizedInks)).filter(
                (i) => VALID_LORCANA_INKS.has(i),
            );

            const isCoreLegal =
                meta.format === 'core' &&
                (resolvedCards.length === 0 ||
                    resolvedCards.every((dc) =>
                        dc.card?.formats?.includes('core'),
                    ));

            return {
                ...deck,
                cards: resolvedCards,
                displayDescription: meta.description,
                displayInks,
                meta,
                isCoreLegal,
            };
        });
}
