import { describe, it, expect, vi } from 'vitest';

// Mock server auth module
vi.mock('../services/auth.server', () => ({
    authService: {
        verifyEmail: vi.fn(),
        getSessionUser: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    },
}));

import { loader as verifyLoader } from './verify';
import { loader as homeLoader, action as homeAction } from './home';
import { authService } from '../services/auth.server';

describe('Route Loaders & Actions', () => {
    describe('/verify Loader', () => {
        it('should return error when userId or secret query params are missing', async () => {
            vi.mocked(authService.getSessionUser).mockResolvedValueOnce(null);
            const request = new Request('http://localhost:5173/verify');
            const response = await verifyLoader({
                request,
                params: {},
                context: {},
            } as any);
            expect(response).toEqual({
                success: false,
                message:
                    'Missing verification parameters in verification link.',
                user: null,
            });
        });

        it('should call authService.verifyEmail when params are present', async () => {
            vi.mocked(authService.getSessionUser).mockResolvedValueOnce(null);
            vi.mocked(authService.verifyEmail).mockResolvedValueOnce({} as any);
            const request = new Request(
                'http://localhost:5173/verify?userId=u123&secret=sec789',
            );
            const response = await verifyLoader({
                request,
                params: {},
                context: {},
            } as any);
            expect(authService.verifyEmail).toHaveBeenCalledWith({
                userId: 'u123',
                secret: 'sec789',
            });
            expect(response).toEqual({
                success: true,
                message:
                    'Your email address has been successfully verified! You now have full access.',
                user: null,
            });
        });
    });

    describe('/ (Home) Loader and Action', () => {
        it('should return user from session in home loader', async () => {
            vi.mocked(authService.getSessionUser).mockResolvedValueOnce({
                $id: 'user-1',
                email: 'test@user.com',
                name: 'Test User',
            } as any);

            const request = new Request('http://localhost:5173/');
            const response = await homeLoader({
                request,
                params: {},
                context: {},
            } as any);
            expect(response.user).toBeDefined();
            expect(response.user?.$id).toBe('user-1');
        });

        it('should handle auth-login intent and set session cookie in home action', async () => {
            vi.mocked(authService.login).mockResolvedValueOnce({
                session: { secret: 'sess-abc' },
                cookieHeader: 'appwrite-session=sess-abc; Path=/',
            } as any);

            const formData = new FormData();
            formData.set('intent', 'auth-login');
            formData.set('email', 'test@user.com');
            formData.set('password', 'secret123');

            const request = new Request('http://localhost:5173/', {
                method: 'POST',
                body: formData,
            });

            const actionResponse: any = await homeAction({
                request,
                params: {},
                context: {},
            } as any);
            expect(authService.login).toHaveBeenCalledWith({
                email: 'test@user.com',
                password: 'secret123',
            });
            expect(actionResponse.data || actionResponse).toMatchObject({
                success: true,
            });
        });
    });
});
