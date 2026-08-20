import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksEditModal } from '../modals/MyDecksEditModal';

afterEach(cleanup);

const mockDeckCards = [
    {
        card: {
            id: 'c1',
            name: 'Simba - Returned King',
            set: 'The First Chapter',
        },
    },
    {
        card: {
            id: 'c2',
            name: 'Merlin - Rabbit',
            set: 'Rise of the Floodborn',
        },
    },
];

const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    title: 'Amber Steel Song',
    onTitleChange: vi.fn(),
    format: 'core' as const,
    onFormatChange: vi.fn(),
    inks: ['amber', 'steel'],
    onInksChange: vi.fn(),
    description: 'Song heavy deck with Ariel',
    onDescriptionChange: vi.fn(),
    coverCardId: 'c1',
    onCoverCardIdChange: vi.fn(),
    deckCards: mockDeckCards,
    onSave: vi.fn(),
};

function renderModal(props = {}) {
    return render(
        <MantineProvider>
            <MyDecksEditModal {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDecksEditModal', () => {
    it('renders the edit modal with populated form fields', () => {
        renderModal();
        expect(screen.getByText('Edit Deck Info')).toBeInTheDocument();
        expect(
            screen.getByDisplayValue('Amber Steel Song'),
        ).toBeInTheDocument();
        expect(
            screen.getByDisplayValue('Song heavy deck with Ariel'),
        ).toBeInTheDocument();
        expect(screen.getByText('Cover Card Image')).toBeInTheDocument();
    });

    it('calls onTitleChange when modifying the deck title', () => {
        const onTitleChange = vi.fn();
        renderModal({ onTitleChange });
        const input = screen.getByDisplayValue('Amber Steel Song');
        fireEvent.change(input, { target: { value: 'Updated Title' } });
        expect(onTitleChange).toHaveBeenCalledWith('Updated Title');
    });

    it('calls onDescriptionChange when modifying notes', () => {
        const onDescriptionChange = vi.fn();
        renderModal({ onDescriptionChange });
        const textarea = screen.getByDisplayValue('Song heavy deck with Ariel');
        fireEvent.change(textarea, { target: { value: 'New Notes' } });
        expect(onDescriptionChange).toHaveBeenCalledWith('New Notes');
    });

    it('toggles ink color selection and respects the 2-ink max', () => {
        const onInksChange = vi.fn();
        renderModal({ inks: ['amber', 'steel'], onInksChange });

        const amberCheckbox = screen.getByLabelText('Amber');
        fireEvent.click(amberCheckbox);
        expect(onInksChange).toHaveBeenCalledWith(['steel']);

        expect(screen.getByLabelText('Ruby')).toBeDisabled();
    });

    it('disables Save Changes button when title is empty', () => {
        renderModal({ title: '', inks: ['amber'] });
        expect(
            screen.getByText('Save Changes').closest('button'),
        ).toBeDisabled();
    });

    it('disables Save Changes button when inks is empty', () => {
        renderModal({ title: 'Valid Title', inks: [] });
        expect(
            screen.getByText('Save Changes').closest('button'),
        ).toBeDisabled();
    });

    it('calls onSave when Save Changes is clicked with valid inputs', () => {
        const onSave = vi.fn();
        renderModal({ onSave });
        const saveBtn = screen.getByText('Save Changes').closest('button');
        expect(saveBtn).not.toBeDisabled();
        if (saveBtn) fireEvent.click(saveBtn);
        expect(onSave).toHaveBeenCalledOnce();
    });

    it('calls onClose when Cancel button is clicked', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
