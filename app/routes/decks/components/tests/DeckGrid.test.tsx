import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DeckGrid } from '../DeckGrid';

describe('DeckGrid', () => {
    const mockCloneFetcher: any = { state: 'idle' };

    it('renders tabs and empty state when no decks match', () => {
        render(
            <MantineProvider>
                <DeckGrid
                    coreDecks={[]}
                    infinityDecks={[]}
                    cloneFetcher={mockCloneFetcher}
                    copyFeedback={null}
                    onOpenViewModal={vi.fn()}
                    onCloneDeck={vi.fn()}
                    onExportDeck={vi.fn()}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('Core Constructed (0)')).toBeInTheDocument();
        expect(screen.getByText('Infinity Constructed (0)')).toBeInTheDocument();
        expect(
            screen.getByText('No decks found matching your filters in this format.'),
        ).toBeInTheDocument();
    });
});
