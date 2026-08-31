import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ShoppingListModal } from '../ShoppingListModal';
import type { DeckWithProgress } from '../../types/lorcana';

describe('ShoppingListModal', () => {
    const mockOnClose = vi.fn();
    const mockOnQuickAdd = vi.fn();

    const mockDeckWithMissing: DeckWithProgress = {
        $id: 'deck-1',
        id: 'deck-1',
        title: 'Amber Ruby Aggro',
        description: 'Aggro deck',
        creator_id: 'user-1',
        is_public: true,
        progress: {
            percentage: 50,
            ownedCount: 2,
            totalCount: 4,
            missingCards: [],
        },
        cards: [
            {
                card: {
                    $id: 'c1',
                    id: 'c1',
                    name: 'Stitch - Rock Star',
                    set: 'The First Chapter',
                    number: 23,
                    ink_color: 'Amber',
                    cost: 6,
                    inkwell: true,
                    strength: 3,
                    willpower: 5,
                    lore: 3,
                    type: ['Character'],
                    classifications: ['Floodborn'],
                    rarity: 'Super Rare',
                    image_url: '',
                    formats: ['core', 'infinity'],
                    prices: { usd: 10.0, usd_foil: 20.0 },
                },
                requiredQty: 4,
                ownedQty: 2,
            },
        ],
    };

    const mockDeckComplete: DeckWithProgress = {
        $id: 'deck-2',
        id: 'deck-2',
        title: 'Emerald Steel Tempo',
        description: 'Full deck',
        creator_id: 'user-1',
        is_public: true,
        progress: {
            percentage: 100,
            ownedCount: 60,
            totalCount: 60,
            missingCards: [],
        },
        cards: [
            {
                card: {
                    $id: 'c2',
                    id: 'c2',
                    name: 'Robin Hood',
                    set: 'Into the Inklands',
                    number: 10,
                    ink_color: 'Steel',
                    cost: 5,
                    inkwell: true,
                    strength: 3,
                    willpower: 6,
                    lore: 2,
                    type: ['Character'],
                    classifications: ['Hero'],
                    rarity: 'Legendary',
                    image_url: '',
                    formats: ['core', 'infinity'],
                },
                requiredQty: 4,
                ownedQty: 4,
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });
    });

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <ShoppingListModal
                    opened={true}
                    onClose={mockOnClose}
                    deck={mockDeckWithMissing}
                    user={{ $id: 'user-1' }}
                    onQuickAdd={mockOnQuickAdd}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders missing card details, required/owned counts, and buy buttons', () => {
        renderComponent();
        expect(
            screen.getByText('Shopping List: Amber Ruby Aggro'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText('Stitch - Rock Star')[0],
        ).toBeInTheDocument();
        expect(screen.getByText('Need 2')).toBeInTheDocument();
        expect(
            screen.getByText('Est. Missing Cost: $20.00'),
        ).toBeInTheDocument();
        expect(screen.getByText('$10.00')).toBeInTheDocument();
        expect(screen.getByText('($20.00 total)')).toBeInTheDocument();
        expect(screen.getByText('Copy List')).toBeInTheDocument();
        expect(screen.getByText('Buy on TCGPlayer')).toBeInTheDocument();
    });

    it('renders celebratory state when 100% owned', () => {
        renderComponent({ deck: mockDeckComplete });
        expect(
            screen.getByText('You own all the cards for this deck!'),
        ).toBeInTheDocument();
    });

    it('copies TCGPlayer mass entry text to clipboard from menu dropdown on click', async () => {
        renderComponent();
        const copyBtn = screen.getByRole('button', { name: /Copy List/i });
        fireEvent.click(copyBtn);
        const tcgItem = await screen.findByText('TCGPlayer Mass Entry');
        fireEvent.click(tcgItem);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            '2 Stitch - Rock Star',
        );
    });

    it('copies mass entry text and opens TCGPlayer when clicking Buy on TCGPlayer', () => {
        const windowOpenSpy = vi
            .spyOn(window, 'open')
            .mockImplementation(() => null);
        renderComponent();
        const buyBtn = screen.getByText('Buy on TCGPlayer');
        fireEvent.click(buyBtn);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            '2 Stitch - Rock Star',
        );
        expect(windowOpenSpy).toHaveBeenCalledWith(
            'https://www.tcgplayer.com/massentry',
            '_blank',
            'noopener,noreferrer',
        );
        windowOpenSpy.mockRestore();
    });

    it('triggers quick add callback when +1 Coll button is clicked', () => {
        renderComponent();
        const quickAddBtn = screen.getByText('+1 Coll');
        fireEvent.click(quickAddBtn);
        expect(mockOnQuickAdd).toHaveBeenCalledWith('c1', 3);
    });
});
