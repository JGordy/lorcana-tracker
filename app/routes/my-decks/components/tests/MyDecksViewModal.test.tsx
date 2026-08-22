import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksViewModal } from '../modals/MyDecksViewModal';

afterEach(cleanup);

const mockDeck = {
    $id: 'deck-123',
    title: 'Emerald Steel Bounce',
    displayInks: ['emerald', 'steel'],
    isCoreLegal: true,
    cards: [
        {
            card: {
                id: 'card-1',
                name: 'Merlin - Goat',
                cost: 4,
                inkwell: true,
            },
            requiredQty: 4,
            ownedQty: 4,
        },
    ],
    progress: {
        percentage: 80,
        ownedCount: 48,
        totalCount: 60,
    },
};

const mockFilteredCards = [
    {
        card: {
            id: 'card-1',
            name: 'Merlin - Goat',
            set: 'Rise of the Floodborn',
            number: 89,
            ink_color: 'Amethyst',
            cost: 4,
            rarity: 'Rare',
            image_url: 'https://example.com/goat.jpg',
        },
        requiredQty: 4,
        ownedQty: 4,
    },
    {
        card: {
            id: 'card-2',
            name: 'Madam Mim - Fox',
            set: 'Rise of the Floodborn',
            number: 90,
            ink_color: 'Amethyst',
            cost: 3,
            rarity: 'Rare',
            image_url: undefined,
        },
        requiredQty: 4,
        ownedQty: 2,
    },
];

const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    activeDeck: mockDeck,
    searchQuery: '',
    onSearchChange: vi.fn(),
    inkFilter: 'all',
    onInkFilterChange: vi.fn(),
    filteredCards: mockFilteredCards,
    copyFeedback: null,
    onOpenAddCardsModal: vi.fn(),
    onOpenEditModal: vi.fn(),
    onExportDeck: vi.fn(),
    onUpdateCardQty: vi.fn(),
    onQuickAdd: vi.fn(),
    onRemoveCard: vi.fn(),
    onOpenShoppingList: vi.fn(),
};

function renderModal(props = {}) {
    return render(
        <MantineProvider>
            <MyDecksViewModal {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDecksViewModal', () => {
    it('does not render modal content if activeDeck is null', () => {
        renderModal({ activeDeck: null });
        expect(
            screen.queryByText('Emerald Steel Bounce'),
        ).not.toBeInTheDocument();
    });

    it('renders modal header with deck title, legality, and completion progress', () => {
        renderModal();
        expect(screen.getByText('Emerald Steel Bounce')).toBeInTheDocument();
        expect(screen.getByText('CORE LEGAL')).toBeInTheDocument();
        expect(screen.getByText('48/60 (80%)')).toBeInTheDocument();
    });

    it('renders "INFINITY" badge for non-core-legal deck', () => {
        renderModal({ activeDeck: { ...mockDeck, isCoreLegal: false } });
        expect(screen.getByText('INFINITY')).toBeInTheDocument();
    });

    it('renders toolbar search input and calls onSearchChange', () => {
        const onSearchChange = vi.fn();
        renderModal({ onSearchChange });
        const input = screen.getByPlaceholderText(
            'Search cards in this deck...',
        );
        fireEvent.change(input, { target: { value: 'Merlin' } });
        expect(onSearchChange).toHaveBeenCalledWith('Merlin');
    });

    it('calls onOpenAddCardsModal when "Add Cards from Catalog" button is clicked', () => {
        const onOpenAddCardsModal = vi.fn();
        renderModal({ onOpenAddCardsModal });
        fireEvent.click(screen.getByText('Add Cards from Catalog'));
        expect(onOpenAddCardsModal).toHaveBeenCalledOnce();
    });

    it('calls onOpenEditModal when "Edit Info" button is clicked', () => {
        const onOpenEditModal = vi.fn();
        renderModal({ onOpenEditModal });
        fireEvent.click(screen.getByText('Edit Info'));
        expect(onOpenEditModal).toHaveBeenCalledWith(mockDeck);
    });

    it('calls onExportDeck when "Export" button is clicked', () => {
        const onExportDeck = vi.fn();
        renderModal({ onExportDeck });
        fireEvent.click(screen.getByText('Export'));
        expect(onExportDeck).toHaveBeenCalledWith(mockDeck);
    });

    it('displays Copied state when copyFeedback matches deck id', () => {
        renderModal({ copyFeedback: 'deck-123' });
        expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    it('renders table rows for cards in deck with ownership status', () => {
        renderModal();
        expect(screen.getAllByText('Merlin - Goat')[0]).toBeInTheDocument();
        expect(screen.getByText('✓ Owned')).toBeInTheDocument();

        expect(screen.getAllByText('Madam Mim - Fox')[0]).toBeInTheDocument();
        expect(screen.getByText('Need 2')).toBeInTheDocument();
        expect(screen.getByText('+1 Coll')).toBeInTheDocument();
    });

    it('calls onQuickAdd when clicking "+1 Coll" button on a missing card', () => {
        const onQuickAdd = vi.fn();
        renderModal({ onQuickAdd });
        fireEvent.click(screen.getByText('+1 Coll'));
        expect(onQuickAdd).toHaveBeenCalledWith('card-2', 2);
    });

    it('calls onOpenShoppingList when "Shopping List" button is clicked', () => {
        const onOpenShoppingList = vi.fn();
        renderModal({ onOpenShoppingList });
        fireEvent.click(screen.getByText('Shopping List'));
        expect(onOpenShoppingList).toHaveBeenCalledWith(mockDeck);
    });

    it('calls onOpenPlaytest when "Playtest Hand" button is clicked', () => {
        const onOpenPlaytest = vi.fn();
        renderModal({ onOpenPlaytest });
        fireEvent.click(screen.getByText('Playtest Hand'));
        expect(onOpenPlaytest).toHaveBeenCalledWith(mockDeck);
    });

    it('shows empty filter message when filteredCards is empty', () => {
        renderModal({ filteredCards: [] });
        expect(
            screen.getByText('No cards match your search filter.'),
        ).toBeInTheDocument();
    });

    it('toggles DeckInkCurve panel when clicking Hide Curve / Ink Curve button', () => {
        renderModal();
        expect(
            screen.getByText('Deck Ink Curve & Cost Distribution'),
        ).toBeInTheDocument();

        const hideBtn = screen.getByText('Hide Curve');
        fireEvent.click(hideBtn);
        expect(
            screen.queryByText('Deck Ink Curve & Cost Distribution'),
        ).not.toBeInTheDocument();

        const showBtn = screen.getByText('Ink Curve');
        fireEvent.click(showBtn);
        expect(
            screen.getByText('Deck Ink Curve & Cost Distribution'),
        ).toBeInTheDocument();
    });
});
