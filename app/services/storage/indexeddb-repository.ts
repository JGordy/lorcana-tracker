import { get, set, del } from 'idb-keyval';
import type { UserCollectionMap } from '../../types/lorcana';
import type { ICollectionRepository } from './collection-repository';

export const INDEXEDDB_COLLECTION_KEY = 'lorcana_user_collection';

export class IndexedDbRepository implements ICollectionRepository {
    async getCollection(): Promise<UserCollectionMap> {
        if (typeof window === 'undefined') return {};
        try {
            const data = await get<UserCollectionMap>(INDEXEDDB_COLLECTION_KEY);
            return data || {};
        } catch (err) {
            console.warn(
                '[IndexedDbRepository] Error reading collection:',
                err,
            );
            return {};
        }
    }

    async updateCard(
        cardId: string,
        normalCount: number,
        foilCount: number,
    ): Promise<UserCollectionMap> {
        const collection = await this.getCollection();
        const norm = Math.max(0, normalCount);
        const foil = Math.max(0, foilCount);

        if (norm === 0 && foil === 0) {
            delete collection[cardId];
        } else {
            collection[cardId] = { normal: norm, foil };
        }

        await this.setFullCollection(collection);
        return collection;
    }

    async setFullCollection(collection: UserCollectionMap): Promise<void> {
        if (typeof window === 'undefined') return;
        try {
            await set(INDEXEDDB_COLLECTION_KEY, collection);
        } catch (err) {
            console.warn(
                '[IndexedDbRepository] Error writing collection:',
                err,
            );
        }
    }

    async clear(): Promise<void> {
        if (typeof window === 'undefined') return;
        try {
            await del(INDEXEDDB_COLLECTION_KEY);
        } catch (err) {
            console.warn(
                '[IndexedDbRepository] Error clearing collection:',
                err,
            );
        }
    }
}
