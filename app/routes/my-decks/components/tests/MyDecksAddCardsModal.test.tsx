import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksAddCardsModal } from '../modals/MyDecksAddCardsModal';

afterEach(cleanup);

const mockCards = [
    {
        id: 'c1',
        name: 'Stitch - Rock Star',
        set: 'The First Chapter',
        number: 23,
        ink_color: 'Amber',
        cost: 6,
        rarity: 'Super Rare',
        image_url: 'https://example.com/stitch.png',
    },
    {
        id: 'c2',
        name: "Pascal - Rapunzel's Companion",
        set: 'The First Chapter',
        number: 45,
        ink_color: 'Emerald',
        cost: 1,
        rarity: 'Common',
        image_url: undefined,
    },
];

const mockDeckCardsMap = new Map<string, number>([
    ['c1', 2],
    ['c2', 4],
]);

const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    searchQuery: '',
    onSearchQueryChange: vi.fn(),
    inkFilter: 'all',
    onInkFilterChange: vi.fn(),
    typeFilter: 'all',
    onTypeFilterChange: vi.fn(),
    onlyCoreFilter: false,
    onOnlyCoreFilterChange: vi.fn(),
    filteredCards: mockCards,
    activeDeckCardsMap: mockDeckCardsMap,
    onUpdateCardQty: vi.fn(),
};

function renderModal(props = {}) {
    return render(
        <MantineProvider>
            <MyDecksAddCardsModal {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDecksAddCardsModal', () => {
    it('renders modal header, search bar, and filter controls', () => {
        renderModal();
        expect(screen.getByText('Add Cards to Deck')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Search by card name...'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Core Only')).toBeInTheDocument();
        expect(screen.getByText('All Inks')).toBeInTheDocument();
        expect(screen.getByText('All Types')).toBeInTheDocument();
    });

    it('renders card items with name and set info', () => {
        renderModal();
        expect(screen.getByText('Stitch - Rock Star')).toBeInTheDocument();
        expect(screen.getByText('The First Chapter • #23')).toBeInTheDocument();

        expect(
            screen.getAllByText("Pascal - Rapunzel's Companion").length,
        ).toBeGreaterThan(0);
        expect(screen.getByText('The First Chapter • #45')).toBeInTheDocument();
    });

    it('calls onSearchQueryChange when typing in the search input', async () => {
        const onSearchQueryChange = vi.fn();
        renderModal({ onSearchQueryChange });
        const input = screen.getByPlaceholderText('Search by card name...');
        fireEvent.change(input, { target: { value: 'Stitch' } });
        await vi.waitFor(
            () => {
                expect(onSearchQueryChange).toHaveBeenCalledWith('Stitch');
            },
            { timeout: 3000 },
        );
    });

    it('calls onOnlyCoreFilterChange when clicking the Core Only checkbox', () => {
        const onOnlyCoreFilterChange = vi.fn();
        renderModal({ onOnlyCoreFilterChange });
        const checkbox = screen.getByLabelText('Core Only');
        fireEvent.click(checkbox);
        expect(onOnlyCoreFilterChange).toHaveBeenCalledWith(true);
    });

    it('calls onUpdateCardQty with +1 when plus button is clicked', () => {
        const onUpdateCardQty = vi.fn();
        renderModal({ onUpdateCardQty });
        const increaseBtn = screen.getByRole('button', {
            name: /Increase Stitch - Rock Star/i,
        });
        fireEvent.click(increaseBtn);
        expect(onUpdateCardQty).toHaveBeenCalledWith('c1', 1);
    });

    it('calls onUpdateCardQty with -1 when minus button is clicked', () => {
        const onUpdateCardQty = vi.fn();
        renderModal({ onUpdateCardQty });
        const decreaseBtn = screen.getByRole('button', {
            name: /Decrease Stitch - Rock Star/i,
        });
        fireEvent.click(decreaseBtn);
        expect(onUpdateCardQty).toHaveBeenCalledWith('c1', -1);
    });

    it('disables plus button when quantity reaches max of 4', () => {
        renderModal();
        const increaseBtn = screen.getByRole('button', {
            name: /Increase Pascal - Rapunzel's Companion/i,
        });
        expect(increaseBtn).toBeDisabled();
    });

    it('renders deck inks option when deckInks prop has multiple inks', () => {
        renderModal({
            deckInks: ['amber', 'sapphire'],
            inkFilter: 'deck',
        });
        expect(
            screen.getByText('Deck Inks (Amber / Sapphire)'),
        ).toBeInTheDocument();
    });

    it('renders single deck ink option when deckInks has one ink', () => {
        renderModal({
            deckInks: ['steel'],
            inkFilter: 'deck',
        });
        expect(screen.getByText('Deck Inks (Steel)')).toBeInTheDocument();
    });

    it('does not render deck inks option when deckInks is empty', () => {
        renderModal({
            deckInks: [],
            inkFilter: 'all',
        });
        expect(screen.queryByText(/Deck Inks/i)).not.toBeInTheDocument();
        expect(screen.getByText('All Inks')).toBeInTheDocument();
    });

    it('calls onTypeFilterChange when type select changes', () => {
        const onTypeFilterChange = vi.fn();
        renderModal({ onTypeFilterChange });
        expect(screen.getByText('All Types')).toBeInTheDocument();
    });

    it('calls onClose when Done Adding Cards button is clicked', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.click(screen.getByText('Done Adding Cards'));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
