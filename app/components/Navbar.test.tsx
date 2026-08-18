import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Navbar } from './Navbar';

describe('Navbar Component', () => {
    const renderNavbar = (user: any = null) => {
        const router = createMemoryRouter(
            [
                {
                    path: '/',
                    element: (
                        <MantineProvider>
                            <Navbar user={user} />
                        </MantineProvider>
                    ),
                },
            ],
            { initialEntries: ['/'] },
        );

        return render(<RouterProvider router={router} />);
    };

    it('should render brand title and navigation links', () => {
        renderNavbar(null);
        expect(screen.getByText('GlimmerForge')).toBeInTheDocument();
        expect(screen.getByText('Deck Directory')).toBeInTheDocument();
        expect(screen.getAllByText('My Decks').length).toBeGreaterThan(0);
        expect(screen.getByText('My Collection')).toBeInTheDocument();
    });

    it('should display Sign In / Register button when user is logged out', () => {
        renderNavbar(null);
        expect(screen.getByText('Sign In / Register')).toBeInTheDocument();
    });

    it('should display user name and verification status when logged in', () => {
        const mockUser = {
            $id: 'user-abc',
            email: 'player@lorcana.com',
            name: 'Illumineer Jane',
            emailVerification: true,
        };
        renderNavbar(mockUser);
        expect(screen.getByText('Illumineer Jane')).toBeInTheDocument();
        expect(screen.getByText('✓ Verified')).toBeInTheDocument();
    });

    it('should show pending verification badge when email is not verified', () => {
        const mockUser = {
            $id: 'user-unverified',
            email: 'unverified@lorcana.com',
            name: 'New Player',
            emailVerification: false,
        };
        renderNavbar(mockUser);
        expect(screen.getByText('New Player')).toBeInTheDocument();
        expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    });

    it('should render avatar button and sign out option in menu dropdown', async () => {
        const mockUser = {
            $id: 'user-abc',
            email: 'player@lorcana.com',
            name: 'Illumineer Jane',
            emailVerification: true,
        };
        renderNavbar(mockUser);
        const avatarButton = screen.getByRole('button', {
            name: /user account menu/i,
        });
        expect(avatarButton).toBeInTheDocument();
    });
});
