import type { Route } from './+types/home';
import { data } from 'react-router';
import { authService } from '../../services/auth.server';

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'logout') {
        const { cookieHeader } = await authService.logout(request);
        return data(
            { success: true },
            {
                headers: {
                    'Set-Cookie': cookieHeader,
                },
            },
        );
    }

    if (intent === 'auth-register') {
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password || !name) {
            return { error: 'Name, email, and password are required.' };
        }

        try {
            const origin = new URL(request.url).origin;
            const { user, cookieHeader } = await authService.register({
                name,
                email,
                password,
                origin,
            });

            return data(
                { success: true, user },
                {
                    headers: {
                        'Set-Cookie': cookieHeader,
                    },
                },
            );
        } catch (error: any) {
            console.error('Register error:', error);
            return { error: error?.message || 'Failed to create account.' };
        }
    }

    if (intent === 'auth-login') {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            return { error: 'Email and password are required.' };
        }

        try {
            const { session, cookieHeader } = await authService.login({
                email,
                password,
            });
            return data(
                { success: true, session },
                {
                    headers: {
                        'Set-Cookie': cookieHeader,
                    },
                },
            );
        } catch (error: any) {
            console.error('Login error:', error);
            return { error: error?.message || 'Invalid email or password.' };
        }
    }

    if (intent === 'login-demo') {
        const { user, cookieHeader } =
            await authService.anonymousLogin(request);
        const headers: Record<string, string> = {};
        if (cookieHeader) {
            headers['Set-Cookie'] = cookieHeader;
        }
        return data({ success: true, user }, { headers });
    }

    return { success: false };
}
