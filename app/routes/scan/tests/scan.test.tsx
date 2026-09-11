import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

const { mockCard, mockSubmit } = vi.hoisted(() => ({
    mockCard: {
        $id: 'rex-protective-dinosaur',
        id: 'rex-protective-dinosaur',
        name: 'Rex - Protective Dinosaur',
        set: 'Wilds Unknown',
        number: 10,
        ink_color: 'Amber',
        cost: 2,
        inkwell: true,
        strength: 3,
        willpower: 1,
        lore: 1,
        type: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Dinosaur'],
        rarity: 'Uncommon',
        image_url: 'https://api.lorcana.ravensburger.com/images/en/set7/10.jpg',
        formats: ['core', 'infinity'],
        prices: {
            usd: 1.39,
            usd_foil: 3.5,
        },
    },
    mockSubmit: vi.fn(),
}));

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useLoaderData: () => ({
            cards: [mockCard],
            userCollection: [
                {
                    card_id: 'rex-protective-dinosaur',
                    quantity: 2,
                    is_foil: false,
                },
            ],
            user: { $id: 'user-test-123' },
            hasGeminiApiKey: true,
        }),
        useFetcher: () => ({
            submit: mockSubmit,
            state: 'idle',
            data: null,
            Form: 'form',
        }),
        useNavigate: () => vi.fn(),
    };
});

// Mock CameraViewfinder to isolate ScanPage state logic
vi.mock('../components/CameraViewfinder', () => ({
    CameraViewfinder: React.forwardRef(function MockCameraViewfinder(
        props: any,
        ref: any,
    ) {
        React.useImperativeHandle(ref, () => ({
            captureFrame: () => 'mock-base64-frame',
            toggleTorch: async () => true,
            triggerFocus: async () => {},
            hasTorch: true,
            isTorchOn: false,
            openFilePicker: () => {},
        }));

        return (
            <div data-testid="mock-camera-viewfinder">
                <button onClick={() => props.onCardDetected(mockCard, 'ocr')}>
                    Simulate Detect Rex
                </button>
            </div>
        );
    }),
}));

import ScanPage from '../scan';

describe('ScanPage Route Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders scanner controls and camera viewfinder', () => {
        render(
            <MantineProvider>
                <ScanPage />
            </MantineProvider>,
        );

        expect(
            screen.getByTestId('mock-camera-viewfinder'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Back to Collection')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /ai scan/i }),
        ).toBeInTheDocument();
    });

    it('opens card drawer upon card detection in single scan mode', async () => {
        render(
            <MantineProvider>
                <ScanPage />
            </MantineProvider>,
        );

        // Click simulated detect button
        fireEvent.click(screen.getByText('Simulate Detect Rex'));

        // Drawer should open and display card name and quantity
        await waitFor(() => {
            expect(
                screen.getByText('Rex - Protective Dinosaur'),
            ).toBeInTheDocument();
            expect(screen.getByText('Keep Scanning')).toBeInTheDocument();
        });
    });

    it('submits quantity adjustment to backend and optimistically updates count', async () => {
        render(
            <MantineProvider>
                <ScanPage />
            </MantineProvider>,
        );

        // Open drawer
        fireEvent.click(screen.getByText('Simulate Detect Rex'));

        await waitFor(() => {
            expect(
                screen.getByText('Rex - Protective Dinosaur'),
            ).toBeInTheDocument();
        });

        // Click Regular + using accessible label
        const addRegular = screen.getByLabelText('Increase regular quantity');
        fireEvent.click(addRegular);

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                intent: 'update-quantity',
                userId: 'user-test-123',
                cardId: 'rex-protective-dinosaur',
                quantity: '3', // initial was 2, +1 = 3
                isFoil: 'false',
            }),
            expect.objectContaining({
                method: 'post',
            }),
        );
    });

    it('toggles Rapid Mode and stays open without full drawer popup', async () => {
        const { container } = render(
            <MantineProvider>
                <ScanPage />
            </MantineProvider>,
        );

        // Toggle Rapid Mode switch
        const rapidSwitch = container.querySelector(
            'input[type="checkbox"]',
        ) as HTMLInputElement;
        expect(rapidSwitch).not.toBeNull();
        fireEvent.click(rapidSwitch);

        // In rapid mode, detecting a card should auto-increment regular copy and trigger submit
        fireEvent.click(screen.getByText('Simulate Detect Rex'));

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                intent: 'update-quantity',
                cardId: 'rex-protective-dinosaur',
                quantity: '3',
            }),
            expect.anything(),
        );

        // Drawer should NOT be opened in rapid mode
        expect(screen.queryByText('Keep Scanning')).toBeNull();
    });
});
