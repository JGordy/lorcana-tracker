import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FetcherWithComponents } from 'react-router';
import type {
    Card as LorcanaCard,
    UserCollectionItemDoc,
} from '../../../types/lorcana';
import { buildCardsLookup } from '../../../utils/deck';

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
    >(() => {
        if (serverCollection && serverCollection.length > 0) {
            return serverCollection;
        }
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('lorcana_user_inventory');
                return stored ? JSON.parse(stored) : serverCollection;
            } catch {
                // Fallthrough to serverCollection
            }
        }
        return serverCollection;
    });

    useEffect(() => {
        if (serverCollection && serverCollection.length > 0) {
            setUserCollection(serverCollection);
            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    'lorcana_user_inventory',
                    JSON.stringify(serverCollection),
                );
            }
        }
    }, [serverCollection]);

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

    const handleAdjustQuantity = (
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

        const updatedCollection = userCollection.filter(
            (item) => !(item.card_id === cardId && item.is_foil === isFoil),
        );

        if (newQty > 0) {
            const existing = userCollection.find(
                (item) => item.card_id === cardId && item.is_foil === isFoil,
            );
            updatedCollection.push({
                $id: existing?.$id || `inv-${Date.now()}`,
                user_id: user.$id,
                card_id: cardId,
                quantity: newQty,
                is_foil: isFoil,
            });
        }

        setUserCollection(updatedCollection);
        if (typeof window !== 'undefined') {
            localStorage.setItem(
                'lorcana_user_inventory',
                JSON.stringify(updatedCollection),
            );
        }

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
    };

    const totals = useMemo(() => {
        let totalCardsOwned = 0;
        const uniqueCardsOwned = new Set<string>();

        const localQuantities = new Map<string, number>();
        for (const item of userCollection) {
            localQuantities.set(
                `${item.card_id}_${item.is_foil ? 'foil' : 'normal'}`,
                item.quantity,
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
            localQuantities.set(
                `${cardId}_${isFoil ? 'foil' : 'normal'}`,
                quantity,
            );
        }

        for (const [key, qty] of localQuantities.entries()) {
            if (qty > 0) {
                totalCardsOwned += qty;
                const cardId = key.substring(0, key.lastIndexOf('_'));
                uniqueCardsOwned.add(cardId);
            }
        }

        return {
            totalCardsOwned,
            uniqueCardsCount: uniqueCardsOwned.size,
        };
    }, [userCollection, fetcher.formData]);

    return {
        userCollection,
        setUserCollection,
        inventoryMap,
        getCardQuantity,
        handleAdjustQuantity,
        totals,
    };
}
