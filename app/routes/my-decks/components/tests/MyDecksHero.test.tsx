import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { MyDecksHero } from '../MyDecksHero';

const defaultProps = {
    totalDecksCount: 7,
    readyToPlayCount: 3,
    inProgressCount: 4,
};

function renderHero(props = {}) {
    return render(
        <MantineProvider>
            <MemoryRouter>
                <MyDecksHero {...defaultProps} {...props} />
            </MemoryRouter>
        </MantineProvider>,
    );
}

describe('MyDecksHero', () => {
    it('renders the title and description text', () => {
        renderHero();
        expect(screen.getByText('My Decks')).toBeInTheDocument();
        expect(
            screen.getByText(/Build, customize, and manage/i),
        ).toBeInTheDocument();
    });

    it('displays the three metric stat cards with correct values', () => {
        renderHero();
        expect(screen.getByText('Total Decks')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('Ready (100%)')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('In-Progress')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('renders zero counts without crashing', () => {
        renderHero({
            totalDecksCount: 0,
            readyToPlayCount: 0,
            inProgressCount: 0,
        });
        expect(screen.getAllByText('0')).toHaveLength(3);
    });
});
