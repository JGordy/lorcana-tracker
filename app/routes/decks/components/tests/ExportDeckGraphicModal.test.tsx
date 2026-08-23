import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ExportDeckGraphicModal } from '../ExportDeckGraphicModal';
import * as htmlToImage from 'html-to-image';

vi.mock('html-to-image', () => ({
    toPng: vi.fn().mockResolvedValue('data:image/png;base64,fakeData'),
    toBlob: vi
        .fn()
        .mockResolvedValue(new Blob(['fake'], { type: 'image/png' })),
}));

describe('ExportDeckGraphicModal', () => {
    const mockOnClose = vi.fn();
    const mockDeck: any = {
        $id: 'deck-1',
        title: 'Sapphire Steel Ramp',
        author: 'Illumineer',
        displayInks: ['sapphire', 'steel'],
        isCoreLegal: true,
        cards: [
            {
                card: {
                    id: 'c1',
                    name: 'One Jump Ahead',
                    ink_color: 'Sapphire',
                    cost: 2,
                    inkwell: true,
                    type: ['Action', 'Song'],
                },
                requiredQty: 4,
            },
            {
                card: {
                    id: 'c2',
                    name: 'A Whole New World',
                    ink_color: 'Steel',
                    cost: 5,
                    inkwell: true,
                    type: ['Action', 'Song'],
                },
                requiredQty: 4,
            },
        ],
    };

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <ExportDeckGraphicModal
                    opened={true}
                    onClose={mockOnClose}
                    deck={mockDeck}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders export modal with title, graphic preview, sorting options, and column stepper', () => {
        renderComponent();
        expect(
            screen.getByText('Export Shareable Graphic'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText('Sapphire Steel Ramp')[0],
        ).toBeInTheDocument();
        expect(screen.getByText('By Ink Cost')).toBeInTheDocument();
        expect(screen.getByText('By Card Type')).toBeInTheDocument();
        expect(screen.getByText('Columns:')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('Download PNG')).toBeInTheDocument();
        expect(screen.getByText('Copy Image')).toBeInTheDocument();
    });

    it('triggers PNG download when clicking Download PNG', async () => {
        renderComponent();
        const downloadBtn = screen.getByText('Download PNG');
        fireEvent.click(downloadBtn);

        await waitFor(() => {
            expect(htmlToImage.toPng).toHaveBeenCalled();
        });
    });

    it('triggers clipboard copy when clicking Copy Image', async () => {
        const writeMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                write: writeMock,
            },
        });

        renderComponent();
        const copyBtn = screen.getByText('Copy Image');
        fireEvent.click(copyBtn);

        await waitFor(() => {
            expect(htmlToImage.toBlob).toHaveBeenCalled();
        });
    });
});
