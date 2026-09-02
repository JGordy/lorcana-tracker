import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import MyDecks from '../my-decks';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useLoaderData: () => ({
            decks: [],
            cards: [],
            user: { $id: 'user-1' },
            sort: 'progress',
        }),
        useSubmit: () => vi.fn(),
        useFetcher: () => ({ submit: vi.fn(), data: null }),
        useNavigate: () => vi.fn(),
        useSearchParams: () => [new URLSearchParams(), vi.fn()],
    };
});

describe('MyDecks Route Integration', () => {
    it('renders header and container correctly', () => {
        render(
            <MantineProvider>
                <MemoryRouter>
                    <MyDecks
                        {...({
                            loaderData: {
                                decks: [],
                                cards: [],
                                user: { $id: 'user-1' },
                                sort: 'progress',
                            },
                        } as any)}
                    />
                </MemoryRouter>
            </MantineProvider>,
        );

        expect(
            screen.getByRole('heading', { name: /my decks/i }),
        ).toBeInTheDocument();
    });

    it('opens add cards modal with deck inks and core only defaulted', async () => {
        const mockDeck = {
            $id: 'deck-123',
            title: 'Princess Core',
            description: JSON.stringify({
                format: 'core',
                inks: ['amber', 'sapphire'],
                description: 'A test deck',
            }),
            cards: [],
            is_active: false,
        };

        const mockCards = [
            {
                id: 'anna-amber',
                name: 'Anna - Heir to Arendelle',
                set: 'The First Chapter',
                number: 35,
                ink_color: 'Amber',
                cost: 4,
                type: 'Character',
                formats: ['core'],
            },
            {
                id: 'anna-amethyst',
                name: 'Anna - Mystical Majesty',
                set: 'Shimmering Skies',
                number: 46,
                ink_color: 'Amethyst',
                cost: 7,
                type: 'Character',
                formats: ['core'],
            },
        ];

        render(
            <MantineProvider>
                <MemoryRouter>
                    <MyDecks
                        {...({
                            loaderData: {
                                decks: [mockDeck],
                                cards: mockCards,
                                user: { $id: 'user-1' },
                                sort: 'progress',
                            },
                        } as any)}
                    />
                </MemoryRouter>
            </MantineProvider>,
        );

        expect(screen.getByText('Princess Core')).toBeInTheDocument();

        // Open more options menu and click Add Cards
        const moreBtn = screen.getByRole('button', {
            name: /more deck options/i,
        });
        fireEvent.click(moreBtn);

        const addCardsItem = await screen.findByText('Add Cards');
        fireEvent.click(addCardsItem);

        // Add Cards to Deck modal should be open
        expect(
            await screen.findByText('Add Cards to Deck'),
        ).toBeInTheDocument();

        // Verify Deck Inks option is shown with Amber / Sapphire
        expect(
            screen.getByText('Deck Inks (Amber / Sapphire)'),
        ).toBeInTheDocument();

        // Verify Core Only is checked by default
        const coreCheckbox = screen.getByLabelText('Core Only');
        expect(coreCheckbox).toBeChecked();

        // Verify only the Amber Anna is shown, not Amethyst Anna
        expect(
            screen.getAllByText('Anna - Heir to Arendelle').length,
        ).toBeGreaterThan(0);
        expect(
            screen.queryByText('Anna - Mystical Majesty'),
        ).not.toBeInTheDocument();
    });
});
