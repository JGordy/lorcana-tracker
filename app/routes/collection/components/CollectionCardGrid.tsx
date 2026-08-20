import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, Stack, Text, Button, SimpleGrid } from '@mantine/core';
import type { Card as LorcanaCard } from '../../../types/lorcana';
import { CollectionCardItem } from './CollectionCardItem';

export interface CollectionCardGridProps {
    filteredCards: LorcanaCard[];
    sortedFilteredCards: LorcanaCard[];
    selectedOwnership: string;
    totals: {
        totalCardsOwned: number;
        uniqueCardsCount: number;
    };
    hasActiveFilters: boolean;
    handleResetFilters: () => void;
    getCardQuantity: (card: LorcanaCard, isFoil: boolean) => number;
    handleAdjustQuantity: (
        cardId: string,
        isFoil: boolean,
        currentQty: number,
        change: number,
    ) => void;
    filterResetKey?: string;
}

export function CollectionCardGrid({
    filteredCards,
    sortedFilteredCards,
    selectedOwnership,
    totals,
    hasActiveFilters,
    handleResetFilters,
    getCardQuantity,
    handleAdjustQuantity,
    filterResetKey,
}: CollectionCardGridProps) {
    const [visibleCount, setVisibleCount] = useState(48);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Reset infinite scroll pagination when active filters change
    useEffect(() => {
        setVisibleCount(48);
    }, [filterResetKey]);

    useEffect(() => {
        if (visibleCount >= filteredCards.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) =>
                        Math.min(prev + 48, filteredCards.length),
                    );
                }
            },
            { rootMargin: '300px', threshold: 0.1 },
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [filteredCards.length, visibleCount]);

    const slicedCards = useMemo(
        () => sortedFilteredCards.slice(0, visibleCount),
        [sortedFilteredCards, visibleCount],
    );

    if (filteredCards.length === 0) {
        return (
            <Card
                padding="xl"
                radius="md"
                withBorder
                bg="dark.8"
                style={{
                    textAlign: 'center',
                    borderStyle: 'dashed',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
            >
                <Stack align="center" gap="sm" py="md">
                    <Text c="gray.3" fw={700} size="md">
                        {selectedOwnership === 'owned'
                            ? 'No owned cards match your current filters.'
                            : selectedOwnership === 'missing'
                              ? 'No unowned cards match your current filters.'
                              : 'No cards in catalog match your current filters.'}
                    </Text>
                    {selectedOwnership === 'owned' &&
                    totals.uniqueCardsCount === 0 ? (
                        <Text c="dimmed" size="xs" maw={420}>
                            You haven't added any cards to your inventory yet.
                            Switch to "All Cards" or adjust your filters to
                            start adding cards!
                        </Text>
                    ) : null}
                    {hasActiveFilters && (
                        <Button
                            variant="light"
                            color="violet"
                            size="xs"
                            radius="md"
                            onClick={handleResetFilters}
                        >
                            Reset All Filters
                        </Button>
                    )}
                </Stack>
            </Card>
        );
    }

    return (
        <>
            <SimpleGrid
                cols={{
                    base: 2,
                    xs: 2,
                    sm: 3,
                    md: 3,
                    lg: 4,
                    xl: 4,
                }}
                spacing="md"
            >
                {slicedCards.map((card) => (
                    <CollectionCardItem
                        key={card.$id}
                        card={card}
                        getCardQuantity={getCardQuantity}
                        handleAdjustQuantity={handleAdjustQuantity}
                    />
                ))}
            </SimpleGrid>

            {visibleCount < filteredCards.length && (
                <div
                    ref={sentinelRef}
                    data-testid="infinite-scroll-sentinel"
                    style={{ height: 20, margin: '20px 0' }}
                />
            )}
        </>
    );
}
