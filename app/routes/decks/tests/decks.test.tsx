import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import Decks from '../decks';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useLoaderData: () => ({
            decks: [
                {
                    $id: 'd1',
                    title: 'Amber Ruby Aggro',
                    description: 'Fast aggro deck',
                    is_trending: true,
                    cards: [],
                    progress: {
                        percentage: 100,
                        ownedCount: 60,
                        totalCount: 60,
                        missingCards: [],
                    },
                },
            ],
            cards: [],
            user: null,
            sort: 'progress',
        }),
        useNavigate: () => vi.fn(),
        useFetcher: () => ({ submit: vi.fn(), state: 'idle' }),
        useSubmit: () => vi.fn(),
    };
});

describe('Decks Route Integration', () => {
    it('renders header, deck list grid and format tabs', () => {
        render(
            <MantineProvider>
                <MemoryRouter>
                    <Decks />
                </MemoryRouter>
            </MantineProvider>,
        );

        expect(
            screen.getByText('Disney Lorcana Metagame Deck Matcher'),
        ).toBeInTheDocument();
        expect(screen.getByText('Amber Ruby Aggro')).toBeInTheDocument();
    });
});
