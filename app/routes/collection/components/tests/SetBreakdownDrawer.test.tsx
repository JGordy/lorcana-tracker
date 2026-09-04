import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { SetBreakdownDrawer } from '../SetBreakdownDrawer';
import type { SetProgressStats } from '../../../../utils/setCompletion';

const mockSetProgressStats: SetProgressStats[] = [
    {
        setName: 'The First Chapter',
        setIndex: 1,
        totalCardsInSet: 204,
        uniqueCardsOwned: 102,
        totalCardsOwned: 150,
        standardCardsOwned: 130,
        foilCardsOwned: 20,
        completionPercentage: 50,
        marketValue: 245.5,
    },
    {
        setName: 'Rise of the Floodborn',
        setIndex: 2,
        totalCardsInSet: 204,
        uniqueCardsOwned: 204,
        totalCardsOwned: 300,
        standardCardsOwned: 270,
        foilCardsOwned: 30,
        completionPercentage: 100,
        marketValue: 480.0,
    },
    {
        setName: 'Promo Set 1',
        setIndex: undefined,
        totalCardsInSet: 15,
        uniqueCardsOwned: 0,
        totalCardsOwned: 0,
        standardCardsOwned: 0,
        foilCardsOwned: 0,
        completionPercentage: 0,
        marketValue: 0.0,
    },
];

describe('SetBreakdownDrawer', () => {
    const defaultProps = {
        opened: true,
        onClose: vi.fn(),
        setProgressStats: mockSetProgressStats,
        selectedSet: 'All',
        onSelectSet: vi.fn(),
    };

    it('renders drawer header, total sets count, and set cards', () => {
        render(
            <MantineProvider>
                <SetBreakdownDrawer {...defaultProps} />
            </MantineProvider>,
        );

        expect(screen.getByText('Set Progress Breakdown')).toBeInTheDocument();
        expect(screen.getByText('3 Sets')).toBeInTheDocument();
        expect(screen.getByText('The First Chapter')).toBeInTheDocument();
        expect(screen.getByText('Rise of the Floodborn')).toBeInTheDocument();
        expect(screen.getByText('Promo Set 1')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('filters set cards based on search input', () => {
        render(
            <MantineProvider>
                <SetBreakdownDrawer {...defaultProps} />
            </MantineProvider>,
        );

        const searchInput = screen.getByPlaceholderText('Search sets...');
        fireEvent.change(searchInput, { target: { value: 'Floodborn' } });

        expect(screen.getByText('Rise of the Floodborn')).toBeInTheDocument();
        expect(screen.queryByText('The First Chapter')).not.toBeInTheDocument();
    });

    it('calls onSelectSet and onClose when clicking Filter Set button', () => {
        const onSelectSet = vi.fn();
        const onClose = vi.fn();

        render(
            <MantineProvider>
                <SetBreakdownDrawer
                    {...defaultProps}
                    onSelectSet={onSelectSet}
                    onClose={onClose}
                />
            </MantineProvider>,
        );

        const filterButtons = screen.getAllByRole('button', {
            name: /filter set/i,
        });
        fireEvent.click(filterButtons[0]);

        expect(onSelectSet).toHaveBeenCalledWith('The First Chapter');
        expect(onClose).toHaveBeenCalled();
    });

    it('shows Active Filter badge for already selected set', () => {
        render(
            <MantineProvider>
                <SetBreakdownDrawer
                    {...defaultProps}
                    selectedSet="The First Chapter"
                />
            </MantineProvider>,
        );

        expect(screen.getByText('Active Filter')).toBeInTheDocument();
    });
});
