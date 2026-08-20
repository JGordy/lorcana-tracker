import type { Route } from './+types/home';
import { authService } from '../../services/auth.server';

export async function loader({ request }: Route.LoaderArgs) {
    const user = await authService.getSessionUser(request);
    return { user };
}
