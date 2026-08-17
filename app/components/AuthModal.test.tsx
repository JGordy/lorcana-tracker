import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthModal } from './AuthModal';

describe('AuthModal Component', () => {
    const renderAuthModal = (opened = true, onClose = vi.fn()) => {
        const router = createMemoryRouter(
            [
                {
                    path: '/',
                    element: (
                        <MantineProvider>
                            <AuthModal opened={opened} onClose={onClose} />
                        </MantineProvider>
                    ),
                },
            ],
            { initialEntries: ['/'] },
        );

        return render(<RouterProvider router={router} />);
    };

    it('should render sign in form elements when opened in login mode', () => {
        renderAuthModal(true);
        expect(screen.getByText('Sign In to GlimmerForge')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('you@example.com'),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Minimum 8 characters'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Sign In' }),
        ).toBeInTheDocument();
    });

    it('should render registration mode toggle button', () => {
        renderAuthModal(true);
        expect(
            screen.getByText(/Don't have an account\?/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Create Account' }),
        ).toBeInTheDocument();
    });
});
