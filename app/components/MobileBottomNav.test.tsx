import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MobileBottomNav, MOBILE_NAV_ITEMS } from './MobileBottomNav';

describe('MobileBottomNav Component', () => {
    const renderNav = (initialPath = '/') => {
        const router = createMemoryRouter(
            [
                {
                    path: '*',
                    element: (
                        <MantineProvider>
                            <MobileBottomNav />
                        </MantineProvider>
                    ),
                },
            ],
            { initialEntries: [initialPath] },
        );

        return render(<RouterProvider router={router} />);
    };

    it('renders all mobile navigation items', () => {
        renderNav('/');

        MOBILE_NAV_ITEMS.forEach((item) => {
            const link = screen.getByRole('link', {
                name: new RegExp(`^${item.label}$`, 'i'),
            });
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', item.to);
        });
    });

    it('marks the current active route with aria-current="page"', () => {
        renderNav('/collection');

        const collectionLink = screen.getByRole('link', {
            name: /collection/i,
        });
        expect(collectionLink).toHaveAttribute('aria-current', 'page');

        const decksLink = screen.getByRole('link', { name: /^decks$/i });
        expect(decksLink).not.toHaveAttribute('aria-current');
    });

    it('updates active state when rendered on /decks route', () => {
        renderNav('/decks');

        const decksLink = screen.getByRole('link', { name: /^decks$/i });
        expect(decksLink).toHaveAttribute('aria-current', 'page');
    });

    it('updates active state when rendered on /my-decks route', () => {
        renderNav('/my-decks');

        const myDecksLink = screen.getByRole('link', { name: /my decks/i });
        expect(myDecksLink).toHaveAttribute('aria-current', 'page');
    });

    it('renders with accessibility aria-label and no active items on unmapped route', () => {
        renderNav('/unknown-route');

        const nav = screen.getByRole('navigation', {
            name: /mobile navigation/i,
        });
        expect(nav).toBeInTheDocument();

        MOBILE_NAV_ITEMS.forEach((item) => {
            const link = screen.getByRole('link', {
                name: new RegExp(`^${item.label}$`, 'i'),
            });
            expect(link).not.toHaveAttribute('aria-current');
        });
    });
});
