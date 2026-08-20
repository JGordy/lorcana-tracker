import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksGrid } from '../MyDecksGrid';

const mockDeck = {
    $id: 'deck-1',
    title: 'Ruby Steel Aggro',
    progress: { percentage: 90, ownedCount: 54, totalCount: 60 },
    displayInks: ['ruby', 'steel'],
    isCoreLegal: true,
    meta: {
        description: '',
        coverCardId: undefined,
        inks: ['ruby', 'steel'],
        format: 'core',
    },
    cards: [],
};

const defaultProps = {
    decks: [mockDeck],
    searchQuery: '',
    copyFeedback: null,
    onOpenCreateModal: vi.fn(),
    onOpenViewModal: vi.fn(),
    onOpenEditModal: vi.fn(),
    onOpenDeleteModal: vi.fn(),
    onExportDeck: vi.fn(),
    onOpenAddCardsModal: vi.fn(),
};

function renderGrid(props = {}) {
    return render(
        <MantineProvider>
            <MyDecksGrid {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDecksGrid', () => {
    it('renders a deck card for each deck in the list', () => {
        renderGrid();
        expect(screen.getByText('Ruby Steel Aggro')).toBeInTheDocument();
    });

    it('renders multiple deck cards when given multiple decks', () => {
        const secondDeck = {
            ...mockDeck,
            $id: 'deck-2',
            title: 'Sapphire Amethyst Control',
        };
        renderGrid({ decks: [mockDeck, secondDeck] });
        expect(screen.getByText('Ruby Steel Aggro')).toBeInTheDocument();
        expect(
            screen.getByText('Sapphire Amethyst Control'),
        ).toBeInTheDocument();
    });

    describe('empty state — no decks at all', () => {
        it('shows the "No personal decks yet" message', () => {
            renderGrid({ decks: [], searchQuery: '' });
            expect(
                screen.getByText('No personal decks yet'),
            ).toBeInTheDocument();
        });

        it('shows the Create Your First Deck CTA button', () => {
            renderGrid({ decks: [], searchQuery: '' });
            expect(
                screen.getByText('Create Your First Deck'),
            ).toBeInTheDocument();
        });

        it('calls onOpenCreateModal when the CTA button is clicked', () => {
            const onOpenCreateModal = vi.fn();
            renderGrid({ decks: [], searchQuery: '', onOpenCreateModal });
            fireEvent.click(screen.getByText('Create Your First Deck'));
            expect(onOpenCreateModal).toHaveBeenCalledOnce();
        });
    });

    describe('empty state — no decks matching search query', () => {
        it('shows the "No decks match your filter" message', () => {
            renderGrid({ decks: [], searchQuery: 'xyz' });
            expect(
                screen.getByText('No decks match your filter'),
            ).toBeInTheDocument();
        });

        it('shows the search query in the helper text', () => {
            renderGrid({ decks: [], searchQuery: 'xyz' });
            expect(
                screen.getByText(/Try clearing your search query "xyz"/i),
            ).toBeInTheDocument();
        });

        it('does NOT show the Create CTA button when a search is active', () => {
            renderGrid({ decks: [], searchQuery: 'xyz' });
            expect(
                screen.queryByText('Create Your First Deck'),
            ).not.toBeInTheDocument();
        });
    });
});
