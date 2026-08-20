import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader } from '../loader';
import { authService } from '../../../services/auth.server';

vi.mock('../../../services/auth.server', () => ({
    authService: {
        getSessionUser: vi.fn(),
    },
}));

describe('Home Loader Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns user from authService.getSessionUser', async () => {
        const mockUser = { $id: 'user-123', name: 'Joe' };
        vi.mocked(authService.getSessionUser).mockResolvedValue(
            mockUser as any,
        );

        const request = new Request('http://localhost:3000/');
        const result = await loader({ request } as any);

        expect(authService.getSessionUser).toHaveBeenCalledWith(request);
        expect(result).toEqual({ user: mockUser });
    });
});
