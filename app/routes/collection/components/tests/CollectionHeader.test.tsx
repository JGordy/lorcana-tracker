import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CollectionHeader } from '../CollectionHeader';

describe('CollectionHeader', () => {
    it('renders header title and metric totals correctly', () => {
        render(
            <MantineProvider>
                <CollectionHeader
                    totals={{ totalCardsOwned: 45, uniqueCardsCount: 20 }}
                    totalCatalogCards={100}
                />
            </MantineProvider>,
        );

        expect(screen.getByText('My Collection')).toBeDefined();
        expect(screen.getByText('45')).toBeDefined();
        expect(screen.getByText('20')).toBeDefined();
        expect(screen.getByText('20%')).toBeDefined();
        expect(screen.getByText('(20 / 100)')).toBeDefined();
    });
});
