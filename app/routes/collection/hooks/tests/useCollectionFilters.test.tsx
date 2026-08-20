import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { useCollectionFilters } from '../useCollectionFilters';
import type { Card as LorcanaCard } from '../../../../types/lorcana';

describe('useCollectionFilters', () => {
    const mockCards: LorcanaCard[] = [
        {
            id: 'c1',
            $id: 'c1',
            name: 'Mickey Mouse - Brave Little Tailor',
            set: 'The First Chapter',
            number: 1,
            ink_color: 'Ruby',
            cost: 8,
            inkwell: true,
            rarity: 'Legendary',
            type: 'Character',
            classifications: ['Hero'],
            strength: 5,
            willpower: 5,
            lore: 4,
            formats: ['core'],
        } as any,
        {
            id: 'c2',
            $id: 'c2',
            name: 'Elsa - Spirit of Winter',
            set: 'The First Chapter',
            number: 2,
            ink_color: 'Amethyst',
            cost: 6,
            inkwell: false,
            rarity: 'Legendary',
            type: 'Character',
            classifications: ['Queen', 'Sorcerer'],
            strength: 4,
            willpower: 6,
            lore: 3,
            formats: ['core'],
        } as any,
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter>{children}</MemoryRouter>
    );

    it('initializes default filter state and returns all cards', () => {
        const { result } = renderHook(
            () =>
                useCollectionFilters({
                    cards: mockCards,
                    getCardQuantity: () => 0,
                }),
            { wrapper },
        );

        expect(result.current.searchQuery).toBe('');
        expect(result.current.selectedSet).toBe('All');
        expect(result.current.hasActiveFilters).toBe(false);
        expect(result.current.filteredCards).toHaveLength(2);
    });

    it('filters cards by search query', () => {
        const { result } = renderHook(
            () =>
                useCollectionFilters({
                    cards: mockCards,
                    getCardQuantity: () => 0,
                }),
            { wrapper },
        );

        act(() => {
            result.current.setSearchQuery('Mickey');
        });

        expect(result.current.hasActiveFilters).toBe(true);
        expect(result.current.filteredCards).toHaveLength(1);
        expect(result.current.filteredCards[0].name).toContain('Mickey');
    });

    it('resets all filters on handleResetFilters', () => {
        const { result } = renderHook(
            () =>
                useCollectionFilters({
                    cards: mockCards,
                    getCardQuantity: () => 0,
                }),
            { wrapper },
        );

        act(() => {
            result.current.setSearchQuery('Mickey');
            result.current.setSelectedCost('8');
        });

        expect(result.current.hasActiveFilters).toBe(true);

        act(() => {
            result.current.handleResetFilters();
        });

        expect(result.current.hasActiveFilters).toBe(false);
        expect(result.current.searchQuery).toBe('');
        expect(result.current.selectedCost).toBe('All');
    });
});
