import type { DeckWithProgress } from '../../../types/lorcana';

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
}

// Filter decks locally based on deck title, creator, or descriptions
export function filterDecks(
    decks: DeckWithProgress[],
    searchQuery: string,
): ProcessedDeck[] {
    const query = searchQuery.trim().toLowerCase();

    return decks
        .filter(
            (deck) =>
                deck.title.toLowerCase().includes(query) ||
                deck.description.toLowerCase().includes(query),
        )
        .map((deck) => {
            const isCoreLegal = deck.cards.every((dc) =>
                dc.card.formats?.includes('core'),
            );
            return {
                ...deck,
                isCoreLegal,
            };
        });
}
