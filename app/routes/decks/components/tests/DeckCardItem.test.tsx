import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DeckCardItem } from '../DeckCardItem';

describe('DeckCardItem', () => {
    const mockCloneFetcher: any = { state: 'idle' };
    const mockOpenViewModal = vi.fn();
    const mockCloneDeck = vi.fn();
    const mockExportDeck = vi.fn();

    const mockDeck: any = {
        $id: 'deck-1',
        title: 'Amber Ruby Aggro',
        description: 'Fast aggro deck',
        is_trending: true,
        isCoreLegal: true,
        cards: [
            {
                card: { id: 'c1', name: 'Stitch', set: 'The First Chapter', ink_color: 'Amber' },
                requiredQty: 4,
            },
        ],
        progress: {
            percentage: 100,
            ownedCount: 60,
            totalCount: 60,
            missingCards: [],
        },
    };

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <DeckCardItem
                    deck={mockDeck}
                    cloneFetcher={mockCloneFetcher}
                    copyFeedback={null}
                    onOpenViewModal={mockOpenViewModal}
                    onCloneDeck={mockCloneDeck}
                    onExportDeck={mockExportDeck}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders deck title, progress, and badges', () => {
        renderComponent();
        expect(screen.getByText('Amber Ruby Aggro')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('Trending')).toBeInTheDocument();
        expect(screen.getByText('Core')).toBeInTheDocument();
    });

    it('triggers view modal callback on View Decklist button click', () => {
        renderComponent();
        fireEvent.click(screen.getByText('View Decklist'));
        expect(mockOpenViewModal).toHaveBeenCalledWith('deck-1');
    });
});
