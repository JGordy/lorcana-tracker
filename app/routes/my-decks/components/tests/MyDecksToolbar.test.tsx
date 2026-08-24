import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksToolbar } from '../MyDecksToolbar';

const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    sort: 'progress',
    navigate: vi.fn(),
    activeCount: 5,
    user: { $id: 'user_1' },
    onOpenCreateModal: vi.fn(),
    onOpenImportModal: vi.fn(),
};

function renderToolbar(props = {}) {
    return render(
        <MantineProvider>
            <MyDecksToolbar {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDecksToolbar', () => {
    it('renders the search input, action buttons, and sort select', () => {
        renderToolbar();
        expect(
            screen.getByPlaceholderText(
                'Search personal decks by name or notes...',
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('New Deck')).toBeInTheDocument();
        expect(screen.getByText('Import')).toBeInTheDocument();
        expect(screen.getByText('Highest Match %')).toBeInTheDocument();
    });

    it('triggers onOpenCreateModal when New Deck button is clicked', () => {
        const onOpenCreateModal = vi.fn();
        renderToolbar({ onOpenCreateModal });
        fireEvent.click(screen.getByText('New Deck'));
        expect(onOpenCreateModal).toHaveBeenCalledOnce();
    });

    it('triggers onOpenImportModal when Import button is clicked', () => {
        const onOpenImportModal = vi.fn();
        renderToolbar({ onOpenImportModal });
        fireEvent.click(screen.getByText('Import'));
        expect(onOpenImportModal).toHaveBeenCalledOnce();
    });

    it('disables New Deck button when user is not logged in', () => {
        renderToolbar({ user: null });
        expect(screen.getByText('New Deck').closest('button')).toBeDisabled();
    });

    it('calls onSearchChange when typing in the search input', () => {
        const onSearchChange = vi.fn();
        renderToolbar({ onSearchChange });
        const input = screen.getByPlaceholderText(
            'Search personal decks by name or notes...',
        );
        fireEvent.change(input, { target: { value: 'ruby' } });
        expect(onSearchChange).toHaveBeenCalledWith('ruby');
    });

    it('shows a clear button when searchQuery is non-empty', () => {
        renderToolbar({ searchQuery: 'amber' });
        expect(screen.getByTitle('Clear search')).toBeInTheDocument();
    });

    it('calls onSearchChange with empty string when clear button is clicked', () => {
        const onSearchChange = vi.fn();
        renderToolbar({ searchQuery: 'amber', onSearchChange });
        fireEvent.click(screen.getByTitle('Clear search'));
        expect(onSearchChange).toHaveBeenCalledWith('');
    });

    it('does not show clear button when searchQuery is empty', () => {
        renderToolbar({ searchQuery: '' });
        expect(screen.queryByTitle('Clear search')).not.toBeInTheDocument();
    });

    it('renders Deck Audit button when onOpenAuditModal is provided', () => {
        const onOpenAuditModal = vi.fn();
        renderToolbar({
            onOpenAuditModal,
            conflictCount: 2,
            physicallyBuiltCount: 3,
        });
        expect(screen.getByText('Deck Audit')).toBeInTheDocument();
        expect(screen.getByText('2 Conflicts')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Deck Audit'));
        expect(onOpenAuditModal).toHaveBeenCalledOnce();
    });
});
