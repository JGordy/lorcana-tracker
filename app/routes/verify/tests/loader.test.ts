import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader } from '../loader';
import { authService } from '../../../services/auth.server';

vi.mock('../../../services/auth.server', () => ({
    authService: {
        getSessionUser: vi.fn(),
        verifyEmail: vi.fn(),
    },
}));

describe('Verify Loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns error when query params are missing', async () => {
        vi.mocked(authService.getSessionUser).mockResolvedValue(null);

        const request = new Request('http://localhost:3000/verify');
        const result = await loader({ request } as any);

        expect(result).toEqual({
            success: false,
            message: 'Missing verification parameters in verification link.',
            user: null,
        });
    });

    it('calls authService.verifyEmail when params are valid', async () => {
        vi.mocked(authService.getSessionUser).mockResolvedValue(null);
        vi.mocked(authService.verifyEmail).mockResolvedValue({} as any);

        const request = new Request(
            'http://localhost:3000/verify?userId=u1&secret=s1',
        );
        const result = await loader({ request } as any);

        expect(authService.verifyEmail).toHaveBeenCalledWith({
            userId: 'u1',
            secret: 's1',
        });
        expect(result.success).toBe(true);
    });
});
