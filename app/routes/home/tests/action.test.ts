import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action } from '../action';
import { authService } from '../../../services/auth.server';

vi.mock('../../../services/auth.server', () => ({
    authService: {
        logout: vi.fn(),
        register: vi.fn(),
        login: vi.fn(),
        anonymousLogin: vi.fn(),
    },
}));

describe('Home Action Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles login-demo intent correctly', async () => {
        vi.mocked(authService.anonymousLogin).mockResolvedValue({
            user: { $id: 'demo-user' } as any,
            sessionSecret: 'sec-123',
            cookieHeader: 'session=123',
        });

        const formData = new FormData();
        formData.append('intent', 'login-demo');

        const request = new Request('http://localhost:3000/', {
            method: 'POST',
            body: formData,
        });

        const response: any = await action({ request } as any);
        expect(authService.anonymousLogin).toHaveBeenCalledWith(request);
        expect(
            response.headers?.get('Set-Cookie') ||
                response.init?.headers?.['Set-Cookie'],
        ).toBe('session=123');
    });

    it('handles logout intent correctly', async () => {
        vi.mocked(authService.logout).mockResolvedValue({
            cookieHeader: 'session=deleted',
        });

        const formData = new FormData();
        formData.append('intent', 'logout');

        const request = new Request('http://localhost:3000/', {
            method: 'POST',
            body: formData,
        });

        const response: any = await action({ request } as any);
        expect(authService.logout).toHaveBeenCalledWith(request);
        expect(
            response.headers?.get('Set-Cookie') ||
                response.init?.headers?.['Set-Cookie'],
        ).toBe('session=deleted');
    });
});
