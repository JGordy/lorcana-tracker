import type { Route } from './+types/collection';
import { authService, dbService } from '../../services/appwrite.server';

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent');

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

    return { success: false };
}
