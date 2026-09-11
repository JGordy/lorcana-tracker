import {
    authService,
    dbService,
    getCardsCatalog,
} from '../../services/appwrite.server';
import { identifyCardWithGeminiVision } from '../../utils/scanner/geminiVision.server';

export async function action({ request }: { request: Request }) {
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'gemini-vision') {
        const image = formData.get('image') as string;
        if (!image) {
            return {
                success: false,
                card: null,
                error: 'No image payload provided for AI vision identification.',
            };
        }

        const catalog = await getCardsCatalog();
        const result = await identifyCardWithGeminiVision(image, catalog);
        return result;
    }

    if (intent === 'update-quantity') {
        const sessionUser = await authService.getSessionUser(request);
        const userId = sessionUser?.$id || (formData.get('userId') as string);
        const cardId = formData.get('cardId') as string;
        const quantity = parseInt(formData.get('quantity') as string, 10);
        const isFoil = formData.get('isFoil') === 'true';

        const result = await dbService.updateInventory(
            userId,
            cardId,
            quantity,
            isFoil,
            request,
        );

        return { success: true, item: result };
    }

    return { success: false, error: 'Unknown intent' };
}
