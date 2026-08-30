import type { UserCollectionMap } from '../../types/lorcana';

export interface ICollectionRepository {
    getCollection(): Promise<UserCollectionMap>;
    updateCard(
        cardId: string,
        normalCount: number,
        foilCount: number,
    ): Promise<UserCollectionMap>;
    setFullCollection(collection: UserCollectionMap): Promise<void>;
    clear(): Promise<void>;
}
