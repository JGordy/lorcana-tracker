import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
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
                <MyDecks />
            </MantineProvider>,
        );

        expect(screen.getByText('My Custom Decks')).toBeInTheDocument();
    });
});
