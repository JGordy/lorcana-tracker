import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DecksToolbar } from '../DecksToolbar';

describe('DecksToolbar', () => {
    const mockNavigate = vi.fn();
    const mockSetSearchChange = vi.fn();
    const mockOpenImportModal = vi.fn();

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <DecksToolbar
                    searchQuery=""
                    onSearchChange={mockSetSearchChange}
                    sort="progress"
                    navigate={mockNavigate}
                    activeCount={5}
                    user={null}
                    onOpenImportModal={mockOpenImportModal}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders search input, sort select, and active count badge', () => {
        renderComponent();
        expect(
            screen.getByPlaceholderText('Search meta decks...'),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('Highest Match %')).toBeInTheDocument();
        expect(screen.getByText('5 Decks')).toBeInTheDocument();
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
