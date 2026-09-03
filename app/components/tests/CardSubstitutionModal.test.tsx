import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CardSubstitutionModal } from '../substitutions/CardSubstitutionModal';
import type { Card, DeckWithProgress } from '../../types/lorcana';

describe('CardSubstitutionModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSwap = vi.fn();
    const mockOnQuickAdd = vi.fn();

    const mockTargetMaui: Card = {
        $id: 'maui-hero-to-all',
        id: 'maui-hero-to-all',
        name: 'Maui - Hero to All',
        set: 'The First Chapter',
        number: 115,
        ink_color: 'Ruby',
        cost: 5,
        inkwell: false,
        strength: 6,
        willpower: 5,
        lore: 0,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Deity', 'Rush'],
        rarity: 'Rare',
        image_url: 'https://api.lorcana.ravensburger.com/images/maui.jpg',
        formats: ['core', 'infinity'],
        prices: { usd: 18.5, usd_foil: 28.0 },
    };

    const mockZeus: Card = {
        $id: 'zeus-god-of-lightning',
        id: 'zeus-god-of-lightning',
        name: 'Zeus - God of Lightning',
        set: 'The First Chapter',
        number: 130,
        ink_color: 'Ruby',
        cost: 5,
        inkwell: true,
        strength: 0,
        willpower: 4,
        lore: 2,
        type: ['Character'],
        classifications: ['Storyborn', 'Deity', 'Rush'],
        rarity: 'Rare',
        image_url: 'https://api.lorcana.ravensburger.com/images/zeus.jpg',
        formats: ['core', 'infinity'],
        prices: { usd: 0.75, usd_foil: 2.0 },
    };

    const mockCatalog: Card[] = [mockTargetMaui, mockZeus];

    const mockDeck: DeckWithProgress = {
        $id: 'deck-1',
        id: 'deck-1',
        title: 'Ruby Amethyst Control',
        description: 'Control deck',
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
                card: mockTargetMaui,
                requiredQty: 4,
                ownedQty: 1,
            },
        ],
        meta: {
            format: 'core',
            inks: ['Ruby', 'Amethyst'],
            description: '',
            is_active: false,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <CardSubstitutionModal
                    opened={true}
                    onClose={mockOnClose}
                    targetCard={mockTargetMaui}
                    deck={mockDeck}
                    catalog={mockCatalog}
                    userCollection={[{ card_id: mockZeus.id, quantity: 2 }]}
                    user={{ $id: 'user-1' }}
                    canSwapInDeck={true}
                    onSwapCardInDeck={mockOnSwap}
                    onQuickAdd={mockOnQuickAdd}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders target card information and candidate substitutions', () => {
        renderComponent();
        expect(
            screen.getByText('Card Substitutions: Maui - Hero to All'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Replacing: Maui - Hero to All'),
        ).toBeInTheDocument();
        expect(screen.getByText(/1 owned \/ 4 in deck/)).toBeInTheDocument();
        expect(screen.getByText(/3 missing/)).toBeInTheDocument();

        // Zeus should be recommended as candidate (displayed as visual card tile)
        expect(
            screen.getByAltText('Zeus - God of Lightning'),
        ).toBeInTheDocument();
        expect(screen.getByText('Save $17.75 (96%)')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Swap/i }),
        ).toBeInTheDocument();
    });

    it('triggers swap card callback when clicking Swap button', () => {
        renderComponent();
        const swapBtn = screen.getByRole('button', { name: /Swap/i });
        fireEvent.click(swapBtn);
        expect(mockOnSwap).toHaveBeenCalledWith(mockTargetMaui, mockZeus, 1);
    });

    it('triggers quick add callback when clicking +1 Coll', () => {
        renderComponent();
        const quickAddBtns = screen.getAllByText('+1 Coll');
        fireEvent.click(quickAddBtns[0]);
        expect(mockOnQuickAdd).toHaveBeenCalledWith(mockZeus.id, 3);
    });

    it('correctly picks up collection items stored in localStorage', () => {
        const mockRC: Card = {
            $id: 'rc-remote-controlled-car',
            id: 'rc-remote-controlled-car',
            name: 'RC - Remote-Controlled Car',
            set: 'Wilds Unknown',
            number: 77,
            ink_color: 'Ruby',
            cost: 5,
            inkwell: true,
            strength: 3,
            willpower: 2,
            lore: 2,
            type: ['Character'],
            classifications: ['Storyborn', 'Ally', 'Toy', 'Racer', 'Rush'],
            rarity: 'Common',
            image_url: 'https://api.lorcana.ravensburger.com/images/rc.jpg',
            formats: ['core', 'infinity'],
            prices: { usd: 0.08, usd_foil: 0.3 },
        };

        // Populate localStorage
        localStorage.setItem(
            'lorcana_user_inventory',
            JSON.stringify([
                { card_id: 'rc-remote-controlled-car', quantity: 4 },
            ]),
        );

        renderComponent({
            catalog: [mockTargetMaui, mockRC],
            userCollection: [], // empty server collection
        });

        // RC should show 4 owned
        expect(screen.getByText(/4 owned/i)).toBeInTheDocument();
        localStorage.removeItem('lorcana_user_inventory');
    });

    it('filters candidate list based on search query', () => {
        renderComponent();
        const searchInput = screen.getByPlaceholderText(
            'Search substitute cards...',
        );
        fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
        expect(
            screen.getByText(
                'No matching substitutes found with current filters.',
            ),
        ).toBeInTheDocument();
    });
});
