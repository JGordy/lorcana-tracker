import { authService, dbService } from '../../services/appwrite.server';
import { COLLECTIONS, type Card as LorcanaCard } from '../../types/lorcana';

export async function loader({ request }: { request: Request }) {
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
        hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    };
}
