import { useState, useEffect, useCallback, useRef } from 'react';
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

    const saveLocalDecksStore = useCallback((allDecks: DeckWithProgress[]) => {
        if (typeof window === 'undefined') return;
        try {
            const localOnly = allDecks.filter(
                (d) =>
                    d.$id.startsWith('deck_local_') ||
                    d.id.startsWith('deck_local_'),
            );
            localStorage.setItem(
                'lorcana_user_decks_store',
                JSON.stringify(localOnly),
            );
        } catch (e) {
            console.warn('[LocalDecks] Failed to save local decks store:', e);
        }
    }, []);

    const [localDecks, setLocalDecks] = useState<DeckWithProgress[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedActive = localStorage.getItem(
                    'lorcana_active_deck_ids',
                );
                const activeSet = new Set(
                    storedActive ? JSON.parse(storedActive) : [],
                );

                const storedCustom = localStorage.getItem(
                    'lorcana_user_decks_store',
                );
                const customDecks: DeckWithProgress[] = storedCustom
                    ? JSON.parse(storedCustom)
                    : [];

                const map = new Map<string, DeckWithProgress>();
                for (const d of decks) {
                    map.set(d.$id || d.id, d);
                }
                for (const d of customDecks) {
                    map.set(d.$id || d.id, d);
                }

                return Array.from(map.values()).map((d) =>
                    activeSet.has(d.$id) || activeSet.has(d.id) || d.is_active
                        ? updateDeckActiveState(d, true)
                        : d,
                );
            } catch {
                // Ignore parsing errors
            }
        }
        return decks;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedActive = localStorage.getItem(
                    'lorcana_active_deck_ids',
                );
                const activeSet = new Set(
                    storedActive ? JSON.parse(storedActive) : [],
                );

                const storedCustom = localStorage.getItem(
                    'lorcana_user_decks_store',
                );
                const customDecks: DeckWithProgress[] = storedCustom
                    ? JSON.parse(storedCustom)
                    : [];

                setLocalDecks((prevLocalDecks) => {
                    const prevMap = new Map<string, DeckWithProgress>();
                    for (const pd of prevLocalDecks) {
                        prevMap.set(pd.$id || pd.id, pd);
                    }

                    const map = new Map<string, DeckWithProgress>();
                    for (const d of decks) {
                        const prevDeck = prevMap.get(d.$id || d.id);
                        if (prevDeck) {
                            const mergedCards = d.cards.map((c) => {
                                const prevCard = prevDeck.cards.find(
                                    (pc) => pc.card.id === c.card.id,
                                );
                                const ownedQty = Math.max(
                                    c.ownedQty || 0,
                                    prevCard?.ownedQty || 0,
                                );
                                return { ...c, ownedQty };
                            });
                            map.set(d.$id || d.id, {
                                ...d,
                                cards: mergedCards,
                            });
                        } else {
                            map.set(d.$id || d.id, d);
                        }
                    }

                    for (const d of customDecks) {
                        const prevDeck = prevMap.get(d.$id || d.id);
                        if (prevDeck) {
                            const mergedCards = d.cards.map((c) => {
                                const prevCard = prevDeck.cards.find(
                                    (pc) => pc.card.id === c.card.id,
                                );
                                const ownedQty = Math.max(
                                    c.ownedQty || 0,
                                    prevCard?.ownedQty || 0,
                                );
                                return { ...c, ownedQty };
                            });
                            map.set(d.$id || d.id, {
                                ...d,
                                cards: mergedCards,
                            });
                        } else {
                            map.set(d.$id || d.id, d);
                        }
                    }

                    return Array.from(map.values()).map((d) =>
                        activeSet.has(d.$id) ||
                        activeSet.has(d.id) ||
                        d.is_active
                            ? updateDeckActiveState(d, true)
                            : d,
                    );
                });
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
            setLocalDecks((prevDecks) => {
                const next = prevDecks.map((d) => {
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
                });
                saveLocalDecksStore(next);
                return next;
            });
        },
        [saveLocalDecksStore],
    );

    const cardUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingPayloadRef = useRef<{
        deckId: string;
        userId: string;
        payload: Array<{ cardId: string; quantity: number }>;
    } | null>(null);

    const flushDeckCardsUpdate = useCallback(() => {
        if (cardUpdateTimerRef.current) {
            clearTimeout(cardUpdateTimerRef.current);
            cardUpdateTimerRef.current = null;
        }
        if (pendingPayloadRef.current) {
            const { deckId, userId, payload } = pendingPayloadRef.current;
            fetcher.submit(
                {
                    intent: 'update-deck-cards',
                    deckId,
                    userId,
                    cards: JSON.stringify(payload),
                },
                { method: 'post' },
            );
            pendingPayloadRef.current = null;
        }
    }, [fetcher]);

    const debouncedSubmitDeckCards = useCallback(
        (
            deckId: string,
            userId: string,
            payload: Array<{ cardId: string; quantity: number }>,
        ) => {
            pendingPayloadRef.current = { deckId, userId, payload };

            if (cardUpdateTimerRef.current) {
                clearTimeout(cardUpdateTimerRef.current);
            }

            cardUpdateTimerRef.current = setTimeout(() => {
                flushDeckCardsUpdate();
            }, 400);
        },
        [flushDeckCardsUpdate],
    );

    useEffect(() => {
        return () => {
            flushDeckCardsUpdate();
        };
    }, [flushDeckCardsUpdate]);

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

        setLocalDecks((prev) => {
            const next = [newDeckObj, ...prev];
            saveLocalDecksStore(next);
            return next;
        });

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

        debouncedSubmitDeckCards(deck.$id, user.$id, payload);
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

        debouncedSubmitDeckCards(deck.$id, user.$id, payload);
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

        debouncedSubmitDeckCards(undoState.deckId, user.$id, payload);

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

        debouncedSubmitDeckCards(activeDeckId, user.$id, payload);
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

    const handleQuickAdd = (cardId: string, newQuantity: number) => {
        if (!user) {
            alert('Please sign in to update your inventory.');
            return;
        }

        const clampedQuantity = Math.max(0, newQuantity);

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
                        c.card.id === cardId ? clampedQuantity : c.ownedQty;
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

        if (typeof window !== 'undefined') {
            try {
                const storedInv = localStorage.getItem(
                    'lorcana_user_inventory',
                );
                let inv: any[] = storedInv ? JSON.parse(storedInv) : [];
                inv = inv.filter(
                    (item: any) => !(item.card_id === cardId && !item.is_foil),
                );
                if (clampedQuantity > 0) {
                    inv.push({
                        $id: `inv_${Date.now()}`,
                        user_id: user.$id,
                        card_id: cardId,
                        quantity: clampedQuantity,
                        is_foil: false,
                    });
                }
                localStorage.setItem(
                    'lorcana_user_inventory',
                    JSON.stringify(inv),
                );
            } catch {
                // Ignore localStorage errors
            }
        }

        fetcher.submit(
            {
                intent: 'quick-add',
                userId: user.$id,
                cardId,
                quantity: clampedQuantity.toString(),
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
