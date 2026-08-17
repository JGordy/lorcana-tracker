import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node-appwrite before imports
const mockAccount = {
    create: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    createAnonymousSession: vi.fn(),
    createVerification: vi.fn(),
    get: vi.fn(),
    deleteSession: vi.fn(),
};

const mockUsers = {
    updateEmailVerification: vi.fn(),
};

vi.mock('../utils/appwrite/server', () => ({
    createAdminClient: () => ({
        account: mockAccount,
        users: mockUsers,
    }),
    createSessionClient: () => ({
        account: mockAccount,
    }),
    createSessionClientFromSecret: () => ({
        account: mockAccount,
    }),
    serializeSessionCookie: (secret: string) =>
        `appwrite-session=${secret}; Path=/; HttpOnly; SameSite=Lax`,
    serializeDeleteSessionCookie: () =>
        `appwrite-session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    parseSessionCookie: (header: string | null) =>
        header?.includes('appwrite-session=') ? 'secret-token' : null,
}));

import { authService } from './auth.server';

describe('authService (Server-Side)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('register', () => {
        it('should create user, create session, send verification, and return cookieHeader', async () => {
            mockAccount.create.mockResolvedValueOnce({
                $id: 'user-123',
                email: 'test@example.com',
                name: 'Player 1',
            });
            mockAccount.createEmailPasswordSession.mockResolvedValueOnce({
                secret: 'test-session-secret',
            });
            mockAccount.createVerification.mockResolvedValueOnce({});

            const result = await authService.register({
                name: 'Player 1',
                email: 'test@example.com',
                password: 'password123',
                origin: 'http://localhost:5173',
            });

            expect(mockAccount.create).toHaveBeenCalled();
            expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
                'test@example.com',
                'password123',
            );
            expect(result.user).toEqual({
                $id: 'user-123',
                email: 'test@example.com',
                name: 'Player 1',
            });
            expect(result.cookieHeader).toContain(
                'appwrite-session=test-session-secret',
            );
        });
    });

    describe('login', () => {
        it('should authenticate with email and password and return session cookie', async () => {
            mockAccount.createEmailPasswordSession.mockResolvedValueOnce({
                secret: 'login-secret-456',
            });

            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
                'test@example.com',
                'password123',
            );
            expect(result.cookieHeader).toContain(
                'appwrite-session=login-secret-456',
            );
        });
    });

    describe('verifyEmail', () => {
        it('should use users service to update email verification status', async () => {
            mockUsers.updateEmailVerification.mockResolvedValueOnce({
                $id: 'user-123',
                emailVerification: true,
            });

            const result = await authService.verifyEmail({
                userId: 'user-123',
                secret: 'token-secret',
            });

            expect(mockUsers.updateEmailVerification).toHaveBeenCalledWith(
                'user-123',
                true,
            );
            expect(result.emailVerification).toBe(true);
        });
    });

    describe('logout', () => {
        it('should return deletion cookie header', async () => {
            const result = await authService.logout();
            expect(result.cookieHeader).toContain('Max-Age=0');
        });
    });
});
