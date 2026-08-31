import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CollectionHeader } from '../CollectionHeader';

describe('CollectionHeader', () => {
    it('renders header title and metric totals correctly', () => {
        render(
            <MantineProvider>
                <CollectionHeader
                    totals={{ totalCardsOwned: 45, uniqueCardsCount: 20 }}
                    totalCatalogCards={100}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('My Collection')).toBeDefined();
        expect(screen.getByText('45')).toBeDefined();
        expect(screen.getByText('20')).toBeDefined();
        expect(screen.getByText('20%')).toBeDefined();
        expect(screen.getByText('(20 / 100)')).toBeDefined();
    });

    it('renders portfolio valuation and handles crown jewels drawer', () => {
        const mockValuation = {
            totalValue: 125.5,
            standardValue: 75.5,
            foilValue: 50.0,
            pricedCardsCount: 15,
            unpricedCardsCount: 5,
            topGems: [
                {
                    card: {
                        id: 'c1',
                        name: 'Elsa - Spirit of Winter',
                        set: 'The First Chapter',
                        number: 42,
                        ink_color: 'Amethyst',
                        rarity: 'Enchanted',
                        cost: 8,
                        prices: { usd: 100, usd_foil: 120 },
                    },
                    isFoil: true,
                    unitPrice: 120,
                    quantity: 1,
                    totalValue: 120,
                },
            ],
        };

        render(
            <MantineProvider>
                <CollectionHeader
                    totals={{ totalCardsOwned: 45, uniqueCardsCount: 20 }}
                    totalCatalogCards={100}
                    valuation={mockValuation as any}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('Est. Value')).toBeInTheDocument();
        expect(screen.getByText('$125.50')).toBeInTheDocument();
        expect(screen.getByText('$75.50')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText('💎 Gems')).toBeInTheDocument();
    });
});
