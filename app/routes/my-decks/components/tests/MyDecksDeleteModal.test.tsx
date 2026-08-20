import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { MyDecksDeleteModal } from '../modals/MyDecksDeleteModal';

afterEach(cleanup);

const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    deckTitle: 'Amber / Ruby Aggro',
    onConfirmDelete: vi.fn(),
};

function renderModal(props = {}) {
    return render(
        <MantineProvider>
            <MyDecksDeleteModal {...defaultProps} {...props} />
        </MantineProvider>,
    );
}

describe('MyDecksDeleteModal', () => {
    it('renders the delete modal with deck title and confirmation warning', () => {
        renderModal();
        expect(screen.getByText('Delete Custom Deck')).toBeInTheDocument();
        expect(
            screen.getByText(
                /Are you sure you want to permanently delete "Amber \/ Ruby Aggro"\?/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/This action cannot be undone/i),
        ).toBeInTheDocument();
    });

    it('calls onConfirmDelete when "Permanently Delete" is clicked', () => {
        const onConfirmDelete = vi.fn();
        renderModal({ onConfirmDelete });
        fireEvent.click(screen.getByText('Permanently Delete'));
        expect(onConfirmDelete).toHaveBeenCalledOnce();
    });

    it('calls onClose when "Cancel" is clicked', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
