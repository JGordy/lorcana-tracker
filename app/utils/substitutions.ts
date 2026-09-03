import type { Card } from '../types/lorcana';
import { buildCardsLookup, getCardSlug } from './deck';

export const COMMON_LORCANA_KEYWORDS = [
    'Rush',
    'Evasive',
    'Bodyguard',
    'Ward',
    'Singer',
    'Shift',
    'Support',
    'Challenger',
    'Resist',
    'Reckless',
    'Vanish',
    'Puppeteer',
    'Alert',
] as const;

export interface SubstitutionRecommendation {
    card: Card;
    score: number;
    reasons: string[];
    priceDifference: number | null; // targetPrice - candidatePrice (positive means cheaper)
    percentSavings: number | null; // percentage saved (0 - 100)
    ownedQty: number;
    inDeckQty: number;
    maxCanAdd: number;
}

export interface FindSubstitutionsOptions {
    maxResults?: number;
    onlyOwned?: boolean;
    exactCostOnly?: boolean;
    format?: 'core' | 'infinity' | string;
    allowOtherDeckInks?: boolean;
}

/**
 * Extracts gameplay keywords, classifications, and roles from a card.
 */
export function extractCardKeywords(card: Card): string[] {
    const keywords = new Set<string>();

    // 1. Check card types (e.g. Song)
    if (Array.isArray(card.type)) {
        for (const t of card.type) {
            if (t.toLowerCase() === 'song') {
                keywords.add('Song');
            }
        }
    }

    // 2. Check classifications (e.g. Shift, Singer, classifications)
    if (Array.isArray(card.classifications)) {
        for (const c of card.classifications) {
            const clean = c.trim();
            if (!clean) continue;
            for (const kw of COMMON_LORCANA_KEYWORDS) {
                if (clean.toLowerCase() === kw.toLowerCase()) {
                    keywords.add(kw);
                }
            }
            // Also store major tribe classifications
            keywords.add(clean);
        }
    }

    // 3. Check card name for keywords (e.g., "Ariel - Spectacular Singer")
    const nameLower = card.name.toLowerCase();
    for (const kw of COMMON_LORCANA_KEYWORDS) {
        const kwLower = kw.toLowerCase();
        // Regex word boundary match
        const regex = new RegExp(`\\b${kwLower}\\b`, 'i');
        if (regex.test(nameLower)) {
            keywords.add(kw);
        }
    }

    // 4. Check potential custom/future properties
    const anyCard = card as any;
    if (Array.isArray(anyCard.keywords)) {
        for (const kw of anyCard.keywords) {
            if (typeof kw === 'string') keywords.add(kw);
        }
    }
    if (typeof anyCard.body_text === 'string') {
        for (const kw of COMMON_LORCANA_KEYWORDS) {
            const regex = new RegExp(`\\b${kw}\\b`, 'i');
            if (regex.test(anyCard.body_text)) {
                keywords.add(kw);
            }
        }
    }

    return Array.from(keywords);
}

/**
 * Normalizes ink color string for comparison
 */
export function normalizeInkColor(color: string | undefined): string {
    return (color || '').toLowerCase().trim();
}

/**
 * Calculates compatibility score between candidate and target card.
 */
export function calculateSubstitutionScore(
    candidate: Card,
    targetCard: Card,
    context?: {
        ownedQty?: number;
        inDeckQty?: number;
    },
): {
    score: number;
    reasons: string[];
    priceDifference: number | null;
    percentSavings: number | null;
} {
    let score = 0;
    const reasons: string[] = [];

    const ownedQty = context?.ownedQty || 0;

    // 1. Same Ink Color Match (+10 pts)
    const candInk = normalizeInkColor(candidate.ink_color);
    const targetInk = normalizeInkColor(targetCard.ink_color);
    if (candInk === targetInk) {
        score += 10;
    }

    // 2. Card Type Match (+25 pts, +10 bonus for Songs)
    const candTypes = (candidate.type || []).map((t) => t.toLowerCase());
    const targetTypes = (targetCard.type || []).map((t) => t.toLowerCase());

    const isCandSong = candTypes.includes('song');
    const isTargetSong = targetTypes.includes('song');

    if (isCandSong && isTargetSong) {
        score += 35; // 25 + 10 bonus
        reasons.push('Both are Songs');
    } else {
        const sharedTypes = candTypes.filter((t) => targetTypes.includes(t));
        if (sharedTypes.length > 0) {
            score += 25;
            const primaryType =
                candidate.type?.[0] || targetCard.type?.[0] || 'Card';
            reasons.push(`Same Type (${primaryType})`);
        }
    }

    // 3. Ink Cost Proximity (+20 for exact, +10 for ±1)
    const costDiff = Math.abs(candidate.cost - targetCard.cost);
    if (costDiff === 0) {
        score += 20;
        reasons.push(`Exact Cost (${candidate.cost})`);
    } else if (costDiff === 1) {
        score += 10;
        reasons.push(
            candidate.cost > targetCard.cost
                ? `Near Cost (${candidate.cost}, +1)`
                : `Near Cost (${candidate.cost}, -1)`,
        );
    }

    // 4. Inkwell / Inkable Compatibility (+15 pts)
    if (Boolean(candidate.inkwell) === Boolean(targetCard.inkwell)) {
        score += 15;
        if (candidate.inkwell) {
            reasons.push('Inkable Match');
        } else {
            reasons.push('Both Uninkable');
        }
    }

    // 5. Shared Keywords & Classifications (+15 for core keywords, +5 for tribes)
    const targetKeywords = extractCardKeywords(targetCard);
    const candidateKeywords = extractCardKeywords(candidate);

    const commonKws = candidateKeywords.filter((kw) =>
        targetKeywords.includes(kw),
    );

    for (const kw of commonKws) {
        const isCoreKeyword = COMMON_LORCANA_KEYWORDS.some(
            (k) => k.toLowerCase() === kw.toLowerCase(),
        );
        if (isCoreKeyword) {
            score += 15;
            reasons.push(`Both have ${kw}`);
        } else if (kw !== 'Song') {
            score += 5;
            reasons.push(`Shared: ${kw}`);
        }
    }

    // 6. Character Stats Proximity (+5 pts)
    if (
        candTypes.includes('character') &&
        targetTypes.includes('character') &&
        typeof candidate.strength === 'number' &&
        typeof targetCard.strength === 'number' &&
        typeof candidate.willpower === 'number' &&
        typeof targetCard.willpower === 'number'
    ) {
        const strDiff = Math.abs(candidate.strength - targetCard.strength);
        const willDiff = Math.abs(candidate.willpower - targetCard.willpower);
        if (strDiff <= 1 && willDiff <= 1) {
            score += 5;
            reasons.push(
                `Similar Stats (${candidate.strength}/${candidate.willpower})`,
            );
        }
    }

    // 7. Lore Output Proximity (+5 pts)
    if (candidate.lore >= targetCard.lore && targetCard.lore > 0) {
        score += 5;
        if (candidate.lore > targetCard.lore) {
            reasons.push(`Higher Lore (${candidate.lore} ◊)`);
        } else {
            reasons.push(`Same Lore (${candidate.lore} ◊)`);
        }
    }

    // 8. Owned in Collection Bonus (+30 pts)
    if (ownedQty > 0) {
        score += 30;
        reasons.push(`In Collection (${ownedQty} owned)`);
    }

    // 9. Budget / Price Savings (+15 pts)
    const targetPrice = targetCard.prices?.usd ?? null;
    const candPrice = candidate.prices?.usd ?? null;

    let priceDifference: number | null = null;
    let percentSavings: number | null = null;

    if (candPrice !== null && targetPrice !== null) {
        priceDifference = Math.round((targetPrice - candPrice) * 100) / 100;
        if (targetPrice > 0) {
            percentSavings = Math.round(
                ((targetPrice - candPrice) / targetPrice) * 100,
            );
        }

        if (
            priceDifference > 0 &&
            percentSavings !== null &&
            percentSavings >= 40
        ) {
            score += 15;
            reasons.push(
                `Save $${priceDifference.toFixed(2)} (${percentSavings}% cheaper)`,
            );
        } else if (candPrice < 1.0) {
            score += 10;
            reasons.push(`Budget Pick ($${candPrice.toFixed(2)})`);
        }
    } else if (candPrice !== null && candPrice < 1.0) {
        score += 10;
        reasons.push(`Budget Pick ($${candPrice.toFixed(2)})`);
    }

    return {
        score,
        reasons,
        priceDifference,
        percentSavings,
    };
}

/**
 * Finds and ranks the best card substitutions for a target card in a deck.
 */
export function findCardSubstitutions(
    targetCard: Card,
    deck: {
        cards: Array<{ card: Card; requiredQty?: number; quantity?: number }>;
        meta?: { inks?: string[]; format?: string };
        displayInks?: string[];
    },
    catalog: Card[],
    userCollection: Array<{ card_id: string; quantity: number }> = [],
    options: FindSubstitutionsOptions = {},
): SubstitutionRecommendation[] {
    const {
        maxResults = 10,
        onlyOwned = false,
        exactCostOnly = false,
        format = deck.meta?.format || 'core',
        allowOtherDeckInks = false,
    } = options;

    // 1. Build map of user collection ownership with canonical lookup resolution
    const cardsLookup = buildCardsLookup(catalog);
    const ownedMap = new Map<string, number>();
    for (const item of userCollection) {
        const rawId =
            (item as any).card_id ||
            (item as any).cardId ||
            (item as any).$id ||
            (item as any).id;
        const qty = item.quantity || 0;
        if (rawId && qty > 0) {
            const keysToUpdate = new Set<string>();
            keysToUpdate.add(rawId);

            const resolved =
                cardsLookup.get(rawId) ||
                cardsLookup.get(getCardSlug(rawId)) ||
                cardsLookup.get(
                    rawId
                        .replace(/-(set|promo)-[a-z0-9]+-\d+$/i, '')
                        .replace(/-\d+-\d+$/i, ''),
                );

            if (resolved) {
                if (resolved.id) keysToUpdate.add(resolved.id);
                if (resolved.$id) keysToUpdate.add(resolved.$id);
                const baseSlug = getCardSlug(resolved.name);
                if (baseSlug) keysToUpdate.add(baseSlug);
            } else {
                const slug = getCardSlug(rawId);
                if (slug) keysToUpdate.add(slug);
            }

            for (const key of keysToUpdate) {
                ownedMap.set(key, (ownedMap.get(key) || 0) + qty);
            }
        }
    }

    // 2. Build map of current deck card quantities
    const inDeckMap = new Map<string, number>();
    for (const dc of deck.cards) {
        const cId = dc.card.id || (dc.card as any).$id;
        const qty =
            typeof dc.requiredQty === 'number'
                ? dc.requiredQty
                : typeof dc.quantity === 'number'
                  ? dc.quantity
                  : 1;
        if (cId && qty > 0) {
            const keysToUpdate = new Set<string>();
            keysToUpdate.add(cId);

            const resolved =
                cardsLookup.get(cId) || cardsLookup.get(getCardSlug(cId));
            if (resolved) {
                if (resolved.id) keysToUpdate.add(resolved.id);
                if (resolved.$id) keysToUpdate.add(resolved.$id);
                const baseSlug = getCardSlug(resolved.name);
                if (baseSlug) keysToUpdate.add(baseSlug);
            } else {
                const slug = getCardSlug(cId);
                if (slug) keysToUpdate.add(slug);
            }

            for (const key of keysToUpdate) {
                inDeckMap.set(key, (inDeckMap.get(key) || 0) + qty);
            }
        }
    }

    // 3. Determine allowable inks
    const targetInk = normalizeInkColor(targetCard.ink_color);
    const deckInks = (deck.displayInks || deck.meta?.inks || []).map((i) =>
        normalizeInkColor(i),
    );

    const allowedInks = new Set<string>();
    if (targetInk) allowedInks.add(targetInk);
    if (allowOtherDeckInks && deckInks.length > 0) {
        for (const ink of deckInks) {
            if (ink) allowedInks.add(ink);
        }
    }

    const recommendations: SubstitutionRecommendation[] = [];

    for (const candidate of catalog) {
        // Exclude the target card itself
        if (candidate.id === targetCard.id || candidate.$id === targetCard.id) {
            continue;
        }

        // Check if candidate already has 4 copies in deck
        const currentInDeck =
            inDeckMap.get(candidate.id) ||
            inDeckMap.get((candidate as any).$id) ||
            0;
        if (currentInDeck >= 4) {
            continue;
        }

        // Ink filter
        const candInk = normalizeInkColor(candidate.ink_color);
        if (allowedInks.size > 0 && !allowedInks.has(candInk)) {
            continue;
        }

        // Format legality filter
        if (format === 'core') {
            const candFormats = candidate.formats || ['core', 'infinity'];
            if (!candFormats.includes('core')) {
                continue;
            }
        }

        // Exact cost filter if enabled
        if (exactCostOnly && candidate.cost !== targetCard.cost) {
            continue;
        }

        // Owned quantity
        const candId = candidate.id || (candidate as any).$id;
        const candSlug = getCardSlug(candidate.name);
        const ownedQty =
            ownedMap.get(candId) ||
            ((candidate as any).$id
                ? ownedMap.get((candidate as any).$id)
                : 0) ||
            (candSlug ? ownedMap.get(candSlug) : 0) ||
            0;
        if (onlyOwned && ownedQty <= 0) {
            continue;
        }

        // Calculate score
        const { score, reasons, priceDifference, percentSavings } =
            calculateSubstitutionScore(candidate, targetCard, {
                ownedQty,
                inDeckQty: currentInDeck,
            });

        const maxCanAdd = Math.min(4 - currentInDeck, 4);

        recommendations.push({
            card: candidate,
            score,
            reasons,
            priceDifference,
            percentSavings,
            ownedQty,
            inDeckQty: currentInDeck,
            maxCanAdd,
        });
    }

    // Sort by score descending, then by price savings descending, then by lowest cost
    recommendations.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        if (
            b.priceDifference !== null &&
            a.priceDifference !== null &&
            b.priceDifference !== a.priceDifference
        ) {
            return b.priceDifference - a.priceDifference;
        }
        return a.card.cost - b.card.cost;
    });

    return recommendations.slice(0, maxResults);
}
