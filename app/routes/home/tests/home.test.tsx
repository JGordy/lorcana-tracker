import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import Home from '../home';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useLoaderData: () => ({
            user: null,
        }),
    };
});

describe('Home Route Integration', () => {
    it('renders home hero, features grid, quick start workflow, and demo callout for visitors', () => {
        render(
            <MantineProvider>
                <MemoryRouter>
                    <Home />
                </MemoryRouter>
            </MantineProvider>,
        );

        expect(screen.getByText('GlimmerForge')).toBeInTheDocument();
        expect(screen.getByText('Catalog Collection')).toBeInTheDocument();
        expect(
            screen.getByText('From Booster Pack to Tournament Ready'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Ready to test it in action?'),
        ).toBeInTheDocument();
    });
});
