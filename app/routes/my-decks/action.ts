import type { Route } from './+types/my-decks';
import { data } from 'react-router';
import { authService, dbService } from '../../services/appwrite.server';

export async function action({ request }: Route.ActionArgs) {
    try {
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

        if (intent === 'create-deck' || intent === 'import-deck') {
            const userId = formData.get('userId') as string;
            const title = formData.get('title') as string;
            const description = (formData.get('description') as string) || '';
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

        if (intent === 'update-deck-cards') {
            const deckId = formData.get('deckId') as string;
            const userId = formData.get('userId') as string;
            const cardsJson = formData.get('cards') as string;
            const cardsList = JSON.parse(cardsJson) as Array<{
                cardId: string;
                quantity: number;
            }>;

            const result = await dbService.updateDeckCards(
                deckId,
                userId,
                cardsList,
                request,
            );
            return { success: true, result };
        }

        if (intent === 'update-deck-details') {
            const deckId = formData.get('deckId') as string;
            const userId = formData.get('userId') as string;
            const title = formData.get('title') as string;
            const description = (formData.get('description') as string) || '';

            const result = await dbService.updateDeckDetails(
                deckId,
                userId,
                title,
                description,
                request,
            );
            return { success: true, result };
        }

        if (intent === 'delete-deck') {
            const deckId = formData.get('deckId') as string;
            const userId = formData.get('userId') as string;

            const result = await dbService.deleteDeck(deckId, userId, request);
            return { success: true, result };
        }

        return { success: false, error: 'Unknown intent' };
    } catch (error: any) {
        console.error('Action error in my-decks:', error);
        return {
            success: false,
            error: error?.message || 'An unexpected error occurred.',
        };
    }
}
