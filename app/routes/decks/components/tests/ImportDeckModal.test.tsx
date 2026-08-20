import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ImportDeckModal } from '../ImportDeckModal';

describe('ImportDeckModal', () => {
    const mockOnClose = vi.fn();
    const mockOnValidate = vi.fn();
    const mockOnSubmit = vi.fn();

    const renderComponent = (props: any = {}) => {
        return render(
            <MantineProvider>
                <ImportDeckModal
                    opened={true}
                    onClose={mockOnClose}
                    importTitle=""
                    setImportTitle={vi.fn()}
                    importText=""
                    setImportText={vi.fn()}
                    importError={null}
                    parsedResults={null}
                    onValidate={mockOnValidate}
                    onSubmit={mockOnSubmit}
                    {...props}
                />
            </MantineProvider>,
        );
    };

    it('renders modal header and input fields', () => {
        renderComponent();
        expect(screen.getByText('Import Lorcana Deck List')).toBeInTheDocument();
        expect(screen.getByText('Validate List')).toBeInTheDocument();
    });

    it('calls onValidate on Validate List click', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Validate List'));
        expect(mockOnValidate).toHaveBeenCalled();
    });
});
