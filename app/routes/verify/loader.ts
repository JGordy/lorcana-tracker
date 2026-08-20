import type { Route } from './+types/verify';
import { authService } from '../../services/auth.server';

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const userId = url.searchParams.get('userId');

    const user = await authService.getSessionUser(request);

    if (!secret || !userId) {
        return {
            success: false,
            message: 'Missing verification parameters in verification link.',
            user,
        };
    }

    try {
        await authService.verifyEmail({ userId, secret });
        return {
            success: true,
            message:
                'Your email address has been successfully verified! You now have full access.',
            user,
        };
    } catch (error: any) {
        console.error('Verification error:', error);
        return {
            success: false,
            message:
                error?.message ||
                'Failed to verify email. The link may have expired.',
            user,
        };
    }
}
