import { redirect } from 'react-router';
import { authService } from '../services/auth.server';
import type { Route } from './+types/logout';

export async function action({ request }: Route.ActionArgs) {
    const { cookieHeader } = await authService.logout(request);
    return redirect('/', {
        headers: {
            'Set-Cookie': cookieHeader,
        },
    });
}

export async function loader() {
    return redirect('/');
}
