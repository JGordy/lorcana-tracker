import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { HomeHero } from '../HomeHero';

describe('HomeHero', () => {
    it('renders GlimmerForge title and navigation action buttons', () => {
        render(
            <MantineProvider>
                <MemoryRouter>
                    <HomeHero />
                </MemoryRouter>
            </MantineProvider>,
        );

        expect(screen.getByText('GlimmerForge')).toBeInTheDocument();
        expect(screen.getByText('Manage My Collection')).toBeInTheDocument();
        expect(screen.getByText('Browse Public Decks')).toBeInTheDocument();
        expect(screen.getByText('Full Catalog Support')).toBeInTheDocument();
    });
});
