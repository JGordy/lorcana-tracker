import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DeckInkCurve } from '../DeckInkCurve';

describe('DeckInkCurve Component', () => {
    const mockCards = [
        {
            card: {
                id: 'c1',
                name: 'Stitch - Rock Star',
                cost: 6,
                inkwell: true,
            },
            requiredQty: 4,
        },
        {
            card: {
                id: 'c2',
                name: 'Dragon Fire',
                cost: 5,
                inkwell: false,
            },
            requiredQty: 4,
        },
        {
            card: {
                id: 'c3',
                name: 'Pascal - Rapunzel Companion',
                cost: 1,
                inkwell: true,
            },
            requiredQty: 4,
        },
    ];

    const renderComponent = (cards = mockCards) => {
        return render(
            <MantineProvider>
                <DeckInkCurve cards={cards} />
            </MantineProvider>,
        );
    };

    it('renders title, total cards, average cost, and inkable percentage', () => {
        renderComponent();
        expect(
            screen.getByText('Deck Ink Curve & Cost Distribution'),
        ).toBeInTheDocument();
        expect(screen.getByText('67% Inkable')).toBeInTheDocument();
        expect(screen.getByText('8 Inkable')).toBeInTheDocument();
        expect(screen.getByText('4 Uninkable')).toBeInTheDocument();
        expect(screen.getByText('4⬡')).toBeInTheDocument(); // Avg cost 4.0
    });

    it('renders cost tier counts for present cards', () => {
        renderComponent();
        const counts = screen.getAllByText('4');
        expect(counts.length).toBeGreaterThanOrEqual(3);
    });

    it('renders fallback empty state when no cards provided', () => {
        render(
            <MantineProvider>
                <DeckInkCurve cards={[]} />
            </MantineProvider>,
        );
        expect(
            screen.getByText('No cards in deck to calculate ink curve.'),
        ).toBeInTheDocument();
    });
});
