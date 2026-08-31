import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CrownJewelsDrawer } from '../CrownJewelsDrawer';
import type { TopGemItem } from '../../../../utils/valuation';
import type { Card as LorcanaCard } from '../../../../types/lorcana';

describe('CrownJewelsDrawer', () => {
    afterEach(cleanup);
    const mockOnClose = vi.fn();

    const mockTopGems: TopGemItem[] = [
        {
            card: {
                id: 'elsa-spirit-winter',
                name: 'Elsa - Spirit of Winter',
                set: 'The First Chapter',
                number: 205,
                ink_color: 'Amethyst',
                rarity: 'Enchanted',
                cost: 8,
                image_url: 'https://example.com/elsa.jpg',
                prices: { usd: null, usd_foil: 450.0 },
                tcgplayer_url: 'https://tcgplayer.com/elsa',
            } as LorcanaCard,
            isFoil: true,
            unitPrice: 450.0,
            quantity: 2,
            totalValue: 900.0,
        },
        {
            card: {
                id: 'stitch-rock-star',
                name: 'Stitch - Rock Star',
                set: 'The First Chapter',
                number: 23,
                ink_color: 'Amber',
                rarity: 'Super Rare',
                cost: 6,
                image_url: 'https://example.com/stitch.jpg',
                prices: { usd: 12.0, usd_foil: 35.0 },
            } as LorcanaCard,
            isFoil: false,
            unitPrice: 12.0,
            quantity: 4,
            totalValue: 48.0,
        },
    ];

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <CrownJewelsDrawer
                    opened={true}
                    onClose={mockOnClose}
                    topGems={mockTopGems}
                    totalCollectionValue={1000.0}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders modal title, top value stats, and cards with rates and values', () => {
        renderComponent();

        expect(screen.getByText(/Crown Jewels/i)).toBeInTheDocument();
        expect(
            screen.getByText(/Top Value: \$948\.00 \(95% of Coll\.\)/i),
        ).toBeInTheDocument();

        // Check card names and prices
        expect(screen.getByText('Elsa - Spirit of Winter')).toBeInTheDocument();
        expect(screen.getByText('Stitch - Rock Star')).toBeInTheDocument();
        expect(screen.getByText('$450.00')).toBeInTheDocument();
        expect(screen.getByText('$900.00')).toBeInTheDocument();
        expect(screen.getByText('$12.00')).toBeInTheDocument();
        expect(screen.getByText('$48.00')).toBeInTheDocument();

        // Check foil badge
        expect(screen.getByText('FOIL')).toBeInTheDocument();
    });

    it('renders empty state when no cards are owned', () => {
        renderComponent({ topGems: [], totalCollectionValue: 0 });
        expect(
            screen.getByText('No Valued Cards Found Yet'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /Add cards to your collection to automatically rank/i,
            ),
        ).toBeInTheDocument();
    });

    it('triggers onClose when close button is clicked', () => {
        renderComponent();
        const closeBtn = document.querySelector('.mantine-Modal-close');
        expect(closeBtn).not.toBeNull();
        if (closeBtn) {
            fireEvent.click(closeBtn);
            expect(mockOnClose).toHaveBeenCalled();
        }
    });
});
