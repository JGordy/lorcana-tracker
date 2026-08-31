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
});
