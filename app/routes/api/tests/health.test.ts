import { describe, it, expect } from 'vitest';
import { loader } from '../health';

describe('api/health loader', () => {
    it('returns status 200 with status ok and timestamp', async () => {
        const response = await loader();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toContain('no-cache');

        const json = await response.json();
        expect(json.status).toBe('ok');
        expect(typeof json.timestamp).toBe('string');
        expect(Number.isNaN(Date.parse(json.timestamp))).toBe(false);
    });
});
