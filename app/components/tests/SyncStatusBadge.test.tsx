import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SyncStatusBadge } from '../SyncStatusBadge';

describe('SyncStatusBadge UI Component', () => {
    it('should render "Saved & Synced" status badge', () => {
        render(
            <MantineProvider>
                <SyncStatusBadge status="synced" />
            </MantineProvider>,
        );
        expect(screen.getByText('Saved & Synced')).toBeInTheDocument();
    });

    it('should render "Saving..." status badge', () => {
        render(
            <MantineProvider>
                <SyncStatusBadge status="syncing" />
            </MantineProvider>,
        );
        expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should render "Saved to Device" status badge', () => {
        render(
            <MantineProvider>
                <SyncStatusBadge status="offline" />
            </MantineProvider>,
        );
        expect(screen.getByText('Saved to Device')).toBeInTheDocument();
    });

    it('should render "Sync Error" status badge', () => {
        render(
            <MantineProvider>
                <SyncStatusBadge status="error" />
            </MantineProvider>,
        );
        expect(screen.getByText('Sync Error')).toBeInTheDocument();
    });
});
