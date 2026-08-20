import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ShinyCardImage } from '../ShinyCardImage';
import type { Card as LorcanaCard } from '../../../../types/lorcana';

describe('ShinyCardImage', () => {
    it('returns null if card has no image_url', () => {
        const { container } = render(
            <ShinyCardImage card={{ name: 'No Image' } as LorcanaCard} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders image for standard card', () => {
        render(
            <ShinyCardImage
                card={
                    {
                        name: 'Mickey Mouse',
                        image_url: 'https://example.com/mickey.png',
                        rarity: 'Common',
                    } as LorcanaCard
                }
            />,
        );

        const img = screen.getByRole('img', { name: 'Mickey Mouse' });
        expect(img).toBeDefined();
        expect(img.getAttribute('src')).toBe('https://example.com/mickey.png');
    });

    it('renders holo layer for Enchanted card', () => {
        render(
            <ShinyCardImage
                card={
                    {
                        name: 'Enchanted Elsa',
                        image_url: 'https://example.com/elsa.png',
                        rarity: 'Enchanted',
                    } as LorcanaCard
                }
            />,
        );

        expect(screen.getByTestId('shiny-holo-layer')).toBeDefined();
    });
});
