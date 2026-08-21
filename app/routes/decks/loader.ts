import type { Route } from './+types/decks';
import { authService, dbService } from '../../services/appwrite.server';
import { COLLECTIONS, type Card as LorcanaCard } from '../../types/lorcana';

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const sort = (url.searchParams.get('sort') || 'progress') as
        'progress' | 'missing_cost' | 'name';
    const completion = (url.searchParams.get('completion') || 'all') as
        'all' | 'ready' | 'near' | 'in_progress';

    // Get active session user
    const user = await authService.getSessionUser(request);
    const userId = user ? user.$id : null;

    // Retrieve public decks and cards concurrently
    const [decks, cards] = await Promise.all([
        dbService.getDecksWithProgress(userId, sort, request),
        dbService.getCollection<LorcanaCard>(COLLECTIONS.CARDS, [], request),
    ]);

    return { decks, cards, user, sort, completion };
}
