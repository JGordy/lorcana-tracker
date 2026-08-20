import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { VerifyCard } from '../VerifyCard';

describe('VerifyCard', () => {
    it('renders success state correctly', () => {
        render(
            <MantineProvider>
                <MemoryRouter>
                    <VerifyCard
                        success={true}
                        message="Email verified successfully!"
                    />
                </MemoryRouter>
            </MantineProvider>,
        );

        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        expect(
            screen.getByText('Email verified successfully!'),
        ).toBeInTheDocument();
        expect(screen.getByText('Go to My Collection')).toBeInTheDocument();
    });

    it('renders failure state correctly', () => {
        render(
            <MantineProvider>
                <MemoryRouter>
                    <VerifyCard
                        success={false}
                        message="Invalid verification token."
                    />
                </MemoryRouter>
            </MantineProvider>,
        );

        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(
            screen.getByText('Invalid verification token.'),
        ).toBeInTheDocument();
    });
});
