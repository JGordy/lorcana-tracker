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
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders deck title and cards table', () => {
        renderComponent();
        expect(screen.getByText('Amber Ruby Aggro')).toBeInTheDocument();
        expect(screen.getByText('Stitch')).toBeInTheDocument();
        expect(screen.getByText('+1 Coll')).toBeInTheDocument();
    });

    it('triggers quick add callback when clicking +1 Coll button', () => {
        renderComponent();
        fireEvent.click(screen.getByText('+1 Coll'));
        expect(mockOnQuickAdd).toHaveBeenCalledWith('c1', 2);
    });
});
