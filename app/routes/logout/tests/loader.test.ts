import { describe, it, expect } from 'vitest';
import { loader } from '../loader';

describe('Logout Loader', () => {
    it('redirects GET requests to home route', async () => {
        const response = await loader();
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('/');
    });
});
