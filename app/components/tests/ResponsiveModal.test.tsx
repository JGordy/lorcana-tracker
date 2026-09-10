import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ResponsiveModal } from '../ResponsiveModal';
import * as mantineHooks from '@mantine/hooks';

vi.mock('@mantine/hooks', async () => {
    const actual = await vi.importActual('@mantine/hooks');
    return {
        ...actual,
        useMediaQuery: vi.fn(),
    };
});

describe('ResponsiveModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Modal on desktop screens (useMediaQuery returns false)', () => {
        vi.mocked(mantineHooks.useMediaQuery).mockReturnValue(false);

        render(
            <MantineProvider>
                <ResponsiveModal
                    opened
                    onClose={vi.fn()}
                    title="Test Modal Title"
                >
                    <div>Desktop Modal Content</div>
                </ResponsiveModal>
            </MantineProvider>,
        );

        expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
        expect(screen.getByText('Desktop Modal Content')).toBeInTheDocument();
        expect(
            screen.queryByTestId('responsive-modal-drag-handle'),
        ).not.toBeInTheDocument();
    });

    it('renders bottom-sheet Drawer on mobile screens (useMediaQuery returns true)', () => {
        vi.mocked(mantineHooks.useMediaQuery).mockReturnValue(true);

        render(
            <MantineProvider>
                <ResponsiveModal
                    opened
                    onClose={vi.fn()}
                    title="Mobile Drawer Title"
                    centered
                    radius="lg"
                    styles={{
                        content: {
                            background:
                                'linear-gradient(180deg, #16122e 0%, #0d0a1a 100%)',
                            border: '1px solid rgba(234, 179, 8, 0.35)',
                        },
                    }}
                >
                    <div>Mobile Drawer Content</div>
                </ResponsiveModal>
            </MantineProvider>,
        );

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText('Mobile Drawer Title')).toBeInTheDocument();
        expect(screen.getByText('Mobile Drawer Content')).toBeInTheDocument();
    });

    it('respects withCloseButton={false} on mobile drawer', () => {
        vi.mocked(mantineHooks.useMediaQuery).mockReturnValue(true);

        render(
            <MantineProvider>
                <ResponsiveModal
                    opened
                    onClose={vi.fn()}
                    title="No Close Button"
                    withCloseButton={false}
                >
                    <div>Content</div>
                </ResponsiveModal>
            </MantineProvider>,
        );

        expect(screen.getByText('No Close Button')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /close/i }),
        ).not.toBeInTheDocument();
    });

    it('triggers onClose when close button is clicked on mobile drawer', () => {
        vi.mocked(mantineHooks.useMediaQuery).mockReturnValue(true);
        const onClose = vi.fn();

        render(
            <MantineProvider>
                <ResponsiveModal
                    opened
                    onClose={onClose}
                    title="Closable Drawer"
                    withCloseButton
                >
                    <div>Content</div>
                </ResponsiveModal>
            </MantineProvider>,
        );

        const closeBtn = document.querySelector(
            '.mantine-Drawer-close',
        ) as HTMLElement;
        expect(closeBtn).toBeInTheDocument();
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });
});
