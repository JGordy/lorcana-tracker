import type { Route } from './+types/collection';
import { authService, dbService } from '../../services/appwrite.server';
import { COLLECTIONS, type Card as LorcanaCard } from '../../types/lorcana';

export async function loader({ request }: Route.LoaderArgs) {
    const user = await authService.getSessionUser(request);
    const userId = user ? user.$id : null;

    const [cards, userCollection] = await Promise.all([
        dbService.getCollection<LorcanaCard>(COLLECTIONS.CARDS, [], request),
        userId
            ? dbService.getUserInventory(userId, request)
            : Promise.resolve([]),
    ]);

    return {
        cards,
        userCollection,
        user,
    };
}
