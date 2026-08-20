import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DecksHeader } from '../DecksHeader';

describe('DecksHeader', () => {
    const mockNavigate = vi.fn();
    const mockSetSearchQuery = vi.fn();
    const mockOpenImportModal = vi.fn();

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <DecksHeader
                    searchQuery=""
                    setSearchQuery={mockSetSearchQuery}
                    sort="progress"
                    navigate={mockNavigate}
                    user={null}
                    onOpenImportModal={mockOpenImportModal}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders hero title and search input', () => {
        renderComponent();
        expect(
            screen.getByText('Disney Lorcana Metagame Deck Matcher'),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Search meta decks...'),
        ).toBeInTheDocument();
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
