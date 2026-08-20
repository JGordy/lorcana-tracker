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
});
