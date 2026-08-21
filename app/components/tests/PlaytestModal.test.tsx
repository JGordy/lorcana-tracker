import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { PlaytestModal } from '../PlaytestModal';
import type { Card } from '../../types/lorcana';

describe('PlaytestModal', () => {
    const mockCardA: Card = {
        $id: 'c1',
        id: 'c1',
        name: 'Stitch - Rock Star',
        set: 'The First Chapter',
        number: 1,
        ink_color: 'Amber',
        cost: 6,
        inkwell: true,
        strength: 3,
        willpower: 5,
        lore: 3,
        type: ['Character'],
        classifications: ['Floodborn', 'Hero'],
        rarity: 'Super Rare',
        image_url: 'https://example.com/stitch.jpg',
        formats: ['core', 'infinity'],
    };

    const mockCardB: Card = {
        $id: 'c2',
        id: 'c2',
        name: 'Dragon Fire',
        set: 'The First Chapter',
        number: 2,
        ink_color: 'Ruby',
        cost: 5,
        inkwell: false,
        strength: null,
        willpower: null,
        lore: 0,
        type: ['Action'],
        classifications: [],
        rarity: 'Uncommon',
        image_url: 'https://example.com/dragonfire.jpg',
        formats: ['core', 'infinity'],
    };

    const mockDeck = {
        $id: 'deck-1',
        title: 'Amber Ruby Control',
        isCoreLegal: true,
        cards: [
            { card: mockCardA, requiredQty: 10, ownedQty: 10 },
            { card: mockCardB, requiredQty: 10, ownedQty: 10 },
        ],
    };

    const renderModal = (props: any = {}) => {
        const onClose = vi.fn();
        const utils = render(
            <MantineProvider>
                <PlaytestModal
                    opened={true}
                    onClose={onClose}
                    deck={mockDeck}
                    {...props}
                />
            </MantineProvider>,
        );
        return { ...utils, onClose };
    };

    it('renders modal header, deck title, and dealt opening hand', () => {
        renderModal();
        expect(screen.getByText('Amber Ruby Control')).toBeInTheDocument();
        expect(screen.getByText('Alter Phase')).toBeInTheDocument();
        expect(screen.getByText('13 in Deck')).toBeInTheDocument(); // 20 - 7 = 13
    });

    it('toggles cards for alter on click', () => {
        renderModal();
        const cards = screen.getAllByTitle(/Stitch - Rock Star|Dragon Fire/);
        expect(cards.length).toBeGreaterThanOrEqual(7);

        // Click the first card container
        const firstCardEl = cards[0].closest('.mantine-Card-root');
        expect(firstCardEl).toBeInTheDocument();
        if (firstCardEl) {
            fireEvent.click(firstCardEl);
            expect(screen.getByText('Alter Selected (1)')).toBeInTheDocument();
            expect(screen.getByText('ALTER')).toBeInTheDocument();
        }
    });

    it('executes alter and transitions into turn progression phase', () => {
        renderModal();
        const keepBtn = screen.getByText('Keep Hand (0 Alter)');
        fireEvent.click(keepBtn);

        // Once altered/kept, Alter Phase should lock and Turn controls appear
        expect(screen.getByText('Alter Phase Locked')).toBeInTheDocument();
        expect(screen.getByText('Draw Next Turn (Turn 2)')).toBeInTheDocument();
    });

    it('advances turns when Draw Next Turn is clicked', () => {
        renderModal();
        // Keep hand first to lock alter
        fireEvent.click(screen.getByText('Keep Hand (0 Alter)'));

        const drawBtn = screen.getByText('Draw Next Turn (Turn 2)');
        fireEvent.click(drawBtn);

        expect(screen.getByText('Draw Next Turn (Turn 3)')).toBeInTheDocument();
        expect(screen.getByText('12 in Deck')).toBeInTheDocument(); // 13 - 1 = 12
    });

    it('resets hand when New Hand is clicked', () => {
        renderModal();
        fireEvent.click(screen.getByText('Keep Hand (0 Alter)'));
        expect(screen.getByText('Alter Phase Locked')).toBeInTheDocument();

        const newHandBtn = screen.getByText('New Hand');
        fireEvent.click(newHandBtn);

        expect(screen.getByText('Alter Phase')).toBeInTheDocument();
    });

    it('returns null when deck is not provided', () => {
        const { container } = render(
            <MantineProvider>
                <PlaytestModal opened={true} onClose={vi.fn()} deck={null} />
            </MantineProvider>,
        );
        expect(container.querySelector('.mantine-Modal-root')).toBeNull();
    });
});
