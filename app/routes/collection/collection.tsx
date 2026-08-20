import { useFetcher } from 'react-router';
import { useMemo } from 'react';
import { Container, Grid } from '@mantine/core';

import { buildCardsLookup } from '../../utils/deck';

import { useCollectionInventory } from './hooks/useCollectionInventory';
import { useCollectionFilters } from './hooks/useCollectionFilters';
import { CollectionHeader } from './components/CollectionHeader';
import { CollectionFiltersSidebar } from './components/CollectionFiltersSidebar';
import { CollectionTopFilterBar } from './components/CollectionTopFilterBar';
import { CollectionCardGrid } from './components/CollectionCardGrid';
import type { Route } from './+types/collection';

export { loader } from './loader';
export { action } from './action';

export default function Collection({ loaderData }: Route.ComponentProps) {
    const { cards, userCollection: serverCollection, user } = loaderData;
    const fetcher = useFetcher();

    const cardsLookup = useMemo(() => buildCardsLookup(cards), [cards]);

    const { getCardQuantity, handleAdjustQuantity, totals } =
        useCollectionInventory({
            serverCollection,
            user,
            fetcher,
            cardsLookup,
        });

    const {
        selectedOwnership,
        setSelectedOwnership,
        searchQuery,
        setSearchQuery,
        selectedInks,
        setSelectedInks,
        hasActiveFilters,
        handleResetFilters,
        filteredCards,
        sortedFilteredCards,
        filterResetKey,
        ...sidebarFilterProps
    } = useCollectionFilters({
        cards,
        getCardQuantity,
    });

    return (
        <Container size="xl" py="xl">
            {/* Banner Dashboard Header */}
            <CollectionHeader
                totals={totals}
                totalCatalogCards={cards.length}
            />

            {/* Workspace Layout */}
            <Grid gap="md">
                {/* Left Panel: Filters */}
                <Grid.Col span={{ base: 12, md: 3 }}>
                    <CollectionFiltersSidebar
                        selectedOwnership={selectedOwnership}
                        setSelectedOwnership={setSelectedOwnership}
                        hasActiveFilters={hasActiveFilters}
                        handleResetFilters={handleResetFilters}
                        {...sidebarFilterProps}
                    />
                </Grid.Col>

                {/* Right Panel: Cards Grid & Sticky Top Bar */}
                <Grid.Col span={{ base: 12, md: 9 }}>
                    <CollectionTopFilterBar
                        selectedOwnership={selectedOwnership}
                        setSelectedOwnership={setSelectedOwnership}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedInks={selectedInks}
                        setSelectedInks={setSelectedInks}
                    />

                    <CollectionCardGrid
                        filteredCards={filteredCards}
                        sortedFilteredCards={sortedFilteredCards}
                        selectedOwnership={selectedOwnership}
                        totals={totals}
                        hasActiveFilters={hasActiveFilters}
                        handleResetFilters={handleResetFilters}
                        getCardQuantity={getCardQuantity}
                        handleAdjustQuantity={handleAdjustQuantity}
                        filterResetKey={filterResetKey}
                    />
                </Grid.Col>
            </Grid>
        </Container>
    );
}
