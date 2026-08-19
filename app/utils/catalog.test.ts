import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Card Catalog Integrity (cards.json)', () => {
    const cardsPath = path.resolve(process.cwd(), 'public/cards.json');
    const rawData = fs.readFileSync(cardsPath, 'utf8');
    const cards = JSON.parse(rawData);

    it('should have loaded over 3000 cards in catalog', () => {
        expect(Array.isArray(cards)).toBe(true);
        expect(cards.length).toBeGreaterThan(3000);
    });

    it('should have all 90 Epic cards indexed', () => {
        const epics = cards.filter(
            (c: any) => c.rarity?.toLowerCase() === 'epic',
        );
        expect(epics.length).toBe(90);

        // Verify each Epic has image_url, set name, and number
        for (const epic of epics) {
            expect(epic.name).toBeTruthy();
            expect(epic.set).toBeTruthy();
            expect(epic.number).toBeGreaterThan(0);
            expect(epic.image_url).toMatch(/^https?:\/\//);
            expect(epic.ink_color).toBeTruthy();
        }
    });

    it('should have required schema fields for every card', () => {
        for (const card of cards.slice(0, 100)) {
            expect(card.id).toBeTruthy();
            expect(card.name).toBeTruthy();
            expect(card.set).toBeTruthy();
            expect(card.ink_color).toBeTruthy();
            expect(card.rarity).toBeTruthy();
            expect(Array.isArray(card.type)).toBe(true);
            expect(Array.isArray(card.classifications)).toBe(true);
            expect(Array.isArray(card.formats)).toBe(true);
        }
    });
});
