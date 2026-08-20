import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action } from '../action';
import { authService } from '../../../services/auth.server';

vi.mock('../../../services/auth.server', () => ({
    authService: {
        logout: vi.fn(),
    },
}));

describe('Logout Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('clears session cookie and redirects to home', async () => {
        vi.mocked(authService.logout).mockResolvedValue({
            cookieHeader: 'session=deleted; Max-Age=0',
        });

        const request = new Request('http://localhost:3000/logout', {
            method: 'POST',
        });

        const response = await action({ request } as any);
        expect(authService.logout).toHaveBeenCalledWith(request);
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('/');
        expect(response.headers.get('Set-Cookie')).toBe(
            'session=deleted; Max-Age=0',
        );
    });
});
