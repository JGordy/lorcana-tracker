import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { DecksHeader } from '../DecksHeader';

describe('DecksHeader', () => {
    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <MemoryRouter>
                    <DecksHeader
                        totalDecksCount={10}
                        coreDecksCount={6}
                        infinityDecksCount={10}
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
        expect(screen.getByText('Total Decks')).toBeInTheDocument();
        expect(screen.getByText('Core')).toBeInTheDocument();
        expect(screen.getByText('Infinity')).toBeInTheDocument();
        expect(screen.getAllByText('10')).toHaveLength(2);
        expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('renders zero counts without crashing', () => {
        renderComponent({
            totalDecksCount: 0,
            coreDecksCount: 0,
            infinityDecksCount: 0,
        });
        expect(screen.getAllByText('0')).toHaveLength(3);
    });
});
