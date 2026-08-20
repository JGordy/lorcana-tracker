import type { Route } from './+types/decks';
import { data } from 'react-router';
import { authService, dbService } from '../../services/appwrite.server';

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

    if (intent === 'login-demo') {
        const { user, cookieHeader } =
            await authService.anonymousLogin(request);
        const headers: Record<string, string> = {};
        if (cookieHeader) {
            headers['Set-Cookie'] = cookieHeader;
        }
        return data({ success: true, user }, { headers });
    }

    if (intent === 'quick-add') {
        const userId = formData.get('userId') as string;
        const cardId = formData.get('cardId') as string;
        const quantity = parseInt(formData.get('quantity') as string, 10);
        const isFoil = formData.get('isFoil') === 'true';

        const updatedItem = await dbService.updateInventory(
            userId,
            cardId,
            quantity,
            isFoil,
            request,
        );
        return { success: true, updatedItem };
    }

    if (intent === 'import-deck') {
        const userId = formData.get('userId') as string;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const cardsJson = formData.get('cards') as string;
        const cardsList = JSON.parse(cardsJson) as Array<{
            cardId: string;
            quantity: number;
        }>;

        const result = await dbService.createDeck(
            userId,
            title,
            description,
            cardsList,
            request,
        );
        return { success: true, result };
    }

    if (intent === 'clone-deck') {
        const userId = formData.get('userId') as string;
        const title = formData.get('title') as string;
        const description =
            (formData.get('description') as string) ||
            'Cloned from Deck Directory';
        const cardsJson = formData.get('cards') as string;
        const cardsList = JSON.parse(cardsJson) as Array<{
            cardId: string;
            quantity: number;
        }>;

        const result = await dbService.createDeck(
            userId,
            title,
            description,
            cardsList,
            request,
        );
        return { success: true, cloned: true, result };
    }

    return { success: false };
}
