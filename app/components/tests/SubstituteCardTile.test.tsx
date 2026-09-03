import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { SubstituteCardTile } from '../substitutions/SubstituteCardTile';
import type { Card } from '../../types/lorcana';
import type { SubstitutionRecommendation } from '../../utils/substitutions';

describe('SubstituteCardTile', () => {
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
        classifications: ['Storyborn', 'Hero', 'Rush'],
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
        classifications: ['Storyborn', 'Rush'],
        rarity: 'Rare',
        image_url: 'https://api.lorcana.ravensburger.com/images/zeus.jpg',
        formats: ['core', 'infinity'],
        prices: { usd: 0.75, usd_foil: 2.0 },
    };

    const mockSubstitute: SubstitutionRecommendation = {
        card: mockZeus,
        score: 95,
        reasons: [
            'Both have Rush',
            'Same Type (Character)',
            'Exact Cost (5)',
            'Save $17.75 (96% cheaper)',
        ],
        priceDifference: 17.75,
        percentSavings: 96,
        ownedQty: 2,
        inDeckQty: 1,
        maxCanAdd: 3,
    };

    it('renders visual tile with score overlay, savings badge, ownership, and swap action', () => {
        const handleSwap = vi.fn();
        const handleQuickAdd = vi.fn();

        render(
            <MantineProvider>
                <SubstituteCardTile
                    substitute={mockSubstitute}
                    targetCard={mockTargetMaui}
                    user={{ $id: 'user-1' }}
                    canSwap={true}
                    onSwapCard={handleSwap}
                    onQuickAdd={handleQuickAdd}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('95 pts')).toBeInTheDocument();
        expect(screen.getByText('Save $17.75 (96%)')).toBeInTheDocument();
        expect(screen.getByText('2 owned')).toBeInTheDocument();
        expect(screen.getByText('1 in deck')).toBeInTheDocument();
        expect(screen.getByText(/Both have Rush/)).toBeInTheDocument();

        // Swap button
        const swapBtn = screen.getByRole('button', { name: /Swap/i });
        fireEvent.click(swapBtn);
        expect(handleSwap).toHaveBeenCalledWith(mockZeus, 1);

        // Quick add
        const quickAddBtn = screen.getByText('+1 Coll');
        fireEvent.click(quickAddBtn);
        expect(handleQuickAdd).toHaveBeenCalledWith(mockZeus.id, 3);
    });
});
