import fs from 'fs';
import path from 'path';
import { authService, dbService } from '../../services/appwrite.server';
import { COLLECTIONS, type Card as LorcanaCard } from '../../types/lorcana';
import type { CardArtHash } from '../../utils/scanner/artHasher';

let cachedArtHashes: CardArtHash[] | null = null;

export function getArtHashesCatalog(): CardArtHash[] {
    if (cachedArtHashes && cachedArtHashes.length > 0) {
        return cachedArtHashes;
    }
    try {
        const filePath = path.resolve(process.cwd(), 'public/art-hashes.json');
        if (fs.existsSync(filePath)) {
            cachedArtHashes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return cachedArtHashes || [];
        }
    } catch (e) {
        console.error('Failed to load art-hashes.json on server:', e);
    }
    return [];
}

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
        artHashes: getArtHashesCatalog(),
        hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    };
}
