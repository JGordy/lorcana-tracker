import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CollectionCardGrid } from '../CollectionCardGrid';
import type { Card as LorcanaCard } from '../../../../types/lorcana';

describe('CollectionCardGrid', () => {
    const mockCard: LorcanaCard = {
        id: 'card-1',
        $id: 'card-1',
        name: 'Mickey Mouse',
        set: 'The First Chapter',
        number: 1,
        ink_color: 'Amber',
        rarity: 'Common',
        image_url: 'https://example.com/mickey.png',
    } as LorcanaCard;

    beforeEach(() => {
        global.IntersectionObserver = vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        })) as any;
    });

    it('renders empty card notice when filteredCards is empty', () => {
        render(
            <MantineProvider>
                <CollectionCardGrid
                    filteredCards={[]}
                    sortedFilteredCards={[]}
                    selectedOwnership="all"
                    totals={{ totalCardsOwned: 0, uniqueCardsCount: 0 }}
                    hasActiveFilters={true}
                    handleResetFilters={vi.fn()}
                    getCardQuantity={() => 0}
                    handleAdjustQuantity={vi.fn()}
                />
            </MantineProvider>,
        );

        expect(
            screen.getByText('No cards in catalog match your current filters.'),
        ).toBeDefined();
        expect(screen.getByText('Reset All Filters')).toBeDefined();
    });

    it('renders grid of cards when filteredCards is provided', () => {
        render(
            <MantineProvider>
                <CollectionCardGrid
                    filteredCards={[mockCard]}
                    sortedFilteredCards={[mockCard]}
                    selectedOwnership="all"
                    totals={{ totalCardsOwned: 1, uniqueCardsCount: 1 }}
                    hasActiveFilters={false}
                    handleResetFilters={vi.fn()}
                    getCardQuantity={() => 1}
                    handleAdjustQuantity={vi.fn()}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('Mickey Mouse')).toBeDefined();
    });
});
