import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { DecksHeader } from '../DecksHeader';

describe('DecksHeader', () => {
    const mockOpenImportModal = vi.fn();

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <MemoryRouter>
                    <DecksHeader
                        totalDecksCount={10}
                        coreDecksCount={6}
                        infinityDecksCount={10}
                        user={null}
                        onOpenImportModal={mockOpenImportModal}
                        {...props}
                    />
                </MemoryRouter>
            </MantineProvider>,
        );
    };

    it('renders hero title, description, and metric cards', () => {
        renderComponent();
        expect(
            screen.getByText('Disney Lorcana Metagame Deck Matcher'),
        ).toBeInTheDocument();
        expect(screen.getByText('Total Meta Decks')).toBeInTheDocument();
        expect(screen.getByText('Core Constructed')).toBeInTheDocument();
        expect(screen.getByText('Infinity Constructed')).toBeInTheDocument();
        expect(screen.getAllByText('10')).toHaveLength(2);
        expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('shows Import Deck button in hero when user is logged in', () => {
        renderComponent({ user: { $id: 'user-1' } });
        const importBtn = screen.getByText('Import Deck');
        expect(importBtn).toBeInTheDocument();
        fireEvent.click(importBtn);
        expect(mockOpenImportModal).toHaveBeenCalled();
    });

    it('hides Import Deck button in hero for guest user', () => {
        renderComponent({ user: null });
        expect(screen.queryByText('Import Deck')).not.toBeInTheDocument();
    });
});
