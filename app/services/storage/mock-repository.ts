import type { UserCollectionMap } from '../../types/lorcana';
import type { ICollectionRepository } from './collection-repository';

export class MockCollectionRepository implements ICollectionRepository {
    private storage: UserCollectionMap;

    constructor(initialData: UserCollectionMap = {}) {
        this.storage = { ...initialData };
    }

    async getCollection(): Promise<UserCollectionMap> {
        return { ...this.storage };
    }

    async updateCard(
        cardId: string,
        normalCount: number,
        foilCount: number,
    ): Promise<UserCollectionMap> {
        const norm = Math.max(0, normalCount);
        const foil = Math.max(0, foilCount);

        if (norm === 0 && foil === 0) {
            delete this.storage[cardId];
        } else {
            this.storage[cardId] = { normal: norm, foil };
        }

        return { ...this.storage };
    }

    async setFullCollection(collection: UserCollectionMap): Promise<void> {
        this.storage = { ...collection };
    }

    async clear(): Promise<void> {
        this.storage = {};
    }
}
