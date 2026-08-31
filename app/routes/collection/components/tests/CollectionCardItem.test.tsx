import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CollectionCardItem } from '../CollectionCardItem';
import type { Card as LorcanaCard } from '../../../../types/lorcana';

describe('CollectionCardItem', () => {
    const mockCard: LorcanaCard = {
        id: 'card-123',
        $id: 'card-123',
        name: 'Stitch - Rock Star',
        set: 'The First Chapter',
        number: 23,
        ink_color: 'Amber',
        rarity: 'Super Rare',
        image_url: 'https://example.com/stitch.png',
    } as LorcanaCard;

    const mockGetCardQuantity = vi.fn().mockImplementation((card, isFoil) => {
        return isFoil ? 1 : 3;
    });

    const mockHandleAdjustQuantity = vi.fn();

    it('renders card title, set, and quantities', () => {
        render(
            <MantineProvider>
                <CollectionCardItem
                    card={mockCard}
                    getCardQuantity={mockGetCardQuantity}
                    handleAdjustQuantity={mockHandleAdjustQuantity}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('Stitch - Rock Star')).toBeDefined();
        expect(screen.getByText('The First Chapter • #23')).toBeDefined();
        expect(screen.getByText('3')).toBeDefined();
        expect(screen.getByText('1')).toBeDefined();
    });

    it('triggers handleAdjustQuantity when counter buttons are clicked', () => {
        render(
            <MantineProvider>
                <CollectionCardItem
                    card={mockCard}
                    getCardQuantity={mockGetCardQuantity}
                    handleAdjustQuantity={mockHandleAdjustQuantity}
                />
            </MantineProvider>,
        );

        const actionButtons = screen.getAllByRole('button');
        fireEvent.click(actionButtons[0]);
        expect(mockHandleAdjustQuantity).toHaveBeenCalledWith(
            'card-123',
            false,
            3,
            -1,
        );
    });

    it('renders market prices and tcgplayer external link when pricing is present', () => {
        const pricedCard = {
            ...mockCard,
            prices: { usd: 4.5, usd_foil: 12.0 },
            tcgplayer_url: 'https://tcgplayer.com/product/12345',
        };

        render(
            <MantineProvider>
                <CollectionCardItem
                    card={pricedCard as any}
                    getCardQuantity={mockGetCardQuantity}
                    handleAdjustQuantity={mockHandleAdjustQuantity}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('$4.50')).toBeInTheDocument();
        expect(screen.getByText('$12.00')).toBeInTheDocument();
        expect(screen.getByLabelText('View on TCGPlayer')).toHaveAttribute(
            'href',
            'https://tcgplayer.com/product/12345',
        );
    });
});
