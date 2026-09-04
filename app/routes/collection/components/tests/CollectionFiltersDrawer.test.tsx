import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CollectionFiltersDrawer } from '../CollectionFiltersDrawer';

describe('CollectionFiltersDrawer', () => {
    const defaultProps = {
        opened: true,
        onClose: vi.fn(),
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
        totalFilteredCards: 42,
    };

    it('renders drawer header and filter options when opened', () => {
        render(
            <MantineProvider>
                <CollectionFiltersDrawer {...defaultProps} />
            </MantineProvider>,
        );

        // Header
        expect(screen.getByText('Filters')).toBeInTheDocument();

        // Filter sections from inner sidebar
        expect(screen.getByText('Card Set')).toBeInTheDocument();
        expect(screen.getByText('Rarity')).toBeInTheDocument();
        expect(screen.getByText('Ink Cost')).toBeInTheDocument();

        // Footer Apply button with count
        const applyBtn = screen.getByRole('button', {
            name: /Apply Filters \(42 cards\)/i,
        });
        expect(applyBtn).toBeInTheDocument();
    });

    it('triggers onClose when clicking Apply Filters button', () => {
        const onClose = vi.fn();
        render(
            <MantineProvider>
                <CollectionFiltersDrawer {...defaultProps} onClose={onClose} />
            </MantineProvider>,
        );

        const applyBtn = screen.getByRole('button', {
            name: /Apply Filters/i,
        });
        fireEvent.click(applyBtn);

        expect(onClose).toHaveBeenCalled();
    });

    it('renders Reset All button in header when hasActiveFilters is true', () => {
        const handleResetFilters = vi.fn();
        render(
            <MantineProvider>
                <CollectionFiltersDrawer
                    {...defaultProps}
                    hasActiveFilters={true}
                    handleResetFilters={handleResetFilters}
                />
            </MantineProvider>,
        );

        const resetBtn = screen.getByRole('button', {
            name: /Reset All/i,
        });
        expect(resetBtn).toBeInTheDocument();

        fireEvent.click(resetBtn);
        expect(handleResetFilters).toHaveBeenCalled();
    });

    it('does not display content when opened is false', () => {
        render(
            <MantineProvider>
                <CollectionFiltersDrawer {...defaultProps} opened={false} />
            </MantineProvider>,
        );

        expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    });

    it('renders 0 cards label in Apply Filters button when totalFilteredCards is 0', () => {
        render(
            <MantineProvider>
                <CollectionFiltersDrawer
                    {...defaultProps}
                    totalFilteredCards={0}
                />
            </MantineProvider>,
        );

        expect(
            screen.getByRole('button', {
                name: /Apply Filters \(0 cards\)/i,
            }),
        ).toBeInTheDocument();
    });
});
