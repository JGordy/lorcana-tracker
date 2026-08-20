import type { Route } from './+types/my-decks';
import { authService, dbService } from '../../services/appwrite.server';
import { COLLECTIONS, type Card as LorcanaCard } from '../../types/lorcana';

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const sort = (url.searchParams.get('sort') || 'progress') as
        'progress' | 'missing_cost' | 'name';

    const user = await authService.getSessionUser(request);
    const userId = user ? user.$id : null;

    const [decks, cards] = await Promise.all([
        userId
            ? dbService.getUserDecksWithProgress(userId, sort, request)
            : Promise.resolve([]),
        dbService.getCollection<LorcanaCard>(COLLECTIONS.CARDS, [], request),
    ]);

    return { decks, cards, user, sort };
}
