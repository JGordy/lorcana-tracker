import { describe, it, expect } from 'vitest';
import {
    isValidCardAspectRatio,
    smoothQuad,
    TARGET_CARD_ASPECT_RATIO,
    type Quad,
} from '../cardEdgeDetector';

describe('isValidCardAspectRatio', () => {
    it('accepts standard Lorcana / TCG card dimensions (2.5 x 3.5 inches)', () => {
        expect(isValidCardAspectRatio(250, 350)).toBe(true);
        expect(isValidCardAspectRatio(500, 700)).toBe(true);
        expect(isValidCardAspectRatio(63, 88)).toBe(true);
    });

    it('accepts landscape rotated cards', () => {
        expect(isValidCardAspectRatio(350, 250)).toBe(true);
        expect(isValidCardAspectRatio(88, 63)).toBe(true);
    });

    it('rejects squares or extreme widescreen rectangles', () => {
        expect(isValidCardAspectRatio(300, 300)).toBe(false);
        expect(isValidCardAspectRatio(100, 500)).toBe(false);
        expect(isValidCardAspectRatio(0, 100)).toBe(false);
    });
});

describe('smoothQuad', () => {
    it('returns next quad if prev quad is null', () => {
        const nextQuad: Quad = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ];
        expect(smoothQuad(null, nextQuad)).toEqual(nextQuad);
    });

    it('interpolates corners smoothly between frames', () => {
        const prevQuad: Quad = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
        ];
        const nextQuad: Quad = [
            { x: 10, y: 10 },
            { x: 20, y: 10 },
            { x: 20, y: 20 },
            { x: 10, y: 20 },
        ];

        const smoothed = smoothQuad(prevQuad, nextQuad, 0.5);
        expect(smoothed[0]).toEqual({ x: 5, y: 5 });
        expect(smoothed[1]).toEqual({ x: 15, y: 5 });
        expect(smoothed[2]).toEqual({ x: 15, y: 15 });
        expect(smoothed[3]).toEqual({ x: 5, y: 15 });
    });
});
