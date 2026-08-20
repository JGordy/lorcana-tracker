import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import Verify from '../verify';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useLoaderData: () => ({
            success: true,
            message: 'Email address verified!',
        }),
    };
});

describe('Verify Route Integration', () => {
    it('renders verify card view with loader data', () => {
        render(
            <MantineProvider>
                <MemoryRouter>
                    <Verify />
                </MemoryRouter>
            </MantineProvider>,
        );

        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        expect(screen.getByText('Email address verified!')).toBeInTheDocument();
    });
});
