import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDeckCardItem } from '../MyDeckCardItem';

const mockDeck = {
    $id: 'deck-1',
    title: 'Amber Emerald Ramp',
    progress: { percentage: 75, ownedCount: 45, totalCount: 60 },
    displayInks: ['amber', 'emerald'],
    isCoreLegal: true,
    meta: {
        description: 'A ramp-heavy control deck.',
        coverCardId: undefined,
        inks: ['amber', 'emerald'],
        format: 'core',
    },
    cards: [
        {
            card: {
                id: 'c1',
                name: 'Simba - Returned King',
                rarity: 'Legendary',
                cost: 7,
                ink_color: 'Amber',
                image_url: 'https://example.com/simba.jpg',
            },
            requiredQty: 4,
            ownedQty: 4,
        },
        {
            card: {
                id: 'c2',
                name: 'Merlin - Rabbit',
                rarity: 'Rare',
                cost: 3,
                ink_color: 'Emerald',
                image_url: undefined,
            },
            requiredQty: 4,
            ownedQty: 2,
        },
    ],
};

const defaultProps = {
    deck: mockDeck,
    copyFeedback: null,
    onOpenViewModal: vi.fn(),
    onOpenEditModal: vi.fn(),
    onOpenDeleteModal: vi.fn(),
    onExportDeck: vi.fn(),
    onOpenAddCardsModal: vi.fn(),
};

function renderCard(props = {}) {
    return render(
        <MantineProvider>
            <MyDeckCardItem {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDeckCardItem', () => {
    it('renders the deck title', () => {
        renderCard();
        expect(screen.getByText('Amber Emerald Ramp')).toBeInTheDocument();
    });

    it('renders the collection progress badge', () => {
        renderCard();
        expect(screen.getByText('45/60 (75%)')).toBeInTheDocument();
    });

    it('renders "Collection Progress" label', () => {
        renderCard();
        expect(screen.getByText('Collection Progress')).toBeInTheDocument();
    });

    it('renders the Core legality badge', () => {
        renderCard();
        expect(screen.getByText('Core')).toBeInTheDocument();
    });

    it('renders the Infinity legality badge for non-core-legal decks', () => {
        renderCard({ deck: { ...mockDeck, isCoreLegal: false } });
        expect(screen.getByText('Infinity')).toBeInTheDocument();
    });

    it('renders ink images for each ink color', () => {
        renderCard();
        expect(screen.getByAltText('amber')).toBeInTheDocument();
        expect(screen.getByAltText('emerald')).toBeInTheDocument();
    });

    it('renders the deck description when present', () => {
        renderCard();
        expect(
            screen.getByText('A ramp-heavy control deck.'),
        ).toBeInTheDocument();
    });

    it('does not render description text when description is empty', () => {
        const deck = {
            ...mockDeck,
            meta: { ...mockDeck.meta, description: '' },
        };
        renderCard({ deck });
        expect(
            screen.queryByText('A ramp-heavy control deck.'),
        ).not.toBeInTheDocument();
    });

    it('renders the featured card cover image when available', () => {
        renderCard();
        // Simba appears in both the cover section and the key cards row — use getAllByAltText
        const imgs = screen.getAllByAltText('Simba - Returned King');
        expect(imgs.length).toBeGreaterThanOrEqual(1);
        // The deck-cover-img has the full image_url
        const coverImg = imgs.find((el) =>
            el.classList.contains('deck-cover-img'),
        );
        expect(coverImg).toBeTruthy();
        expect(coverImg).toHaveAttribute(
            'src',
            'https://example.com/simba.jpg',
        );
    });

    it('calls onOpenViewModal with deckId when "View & Edit Deck" is clicked', () => {
        const onOpenViewModal = vi.fn();
        renderCard({ onOpenViewModal });
        fireEvent.click(screen.getByText('View & Edit Deck'));
        expect(onOpenViewModal).toHaveBeenCalledWith('deck-1');
    });

    it('calls onOpenEditModal when the edit icon button is clicked', () => {
        const onOpenEditModal = vi.fn();
        renderCard({ onOpenEditModal });
        // Mantine Tooltip labels are accessible names for the wrapped button
        fireEvent.click(screen.getByRole('button', { name: /edit title/i }));
        expect(onOpenEditModal).toHaveBeenCalledWith(mockDeck);
    });

    it('calls onOpenDeleteModal when the delete icon button is clicked', () => {
        const onOpenDeleteModal = vi.fn();
        renderCard({ onOpenDeleteModal });
        fireEvent.click(screen.getByRole('button', { name: /delete deck/i }));
        expect(onOpenDeleteModal).toHaveBeenCalledWith(mockDeck);
    });

    it('calls onExportDeck when the export icon button is clicked', () => {
        const onExportDeck = vi.fn();
        renderCard({ onExportDeck });
        fireEvent.click(
            screen.getByRole('button', { name: /export decklist/i }),
        );
        expect(onExportDeck).toHaveBeenCalledWith(mockDeck);
    });

    it('calls onOpenAddCardsModal when the add cards icon button is clicked', () => {
        const onOpenAddCardsModal = vi.fn();
        renderCard({ onOpenAddCardsModal });
        fireEvent.click(screen.getByRole('button', { name: /add cards/i }));
        expect(onOpenAddCardsModal).toHaveBeenCalledWith(mockDeck);
    });

    it('calls onOpenPlaytest when the playtest action icon button is clicked', () => {
        const onOpenPlaytest = vi.fn();
        renderCard({ onOpenPlaytest });
        fireEvent.click(screen.getByRole('button', { name: /playtest/i }));
        expect(onOpenPlaytest).toHaveBeenCalledWith(mockDeck);
    });

    it('shows copyFeedback check state without crashing', () => {
        // When copyFeedback matches deck id the copy button switches to a check icon
        renderCard({ copyFeedback: 'deck-1' });
        // The export button wrapper is still rendered (just with a different icon inside)
        expect(
            screen.getByRole('button', { name: /export decklist/i }),
        ).toBeInTheDocument();
    });
});
