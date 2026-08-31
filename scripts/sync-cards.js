import fs from 'fs';
import path from 'path';

const CARDS_FILE_PATH = path.resolve(process.cwd(), 'public/cards.json');
const LORCANA_JSON_URL =
    'https://lorcanajson.org/files/current/en/allCards.json';
const LORCAST_BULK_URL = 'https://api.lorcast.com/v0/bulk/cards';

const SET_NAME_BY_CODE = {
    1: 'The First Chapter',
    2: 'Rise of the Floodborn',
    3: 'Into the Inklands',
    4: "Ursula's Return",
    Q1: "Illumineer's Quest: Deep Trouble",
    5: 'Shimmering Skies',
    6: 'Azurite Sea',
    7: "Archazia's Island",
    8: 'Reign of Jafar',
    Q2: "Illumineer's Quest: Palace Heist",
    9: 'Fabled',
    10: 'Whispers in the Well',
    11: 'Winterspell',
    12: 'Wilds Unknown',
    13: 'Attack of the Vine!',
};

const PROMO_SET_NAMES = {
    P1: 'Promo Set 1',
    P2: 'Promo Set 2',
    P3: 'Promo Set 3',
    P4: 'Promo Set 4',
    PD1: 'PD1',
    CP: 'Challenge Promo',
    cp: 'Challenge Promo',
    C1: 'Challenge Promo Year 1',
    C2: 'Lorcana Challenge Year 3',
    D23: 'D23 Collection',
    DIS: 'EPCOT Festival of the Arts',
    CC1: 'Collector Club Promo',
    Q1: "Illumineer's Quest: Deep Trouble",
    Q2: "Illumineer's Quest: Palace Heist",
};

export function getCardSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s-]+/g, '-');
}

/**
 * Builds multi-key lookup maps for Lorcast cards to maximize matching reliability
 */
export function buildLorcastLookups(lorcastCards = []) {
    const byTcgId = new Map();
    const bySetNum = new Map();
    const bySlug = new Map();

    for (const card of lorcastCards) {
        if (card.tcgplayer_id) {
            byTcgId.set(String(card.tcgplayer_id), card);
        }

        const setCode = String(card.set?.code || '')
            .toLowerCase()
            .replace(/^0+/, '');
        const num = String(card.collector_number || '')
            .toLowerCase()
            .replace(/^0+/, '');
        if (setCode && num) {
            bySetNum.set(`${setCode}:${num}`, card);
        }

        const fullName = card.name + (card.version ? ` - ${card.version}` : '');
        const slug = getCardSlug(fullName);
        if (slug && !bySlug.has(slug)) {
            bySlug.set(slug, card);
        }
    }

    return {
        find(raw, calculatedSetCode, calculatedNumber) {
            // 1. Match by LorcanaJSON TCGPlayer ID
            const tcgId = raw.externalLinks?.tcgPlayerId;
            if (tcgId && byTcgId.has(String(tcgId))) {
                return byTcgId.get(String(tcgId));
            }

            // 2. Match by normalized Set Code + Collector Number
            const setCodeNorm = String(
                calculatedSetCode || raw.setCode || raw.code || '',
            )
                .toLowerCase()
                .replace(/^0+/, '');
            const numNorm = String(
                calculatedNumber || raw.number || raw.collector_number || '',
            )
                .toLowerCase()
                .replace(/^0+/, '');
            if (setCodeNorm && numNorm) {
                const setNumKey = `${setCodeNorm}:${numNorm}`;
                if (bySetNum.has(setNumKey)) {
                    return bySetNum.get(setNumKey);
                }
            }

            // 3. Match by Card Name / Slug
            const fullName =
                raw.fullName ||
                (raw.name && raw.version
                    ? `${raw.name} - ${raw.version}`
                    : raw.name || '');
            const slug = getCardSlug(fullName);
            if (slug && bySlug.has(slug)) {
                return bySlug.get(slug);
            }

            return null;
        },
    };
}

/**
 * Normalizes LorcanaJSON card object to our internal Card schema, enriched with Lorcast pricing and store links
 */
export function normalizeCard(raw, usedSlugs, lorcastLookup = null) {
    const name = raw.fullName || raw.name || 'Unknown';
    const isPromo = raw.rarity === 'Special' || raw.rarity === 'Promo';

    let set = 'Unknown Set';
    let number = parseInt(raw.number || raw.collector_number || 0, 10);
    let rarity = raw.rarity || 'Common';
    let setCode = String(raw.setCode || raw.code || '');

    if (isPromo) {
        const match = raw.fullIdentifier?.match(
            /\b(P1|P2|P3|P4|PD1|CP|cp|C1|C2|D23|DIS|CC1|Q1|Q2)\b/i,
        );
        const promoCode = match ? match[1].toUpperCase() : 'PROMO';
        const numMatch =
            raw.fullIdentifier?.match(
                /(\d+)\/(P1|P2|P3|P4|PD1|CP|cp|C1|C2|D23|DIS|CC1|Q1|Q2)/i,
            ) ||
            raw.fullIdentifier?.match(
                /(P1|P2|P3|P4|PD1|CP|cp|C1|C2|D23|DIS|CC1|Q1|Q2)\/(\d+)/i,
            );
        if (numMatch) {
            const parsedNum =
                parseInt(numMatch[1], 10) || parseInt(numMatch[2], 10);
            if (!isNaN(parsedNum) && parsedNum > 0) {
                number = parsedNum;
            }
        }
        set = PROMO_SET_NAMES[promoCode] || `Promo Set ${promoCode}`;
        rarity = 'Promo';
        setCode = promoCode;
    } else {
        set = SET_NAME_BY_CODE[setCode] || raw.setName || `Set ${setCode}`;
    }

    const baseSlug = getCardSlug(name);
    let slug = baseSlug;

    // Preserve standard canonical slug for the first card of that name, add suffix for duplicates/promos
    if (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${setCode.toLowerCase()}-${number}`;
    }
    usedSlugs.add(slug);

    const inkColor =
        raw.color ||
        raw.ink_color ||
        (raw.colors && raw.colors[0]) ||
        'Colorless';
    let imageUrl =
        raw.images?.full || raw.images?.thumbnail || raw.image_url || '';

    // Match Lorcast market pricing & purchase URIs
    const lorcastCard = lorcastLookup
        ? lorcastLookup.find(raw, setCode, number)
        : null;

    let priceUsd = null;
    let priceUsdFoil = null;

    if (lorcastCard?.prices) {
        if (lorcastCard.prices.usd != null) {
            const parsedUsd = parseFloat(lorcastCard.prices.usd);
            if (!isNaN(parsedUsd) && parsedUsd >= 0) {
                priceUsd = parsedUsd;
            }
        }
        if (lorcastCard.prices.usd_foil != null) {
            const parsedFoil = parseFloat(lorcastCard.prices.usd_foil);
            if (!isNaN(parsedFoil) && parsedFoil >= 0) {
                priceUsdFoil = parsedFoil;
            }
        }
    }

    const tcgplayerUrl =
        raw.externalLinks?.tcgPlayerUrl ||
        lorcastCard?.purchase_uris?.tcgplayer ||
        (lorcastCard?.tcgplayer_id
            ? `https://www.tcgplayer.com/product/${lorcastCard.tcgplayer_id}`
            : undefined);

    const cardmarketUrl = raw.externalLinks?.cardmarketUrl || undefined;

    return {
        $id: slug,
        id: slug,
        name: name,
        set: set,
        number: number,
        ink_color: inkColor,
        cost: raw.cost ?? 0,
        inkwell: Boolean(raw.inkwell || raw.inkable),
        strength: raw.strength ?? null,
        willpower: raw.willpower ?? null,
        lore: raw.lore ?? 0,
        type: Array.isArray(raw.type) ? raw.type : [raw.type || 'Character'],
        classifications: Array.isArray(raw.subtypes)
            ? raw.subtypes
            : Array.isArray(raw.classifications)
              ? raw.classifications
              : [],
        rarity: rarity,
        image_url: imageUrl,
        formats: raw.allowedInFormats
            ? Object.keys(raw.allowedInFormats).map((f) => f.toLowerCase())
            : ['core', 'infinity'],
        prices: {
            usd: priceUsd,
            usd_foil: priceUsdFoil,
        },
        tcgplayer_url: tcgplayerUrl,
        cardmarket_url: cardmarketUrl,
    };
}

async function syncCards() {
    console.log('🔄 Starting automated Lorcana card catalog & pricing sync...');

    try {
        console.log(
            `📥 Fetching card dataset and market prices concurrently...`,
        );
        const [ljRes, lcRes] = await Promise.all([
            fetch(LORCANA_JSON_URL, {
                headers: { 'User-Agent': 'GlimmerForge-LorcanaTracker/1.0' },
            }),
            fetch(LORCAST_BULK_URL, {
                headers: { 'User-Agent': 'GlimmerForge-LorcanaTracker/1.0' },
            }).catch((err) => {
                console.warn(
                    `⚠️ Warning: Failed to fetch Lorcast prices (${err.message}). Continuing without live pricing.`,
                );
                return null;
            }),
        ]);

        if (!ljRes.ok) {
            throw new Error(`LorcanaJSON returned HTTP ${ljRes.status}`);
        }

        const ljData = await ljRes.json();
        const cardsArray = Array.isArray(ljData)
            ? ljData
            : ljData.cards || Object.values(ljData);

        let lorcastLookup = null;
        if (lcRes && lcRes.ok) {
            const lcData = await lcRes.json();
            const lcCards = Array.isArray(lcData) ? lcData : [];
            lorcastLookup = buildLorcastLookups(lcCards);
            console.log(
                `📊 Successfully loaded ${lcCards.length} pricing records from Lorcast.`,
            );
        }

        console.log(`✅ Received ${cardsArray.length} cards from LorcanaJSON.`);
        const usedSlugs = new Set();
        const normalized = cardsArray.map((raw) =>
            normalizeCard(raw, usedSlugs, lorcastLookup),
        );

        // Deduplicate by slug ID
        const cardMap = new Map();
        for (const card of normalized) {
            cardMap.set(card.id, card);
        }

        const finalCards = Array.from(cardMap.values());
        const pricedCount = finalCards.filter(
            (c) => c.prices?.usd != null || c.prices?.usd_foil != null,
        ).length;

        fs.writeFileSync(CARDS_FILE_PATH, JSON.stringify(finalCards, null, 2));
        console.log(
            `✨ Successfully synchronized ${finalCards.length} cards (${pricedCount} with market pricing) to ${CARDS_FILE_PATH}!`,
        );
    } catch (err) {
        console.error('❌ Failed to synchronize cards:', err.message);
        process.exit(1);
    }
}

if (
    process.argv[1] &&
    process.argv[1].endsWith('sync-cards.js') &&
    !process.env.VITEST
) {
    syncCards();
}
