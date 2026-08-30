import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { LorcanaCardTile } from '../LorcanaCardTile';
import type { Card } from '../../types/lorcana';

afterEach(cleanup);

const mockCard: Card = {
    $id: 'c1',
    id: 'simba-returned-king',
    name: 'Simba - Returned King',
    set: 'The First Chapter',
    number: 1,
    ink_color: 'Amber',
    cost: 5,
    inkwell: true,
    strength: 4,
    willpower: 6,
    lore: 2,
    type: ['Character'],
    classifications: ['Storyborn', 'Hero', 'King'],
    rarity: 'Super Rare',
    image_url: 'https://example.com/simba.jpg',
    formats: ['core', 'infinity'],
};

function renderTile(props = {}, children?: React.ReactNode) {
    return render(
        <MantineProvider>
            <LorcanaCardTile card={mockCard} {...props}>
                {children}
            </LorcanaCardTile>
        </MantineProvider>,
    );
}

describe('LorcanaCardTile', () => {
    it('renders card image and children content', () => {
        renderTile({}, <div data-testid="tile-footer">Footer Content</div>);

        const img = screen.getByAltText('Simba - Returned King');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/simba.jpg');
        expect(screen.getByTestId('tile-footer')).toBeInTheDocument();
    });

    it('renders headerOverlay when provided', () => {
        renderTile({
            headerOverlay: <div data-testid="header-badge">Need 2</div>,
        });

        expect(screen.getByTestId('header-badge')).toBeInTheDocument();
    });

    it('renders fallback placeholder icon when image_url is missing', () => {
        const noImageCard = { ...mockCard, image_url: '' };
        render(
            <MantineProvider>
                <LorcanaCardTile card={noImageCard} />
            </MantineProvider>,
        );

        expect(screen.getByText('Simba - Returned King')).toBeInTheDocument();
    });

    it('applies rarity glow class for Enchanted card', () => {
        const enchantedCard = { ...mockCard, rarity: 'Enchanted' };
        const { container } = render(
            <MantineProvider>
                <LorcanaCardTile card={enchantedCard} />
            </MantineProvider>,
        );

        const cardElement = container.querySelector('.shiny-enchanted-glow');
        expect(cardElement).toBeInTheDocument();
    });
});
