import LZString from 'lz-string';

export interface DeckCodeCard {
    set: number;
    number: number;
    count: number;
}

export interface DeckCodePayload {
    title?: string;
    cards: DeckCodeCard[];
}

/**
 * Encodes a deck list (and optional title) into a compact, compressed URL string.
 * Uses raw Set-Number:Count serialization compressed with LZString.
 */
export function encodeDeckToString(
    cards: DeckCodeCard[],
    title?: string,
): string {
    if (!cards || cards.length === 0) return '';

    const cardEntries = cards
        .filter((c) => c && c.set > 0 && c.number > 0 && c.count > 0)
        .map((c) => `${c.set}-${c.number}:${c.count}`)
        .join(',');

    const rawPayload = title ? `${title.trim()}|${cardEntries}` : cardEntries;
    if (!rawPayload) return '';

    const compressed = LZString.compressToEncodedURIComponent(rawPayload);
    return compressed || '';
}

/**
 * Decodes a compressed or raw deck string back into structured deck payload data.
 * Safely handles corrupted or malformed input without throwing errors.
 */
export function decodeStringToDeck(
    encodedString: string,
): DeckCodePayload | null {
    if (!encodedString || typeof encodedString !== 'string') return null;

    const trimmed = encodedString.trim();
    if (!trimmed) return null;

    let decompressed: string | null = null;
    try {
        decompressed = LZString.decompressFromEncodedURIComponent(trimmed);
    } catch {
        decompressed = null;
    }

    const targetString = decompressed || trimmed;
    if (!targetString) return null;

    let title: string | undefined = undefined;
    let cardSection = targetString;

    if (targetString.includes('|')) {
        const parts = targetString.split('|');
        title = parts[0]?.trim() || undefined;
        cardSection = parts.slice(1).join('|');
    }

    const cards: DeckCodeCard[] = [];
    const entries = cardSection
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

    for (const entry of entries) {
        const match = entry.match(/^(\d+)-(\d+):(\d+)$/);
        if (match) {
            const set = parseInt(match[1], 10);
            const number = parseInt(match[2], 10);
            const count = parseInt(match[3], 10);

            if (!isNaN(set) && !isNaN(number) && !isNaN(count) && count > 0) {
                cards.push({ set, number, count });
            }
        }
    }

    if (cards.length === 0 && !title) return null;

    return {
        title,
        cards,
    };
}

/**
 * Generates a full shareable URL containing the encoded deck hash.
 */
export function generateDeckShareUrl(
    cards: DeckCodeCard[],
    title?: string,
    origin?: string,
): string {
    const encoded = encodeDeckToString(cards, title);
    if (!encoded) return '';

    const baseUrl =
        origin ||
        (typeof window !== 'undefined'
            ? window.location.origin
            : 'https://lorcana-tracker.app');
    return `${baseUrl}/deck#d=${encoded}`;
}

/**
 * Extracts and decodes deck payload from a URL string or hash fragment.
 */
export function parseDeckFromUrl(urlOrHash: string): DeckCodePayload | null {
    if (!urlOrHash) return null;

    let encodedParam: string | null = null;

    try {
        if (urlOrHash.includes('#')) {
            const hash = urlOrHash.substring(urlOrHash.indexOf('#') + 1);
            const params = new URLSearchParams(hash);
            encodedParam = params.get('d');
        }

        if (!encodedParam && urlOrHash.includes('?')) {
            const search = urlOrHash.substring(urlOrHash.indexOf('?') + 1);
            const params = new URLSearchParams(search);
            encodedParam = params.get('d');
        }

        if (
            !encodedParam &&
            !urlOrHash.includes('/') &&
            !urlOrHash.includes('=')
        ) {
            encodedParam = urlOrHash;
        }
    } catch {
        encodedParam = null;
    }

    if (!encodedParam) return null;
    return decodeStringToDeck(encodedParam);
}
