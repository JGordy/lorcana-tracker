import { describe, it, expect } from 'vitest';
import { loader, action } from '../logout';

describe('Logout Route Exports', () => {
    it('exports loader and action functions', () => {
        expect(typeof loader).toBe('function');
        expect(typeof action).toBe('function');
    });
});
