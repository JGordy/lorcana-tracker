import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import {
    CameraViewfinder,
    type CameraViewfinderRef,
} from '../CameraViewfinder';
import React from 'react';

describe('CameraViewfinder component', () => {
    let originalMediaDevices: any;
    const mockTrack = {
        stop: vi.fn(),
        applyConstraints: vi.fn().mockResolvedValue(undefined),
        getCapabilities: () => ({ torch: false }),
    };
    const mockStream = {
        getTracks: () => [mockTrack],
        getVideoTracks: () => [mockTrack],
    };

    beforeEach(() => {
        HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
        originalMediaDevices = navigator.mediaDevices;
        Object.defineProperty(navigator, 'mediaDevices', {
            writable: true,
            value: {
                getUserMedia: vi.fn().mockResolvedValue(mockStream),
            },
        });
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
            writable: true,
            value: originalMediaDevices,
        });
        vi.clearAllMocks();
    });

    it('renders camera initialization state initially', () => {
        render(
            <MantineProvider>
                <CameraViewfinder
                    cards={[]}
                    onCardDetected={vi.fn()}
                    isPaused={false}
                    facingMode="environment"
                />
            </MantineProvider>,
        );

        expect(screen.getByText('Initializing Camera...')).toBeInTheDocument();
    });

    it('renders guidance instructions and status pill once camera is active', async () => {
        const { container } = render(
            <MantineProvider>
                <CameraViewfinder
                    cards={[]}
                    onCardDetected={vi.fn()}
                    isPaused={false}
                    facingMode="environment"
                />
            </MantineProvider>,
        );

        const video = container.querySelector('video') as HTMLVideoElement;
        expect(video).not.toBeNull();

        // Wait for getUserMedia async stream resolution and onloadedmetadata handler attachment
        await waitFor(() => {
            expect(video.onloadedmetadata).toBeDefined();
        });

        // Simulate video metadata loaded to transition camera to active
        await act(async () => {
            if (video.onloadedmetadata) {
                await (video.onloadedmetadata as any)(
                    new Event('loadedmetadata'),
                );
            }
        });

        await waitFor(() => {
            expect(
                screen.getByText('Hold 8–12 in. away • Tap to focus'),
            ).toBeInTheDocument();
            expect(
                screen.getByText('Hold card inside frame'),
            ).toBeInTheDocument();
        });
    });

    it('handles camera permission failure and displays error recovery options', async () => {
        // Mock getUserMedia to reject with permission denied
        navigator.mediaDevices.getUserMedia = vi
            .fn()
            .mockRejectedValue(new Error('Permission denied'));

        render(
            <MantineProvider>
                <CameraViewfinder
                    cards={[]}
                    onCardDetected={vi.fn()}
                    isPaused={false}
                    facingMode="environment"
                />
            </MantineProvider>,
        );

        const retryBtn = await screen.findByRole('button', {
            name: /retry camera/i,
        });
        expect(retryBtn).toBeInTheDocument();
        expect(screen.getByText('Camera Access Needed')).toBeInTheDocument();
    });

    it('exposes imperative ref controls including captureFrame and openFilePicker', () => {
        const ref = React.createRef<CameraViewfinderRef>();

        render(
            <MantineProvider>
                <CameraViewfinder
                    ref={ref}
                    cards={[]}
                    onCardDetected={vi.fn()}
                    isPaused={false}
                    facingMode="environment"
                />
            </MantineProvider>,
        );

        expect(ref.current).toBeDefined();
        expect(typeof ref.current?.captureFrame).toBe('function');
        expect(typeof ref.current?.toggleTorch).toBe('function');
        expect(typeof ref.current?.triggerFocus).toBe('function');
        expect(typeof ref.current?.openFilePicker).toBe('function');
        expect(ref.current?.hasTorch).toBe(false);
        expect(ref.current?.isTorchOn).toBe(false);
    });

    it('triggers file input click when openFilePicker is called', () => {
        const ref = React.createRef<CameraViewfinderRef>();

        const { container } = render(
            <MantineProvider>
                <CameraViewfinder
                    ref={ref}
                    cards={[]}
                    onCardDetected={vi.fn()}
                    isPaused={false}
                    facingMode="environment"
                />
            </MantineProvider>,
        );

        const fileInput = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        const clickSpy = vi.spyOn(fileInput, 'click');

        ref.current?.openFilePicker();
        expect(clickSpy).toHaveBeenCalled();
    });

    it('mounts and functions with preloaded artHashes', () => {
        const mockHashes = [
            {
                id: 'elsa-snow-queen',
                name: 'Elsa - Snow Queen',
                set: '1',
                setNum: 1,
                number: 1,
                cardNum: 1,
                rarity: 'Common',
                artHash: 'ffff0000ffff0000',
                fullHash: 'ffff0000ffff0000',
            },
        ];

        const { container } = render(
            <MantineProvider>
                <CameraViewfinder
                    cards={[]}
                    artHashes={mockHashes}
                    onCardDetected={vi.fn()}
                    isPaused={false}
                    facingMode="environment"
                />
            </MantineProvider>,
        );

        expect(container.querySelector('video')).toBeInTheDocument();
        expect(container.querySelector('canvas')).toBeInTheDocument();
    });
});
