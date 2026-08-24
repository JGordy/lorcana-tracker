import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { PhysicalDeckAuditModal } from '../PhysicalDeckAuditModal';
import type { DeckAuditResult } from '../../../../../utils/deckAudit';
import type {
    Card as LorcanaCard,
    DeckWithProgress,
} from '../../../../../types/lorcana';

const mockCard: LorcanaCard = {
    $id: 'c1',
    id: 'madam-mim-fox',
    name: 'Madam Mim - Fox',
    set: 'Rise of the Floodborn',
    number: 45,
    ink_color: 'Amethyst',
    cost: 3,
    inkwell: true,
    strength: 4,
    willpower: 3,
    lore: 1,
    type: ['Character'],
    classifications: ['Storyborn'],
    rarity: 'Super Rare',
    image_url: 'https://example.com/mim.jpg',
    formats: ['core', 'infinity'],
};

const mockActiveDecks: DeckWithProgress[] = [
    {
        $id: 'deck-1',
        id: 'deck-1',
        title: 'Bounce Deck A',
        description: '',
        creator_id: 'u1',
        is_public: true,
        progress: {
            percentage: 100,
            ownedCount: 4,
            totalCount: 4,
            missingCards: [],
        },
        cards: [{ card: mockCard, requiredQty: 4, ownedQty: 3 }],
    },
    {
        $id: 'deck-2',
        id: 'deck-2',
        title: 'Bounce Deck B',
        description: '',
        creator_id: 'u1',
        is_public: true,
        progress: {
            percentage: 100,
            ownedCount: 4,
            totalCount: 4,
            missingCards: [],
        },
        cards: [{ card: mockCard, requiredQty: 4, ownedQty: 2 }],
    },
];

const mockAuditResultConflicts: DeckAuditResult = {
    activeDecksCount: 2,
    totalActiveCardsCount: 8,
    totalConflictCardsCount: 1,
    totalDeficitCount: 3,
    is100PercentBuildable: false,
    conflicts: [
        {
            card: mockCard,
            totalRequired: 8,
            totalOwned: 5,
            deficit: 3,
            decks: [
                {
                    deckId: 'deck-1',
                    deckTitle: 'Bounce Deck A',
                    requiredQty: 4,
                },
                {
                    deckId: 'deck-2',
                    deckTitle: 'Bounce Deck B',
                    requiredQty: 4,
                },
            ],
        },
    ],
};

const mockAuditResultNoConflicts: DeckAuditResult = {
    activeDecksCount: 2,
    totalActiveCardsCount: 8,
    totalConflictCardsCount: 0,
    totalDeficitCount: 0,
    is100PercentBuildable: true,
    conflicts: [],
};

function renderModal(props = {}) {
    const defaultProps = {
        opened: true,
        onClose: vi.fn(),
        auditResult: mockAuditResultConflicts,
        activeDecks: mockActiveDecks,
        user: { $id: 'user-1' },
        onQuickAdd: vi.fn(),
    };

    return render(
        <MantineProvider>
            <PhysicalDeckAuditModal {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('PhysicalDeckAuditModal', () => {
    it('renders the modal title and active decks count badge', () => {
        renderModal();
        expect(screen.getByText('Physical Deck Audit')).toBeInTheDocument();
        expect(screen.getByText('2 Active Decks')).toBeInTheDocument();
    });

    it('renders conflict warning banner when card conflicts exist', () => {
        renderModal();
        expect(
            screen.getByText(/1 Card Conflicts Across 2 Active Decks/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/Short 3 total copies/i)).toBeInTheDocument();
    });

    it('renders 100% buildable banner when no conflicts exist', () => {
        renderModal({ auditResult: mockAuditResultNoConflicts });
        expect(
            screen.getByText('100% Physically Buildable!'),
        ).toBeInTheDocument();
    });

    it('renders empty active decks banner when activeDecks is empty', () => {
        const emptyAudit: DeckAuditResult = {
            activeDecksCount: 0,
            totalActiveCardsCount: 0,
            totalConflictCardsCount: 0,
            totalDeficitCount: 0,
            is100PercentBuildable: false,
            conflicts: [],
        };
        renderModal({ auditResult: emptyAudit, activeDecks: [] });
        expect(
            screen.getByText(/No Decks Marked as "Physically Built"/i),
        ).toBeInTheDocument();
    });

    it('renders conflict cards in grid with deficit badge and per-deck breakdown', () => {
        renderModal();
        expect(screen.getByText('Madam Mim - Fox')).toBeInTheDocument();
        expect(screen.getByText('Short 3')).toBeInTheDocument();
        expect(screen.getByText('Bounce Deck A (4×)')).toBeInTheDocument();
        expect(screen.getByText('Bounce Deck B (4×)')).toBeInTheDocument();
    });

    it('copies TCGPlayer shopping list when button clicked', () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

        renderModal();
        const copyBtn = screen.getByText('Copy Missing Physical Cards');
        fireEvent.click(copyBtn);
        expect(writeTextMock).toHaveBeenCalledWith('3 Madam Mim - Fox');
    });

    it('copies proxy list when button clicked', () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

        renderModal();
        const copyProxyBtn = screen.getByText('Copy Proxy Print List');
        fireEvent.click(copyProxyBtn);
        expect(writeTextMock).toHaveBeenCalledWith(
            expect.stringContaining(
                'LORCANA TRACKER - PHYSICAL DECK PROXY PRINT LIST',
            ),
        );
    });
});
