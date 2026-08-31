import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { FetcherWithComponents } from 'react-router';
import type {
    Card as LorcanaCard,
    UserCollectionItemDoc,
} from '../../../types/lorcana';
import { buildCardsLookup } from '../../../utils/deck';

import {
    calculateCollectionValuation,
    type CollectionValuationResult,
} from '../../../utils/valuation';

export interface UseCollectionInventoryOptions {
    serverCollection: UserCollectionItemDoc[];
    user: { $id: string } | null;
    fetcher: FetcherWithComponents<any>;
    cardsLookup: ReturnType<typeof buildCardsLookup<LorcanaCard>>;
}

export function useCollectionInventory({
    serverCollection,
    user,
    fetcher,
    cardsLookup,
}: UseCollectionInventoryOptions) {
    const [userCollection, setUserCollection] = useState<
        UserCollectionItemDoc[]
    >(serverCollection || []);

    const prevCollectionRef = useRef<UserCollectionItemDoc[]>(userCollection);

    useEffect(() => {
        if (serverCollection && serverCollection.length > 0) {
            setUserCollection(serverCollection);
            prevCollectionRef.current = serverCollection;
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(
                        'lorcana_user_inventory',
                        JSON.stringify(serverCollection),
                    );
                } catch {
                    // Ignore storage errors
                }
            }
        }
    }, [serverCollection]);

    // Rollback to previous collection if server update fails
    useEffect(() => {
        if (fetcher.data && fetcher.data.success === false) {
            console.error('Server failed to update collection. Rolling back.');
            if (prevCollectionRef.current) {
                setUserCollection(prevCollectionRef.current);
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(
                            'lorcana_user_inventory',
                            JSON.stringify(prevCollectionRef.current),
                        );
                    } catch {
                        // Ignore storage errors
                    }
                }
            }
        }
    }, [fetcher.data]);

    useEffect(() => {
        if (
            (!serverCollection || serverCollection.length === 0) &&
            typeof window !== 'undefined'
        ) {
            try {
                const stored = localStorage.getItem('lorcana_user_inventory');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setUserCollection(parsed);
                        prevCollectionRef.current = parsed;
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const inventoryMap = useMemo(() => {
        const map = new Map<string, number>();
        for (const item of userCollection) {
            const foilSuffix = item.is_foil ? 'foil' : 'normal';
            const resolvedCard = cardsLookup.get(item.card_id);
            const canonicalId = resolvedCard ? resolvedCard.id : item.card_id;

            map.set(`${item.card_id}_${foilSuffix}`, item.quantity);
            if (canonicalId !== item.card_id) {
                map.set(`${canonicalId}_${foilSuffix}`, item.quantity);
            }
        }

        if (
            fetcher.formData &&
            fetcher.formData.get('intent') === 'update-quantity'
        ) {
            const cardId = fetcher.formData.get('cardId') as string;
            const isFoil = fetcher.formData.get('isFoil') === 'true';
            const quantity = parseInt(
                fetcher.formData.get('quantity') as string,
                10,
            );
            const foilSuffix = isFoil ? 'foil' : 'normal';
            const resolvedCard = cardsLookup.get(cardId);
            const canonicalId = resolvedCard ? resolvedCard.id : cardId;

            map.set(`${cardId}_${foilSuffix}`, quantity);
            if (canonicalId !== cardId) {
                map.set(`${canonicalId}_${foilSuffix}`, quantity);
            }
        }

        return map;
    }, [userCollection, fetcher.formData, cardsLookup]);

    const getCardQuantity = useCallback(
        (card: LorcanaCard, isFoil: boolean): number => {
            const foilSuffix = isFoil ? 'foil' : 'normal';
            const cardId = card.id || card.$id;
            if (!cardId) return 0;

            return (
                inventoryMap.get(`${cardId}_${foilSuffix}`) ||
                (card.$id
                    ? inventoryMap.get(`${card.$id}_${foilSuffix}`)
                    : 0) ||
                0
            );
        },
        [inventoryMap],
    );

    const handleAdjustQuantity = useCallback(
        (
            cardId: string,
            isFoil: boolean,
            currentQty: number,
            change: number,
        ) => {
            if (!user) {
                alert(
                    'Please sign in with a demo session to add cards to your collection.',
                );
                return;
            }
            const newQty = Math.max(0, currentQty + change);

            setUserCollection((prev) => {
                prevCollectionRef.current = prev;
                const next = prev.filter(
                    (item) =>
                        !(item.card_id === cardId && item.is_foil === isFoil),
                );

                if (newQty > 0) {
                    const existing = prev.find(
                        (item) =>
                            item.card_id === cardId && item.is_foil === isFoil,
                    );
                    next.push({
                        $id: existing?.$id || `inv-${Date.now()}`,
                        user_id: user.$id,
                        card_id: cardId,
                        quantity: newQty,
                        is_foil: isFoil,
                    });
                }

                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(
                            'lorcana_user_inventory',
                            JSON.stringify(next),
                        );
                    } catch {
                        // Ignore storage errors
                    }
                }

                return next;
            });

            fetcher.submit(
                {
                    intent: 'update-quantity',
                    userId: user.$id,
                    cardId,
                    quantity: newQty.toString(),
                    isFoil: isFoil.toString(),
                },
                { method: 'post' },
            );
        },
        [user, fetcher],
    );

    // Construct active inventory accounting for optimistic fetcher updates
    const activeCollectionItems = useMemo(() => {
        const itemsMap = new Map<
            string,
            { card_id: string; is_foil: boolean; quantity: number }
        >();

        for (const item of userCollection) {
            itemsMap.set(
                `${item.card_id}_${item.is_foil ? 'foil' : 'normal'}`,
                {
                    card_id: item.card_id,
                    is_foil: item.is_foil,
                    quantity: item.quantity,
                },
            );
        }

        if (
            fetcher.formData &&
            fetcher.formData.get('intent') === 'update-quantity'
        ) {
            const cardId = fetcher.formData.get('cardId') as string;
            const isFoil = fetcher.formData.get('isFoil') === 'true';
            const quantity = parseInt(
                fetcher.formData.get('quantity') as string,
                10,
            );
            const key = `${cardId}_${isFoil ? 'foil' : 'normal'}`;

            if (quantity > 0) {
                itemsMap.set(key, {
                    card_id: cardId,
                    is_foil: isFoil,
                    quantity,
                });
            } else {
                itemsMap.delete(key);
            }
        }

        return Array.from(itemsMap.values()).map((it) => ({
            user_id: user?.$id || '',
            card_id: it.card_id,
            is_foil: it.is_foil,
            quantity: it.quantity,
        }));
    }, [userCollection, fetcher.formData, user]);

    const valuation: CollectionValuationResult = useMemo(() => {
        return calculateCollectionValuation(activeCollectionItems, cardsLookup);
    }, [activeCollectionItems, cardsLookup]);

    const totals = useMemo(() => {
        return {
            totalCardsOwned: valuation.totalOwnedCount,
            uniqueCardsCount: valuation.uniqueOwnedCount,
        };
    }, [valuation.totalOwnedCount, valuation.uniqueOwnedCount]);

    return {
        userCollection,
        setUserCollection,
        inventoryMap,
        getCardQuantity,
        handleAdjustQuantity,
        totals,
        valuation,
    };
}
