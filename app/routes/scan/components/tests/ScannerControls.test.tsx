import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ScannerControls } from '../ScannerControls';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('ScannerControls component', () => {
    const renderControls = (
        props: Partial<React.ComponentProps<typeof ScannerControls>> = {},
    ) => {
        const defaultProps = {
            isRapidMode: false,
            onToggleRapidMode: vi.fn(),
            hasTorch: true,
            isTorchOn: false,
            onToggleTorch: vi.fn(),
            onSwitchCamera: vi.fn(),
            onTriggerAiScan: vi.fn(),
            onOpenFilePicker: vi.fn(),
            isAiScanning: false,
            hasGeminiApiKey: true,
            ...props,
        };

        const router = createMemoryRouter(
            [
                {
                    path: '/scan',
                    element: (
                        <MantineProvider>
                            <ScannerControls {...defaultProps} />
                        </MantineProvider>
                    ),
                },
            ],
            { initialEntries: ['/scan'] },
        );

        return {
            ...render(<RouterProvider router={router} />),
            props: defaultProps,
        };
    };

    it('navigates back to /collection when back button is clicked', () => {
        renderControls();
        const backBtn = screen.getByLabelText('Back to Collection');
        fireEvent.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/collection');
    });

    it('toggles torch when flashlight button is clicked', () => {
        const onToggleTorch = vi.fn();
        renderControls({ hasTorch: true, isTorchOn: false, onToggleTorch });

        const torchBtn = screen.getByLabelText('Toggle Flashlight');
        fireEvent.click(torchBtn);
        expect(onToggleTorch).toHaveBeenCalled();
    });

    it('does not render flashlight button when hasTorch is false', () => {
        renderControls({ hasTorch: false });
        expect(screen.queryByLabelText('Toggle Flashlight')).toBeNull();
    });

    it('calls onSwitchCamera when switch camera button is clicked', () => {
        const onSwitchCamera = vi.fn();
        renderControls({ onSwitchCamera });

        const switchBtn = screen.getByLabelText('Switch Camera');
        fireEvent.click(switchBtn);
        expect(onSwitchCamera).toHaveBeenCalled();
    });

    it('calls onOpenFilePicker when upload button is clicked', () => {
        const onOpenFilePicker = vi.fn();
        renderControls({ onOpenFilePicker });

        const uploadBtn = screen.getByLabelText('Upload Card Photo');
        fireEvent.click(uploadBtn);
        expect(onOpenFilePicker).toHaveBeenCalled();
    });

    it('calls onToggleRapidMode when clicking the rapid mode switch', () => {
        const onToggleRapidMode = vi.fn();
        const { container } = renderControls({
            isRapidMode: false,
            onToggleRapidMode,
        });

        const switchInput = container.querySelector(
            'input[type="checkbox"]',
        ) as HTMLInputElement;
        expect(switchInput).not.toBeNull();
        fireEvent.click(switchInput);
        expect(onToggleRapidMode).toHaveBeenCalledWith(true);
    });

    it('renders AI Scan button and calls onTriggerAiScan when clicked', () => {
        const onTriggerAiScan = vi.fn();
        renderControls({ hasGeminiApiKey: true, onTriggerAiScan });

        const aiBtn = screen.getByRole('button', { name: /ai scan/i });
        expect(aiBtn).toBeInTheDocument();
        fireEvent.click(aiBtn);
        expect(onTriggerAiScan).toHaveBeenCalled();
    });

    it('hides AI Scan button when hasGeminiApiKey is false', () => {
        renderControls({ hasGeminiApiKey: false });
        expect(screen.queryByRole('button', { name: /ai scan/i })).toBeNull();
    });
});
