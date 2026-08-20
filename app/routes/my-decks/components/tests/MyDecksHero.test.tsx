import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { MyDecksHero } from '../MyDecksHero';

const defaultProps = {
    totalDecksCount: 7,
    readyToPlayCount: 3,
    inProgressCount: 4,
    onOpenCreateModal: vi.fn(),
    onOpenImportModal: vi.fn(),
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
        expect(screen.getByText('Total Personal Decks')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(
            screen.getByText('Ready to Play (100% Owned)'),
        ).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Decks In-Progress')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('calls onOpenCreateModal when New Deck button is clicked', () => {
        const onOpenCreateModal = vi.fn();
        renderHero({ onOpenCreateModal });
        fireEvent.click(screen.getByText('New Deck'));
        expect(onOpenCreateModal).toHaveBeenCalledOnce();
    });

    it('calls onOpenImportModal when Import Decklist button is clicked', () => {
        const onOpenImportModal = vi.fn();
        renderHero({ onOpenImportModal });
        fireEvent.click(screen.getByText('Import Decklist'));
        expect(onOpenImportModal).toHaveBeenCalledOnce();
    });

    it('renders the Directory link pointing to /decks', () => {
        renderHero();
        const link = screen.getByText('Directory').closest('a');
        expect(link).toHaveAttribute('href', '/decks');
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
