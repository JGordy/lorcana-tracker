import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CollectionFiltersSidebar } from '../CollectionFiltersSidebar';

describe('CollectionFiltersSidebar', () => {
    const defaultProps = {
        selectedOwnership: 'all',
        setSelectedOwnership: vi.fn(),
        selectedSet: 'All',
        setSelectedSet: vi.fn(),
        sets: ['All', 'The First Chapter'],
        selectedRarity: 'All',
        setSelectedRarity: vi.fn(),
        selectedCost: 'All',
        setSelectedCost: vi.fn(),
        selectedInkable: 'All',
        setSelectedInkable: vi.fn(),
        selectedFormat: 'All',
        setSelectedFormat: vi.fn(),
        selectedType: 'All',
        setSelectedType: vi.fn(),
        selectedClassification: 'All',
        setSelectedClassification: vi.fn(),
        allClassifications: ['Hero'],
        selectedFranchise: 'All',
        setSelectedFranchise: vi.fn(),
        allFranchises: ['Aladdin'],
        selectedAttack: 'All',
        setSelectedAttack: vi.fn(),
        selectedDefense: 'All',
        setSelectedDefense: vi.fn(),
        selectedLore: 'All',
        setSelectedLore: vi.fn(),
        selectedSort: 'default',
        setSelectedSort: vi.fn(),
        selectedPriceRange: 'All',
        setSelectedPriceRange: vi.fn(),
        hasActiveFilters: false,
        handleResetFilters: vi.fn(),
    };

    it('renders sidebar labels correctly', () => {
        render(
            <MantineProvider>
                <CollectionFiltersSidebar {...defaultProps} />
            </MantineProvider>,
        );

        expect(screen.getByText('Filters')).toBeDefined();
        expect(screen.getByText('Ownership')).toBeDefined();
        expect(screen.getByText('Card Set')).toBeDefined();
        expect(screen.getByText('Sort Order')).toBeDefined();
        expect(screen.getByText('Market Price Range')).toBeDefined();
    });

    it('renders Reset All button when active filters exist and triggers handleResetFilters', () => {
        render(
            <MantineProvider>
                <CollectionFiltersSidebar
                    {...defaultProps}
                    hasActiveFilters={true}
                />
            </MantineProvider>,
        );

        const resetButton = screen.getByText('Reset All');
        expect(resetButton).toBeDefined();

        fireEvent.click(resetButton);
        expect(defaultProps.handleResetFilters).toHaveBeenCalled();
    });

    it('enriches set options with completion percentages', () => {
        const setProgressMap = new Map([
            [
                'The First Chapter',
                {
                    setName: 'The First Chapter',
                    setIndex: 1,
                    totalCardsInSet: 204,
                    uniqueCardsOwned: 102,
                    totalCardsOwned: 130,
                    standardCardsOwned: 120,
                    foilCardsOwned: 10,
                    completionPercentage: 50,
                    marketValue: 120.0,
                },
            ],
        ]);

        render(
            <MantineProvider>
                <CollectionFiltersSidebar
                    {...defaultProps}
                    selectedSet="The First Chapter"
                    setProgressMap={setProgressMap}
                />
            </MantineProvider>,
        );

        // Mantine Select displays input with value of selected option
        const setInput = screen.getByDisplayValue('The First Chapter (50%)');
        expect(setInput).toBeInTheDocument();
    });

    it('renders in drawer mode without outer card Paper wrapper', () => {
        const { container } = render(
            <MantineProvider>
                <CollectionFiltersSidebar {...defaultProps} variant="drawer" />
            </MantineProvider>,
        );

        expect(container.querySelector('.filters-sidebar')).toBeNull();
        expect(screen.getByText('Card Set')).toBeInTheDocument();
        expect(screen.getByText('Rarity')).toBeInTheDocument();
    });
});
