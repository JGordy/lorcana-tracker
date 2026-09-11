import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ScannedCardDrawer } from '../ScannedCardDrawer';
import type { Card } from '../../../../types/lorcana';

const mockCard: Card = {
    $id: 'rex-protective-dinosaur',
    id: 'rex-protective-dinosaur',
    name: 'Rex - Protective Dinosaur',
    set: 'Wilds Unknown',
    number: 10,
    ink_color: 'Amber',
    cost: 2,
    inkwell: true,
    strength: 3,
    willpower: 1,
    lore: 1,
    type: ['Character'],
    classifications: ['Storyborn', 'Hero', 'Dinosaur'],
    rarity: 'Uncommon',
    image_url: 'https://api.lorcana.ravensburger.com/images/en/set7/10.jpg',
    formats: ['core', 'infinity'],
    prices: {
        usd: 1.39,
        usd_foil: 3.5,
    },
};

describe('ScannedCardDrawer component', () => {
    const renderDrawer = (
        props: Partial<React.ComponentProps<typeof ScannedCardDrawer>> = {},
    ) => {
        const defaultProps = {
            opened: true,
            onClose: vi.fn(),
            card: mockCard,
            normalQty: 2,
            foilQty: 1,
            onAdjustQuantity: vi.fn(),
            ...props,
        };

        return {
            ...render(
                <MantineProvider>
                    <ScannedCardDrawer {...defaultProps} />
                </MantineProvider>,
            ),
            props: defaultProps,
        };
    };

    it('renders nothing when card is null', () => {
        renderDrawer({ card: null });
        expect(screen.queryByText('Rex - Protective Dinosaur')).toBeNull();
    });

    it('renders card title, set info, rarity, and card image', () => {
        renderDrawer();
        expect(
            screen.getByText('Rex - Protective Dinosaur'),
        ).toBeInTheDocument();
        expect(screen.getByText('Wilds Unknown • #10')).toBeInTheDocument();
        expect(screen.getByText('Uncommon')).toBeInTheDocument();
        expect(
            screen.getByAltText('Rex - Protective Dinosaur'),
        ).toBeInTheDocument();
    });

    it('displays formatted market prices for normal and foil', () => {
        renderDrawer();
        expect(screen.getByText('$1.39')).toBeInTheDocument();
        expect(screen.getByText('$3.50')).toBeInTheDocument();
    });

    it('renders regular and foil inventory quantities', () => {
        renderDrawer({ normalQty: 4, foilQty: 2 });
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('calls onAdjustQuantity when clicking regular quantity plus and minus', () => {
        const onAdjustQuantity = vi.fn();
        renderDrawer({ normalQty: 1, onAdjustQuantity });

        const plusBtn = screen.getByLabelText('Increase regular quantity');
        fireEvent.click(plusBtn);
        expect(onAdjustQuantity).toHaveBeenCalledWith(
            'rex-protective-dinosaur',
            1,
            false,
        );

        const minusBtn = screen.getByLabelText('Decrease regular quantity');
        fireEvent.click(minusBtn);
        expect(onAdjustQuantity).toHaveBeenCalledWith(
            'rex-protective-dinosaur',
            -1,
            false,
        );
    });

    it('disables minus button when regular quantity is 0', () => {
        renderDrawer({ normalQty: 0, foilQty: 1 });
        const minusBtn = screen.getByLabelText('Decrease regular quantity');
        expect(minusBtn).toBeDisabled();
    });

    it('calls onAdjustQuantity with isFoil=true when clicking foil plus and minus', () => {
        const onAdjustQuantity = vi.fn();
        renderDrawer({ normalQty: 0, foilQty: 3, onAdjustQuantity });

        const plusBtn = screen.getByLabelText('Increase foil quantity');
        fireEvent.click(plusBtn);
        expect(onAdjustQuantity).toHaveBeenCalledWith(
            'rex-protective-dinosaur',
            1,
            true,
        );

        const minusBtn = screen.getByLabelText('Decrease foil quantity');
        fireEvent.click(minusBtn);
        expect(onAdjustQuantity).toHaveBeenCalledWith(
            'rex-protective-dinosaur',
            -1,
            true,
        );
    });

    it('calls onClose when clicking close X button', () => {
        const onClose = vi.fn();
        renderDrawer({ onClose });

        const closeBtn = screen.getByLabelText('Close drawer');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking "Keep Scanning" button', () => {
        const onClose = vi.fn();
        renderDrawer({ onClose });

        const keepScanningBtn = screen.getByRole('button', {
            name: /keep scanning/i,
        });
        fireEvent.click(keepScanningBtn);
        expect(onClose).toHaveBeenCalled();
    });

    it('renders other standard base printings and calls onSelectCard when clicked', () => {
        const onSelectCard = vi.fn();
        const altPrinting: Card = {
            ...mockCard,
            id: 'rex-protective-dinosaur-s8',
            number: 15,
            set: 'Shimmering Skies',
            rarity: 'Uncommon',
            prices: { usd: 1.1, usd_foil: 2.5 },
        };
        renderDrawer({
            allCards: [mockCard, altPrinting],
            onSelectCard,
        });

        expect(screen.getByText('Printings:')).toBeInTheDocument();
        const altBadge = screen.getByText(/Uncommon #15/);
        expect(altBadge).toBeInTheDocument();

        fireEvent.click(altBadge);
        expect(onSelectCard).toHaveBeenCalledWith(altPrinting);
    });

    it('does not display base-level printings or pricing when viewing a unique card (e.g. Epic / Enchanted)', () => {
        const epicCard: Card = {
            ...mockCard,
            id: 'anna-braving-the-storm-9-218',
            name: 'Anna - Braving the Storm',
            number: 218,
            set: 'Fabled',
            rarity: 'Epic',
            prices: { usd: null, usd_foil: 15.77 },
        };
        const commonPrinting1: Card = {
            ...mockCard,
            id: 'anna-braving-the-storm-4-137',
            name: 'Anna - Braving the Storm',
            number: 137,
            set: "Ursula's Return",
            rarity: 'Common',
            prices: { usd: 0.28, usd_foil: 0.85 },
        };
        const commonPrinting2: Card = {
            ...mockCard,
            id: 'anna-braving-the-storm-9-146',
            name: 'Anna - Braving the Storm',
            number: 146,
            set: 'Fabled',
            rarity: 'Common',
            prices: { usd: 0.2, usd_foil: 0.5 },
        };

        renderDrawer({
            card: epicCard,
            allCards: [epicCard, commonPrinting1, commonPrinting2],
        });

        // Printings section with base cards should not be shown on unique card
        expect(screen.queryByText('Printings:')).toBeNull();
        expect(screen.queryByText(/Common #137/i)).toBeNull();
        expect(screen.queryByText(/Common #146/i)).toBeNull();
    });

    it('only renders foil quantity controls for foil-only cards', () => {
        const epicCard: Card = {
            ...mockCard,
            id: 'anna-braving-the-storm-9-218',
            name: 'Anna - Braving the Storm',
            number: 218,
            rarity: 'Epic',
            prices: { usd: null, usd_foil: 15.77 },
        };

        renderDrawer({ card: epicCard, normalQty: 0, foilQty: 2 });

        expect(screen.queryByText('Regular Copy')).toBeNull();
        expect(screen.getByText('Foil Copy')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });
});
