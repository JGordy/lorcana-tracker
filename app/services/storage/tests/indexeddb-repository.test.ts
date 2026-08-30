import { describe, it, expect, beforeEach } from 'vitest';
import { MockCollectionRepository } from '../mock-repository';

describe('MockCollectionRepository', () => {
    let repo: MockCollectionRepository;

    beforeEach(() => {
        repo = new MockCollectionRepository();
    });

    it('should start with an empty collection', async () => {
        const collection = await repo.getCollection();
        expect(collection).toEqual({});
    });

    it('should update card quantities correctly', async () => {
        await repo.updateCard('ariel-on-human-legs', 4, 1);
        let collection = await repo.getCollection();

        expect(collection['ariel-on-human-legs']).toEqual({
            normal: 4,
            foil: 1,
        });

        // Update again
        await repo.updateCard('ariel-on-human-legs', 2, 0);
        collection = await repo.getCollection();
        expect(collection['ariel-on-human-legs']).toEqual({
            normal: 2,
            foil: 0,
        });
    });

    it('should remove entry when normal and foil are set to 0', async () => {
        await repo.updateCard('ariel-on-human-legs', 4, 1);
        await repo.updateCard('ariel-on-human-legs', 0, 0);
        const collection = await repo.getCollection();

        expect(collection['ariel-on-human-legs']).toBeUndefined();
    });

    it('should overwrite collection with setFullCollection', async () => {
        await repo.setFullCollection({
            'stitch-rock-star': { normal: 3, foil: 2 },
        });

        const collection = await repo.getCollection();
        expect(collection).toEqual({
            'stitch-rock-star': { normal: 3, foil: 2 },
        });
    });

    it('should clear collection', async () => {
        await repo.setFullCollection({
            'stitch-rock-star': { normal: 3, foil: 2 },
        });
        await repo.clear();

        const collection = await repo.getCollection();
        expect(collection).toEqual({});
    });
});
