import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ViewDeckModal } from '../ViewDeckModal';

describe('ViewDeckModal', () => {
    const mockOnClose = vi.fn();
    const mockCloneFetcher: any = { state: 'idle' };
    const mockOnCloneDeck = vi.fn();
    const mockOnExportDeck = vi.fn();
    const mockOnQuickAdd = vi.fn();
    const mockOnOpenShoppingList = vi.fn();

    const mockActiveDeck: any = {
        $id: 'd1',
        title: 'Amber Ruby Aggro',
        description: 'Fast aggro deck',
        isCoreLegal: true,
        cards: [
            {
                card: {
                    id: 'c1',
                    name: 'Stitch',
                    ink_color: 'Amber',
                    rarity: 'Super Rare',
                    cost: 6,
                },
                requiredQty: 4,
                ownedQty: 2,
            },
        ],
        progress: {
            percentage: 50,
            ownedCount: 30,
            totalCount: 60,
        },
    };

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <ViewDeckModal
                    opened={true}
                    onClose={mockOnClose}
                    activeDeck={mockActiveDeck}
                    searchQuery=""
                    setSearchQuery={vi.fn()}
                    filteredCards={mockActiveDeck.cards}
                    cloneFetcher={mockCloneFetcher}
                    copyFeedback={null}
                    user={{ $id: 'user-1' }}
                    onCloneDeck={mockOnCloneDeck}
                    onExportDeck={mockOnExportDeck}
                    onQuickAdd={mockOnQuickAdd}
                    onOpenShoppingList={mockOnOpenShoppingList}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders deck title, cards table, and Shopping List button', () => {
        renderComponent();
        expect(screen.getByText('Amber Ruby Aggro')).toBeInTheDocument();
        expect(screen.getAllByText('Stitch')[0]).toBeInTheDocument();
        expect(screen.getByText('+1 Coll')).toBeInTheDocument();
        expect(
            screen.getByLabelText('Shopping List (Missing Cards)'),
        ).toBeInTheDocument();
    });

    it('triggers quick add callback when clicking +1 Coll button', () => {
        renderComponent();
        fireEvent.click(screen.getByText('+1 Coll'));
        expect(mockOnQuickAdd).toHaveBeenCalledWith('c1', 2);
    });

    it('triggers onOpenShoppingList when clicking Shopping List button', () => {
        renderComponent();
        fireEvent.click(screen.getByLabelText('Shopping List (Missing Cards)'));
        expect(mockOnOpenShoppingList).toHaveBeenCalledWith(mockActiveDeck);
    });

    it('triggers onOpenPlaytest when clicking Playtest Hand button', () => {
        const mockOnOpenPlaytest = vi.fn();
        renderComponent({ onOpenPlaytest: mockOnOpenPlaytest });
        fireEvent.click(screen.getByText('Playtest Hand'));
        expect(mockOnOpenPlaytest).toHaveBeenCalledWith(mockActiveDeck);
    });

    it('toggles DeckInkCurve panel when clicking Show Deck Curve / Hide Deck Curve button', () => {
        renderComponent();
        expect(
            screen.queryByText('Deck Ink Curve & Cost Distribution'),
        ).not.toBeInTheDocument();

        const showBtn = screen.getByLabelText('Show Deck Curve');
        fireEvent.click(showBtn);
        expect(
            screen.getByText('Deck Ink Curve & Cost Distribution'),
        ).toBeInTheDocument();

        const hideBtn = screen.getByLabelText('Hide Deck Curve');
        fireEvent.click(hideBtn);
        expect(
            screen.queryByText('Deck Ink Curve & Cost Distribution'),
        ).not.toBeInTheDocument();
    });
});
