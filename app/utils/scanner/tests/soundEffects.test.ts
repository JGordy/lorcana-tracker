import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playCardChime } from '../soundEffects';

describe('playCardChime', () => {
    let mockOscillator: any;
    let mockGain: any;
    let lastCtx: any = null;

    beforeEach(() => {
        mockOscillator = {
            type: 'sine',
            frequency: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
        };

        mockGain = {
            gain: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
        };

        class MockAudioContext {
            currentTime = 0;
            destination = {};
            createOscillator = vi.fn(() => ({ ...mockOscillator }));
            createGain = vi.fn(() => ({ ...mockGain }));
        }

        const MockAudioContextConstructor = function () {
            const instance = new MockAudioContext();
            lastCtx = instance;
            return instance;
        } as unknown as typeof AudioContext;

        vi.stubGlobal('AudioContext', MockAudioContextConstructor);
        (window as any).AudioContext = MockAudioContextConstructor;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete (window as any).AudioContext;
    });

    it('plays Tier 1 plain chime for cards under $1.00', () => {
        playCardChime(0.25);
        expect(lastCtx.createOscillator).toHaveBeenCalledTimes(1);
        expect(lastCtx.createGain).toHaveBeenCalledTimes(1);
    });

    it('plays Tier 2 sparkling treasure chime (3 notes) for cards $1.00 - $9.99', () => {
        playCardChime(4.5);
        expect(lastCtx.createOscillator).toHaveBeenCalledTimes(3);
        expect(lastCtx.createGain).toHaveBeenCalledTimes(3);
    });

    it('plays Tier 3 triumphant fanfare arpeggio (5 notes) for cards $10.00 and up', () => {
        playCardChime(15.0);
        expect(lastCtx.createOscillator).toHaveBeenCalledTimes(5);
        expect(lastCtx.createGain).toHaveBeenCalledTimes(5);
    });

    it('handles undefined or 0 price gracefully as Tier 1', () => {
        expect(() => playCardChime()).not.toThrow();
        expect(() => playCardChime(0)).not.toThrow();
    });
});
