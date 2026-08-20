import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksCreateModal } from '../modals/MyDecksCreateModal';

afterEach(cleanup);

const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    title: '',
    onTitleChange: vi.fn(),
    format: 'core' as const,
    onFormatChange: vi.fn(),
    inks: [] as string[],
    onInksChange: vi.fn(),
    description: '',
    onDescriptionChange: vi.fn(),
    onSave: vi.fn(),
};

function renderModal(props = {}) {
    return render(
        <MantineProvider>
            <MyDecksCreateModal {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDecksCreateModal', () => {
    it('renders modal with title and form fields when opened', () => {
        renderModal();
        expect(screen.getByText('Create Custom Deck')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('e.g. Amber / Ruby Aggro'),
        ).toBeInTheDocument();
        expect(screen.getByText('Format Legality')).toBeInTheDocument();
        expect(
            screen.getByText('Ink Colors (Select 1 or 2)'),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(
                'Optional deck guide or tournament notes...',
            ),
        ).toBeInTheDocument();
    });

    it('calls onTitleChange when typing in the title input', () => {
        const onTitleChange = vi.fn();
        renderModal({ onTitleChange });
        const input = screen.getByPlaceholderText('e.g. Amber / Ruby Aggro');
        fireEvent.change(input, { target: { value: 'Ruby Amethyst Control' } });
        expect(onTitleChange).toHaveBeenCalledWith('Ruby Amethyst Control');
    });

    it('calls onDescriptionChange when typing in description textarea', () => {
        const onDescriptionChange = vi.fn();
        renderModal({ onDescriptionChange });
        const textarea = screen.getByPlaceholderText(
            'Optional deck guide or tournament notes...',
        );
        fireEvent.change(textarea, { target: { value: 'Bounce strategy' } });
        expect(onDescriptionChange).toHaveBeenCalledWith('Bounce strategy');
    });

    it('calls onInksChange to add ink when unchecked ink is clicked', () => {
        const onInksChange = vi.fn();
        renderModal({ inks: ['amber'], onInksChange });
        const rubyCheckbox = screen.getByLabelText('Ruby');
        fireEvent.click(rubyCheckbox);
        expect(onInksChange).toHaveBeenCalledWith(['amber', 'ruby']);
    });

    it('calls onInksChange to remove ink when checked ink is clicked', () => {
        const onInksChange = vi.fn();
        renderModal({ inks: ['amber', 'ruby'], onInksChange });
        const amberCheckbox = screen.getByLabelText('Amber');
        fireEvent.click(amberCheckbox);
        expect(onInksChange).toHaveBeenCalledWith(['ruby']);
    });

    it('disables unselected ink checkboxes when 2 inks are already selected', () => {
        renderModal({ inks: ['amber', 'ruby'] });
        expect(screen.getByLabelText('Emerald')).toBeDisabled();
        expect(screen.getByLabelText('Sapphire')).toBeDisabled();
        expect(screen.getByLabelText('Steel')).toBeDisabled();
        expect(screen.getByLabelText('Amethyst')).toBeDisabled();
        expect(screen.getByLabelText('Amber')).not.toBeDisabled();
        expect(screen.getByLabelText('Ruby')).not.toBeDisabled();
    });

    it('disables Save Deck button if title is empty', () => {
        renderModal({ title: '', inks: ['amber'] });
        expect(screen.getByText('Save Deck').closest('button')).toBeDisabled();
    });

    it('disables Save Deck button if no inks selected', () => {
        renderModal({ title: 'My Deck', inks: [] });
        expect(screen.getByText('Save Deck').closest('button')).toBeDisabled();
    });

    it('enables Save Deck and calls onSave when valid', () => {
        const onSave = vi.fn();
        renderModal({ title: 'My Deck', inks: ['amber'], onSave });
        const saveBtn = screen.getByText('Save Deck').closest('button');
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
