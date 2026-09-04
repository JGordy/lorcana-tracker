import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CollectionTopFilterBar } from '../CollectionTopFilterBar';

describe('CollectionTopFilterBar', () => {
    const defaultProps = {
        selectedOwnership: 'all',
        setSelectedOwnership: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        selectedInks: [],
        setSelectedInks: vi.fn(),
    };

    it('renders search input and ink icons', () => {
        render(
            <MantineProvider>
                <CollectionTopFilterBar {...defaultProps} />
            </MantineProvider>,
        );

        const searchInput = screen.getByPlaceholderText(
            'Search cards catalog...',
        );
        expect(searchInput).toBeDefined();

        const amberInk = screen.getByAltText('Amber');
        expect(amberInk).toBeDefined();
    });

    it('calls setSearchQuery on text change', () => {
        render(
            <MantineProvider>
                <CollectionTopFilterBar {...defaultProps} />
            </MantineProvider>,
        );

        const searchInput = screen.getByPlaceholderText(
            'Search cards catalog...',
        );
        fireEvent.change(searchInput, { target: { value: 'Mickey' } });
        expect(defaultProps.setSearchQuery).toHaveBeenCalledWith('Mickey');
    });

    it('renders sort selector and handles sort change', () => {
        const setSelectedSort = vi.fn();
        render(
            <MantineProvider>
                <CollectionTopFilterBar
                    {...defaultProps}
                    selectedSort="price_desc"
                    setSelectedSort={setSelectedSort}
                />
            </MantineProvider>,
        );

        const sortInput = screen.getByDisplayValue('Sort: Price (High to Low)');
        expect(sortInput).toBeInTheDocument();
    });

    it('renders active set chip in filter strip and handles clear set click', () => {
        const onClearSet = vi.fn();
        const onOpenSetBreakdown = vi.fn();
        const mockSetStats = {
            setName: 'Rise of the Floodborn',
            setIndex: 2,
            totalCardsInSet: 204,
            uniqueCardsOwned: 100,
            totalCardsOwned: 150,
            standardCardsOwned: 130,
            foilCardsOwned: 20,
            completionPercentage: 49,
            marketValue: 200,
        };

        render(
            <MantineProvider>
                <CollectionTopFilterBar
                    {...defaultProps}
                    selectedSet="Rise of the Floodborn"
                    selectedSetStats={mockSetStats}
                    onClearSet={onClearSet}
                    onOpenSetBreakdown={onOpenSetBreakdown}
                />
            </MantineProvider>,
        );

        const setChip = screen.getByText(/Rise of the Floodborn \(49%\)/i);
        expect(setChip).toBeInTheDocument();

        // Clicking the chip calls onOpenSetBreakdown
        fireEvent.click(setChip);
        expect(onOpenSetBreakdown).toHaveBeenCalled();

        // Clicking the dismiss X button clears set
        const clearBtn = screen.getByTitle(
            'Remove Rise of the Floodborn (49%) filter',
        );
        fireEvent.click(clearBtn);
        expect(onClearSet).toHaveBeenCalled();
    });

    it('renders multiple active filter chips and handles individual removal and reset all', () => {
        const setSelectedRarity = vi.fn();
        const setSelectedCost = vi.fn();
        const onResetAll = vi.fn();

        render(
            <MantineProvider>
                <CollectionTopFilterBar
                    {...defaultProps}
                    selectedOwnership="owned"
                    searchQuery="Mickey"
                    selectedInks={['Amber', 'Steel']}
                    selectedRarity="Legendary"
                    setSelectedRarity={setSelectedRarity}
                    selectedCost="5"
                    setSelectedCost={setSelectedCost}
                    onResetAll={onResetAll}
                />
            </MantineProvider>,
        );

        // Active chips should be rendered
        expect(screen.getByText('"Mickey"')).toBeInTheDocument();
        expect(screen.getByText('Status: Owned')).toBeInTheDocument();
        expect(screen.getByText('Ink: Amber')).toBeInTheDocument();
        expect(screen.getByText('Ink: Steel')).toBeInTheDocument();
        expect(screen.getByText('Rarity: Legendary')).toBeInTheDocument();
        expect(screen.getByText('Cost: 5')).toBeInTheDocument();

        // Remove a single chip (Rarity)
        const removeRarityBtn = screen.getByTitle(
            'Remove Rarity: Legendary filter',
        );
        fireEvent.click(removeRarityBtn);
        expect(setSelectedRarity).toHaveBeenCalledWith('All');

        // Reset All button
        const resetAllBtn = screen.getByRole('button', { name: /Reset All/i });
        expect(resetAllBtn).toBeInTheDocument();
        fireEvent.click(resetAllBtn);
        expect(onResetAll).toHaveBeenCalled();
    });

    it('handles horizontal scroll navigation with chevrons when overflowing', () => {
        const scrollByMock = vi.fn();
        window.HTMLElement.prototype.scrollBy = scrollByMock;

        const { container } = render(
            <MantineProvider>
                <CollectionTopFilterBar
                    {...defaultProps}
                    selectedOwnership="owned"
                    searchQuery="Mickey"
                    selectedInks={['Amber', 'Steel']}
                    selectedRarity="Legendary"
                />
            </MantineProvider>,
        );

        // Find scroll container
        const scrollContainer = container.querySelector(
            '.mantine-Badge-root',
        )?.parentElement;
        expect(scrollContainer).toBeDefined();

        if (scrollContainer) {
            // Mock overflow dimensions
            Object.defineProperty(scrollContainer, 'scrollWidth', {
                configurable: true,
                value: 600,
            });
            Object.defineProperty(scrollContainer, 'clientWidth', {
                configurable: true,
                value: 200,
            });
            Object.defineProperty(scrollContainer, 'scrollLeft', {
                configurable: true,
                value: 50,
            });

            fireEvent.scroll(scrollContainer);
        }

        // Left and Right chevrons should appear
        const leftChevron = screen.getByTitle('Scroll filters left');
        const rightChevron = screen.getByTitle('Scroll filters right');
        expect(leftChevron).toBeInTheDocument();
        expect(rightChevron).toBeInTheDocument();

        fireEvent.click(leftChevron);
        expect(scrollByMock).toHaveBeenCalledWith({
            left: -160,
            behavior: 'smooth',
        });

        fireEvent.click(rightChevron);
        expect(scrollByMock).toHaveBeenCalledWith({
            left: 160,
            behavior: 'smooth',
        });
    });
});
