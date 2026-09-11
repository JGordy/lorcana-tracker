import { GoogleGenAI, Type } from '@google/genai';
import type { Card } from '../../types/lorcana';
import { buildCardsLookup, getCardSlug } from '../deck';
import { SET_INDEX_MAP } from '../../constants/lorcana';

export interface GeminiVisionCardResult {
    name: string;
    version?: string;
    setNumber?: number;
    cardNumber?: number;
    setName?: string;
    rarity?: string;
}

export interface IdentifyCardResponse {
    success: boolean;
    card: Card | null;
    visionResult?: GeminiVisionCardResult;
    error?: string;
}

/**
 * Strips data URL prefix if present and returns clean base64 + mimeType
 */
export function extractBase64Payload(dataUrlOrBase64: string): {
    base64: string;
    mimeType: string;
} {
    if (dataUrlOrBase64.startsWith('data:')) {
        const matches = dataUrlOrBase64.match(
            /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/,
        );
        if (matches) {
            return {
                mimeType: matches[1],
                base64: matches[2],
            };
        }
    }
    return {
        base64: dataUrlOrBase64,
        mimeType: 'image/jpeg',
    };
}

/**
 * Resolves a card from the catalog given the structured Gemini Vision result.
 */
export function matchVisionResultToCatalog(
    result: GeminiVisionCardResult,
    catalog: Card[],
): Card | null {
    if (!result || !catalog || catalog.length === 0) return null;

    // 1. Match by set number + card number if available
    if (result.setNumber && result.cardNumber) {
        const targetSetName = SET_INDEX_MAP[result.setNumber];
        if (targetSetName) {
            const setCardMatch = catalog.find(
                (c) =>
                    c.set.toLowerCase() === targetSetName.toLowerCase() &&
                    c.number === result.cardNumber,
            );
            if (setCardMatch) return setCardMatch;
        }
    }

    // 2. Match by setName + card number
    if (result.setName && result.cardNumber) {
        const setCardMatch = catalog.find(
            (c) =>
                c.set.toLowerCase().includes(result.setName!.toLowerCase()) &&
                c.number === result.cardNumber,
        );
        if (setCardMatch) return setCardMatch;
    }

    const fullSearchTitle = result.version
        ? `${result.name} - ${result.version}`
        : result.name;
    const targetSlug = getCardSlug(fullSearchTitle);

    // 3. Match by full title + cardNumber (crucial for over-numbered cards like Epic #218/204 or reprints)
    if (result.cardNumber) {
        const titleAndNumberMatch = catalog.find(
            (c) =>
                c.number === result.cardNumber &&
                (getCardSlug(c.name) === targetSlug ||
                    c.name.toLowerCase().includes(result.name.toLowerCase())),
        );
        if (titleAndNumberMatch) return titleAndNumberMatch;
    }

    // 4. Match by full title + rarity (e.g. "Epic" or "Enchanted")
    if (result.rarity) {
        const titleAndRarityMatch = catalog.find(
            (c) =>
                c.rarity.toLowerCase() === result.rarity!.toLowerCase() &&
                (getCardSlug(c.name) === targetSlug ||
                    c.name.toLowerCase().includes(result.name.toLowerCase())),
        );
        if (titleAndRarityMatch) return titleAndRarityMatch;
    }

    // 5. Match by full name lookup (e.g. "Elsa - Spirit of Winter" or "Ariel - Spectacular Singer")
    const cardsLookup = buildCardsLookup(catalog);
    const fullLookupCard = cardsLookup.get(fullSearchTitle);
    if (fullLookupCard) return fullLookupCard;

    const nameLookupCard = cardsLookup.get(result.name);
    if (nameLookupCard) return nameLookupCard;

    // 6. Match by slug similarity
    for (const card of catalog) {
        if (getCardSlug(card.name) === targetSlug) {
            return card;
        }
    }

    // 7. Match by cardNumber alone as fallback
    if (result.cardNumber) {
        const numMatch = catalog.find((c) => c.number === result.cardNumber);
        if (numMatch) return numMatch;
    }

    return null;
}

/**
 * Calls Gemini Flash to identify a card image via multimodal vision.
 */
export async function identifyCardWithGeminiVision(
    imageBase64OrDataUrl: string,
    catalog: Card[],
    apiKey?: string,
): Promise<IdentifyCardResponse> {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
        return {
            success: false,
            card: null,
            error: 'AI Vision is currently offline.',
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: key });
        const { base64, mimeType } = extractBase64Payload(imageBase64OrDataUrl);

        const prompt =
            'You are an expert Disney Lorcana TCG card scanner. Identify this card image precisely. Return the card name, subtitle/version (if any), set number (1 to 14), set name, card collector number, and rarity.';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        data: base64,
                        mimeType,
                    },
                },
                prompt,
            ],
            config: {
                responseMimeType: 'application/json',
                responseJsonSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description:
                                'Card character or item name, e.g. "Ariel" or "Elsa"',
                        },
                        version: {
                            type: Type.STRING,
                            description:
                                'Card subtitle or version, e.g. "Spectacular Singer" or "Spirit of Winter"',
                        },
                        setNumber: {
                            type: Type.INTEGER,
                            description:
                                'Numeric set number (e.g. 1 for The First Chapter, 6 for Azurite Sea)',
                        },
                        setName: {
                            type: Type.STRING,
                            description:
                                'Full set name, e.g. "The First Chapter", "Rise of the Floodborn"',
                        },
                        cardNumber: {
                            type: Type.INTEGER,
                            description:
                                'Collector card number on the bottom border, e.g. 115',
                        },
                        rarity: {
                            type: Type.STRING,
                            description:
                                'Rarity: Common, Uncommon, Rare, Super Rare, Legendary, Epic, Enchanted, Promo',
                        },
                    },
                    required: ['name'],
                },
            },
        });

        const rawText = response.text?.trim() || '{}';
        const parsedJson = JSON.parse(rawText) as GeminiVisionCardResult;

        const matchedCard = matchVisionResultToCatalog(parsedJson, catalog);

        return {
            success: Boolean(matchedCard),
            card: matchedCard,
            visionResult: parsedJson,
        };
    } catch (err: any) {
        console.error('[Gemini Vision Scanner Error]:', err);
        return {
            success: false,
            card: null,
            error: 'Failed to identify card with AI Vision.',
        };
    }
}
