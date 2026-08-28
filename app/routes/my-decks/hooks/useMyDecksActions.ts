import { useState, useEffect, useCallback } from 'react';
import type { useFetcher, useSubmit } from 'react-router';
import type {
    DeckWithProgress,
    Card as LorcanaCard,
} from '../../../types/lorcana';
import { serializeDeckMetadata } from '../utils/myDecksHelpers';
import { parseDeckMetadata } from '../../../utils/deck';

interface UseMyDecksActionsProps {
    decks: DeckWithProgress[];
    cards: LorcanaCard[];
    user?: { $id: string } | null;
    submit: ReturnType<typeof useSubmit>;
    fetcher: ReturnType<typeof useFetcher>;
}

export function useMyDecksActions({
    decks,
    cards,
    user,
    submit,
    fetcher,
}: UseMyDecksActionsProps) {
    const updateDeckActiveState = (
        d: DeckWithProgress,
        isActive: boolean,
    ): DeckWithProgress => {
        const meta = d.meta || parseDeckMetadata(d.description);
        return {
            ...d,
            is_active: isActive,
            meta: {
                ...meta,
                is_active: isActive,
            },
        };
    };

    const [localDecks, setLocalDecks] = useState<DeckWithProgress[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('lorcana_active_deck_ids');
                if (stored) {
                    const activeIds: string[] = JSON.parse(stored);
                    const activeSet = new Set(activeIds);
                    return decks.map((d) =>
                        activeSet.has(d.$id) || d.is_active
                            ? updateDeckActiveState(d, true)
                            : d,
                    );
                }
            } catch {
                // Ignore parsing errors
            }
        }
        return decks;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('lorcana_active_deck_ids');
                const activeSet = new Set(stored ? JSON.parse(stored) : []);
                setLocalDecks(
                    decks.map((d) =>
                        activeSet.has(d.$id) || d.is_active
                            ? updateDeckActiveState(d, true)
                            : d,
                    ),
                );
                return;
            } catch {
                // Fallthrough to standard decks
            }
        }
        setLocalDecks(decks);
    }, [decks]);

    useEffect(() => {
        if (fetcher.data && (fetcher.data as { error?: string }).error) {
            console.warn(
                '[LocalDecks] Backend sync returned error, preserving local deck state:',
                (fetcher.data as { error?: string }).error,
            );
        }
    }, [fetcher.data]);

    const [undoState, setUndoState] = useState<{
        deckId: string;
        deckTitle: string;
        card: LorcanaCard;
        previousQuantity: number;
        timestamp: number;
    } | null>(null);

    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const handleToggleDeckActive = (deck: DeckWithProgress) => {
        const nextIsActive = !deck.is_active;

        setLocalDecks((prev) =>
            prev.map((d) => {
                if (d.$id !== deck.$id) return d;
                return updateDeckActiveState(d, nextIsActive);
            }),
        );

        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('lorcana_active_deck_ids');
                let activeIds: string[] = stored ? JSON.parse(stored) : [];
                if (nextIsActive) {
                    if (!activeIds.includes(deck.$id)) activeIds.push(deck.$id);
                } else {
                    activeIds = activeIds.filter((id) => id !== deck.$id);
                }
                localStorage.setItem(
                    'lorcana_active_deck_ids',
                    JSON.stringify(activeIds),
                );
            } catch {
                // Ignore localStorage errors
            }
        }

        const meta = deck.meta || parseDeckMetadata(deck.description);
        const metaDesc = serializeDeckMetadata(
            meta.format,
            meta.inks,
            meta.description,
            meta.coverCardId,
            nextIsActive,
        );

        fetcher.submit(
            {
                intent: 'update-deck-details',
                deckId: deck.$id,
                userId: user ? user.$id : 'guest-user',
                title: deck.title,
                description: metaDesc,
            },
            { method: 'post' },
        );
    };

    const applyDeckCardsOptimistic = useCallback(
        (
            deckId: string,
            updatedCardEntries: Array<{
                card: LorcanaCard;
                requiredQty: number;
                ownedQty?: number;
            }>,
        ) => {
            setLocalDecks((prevDecks) =>
                prevDecks.map((d) => {
                    if (d.$id !== deckId) return d;

                    const newDeckCards = updatedCardEntries.filter(
                        (c) => c.requiredQty > 0,
                    );

                    let ownedCount = 0;
                    let totalCount = 0;
                    const missingCards: Array<{
                        cardId: string;
                        required: number;
                        owned: number;
                        missing: number;
                    }> = [];

                    const mappedCards = newDeckCards.map((entry) => {
                        const existingInDeck = d.cards.find(
                            (c) => c.card.id === entry.card.id,
                        );
                        const ownedQty =
                            entry.ownedQty !== undefined
                                ? entry.ownedQty
                                : existingInDeck?.ownedQty || 0;
                        const requiredQty = Math.min(
                            Math.max(entry.requiredQty, 1),
                            4,
                        );

                        totalCount += requiredQty;
                        const matched = Math.min(requiredQty, ownedQty);
                        ownedCount += matched;

                        if (ownedQty < requiredQty) {
                            missingCards.push({
                                cardId: entry.card.id,
                                required: requiredQty,
                                owned: ownedQty,
                                missing: requiredQty - ownedQty,
                            });
                        }

                        return {
                            card: entry.card,
                            requiredQty,
                            ownedQty,
                        };
                    });

                    const percentage =
                        totalCount === 0
                            ? 0
                            : Math.round((ownedCount / totalCount) * 100);

                    return {
                        ...d,
                        cards: mappedCards,
                        progress: {
                            percentage,
                            ownedCount,
                            totalCount,
                            missingCards,
                        },
                    };
                }),
            );
        },
        [],
    );

    const handleCreateDeck = (
        newDeckTitle: string,
        newDeckFormat: 'core' | 'infinity',
        newDeckInks: string[],
        newDeckDesc: string,
    ) => {
        if (!newDeckTitle.trim()) return;

        const metaDesc = serializeDeckMetadata(
            newDeckFormat,
            newDeckInks,
            newDeckDesc.trim(),
        );

        const newDeckId = `deck_local_${Date.now()}`;
        const newDeckObj: DeckWithProgress = {
            $id: newDeckId,
            id: newDeckId,
            title: newDeckTitle.trim(),
            description: metaDesc,
            creator_id: user ? user.$id : 'guest-user',
            is_public: true,
            progress: {
                percentage: 0,
                ownedCount: 0,
                totalCount: 0,
                missingCards: [],
            },
            cards: [],
            meta: {
                format: newDeckFormat,
                inks: newDeckInks,
                description: newDeckDesc.trim(),
                is_active: false,
            },
        };

        setLocalDecks((prev) => [newDeckObj, ...prev]);

        submit(
            {
                intent: 'create-deck',
                userId: user ? user.$id : 'guest-user',
                title: newDeckTitle.trim(),
                description: metaDesc,
                cards: JSON.stringify([]),
            },
            { method: 'post' },
        );
    };

    const handleSaveDeckDetails = (
        editingDeck: DeckWithProgress,
        editTitle: string,
        editFormat: 'core' | 'infinity',
        editInks: string[],
        editDesc: string,
        editCoverCardId: string,
    ) => {
        if (!editingDeck || !editTitle.trim()) return;

        const metaDesc = serializeDeckMetadata(
            editFormat,
            editInks,
            editDesc.trim(),
            editCoverCardId !== 'auto' ? editCoverCardId : undefined,
        );

        submit(
            {
                intent: 'update-deck-details',
                deckId: editingDeck.$id,
                userId: user ? user.$id : 'guest-user',
                title: editTitle.trim(),
                description: metaDesc,
            },
            { method: 'post' },
        );
    };

    const handleAdjustQuantity = (
        deck: DeckWithProgress,
        cardId: string,
        delta: number,
    ) => {
        if (!user) return;

        const existingIndex = deck.cards.findIndex((c) => c.card.id === cardId);
        if (existingIndex === -1 && delta <= 0) return;

        let nextDeckCards: Array<{
            card: LorcanaCard;
            requiredQty: number;
            ownedQty?: number;
        }>;

        if (existingIndex !== -1) {
            const currentQty = deck.cards[existingIndex].requiredQty;
            const newQty = currentQty + delta;
            if (newQty <= 0) {
                const removedCard = deck.cards[existingIndex].card;
                nextDeckCards = deck.cards.filter((c) => c.card.id !== cardId);

                setUndoState({
                    deckId: deck.$id,
                    deckTitle: deck.title,
                    card: removedCard,
                    previousQuantity: currentQty,
                    timestamp: Date.now(),
                });
            } else {
                const clamped = Math.min(newQty, 4);
                nextDeckCards = deck.cards.map((c) =>
                    c.card.id === cardId ? { ...c, requiredQty: clamped } : c,
                );
            }
        } else {
            const cardRef = cards.find((c) => c.id === cardId);
            if (!cardRef) return;
            nextDeckCards = [
                ...deck.cards,
                { card: cardRef, requiredQty: Math.min(delta, 4), ownedQty: 0 },
            ];
        }

        applyDeckCardsOptimistic(deck.$id, nextDeckCards);

        const payload = nextDeckCards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        fetcher.submit(
            {
                intent: 'update-deck-cards',
                deckId: deck.$id,
                userId: user.$id,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );
    };

    const handleRemoveCard = (
        deck: DeckWithProgress,
        card: LorcanaCard,
        qty: number,
    ) => {
        if (!user) return;

        const nextDeckCards = deck.cards.filter((c) => c.card.id !== card.id);

        setUndoState({
            deckId: deck.$id,
            deckTitle: deck.title,
            card,
            previousQuantity: qty,
            timestamp: Date.now(),
        });

        applyDeckCardsOptimistic(deck.$id, nextDeckCards);

        const payload = nextDeckCards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        fetcher.submit(
            {
                intent: 'update-deck-cards',
                deckId: deck.$id,
                userId: user.$id,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );
    };

    const handleUndo = () => {
        if (!undoState || !user) return;

        const targetDeck = localDecks.find((d) => d.$id === undoState.deckId);
        if (!targetDeck) {
            setUndoState(null);
            return;
        }

        const existingCard = targetDeck.cards.find(
            (c) => c.card.id === undoState.card.id,
        );
        let nextDeckCards: Array<{
            card: LorcanaCard;
            requiredQty: number;
            ownedQty?: number;
        }>;

        if (existingCard) {
            const clamped = Math.min(
                existingCard.requiredQty + undoState.previousQuantity,
                4,
            );
            nextDeckCards = targetDeck.cards.map((c) =>
                c.card.id === undoState.card.id
                    ? { ...c, requiredQty: clamped }
                    : c,
            );
        } else {
            nextDeckCards = [
                ...targetDeck.cards,
                {
                    card: undoState.card,
                    requiredQty: undoState.previousQuantity,
                    ownedQty: 0,
                },
            ];
        }

        applyDeckCardsOptimistic(undoState.deckId, nextDeckCards);

        const payload = nextDeckCards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        fetcher.submit(
            {
                intent: 'update-deck-cards',
                deckId: undoState.deckId,
                userId: user.$id,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );

        setUndoState(null);
    };

    const handleAddCardToDeck = (activeDeckId: string, card: LorcanaCard) => {
        if (!activeDeckId || !user) return;

        const targetDeck = localDecks.find((d) => d.$id === activeDeckId);
        if (!targetDeck) return;

        const existingCard = targetDeck.cards.find(
            (c) => c.card.id === card.id,
        );
        const currentQty = existingCard ? existingCard.requiredQty : 0;
        if (currentQty >= 4) return;

        const nextQty = currentQty + 1;
        let nextDeckCards: Array<{
            card: LorcanaCard;
            requiredQty: number;
            ownedQty?: number;
        }>;

        if (existingCard) {
            nextDeckCards = targetDeck.cards.map((c) =>
                c.card.id === card.id ? { ...c, requiredQty: nextQty } : c,
            );
        } else {
            nextDeckCards = [
                ...targetDeck.cards,
                { card, requiredQty: 1, ownedQty: 0 },
            ];
        }

        applyDeckCardsOptimistic(activeDeckId, nextDeckCards);

        const payload = nextDeckCards.map((c) => ({
            cardId: c.card.id,
            quantity: c.requiredQty,
        }));

        fetcher.submit(
            {
                intent: 'update-deck-cards',
                deckId: activeDeckId,
                userId: user.$id,
                cards: JSON.stringify(payload),
            },
            { method: 'post' },
        );
    };

    const handleDeleteDeck = (deckToDelete: DeckWithProgress) => {
        if (!deckToDelete || !user) return;

        setLocalDecks((prev) => prev.filter((d) => d.$id !== deckToDelete.$id));

        fetcher.submit(
            {
                intent: 'delete-deck',
                deckId: deckToDelete.$id,
                userId: user.$id,
            },
            { method: 'post' },
        );
    };

    const handleExportDeck = (deck: DeckWithProgress) => {
        const textLines = deck.cards.map(
            (c) => `${c.requiredQty} ${c.card.name}`,
        );
        const fullText = textLines.join('\n');
        navigator.clipboard.writeText(fullText).then(() => {
            setCopyFeedback(deck.$id);
            setTimeout(() => setCopyFeedback(null), 2500);
        });
    };

    const handleQuickAdd = (cardId: string, currentOwned: number) => {
        if (!user) {
            alert('Please sign in to update your inventory.');
            return;
        }

        setLocalDecks((prevDecks) =>
            prevDecks.map((d) => {
                const hasCard = d.cards.some((c) => c.card.id === cardId);
                if (!hasCard) return d;

                let ownedCount = 0;
                let totalCount = 0;
                const missingCards: Array<{
                    cardId: string;
                    required: number;
                    owned: number;
                    missing: number;
                }> = [];

                const mappedCards = d.cards.map((c) => {
                    const ownedQty =
                        c.card.id === cardId ? currentOwned + 1 : c.ownedQty;
                    totalCount += c.requiredQty;
                    const matched = Math.min(c.requiredQty, ownedQty);
                    ownedCount += matched;

                    if (ownedQty < c.requiredQty) {
                        missingCards.push({
                            cardId: c.card.id,
                            required: c.requiredQty,
                            owned: ownedQty,
                            missing: c.requiredQty - ownedQty,
                        });
                    }

                    return {
                        ...c,
                        ownedQty,
                    };
                });

                const percentage =
                    totalCount === 0
                        ? 0
                        : Math.round((ownedCount / totalCount) * 100);

                return {
                    ...d,
                    cards: mappedCards,
                    progress: {
                        percentage,
                        ownedCount,
                        totalCount,
                        missingCards,
                    },
                };
            }),
        );

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
        localDecks,
        undoState,
        setUndoState,
        copyFeedback,
        handleCreateDeck,
        handleSaveDeckDetails,
        handleToggleDeckActive,
        handleAdjustQuantity,
        handleRemoveCard,
        handleUndo,
        handleAddCardToDeck,
        handleDeleteDeck,
        handleExportDeck,
        handleQuickAdd,
    };
}
