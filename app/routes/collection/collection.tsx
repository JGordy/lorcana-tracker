import { useFetcher, type ShouldRevalidateFunctionArgs } from 'react-router';
import { useMemo, useState } from 'react';
import { Container, Grid } from '@mantine/core';

import { buildCardsLookup } from '../../utils/deck';
import {
    calculateSetProgress,
    getSetProgressMap,
} from '../../utils/setCompletion';

import { useCollectionInventory } from './hooks/useCollectionInventory';
import { useCollectionFilters } from './hooks/useCollectionFilters';
import { CollectionHeader } from './components/CollectionHeader';
import { CollectionFiltersSidebar } from './components/CollectionFiltersSidebar';
import { CollectionTopFilterBar } from './components/CollectionTopFilterBar';
import { CollectionCardGrid } from './components/CollectionCardGrid';
import type { Route } from './+types/collection';

export { loader } from './loader';
export { action } from './action';

export function shouldRevalidate({
    formData,
    defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
    if (formData?.get('intent') === 'update-quantity') {
        return false;
    }
    return defaultShouldRevalidate;
}

export default function Collection({ loaderData }: Route.ComponentProps) {
    const { cards, userCollection: serverCollection, user } = loaderData;
    const fetcher = useFetcher();
    const [setBreakdownOpened, setSetBreakdownOpened] = useState(false);

    const cardsLookup = useMemo(() => buildCardsLookup(cards), [cards]);

    const {
        userCollection,
        getCardQuantity,
        handleAdjustQuantity,
        totals,
        valuation,
    } = useCollectionInventory({
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

    const setProgressStats = useMemo(() => {
        return calculateSetProgress(cards, userCollection, cardsLookup);
    }, [cards, userCollection, cardsLookup]);

    const setProgressMap = useMemo(() => {
        return getSetProgressMap(setProgressStats);
    }, [setProgressStats]);

    const selectedSet = sidebarFilterProps.selectedSet;
    const setSelectedSet = sidebarFilterProps.setSelectedSet;
    const selectedSetStats = useMemo(() => {
        if (!selectedSet || selectedSet === 'All') return null;
        return setProgressMap.get(selectedSet) || null;
    }, [selectedSet, setProgressMap]);

    return (
        <Container size="xl" py="lg">
            {/* Banner Dashboard Header */}
            <CollectionHeader
                totals={totals}
                valuation={valuation}
                totalCatalogCards={cards.length}
                selectedSet={selectedSet}
                selectedSetStats={selectedSetStats}
                setProgressStats={setProgressStats}
                onSelectSet={setSelectedSet}
                setBreakdownOpened={setBreakdownOpened}
                onOpenSetBreakdown={() => setSetBreakdownOpened(true)}
                onCloseSetBreakdown={() => setSetBreakdownOpened(false)}
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
                        setProgressMap={setProgressMap}
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
                        selectedSetStats={selectedSetStats}
                        onClearSet={() => setSelectedSet('All')}
                        onOpenSetBreakdown={() => setSetBreakdownOpened(true)}
                        onResetAll={handleResetFilters}
                        {...sidebarFilterProps}
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
