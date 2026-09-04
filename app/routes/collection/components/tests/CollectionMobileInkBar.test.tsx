import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { CollectionMobileInkBar, INK_LIST } from '../CollectionMobileInkBar';

describe('CollectionMobileInkBar', () => {
    it('renders all 6 ink icons', () => {
        const setSelectedInks = vi.fn();
        render(
            <MantineProvider>
                <CollectionMobileInkBar
                    selectedInks={[]}
                    setSelectedInks={setSelectedInks}
                />
            </MantineProvider>,
        );

        INK_LIST.forEach((ink) => {
            const inkImg = screen.getByAltText(ink.name);
            expect(inkImg).toBeInTheDocument();
            const btn = screen.getByLabelText(`Filter by ${ink.name} ink`);
            expect(btn).toBeInTheDocument();
            expect(btn).toHaveAttribute('aria-pressed', 'false');
        });

        // No clear button when no inks are selected
        expect(
            screen.queryByTitle('Clear ink filters'),
        ).not.toBeInTheDocument();
    });

    it('handles selecting an ink color', () => {
        const setSelectedInks = vi.fn();
        render(
            <MantineProvider>
                <CollectionMobileInkBar
                    selectedInks={[]}
                    setSelectedInks={setSelectedInks}
                />
            </MantineProvider>,
        );

        const amberBtn = screen.getByLabelText('Filter by Amber ink');
        fireEvent.click(amberBtn);

        expect(setSelectedInks).toHaveBeenCalled();
        const updater = setSelectedInks.mock.calls[0][0];
        expect(typeof updater).toBe('function');
        expect(updater([])).toEqual(['Amber']);
    });

    it('handles deselecting an already selected ink color', () => {
        const setSelectedInks = vi.fn();
        render(
            <MantineProvider>
                <CollectionMobileInkBar
                    selectedInks={['Amber', 'Amethyst']}
                    setSelectedInks={setSelectedInks}
                />
            </MantineProvider>,
        );

        const amberBtn = screen.getByLabelText('Filter by Amber ink');
        expect(amberBtn).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(amberBtn);

        expect(setSelectedInks).toHaveBeenCalled();
        const updater = setSelectedInks.mock.calls[0][0];
        expect(updater(['Amber', 'Amethyst'])).toEqual(['Amethyst']);
    });

    it('respects maximum ink selection limit of 3', () => {
        const setSelectedInks = vi.fn();
        render(
            <MantineProvider>
                <CollectionMobileInkBar
                    selectedInks={['Amber', 'Amethyst', 'Emerald']}
                    setSelectedInks={setSelectedInks}
                />
            </MantineProvider>,
        );

        const rubyBtn = screen.getByLabelText('Filter by Ruby ink');
        fireEvent.click(rubyBtn);

        // Should not add fourth ink
        expect(setSelectedInks).not.toHaveBeenCalled();
    });

    it('renders clear button and clears selected inks when clicked', () => {
        const setSelectedInks = vi.fn();
        render(
            <MantineProvider>
                <CollectionMobileInkBar
                    selectedInks={['Ruby']}
                    setSelectedInks={setSelectedInks}
                />
            </MantineProvider>,
        );

        const clearBtn = screen.getByTitle('Clear ink filters');
        expect(clearBtn).toBeInTheDocument();

        fireEvent.click(clearBtn);
        expect(setSelectedInks).toHaveBeenCalledWith([]);
    });

    it('supports keyboard navigation with Enter or Space key', () => {
        const setSelectedInks = vi.fn();
        render(
            <MantineProvider>
                <CollectionMobileInkBar
                    selectedInks={[]}
                    setSelectedInks={setSelectedInks}
                />
            </MantineProvider>,
        );

        const sapphireBtn = screen.getByLabelText('Filter by Sapphire ink');
        fireEvent.keyDown(sapphireBtn, { key: ' ' });

        expect(setSelectedInks).toHaveBeenCalled();
    });

    it('respects custom maxInks prop limit', () => {
        const setSelectedInks = vi.fn();
        render(
            <MantineProvider>
                <CollectionMobileInkBar
                    selectedInks={['Amber', 'Amethyst']}
                    setSelectedInks={setSelectedInks}
                    maxInks={2}
                />
            </MantineProvider>,
        );

        const emeraldBtn = screen.getByLabelText('Filter by Emerald ink');
        fireEvent.click(emeraldBtn);

        expect(setSelectedInks).not.toHaveBeenCalled();
    });

    it('renders with size="md" without error', () => {
        const setSelectedInks = vi.fn();
        render(
            <MantineProvider>
                <CollectionMobileInkBar
                    selectedInks={['Amber']}
                    setSelectedInks={setSelectedInks}
                    size="md"
                />
            </MantineProvider>,
        );

        expect(screen.getByAltText('Amber')).toBeInTheDocument();
        expect(screen.getByTitle('Clear ink filters')).toBeInTheDocument();
    });
});
