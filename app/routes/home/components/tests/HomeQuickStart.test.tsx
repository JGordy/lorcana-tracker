import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { HomeQuickStart } from '../HomeQuickStart';

describe('HomeQuickStart', () => {
    it('renders step-by-step workflow guide', () => {
        render(
            <MantineProvider>
                <HomeQuickStart />
            </MantineProvider>,
        );

        expect(screen.getByText('From Booster Pack to Tournament Ready')).toBeInTheDocument();
        expect(screen.getByText('1. Add Physical Cards')).toBeInTheDocument();
        expect(screen.getByText('2. Scan Meta Decks')).toBeInTheDocument();
        expect(screen.getByText('3. Export Buy Lists')).toBeInTheDocument();
    });
});
