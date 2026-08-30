import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BackupModal } from '../BackupModal';

describe('BackupModal UI Component', () => {
    const mockOnClose = vi.fn();
    const mockOnRestore = vi.fn();
    const sampleCollection = {
        'ariel-on-human-legs': { normal: 4, foil: 1 },
    };

    it('should render modal title and export buttons when opened', () => {
        render(
            <MantineProvider>
                <BackupModal
                    opened={true}
                    onClose={mockOnClose}
                    currentCollection={sampleCollection}
                    onRestore={mockOnRestore}
                />
            </MantineProvider>,
        );

        expect(
            screen.getByText('Collection Backup & Restore'),
        ).toBeInTheDocument();
        expect(screen.getByText('Export JSON')).toBeInTheDocument();
        expect(screen.getByText('Restore from Backup')).toBeInTheDocument();
    });

    it('should not render content when unopened', () => {
        render(
            <MantineProvider>
                <BackupModal
                    opened={false}
                    onClose={mockOnClose}
                    currentCollection={sampleCollection}
                    onRestore={mockOnRestore}
                />
            </MantineProvider>,
        );

        expect(
            screen.queryByText('Collection Backup & Restore'),
        ).not.toBeInTheDocument();
    });
});
