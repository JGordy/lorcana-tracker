import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksHeader } from '../MyDecksHeader';

describe('MyDecksHeader', () => {
    it('renders hero title and metrics correctly', () => {
        render(
            <MantineProvider>
                <MyDecksHeader
                    totalDecksCount={5}
                    readyToPlayCount={2}
                    inProgressCount={3}
                    searchQuery=""
                    onSearchChange={vi.fn()}
                    sort="progress"
                    navigate={vi.fn()}
                    user={{ $id: 'u1' }}
                    onOpenCreateModal={vi.fn()}
                    onOpenImportModal={vi.fn()}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('My Custom Decks')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });
});
