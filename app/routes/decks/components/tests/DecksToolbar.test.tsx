import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DecksToolbar } from '../DecksToolbar';

describe('DecksToolbar', () => {
    const mockNavigate = vi.fn();
    const mockSetSearchChange = vi.fn();
    const mockOpenImportModal = vi.fn();
    const mockOnCompletionChange = vi.fn();

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <DecksToolbar
                    searchQuery=""
                    onSearchChange={mockSetSearchChange}
                    sort="progress"
                    completion="all"
                    onCompletionChange={mockOnCompletionChange}
                    completionCounts={{
                        all: 5,
                        ready: 1,
                        near: 2,
                        in_progress: 2,
                    }}
                    navigate={mockNavigate}
                    activeCount={5}
                    user={null}
                    onOpenImportModal={mockOpenImportModal}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders search input, sort select, active count badge, and completion segments', () => {
        renderComponent();
        expect(
            screen.getByPlaceholderText('Search meta decks...'),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('Highest Match %')).toBeInTheDocument();
        expect(screen.getByText('5 Decks')).toBeInTheDocument();
        expect(screen.getByText('All Decks (5)')).toBeInTheDocument();
        expect(screen.getByText('Ready to Play (1)')).toBeInTheDocument();
        expect(screen.getByText('Near Complete (2)')).toBeInTheDocument();
        expect(screen.getByText('In Progress (2)')).toBeInTheDocument();
    });

    it('triggers onCompletionChange when clicking a completion filter option', () => {
        renderComponent();
        const readyChip = screen.getByText('Ready to Play (1)');
        fireEvent.click(readyChip);
        expect(mockOnCompletionChange).toHaveBeenCalledWith('ready');
    });

    it('allows typing into search input', () => {
        renderComponent();
        const input = screen.getByPlaceholderText('Search meta decks...');
        fireEvent.change(input, { target: { value: 'Ruby' } });
        expect(mockSetSearchChange).toHaveBeenCalledWith('Ruby');
    });

    it('shows Import Deck button when user is logged in', () => {
        renderComponent({ user: { $id: 'user-1' } });
        const importBtn = screen.getByText('Import Deck');
        expect(importBtn).toBeInTheDocument();
        fireEvent.click(importBtn);
        expect(mockOpenImportModal).toHaveBeenCalled();
    });

    it('hides Import Deck button for guest user', () => {
        renderComponent({ user: null });
        expect(screen.queryByText('Import Deck')).not.toBeInTheDocument();
    });
});
