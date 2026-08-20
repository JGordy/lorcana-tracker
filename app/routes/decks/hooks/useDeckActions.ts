import { useState } from 'react';
import type { useFetcher } from 'react-router';
import { SET_NAME_TO_INDEX } from '../../../types/lorcana';
import type { ProcessedDeck } from '../utils/deckHelpers';

interface UseDeckActionsOptions {
    user?: { $id: string } | null;
    fetcher: ReturnType<typeof useFetcher>;
    cloneFetcher: ReturnType<typeof useFetcher>;
}

export function useDeckActions({
    user,
    fetcher,
    cloneFetcher,
}: UseDeckActionsOptions) {
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const handleCloneDeck = (deckToClone: ProcessedDeck) => {
        if (!user) {
            alert(
                'Please sign in or use demo login to save decks to your personal library.',
            );
            return;
        }

        const payload = deckToClone.cards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        cloneFetcher.submit(
            {
                intent: 'clone-deck',
                userId: user.$id,
                title: `${deckToClone.title} (Copy)`,
                description: `Cloned from ${deckToClone.title}. ${deckToClone.description || ''}`,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );
    };

    const handleExportDeck = (deckToExport: ProcessedDeck) => {
        const textLines = deckToExport.cards.map((c) => {
            const setIdx = SET_NAME_TO_INDEX[c.card.set];
            const setCode =
                setIdx !== undefined
                    ? `${setIdx.toString().padStart(3, '0')}-${c.card.number.toString().padStart(3, '0')}`
                    : '';
            return `${c.requiredQty} ${c.card.name}${setCode ? ` (${setCode})` : ''}`;
        });
        const fullText = textLines.join('\n');
        navigator.clipboard.writeText(fullText);
        setCopyFeedback(deckToExport.$id);
        setTimeout(() => setCopyFeedback(null), 2500);
    };

    const handleQuickAdd = (cardId: string, currentOwned: number) => {
        if (!user) {
            alert(
                'Please sign in with a demo session to update your inventory.',
            );
            return;
        }
        fetcher.submit(
            {
                intent: 'quick-add',
                userId: user.$id,
                cardId,
                quantity: (currentOwned + 1).toString(),
                isFoil: 'false',
            },
            { method: 'post' },
        );
    };

    return {
        copyFeedback,
        handleCloneDeck,
        handleExportDeck,
        handleQuickAdd,
    };
}
