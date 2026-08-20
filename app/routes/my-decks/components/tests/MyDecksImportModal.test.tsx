import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksImportModal } from '../modals/MyDecksImportModal';

afterEach(cleanup);

const mockParsedResults = {
    validEntries: [
        {
            qty: 4,
            card: {
                id: 'c1',
                name: 'Simba - Returned King',
                set: 'The First Chapter',
            },
        },
        {
            qty: 4,
            card: {
                id: 'c2',
                name: 'Merlin - Rabbit',
                set: 'Rise of the Floodborn',
            },
        },
    ],
    invalidLines: ['Unknown Card Line xyz'],
};

const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    title: '',
    onTitleChange: vi.fn(),
    text: '',
    onTextChange: vi.fn(),
    error: null,
    parsedResults: null,
    onValidate: vi.fn(),
    onSubmit: vi.fn(),
};

function renderModal(props = {}) {
    return render(
        <MantineProvider>
            <MyDecksImportModal {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDecksImportModal', () => {
    it('renders the import modal fields and placeholder text', () => {
        renderModal();
        expect(
            screen.getByText('Import Decklist from Text'),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('e.g. Sapphire / Steel Control'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/Paste Decklist/i)).toBeInTheDocument();
    });

    it('calls onTitleChange when typing a deck title', () => {
        const onTitleChange = vi.fn();
        renderModal({ onTitleChange });
        const titleInput = screen.getByPlaceholderText(
            'e.g. Sapphire / Steel Control',
        );
        fireEvent.change(titleInput, {
            target: { value: 'Imported Amber Deck' },
        });
        expect(onTitleChange).toHaveBeenCalledWith('Imported Amber Deck');
    });

    it('calls onTextChange when pasting decklist text', () => {
        const onTextChange = vi.fn();
        renderModal({ onTextChange });
        const textarea = screen.getByLabelText(/Paste Decklist/i);
        fireEvent.change(textarea, { target: { value: '4 Stitch\n4 Merlin' } });
        expect(onTextChange).toHaveBeenCalledWith('4 Stitch\n4 Merlin');
    });

    it('displays error alert when error prop is provided', () => {
        renderModal({
            error: 'Could not parse any valid cards from decklist.',
        });
        expect(
            screen.getByText('Could not parse any valid cards from decklist.'),
        ).toBeInTheDocument();
    });

    it('displays parsed preview with recognized and unrecognized cards', () => {
        renderModal({ parsedResults: mockParsedResults });
        expect(screen.getByText(/Parsed Preview:/i)).toBeInTheDocument();
        expect(screen.getByText(/8/)).toBeInTheDocument();
        expect(screen.getByText(/2 Unique Recognized/i)).toBeInTheDocument();
        expect(
            screen.getByText(/✓ 4x Simba - Returned King/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/✗ Could not resolve: "Unknown Card Line xyz"/i),
        ).toBeInTheDocument();
    });

    it('calls onValidate when Validate Preview button is clicked', () => {
        const onValidate = vi.fn();
        renderModal({ text: '4 Simba', onValidate });
        const validateBtn = screen.getByText('Validate Preview');
        expect(validateBtn).not.toBeDisabled();
        fireEvent.click(validateBtn);
        expect(onValidate).toHaveBeenCalledOnce();
    });

    it('disables Validate Preview button when text is empty', () => {
        renderModal({ text: '' });
        expect(
            screen.getByText('Validate Preview').closest('button'),
        ).toBeDisabled();
    });

    it('disables Import Deck button when title is missing', () => {
        renderModal({ title: '', parsedResults: mockParsedResults });
        expect(
            screen.getByText('Import Deck').closest('button'),
        ).toBeDisabled();
    });

    it('disables Import Deck button when no valid parsed results', () => {
        renderModal({ title: 'My Deck', parsedResults: null });
        expect(
            screen.getByText('Import Deck').closest('button'),
        ).toBeDisabled();
    });

    it('calls onSubmit when Import Deck button is clicked with valid title and results', () => {
        const onSubmit = vi.fn();
        renderModal({
            title: 'My Imported Deck',
            parsedResults: mockParsedResults,
            onSubmit,
        });
        const importBtn = screen.getByText('Import Deck').closest('button');
        expect(importBtn).not.toBeDisabled();
        if (importBtn) fireEvent.click(importBtn);
        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it('calls onClose when Cancel button is clicked', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
