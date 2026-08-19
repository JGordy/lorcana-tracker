import fs from 'fs';
import path from 'path';

const CARDS_FILE_PATH = path.resolve(process.cwd(), 'public/cards.json');
const LORCANA_JSON_URL =
    'https://lorcanajson.org/files/current/en/allCards.json';

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
 * Normalizes LorcanaJSON card object to our internal Card schema
 */
function normalizeCard(raw, usedSlugs) {
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
    };
}

async function syncCards() {
    console.log('🔄 Starting automated Lorcana card catalog sync...');

    try {
        console.log(`📥 Fetching bulk card data from ${LORCANA_JSON_URL}...`);
        const res = await fetch(LORCANA_JSON_URL, {
            headers: { 'User-Agent': 'GlimmerForge-LorcanaTracker/1.0' },
        });

        if (!res.ok) {
            throw new Error(`LorcanaJSON returned HTTP ${res.status}`);
        }

        const data = await res.json();
        const cardsArray = Array.isArray(data)
            ? data
            : data.cards || Object.values(data);

        console.log(`✅ Received ${cardsArray.length} cards from LorcanaJSON.`);
        const usedSlugs = new Set();
        const normalized = cardsArray.map((raw) =>
            normalizeCard(raw, usedSlugs),
        );

        // Deduplicate by slug ID
        const cardMap = new Map();
        for (const card of normalized) {
            cardMap.set(card.id, card);
        }

        const finalCards = Array.from(cardMap.values());
        fs.writeFileSync(CARDS_FILE_PATH, JSON.stringify(finalCards, null, 2));
        console.log(
            `✨ Successfully synchronized ${finalCards.length} cards with canonical slugs to ${CARDS_FILE_PATH}!`,
        );
    } catch (err) {
        console.error('❌ Failed to synchronize cards:', err.message);
        process.exit(1);
    }
}

syncCards();
