import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DeckGraphicCanvas } from '../DeckGraphicCanvas';
import type { Card } from '../../../../types/lorcana';

const mockCards: Array<{ card: Card; requiredQty: number }> = [
    {
        card: {
            $id: 'c1',
            id: 'cursed-merfolk',
            name: 'Cursed Merfolk',
            set: 'The First Chapter',
            number: 1,
            ink_color: 'Emerald',
            cost: 1,
            inkwell: true,
            strength: 0,
            willpower: 1,
            lore: 1,
            type: ['Character'],
            classifications: ['Storyborn'],
            rarity: 'Common',
            image_url:
                'https://api.lorcana.ravensburger.com/images/en/001/001.png',
            formats: ['core', 'infinity'],
        },
        requiredQty: 4,
    },
    {
        card: {
            $id: 'c2',
            id: 'robin-hood',
            name: 'Robin Hood - Champion of Sherwood',
            set: 'Rise of the Floodborn',
            number: 10,
            ink_color: 'Steel',
            cost: 5,
            inkwell: true,
            strength: 5,
            willpower: 4,
            lore: 2,
            type: ['Character'],
            classifications: ['Floodborn', 'Hero'],
            rarity: 'Super Rare',
            image_url:
                'https://api.lorcana.ravensburger.com/images/en/002/010.png',
            formats: ['core', 'infinity'],
        },
        requiredQty: 3,
    },
];

describe('DeckGraphicCanvas', () => {
    it('renders deck title, creator name, format badge, and Glimmerforge watermark', () => {
        render(
            <MantineProvider>
                <DeckGraphicCanvas
                    deckTitle="Merida Control"
                    creatorName="Joseph Gordy"
                    displayInks={['emerald', 'steel']}
                    isCoreLegal={true}
                    cards={mockCards}
                />
            </MantineProvider>,
        );

        expect(
            screen.getByText(/Joseph Gordy ✦ Merida Control/),
        ).toBeInTheDocument();
        expect(screen.getByText('Core Legal')).toBeInTheDocument();
        expect(screen.getByText('Built with Glimmerforge')).toBeInTheDocument();
        expect(screen.getAllByText('Glimmerforge')[0]).toBeInTheDocument();
        expect(screen.getByText('Emerald')).toBeInTheDocument();
        expect(screen.getByText('Steel')).toBeInTheDocument();
    });

    it('renders cards in matrix grid with quantity badges', () => {
        render(
            <MantineProvider>
                <DeckGraphicCanvas
                    deckTitle="Merida Control"
                    cards={mockCards}
                    columns={8}
                />
            </MantineProvider>,
        );

        expect(screen.getByText(/Merida Control/)).toBeInTheDocument();
    });

    it('renders footer stacked ink cost curve histogram', () => {
        render(
            <MantineProvider>
                <DeckGraphicCanvas
                    deckTitle="Merida Control"
                    cards={mockCards}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('Cost Curve')).toBeInTheDocument();
        expect(
            screen.getByText('Ink distribution by cost'),
        ).toBeInTheDocument();
    });
});
